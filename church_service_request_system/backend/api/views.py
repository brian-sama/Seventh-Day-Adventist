from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token
from django.contrib.auth import get_user_model
from .models import Document, ServiceRequest, Signature, Comment
from .serializers import UserSerializer, DocumentSerializer, ServiceRequestSerializer, SignatureSerializer, CommentSerializer

User = get_user_model()

class CustomAuthToken(ObtainAuthToken):
    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user_id': user.pk,
            'role': user.role,
            'username': user.username
        })

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

class DocumentViewSet(viewsets.ModelViewSet):
    queryset = Document.objects.all()
    serializer_class = DocumentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)

class ServiceRequestViewSet(viewsets.ModelViewSet):
    queryset = ServiceRequest.objects.all().order_by('-created_at')
    serializer_class = ServiceRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'clerk':
            return self.queryset.filter(clerk=user)
        elif user.role == 'elder':
            from django.db.models import Q
            return self.queryset.filter(Q(status='pending_elder') | Q(elder=user))
        elif user.role == 'pastor':
            from django.db.models import Q
            return self.queryset.filter(Q(status='pending_pastor') | Q(pastor=user))
        return self.queryset

    def perform_create(self, serializer):
        serializer.save(clerk=self.request.user)

    @action(detail=True, methods=['post'])
    def approve_elder(self, request, pk=None):
        sr = self.get_object()
        if request.user.role != 'elder':
            return Response({'error': 'Only elders can perform this action'}, status=status.HTTP_403_FORBIDDEN)
        if request.user.signature_image:
            from .pdf_service import add_signature_to_pdf
            try:
                add_signature_to_pdf(sr.document.file.path, request.user.signature_image.path, sr.document.file.path, 100, 100)
            except Exception as e:
                print(f"Failed to add elder signature: {e}")

        sr.status = 'pending_pastor'
        sr.elder = request.user
        sr.save()
        
        # Notify pastors via WhatsApp
        from .notification_service import send_whatsapp_notification
        pastors = User.objects.filter(role='pastor')
        for p in pastors:
            if p.phone_number:
                msg = f"New Service Request Signed\n\nDocument: {sr.document.title}\nSigned by: Head Elder\nTime: {sr.updated_at.strftime('%d %b %Y - %H:%M')}\n\nPlease review in the system."
                send_whatsapp_notification(p.phone_number, msg)

        return Response({'status': 'Approved by Elder'})

    @action(detail=True, methods=['post'])
    def approve_pastor(self, request, pk=None):
        sr = self.get_object()
        if request.user.role != 'pastor':
            return Response({'error': 'Only pastors can perform this action'}, status=status.HTTP_403_FORBIDDEN)
        if request.user.signature_image:
            from .pdf_service import add_signature_to_pdf, lock_pdf
            try:
                add_signature_to_pdf(sr.document.file.path, request.user.signature_image.path, sr.document.file.path, 400, 100)
                lock_pdf(sr.document.file.path, sr.document.file.path)
            except Exception as e:
                print(f"Failed to add pastor signature and lock: {e}")
            sr.document.locked = True
            sr.document.save()

        sr.status = 'approved'
        sr.pastor = request.user
        sr.save()
        return Response({'status': 'Approved by Pastor'})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        sr = self.get_object()
        sr.status = 'rejected'
        sr.save()
        return Response({'status': 'Rejected'})

    @action(detail=True, methods=['post'])
    def return_to_clerk(self, request, pk=None):
        sr = self.get_object()
        sr.status = 'returned_to_clerk'
        sr.save()
        return Response({'status': 'Returned to Clerk'})

class SignatureViewSet(viewsets.ModelViewSet):
    queryset = Signature.objects.all()
    serializer_class = SignatureSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(signed_by=self.request.user)

class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)
