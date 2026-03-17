import os
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action, api_view, permission_classes as perm_classes
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
from django.utils import timezone
from .models import MinistryRequest, Report, Signature, Comment, UserActivity, Notification
from .serializers import (UserSerializer, MinistryRequestSerializer, ReportSerializer,
                          SignatureSerializer, CommentSerializer, UserActivitySerializer, NotificationSerializer)
from .permissions import IsClerk, IsElder, IsPastor, IsElderOrPastor, IsClerkOrAdmin

User = get_user_model()


def _log(user, action_text, mr=None, details=None, status='success'):
    """Helper to create UserActivity entries."""
    UserActivity.objects.create(
        user=user,
        action=action_text,
        ministry_request=mr,
        details=details or {},
        status=status
    )


def _notify(request_obj, user, channel, message):
    """Helper to create Notification entries."""
    Notification.objects.create(
        request=request_obj,
        user=user,
        channel=channel,
        message=message
    )


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
    queryset = User.objects.all().order_by('username')
    serializer_class = UserSerializer

    def get_permissions(self):
        if self.action in ['create', 'destroy', 'update', 'partial_update']:
            return [permissions.IsAdminUser()]
        return [IsAuthenticated()]


class MinistryRequestViewSet(viewsets.ModelViewSet):
    queryset = MinistryRequest.objects.all().order_by('-created_at')
    serializer_class = MinistryRequestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'clerk':
            return self.queryset.filter(clerk=user)
        # Elders and Pastors need to see the full list for processing and history
        return self.queryset

    def perform_create(self, serializer):
        mr = serializer.save(clerk=self.request.user)
        _log(self.request.user, "Created ministry request", mr,
             {"invited_name": mr.invited_name})

    @action(detail=True, methods=['post'], permission_classes=[IsPastor])
    def approve_pastor(self, request, pk=None):
        """Pastor approves. Stamp and PDF generation move to Clerk's final step."""
        mr = self.get_object()
        if not mr.elder_signed:
            return Response({'error': 'Elder must sign first.'}, status=status.HTTP_400_BAD_REQUEST)
        if mr.pastor_approved:
            return Response({'error': 'Already approved by Pastor.'}, status=status.HTTP_400_BAD_REQUEST)
        
        mr.pastor_approved = True
        mr.pastor = request.user
        mr.save()
        
        _log(request.user, "Approved by Pastor", mr)
        _notify(mr, mr.clerk, 'whatsapp', f"Request #{mr.id} approved by Pastor. Now needs Clerk final stamp.")
        
        return Response({'status': 'Approved by Pastor.'})

    @action(detail=True, methods=['post'], permission_classes=[IsClerkOrAdmin])
    def finalize_clerk(self, request, pk=None):
        """Clerk applies final stamp and generates PDF."""
        mr = self.get_object()
        if not mr.pastor_approved:
            return Response({'error': 'Pastor must approve first.'}, status=status.HTTP_400_BAD_REQUEST)
        if mr.final_pdf:
            return Response({'error': 'Already finalized.'}, status=status.HTTP_400_BAD_REQUEST)

        mr.status = 'approved'
        mr.save()

        # Apply Pastor's stamp to the signature model if not already there
        if mr.pastor and (mr.pastor.stamp_image or mr.pastor.signature_image):
            Signature.objects.get_or_create(
                request=mr,
                role='pastor',
                defaults={
                    'signed_by': mr.pastor,
                    'signature_image': mr.pastor.stamp_image or mr.pastor.signature_image
                }
            )

        # Generate the PDF at this final step
        try:
            from .pdf_generator import generate_ministry_request_pdf
            pdf_path = generate_ministry_request_pdf(mr)
            if pdf_path:
                from django.core.files.base import ContentFile
                with open(pdf_path, 'rb') as f:
                    mr.final_pdf.save(f'final_{mr.id}.pdf', ContentFile(f.read()), save=True)
        except Exception as e:
            import traceback
            error_details = traceback.format_exc()
            _log(request.user, f"PDF Generation Error: {str(e)}", mr, {"traceback": error_details})
            return Response({'error': f'PDF Generation failed: {str(e)}', 'details': error_details}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        _log(request.user, "Finalized and Stamped by Clerk", mr)
        return Response({'status': 'Finalized and Stamped.'})

    @action(detail=True, methods=['post'], permission_classes=[IsElder])
    def sign_elder(self, request, pk=None):
        """Elder signs."""
        mr = self.get_object()
        if mr.elder_signed:
            return Response({'error': 'Already signed by Elder.'}, status=status.HTTP_400_BAD_REQUEST)
        
        mr.elder_signed = True
        mr.elder = request.user
        mr.save()
        
        # Create signature record
        Signature.objects.create(
            request=mr,
            signed_by=request.user,
            role='elder',
            signature_image=request.user.signature_image
        )
        
        _log(request.user, "Signed by Elder", mr)
        _notify(mr, mr.clerk, 'whatsapp', f"Request #{mr.id} signed by Elder. Now awaiting Pastor approval.")
        
        return Response({'status': 'Signed by Elder.'})

    @action(detail=True, methods=['get'], permission_classes=[AllowAny])
    def download(self, request, pk=None):
        """Allows downloading the PDF. Requires either auth or a valid verification_uuid."""
        mr = self.get_object()
        
        # Security check: If not authenticated, must provide the verification UUID
        if not request.user.is_authenticated:
            v_uuid = request.query_params.get('vid')
            if not v_uuid or str(v_uuid) != str(mr.verification_uuid):
                return Response({'error': 'Authentication required or invalid verification ID.'}, status=status.HTTP_401_UNAUTHORIZED)

        if not mr.final_pdf:
            return Response({'error': 'PDF not generated yet. Approvals or Rejection might be incomplete.'}, status=status.HTTP_400_BAD_REQUEST)
        
        from django.http import FileResponse
        prefix = "Approval" if mr.status == 'approved' else "Rejection"
        return FileResponse(mr.final_pdf, as_attachment=True, filename=f"{prefix}_Request_{mr.id}.pdf")

    @action(detail=True, methods=['post'], permission_classes=[IsElderOrPastor])
    def reject(self, request, pk=None):
        mr = self.get_object()
        reason = request.data.get('reason', '').strip()
        mr.status = 'rejected'
        mr.rejection_reason = reason
        mr.save()

        # Generate Rejection PDF immediately
        from .pdf_generator import generate_ministry_request_pdf
        pdf_path = generate_ministry_request_pdf(mr)
        if pdf_path:
            from django.core.files.base import ContentFile
            with open(pdf_path, 'rb') as f:
                mr.final_pdf.save(f'rejection_{mr.id}.pdf', ContentFile(f.read()), save=True)

        _log(request.user, "Rejected request and generated rejection PDF", mr, {"reason": reason})
        _notify(mr, mr.clerk, 'whatsapp', f"Request #{mr.id} has been REJECTED. Rejection letter generated.")
        
        return Response({'status': 'Rejected.'})

    @action(detail=True, methods=['get'])
    def activities(self, request, pk=None):
        mr = self.get_object()
        activities = UserActivity.objects.filter(ministry_request=mr).order_by('timestamp')
        return Response(UserActivitySerializer(activities, many=True).data)


class ReportViewSet(viewsets.ModelViewSet):
    queryset = Report.objects.all().order_by('-timestamp')
    serializer_class = ReportSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        file = self.request.FILES.get('file')
        if file and not file.name.lower().endswith('.pdf'):
            from rest_framework.exceptions import ValidationError
            raise ValidationError("Only PDF files are allowed for reports.")
        serializer.save(uploaded_by=self.request.user)

    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        report = self.get_object()
        from django.http import FileResponse
        return FileResponse(report.file, as_attachment=True, filename=report.file.name)


class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)


class SignatureViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Signature.objects.all()
    serializer_class = SignatureSerializer
    permission_classes = [IsAuthenticated]


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Notification.objects.all().order_by('-timestamp')
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]


@api_view(['GET'])
@perm_classes([IsAuthenticated])
def profile(request):
    return Response(UserSerializer(request.user).data)


@api_view(['GET'])
@perm_classes([]) # Public
def verify_request(request, uuid):
    try:
        mr = MinistryRequest.objects.get(verification_uuid=uuid)
        return Response({
            'id': mr.id,
            'invited_name': mr.invited_name,
            'event_type': mr.event_type,
            'event_date': mr.event_date,
            'status': mr.status,
            'elder': mr.elder_name,
            'clerk': mr.clerk_name,
            'finalized_at': mr.updated_at
        })
    except MinistryRequest.DoesNotExist:
        return Response({'error': 'Invalid verification code.'}, status=status.HTTP_404_NOT_FOUND)
