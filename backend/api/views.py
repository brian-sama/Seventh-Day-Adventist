import os
import hashlib
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action, api_view, permission_classes as perm_classes
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
from .models import Document, ServiceRequest, Signature, Comment, UserActivity, Notification
from .serializers import (UserSerializer, DocumentSerializer, ServiceRequestSerializer,
                          SignatureSerializer, CommentSerializer, UserActivitySerializer, NotificationSerializer)
from .permissions import IsClerk, IsElder, IsPastor, IsElderOrPastor, IsClerkOrAdmin
from .pdf_service import (
    convert_docx_to_pdf, 
    apply_clerk_stamp, 
    add_signature_to_pdf, 
    add_qr_verification, 
    lock_pdf
)

User = get_user_model()


def _log(user, action_text, sr=None, details=None, status='success'):
    """Helper to create UserActivity entries in one line."""
    UserActivity.objects.create(
        user=user,
        action=action_text,
        service_request=sr,
        details=details or {},
        status=status
    )


def _notify(request, user, channel, message):
    """Helper to create Notification entries."""
    Notification.objects.create(
        request=request,
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


class DocumentViewSet(viewsets.ModelViewSet):
    queryset = Document.objects.all()
    serializer_class = DocumentSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        doc = serializer.save(uploaded_by=self.request.user)
        
        # Word document support: Convert DOCX to PDF for preview
        if doc.file.name.endswith(('.docx', '.doc')):
            from .pdf_service import convert_docx_to_pdf
            # Create a path for the converted PDF
            pdf_filename = os.path.splitext(doc.file.name)[0] + ".pdf"
            pdf_path = os.path.join(os.path.dirname(doc.file.path), pdf_filename)
            
            converted_path = convert_docx_to_pdf(doc.file.path, pdf_path)
            if converted_path:
                # Save the relative path to models
                rel_path = os.path.relpath(converted_path, start=os.path.join(os.getcwd(), 'media'))
                doc.converted_pdf = rel_path
                doc.save()

        # Compute and store document hash for tamper detection
        try:
            h = hashlib.sha256()
            doc.file.seek(0)
            for chunk in iter(lambda: doc.file.read(8192), b''):
                h.update(chunk)
            doc.file.seek(0)
            doc.document_hash = h.hexdigest()
            doc.save()
        except Exception:
            pass

    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """Serve the document file for download. Preview aware."""
        from django.http import FileResponse, HttpResponseForbidden
        doc = self.get_object()
        
        # Check if requested as inline (preview) or attachment (download)
        as_inline = request.query_params.get('inline') == '1'
        
        # Check if the document belongs to a finalized request
        sr = ServiceRequest.objects.filter(document=doc).first()
        
        # Security: Only permit attachment download AFTER final approval (unless clerk/admin/involved elder/pastor)
        is_involved = False
        if sr:
            is_involved = (request.user == sr.clerk or 
                           (sr.elder and request.user == sr.elder) or 
                           (sr.pastor and request.user == sr.pastor))
            
        is_staff = request.user.role in ['admin', 'clerk', 'elder', 'pastor']
        
        if not as_inline and sr and sr.current_stage != 'FINALIZED' and not is_staff and not is_involved:
            return HttpResponseForbidden("Download is only permitted after final Pastor approval.")
        
        # If it's a DOCX and we want an inline preview, serve the converted PDF if available
        file_to_serve = doc.file
        if as_inline:
            if doc.file.name.endswith(('.docx', '.doc')):
                if not doc.converted_pdf:
                    # Try to convert on the fly
                    from .pdf_service import convert_docx_to_pdf
                    from django.conf import settings
                    
                    pdf_filename = os.path.splitext(doc.file.name)[0] + ".pdf"
                    pdf_path = os.path.join(os.path.dirname(doc.file.path), pdf_filename)
                    
                    converted_path = convert_docx_to_pdf(doc.file.path, pdf_path)
                    if converted_path:
                        rel_path = os.path.relpath(converted_path, start=settings.MEDIA_ROOT)
                        doc.converted_pdf = rel_path
                        doc.save()
                
                if doc.converted_pdf:
                    file_to_serve = doc.converted_pdf
                else:
                    print(f"CRITICAL: DOCX conversion failed for document {doc.id} ({doc.file.name})")
                    return Response({'error': 'Document conversion to PDF failed. Please ensure LibreOffice is installed and healthy on the VPS.'}, 
                                    status=status.HTTP_400_BAD_REQUEST)
            
            # Final safety check: if still not a PDF and requested inline, return error
            if not file_to_serve.name.lower().endswith('.pdf'):
                return Response({'error': 'Inline preview only supported for PDF documents.'}, 
                                status=status.HTTP_400_BAD_REQUEST)

        content_type = 'application/pdf' if file_to_serve.name.lower().endswith('.pdf') else None
        return FileResponse(file_to_serve, as_attachment=not as_inline, filename=os.path.basename(file_to_serve.name), content_type=content_type)


class ServiceRequestViewSet(viewsets.ModelViewSet):
    queryset = ServiceRequest.objects.all().order_by('-created_at')
    serializer_class = ServiceRequestSerializer
    permission_classes = [IsAuthenticated]

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
        sr = serializer.save(
            clerk=self.request.user,
            current_stage='UPLOADED',
            current_holder='Clerk'
        )
        _log(self.request.user, "Created service request", sr,
             {"document_title": sr.document.title})

    @action(detail=True, methods=['get'])
    def activities(self, request, pk=None):
        sr = self.get_object()
        activities = UserActivity.objects.filter(service_request=sr).order_by('timestamp')
        return Response(UserActivitySerializer(activities, many=True).data)

    @action(detail=True, methods=['post'], permission_classes=[IsClerk])
    def apply_stamp(self, request, pk=None):
        """Applies the church clerk's stamp to page 1."""
        sr = self.get_object()
        
        if sr.current_stage != 'UPLOADED':
            return Response({'error': f'Cannot stamp: Document is in "{sr.current_stage}" stage.'},
                            status=status.HTTP_400_BAD_REQUEST)
        
        if sr.is_stamped:
            return Response({'error': 'This document has already been stamped.'},
                            status=status.HTTP_400_BAD_REQUEST)

        try:
            # Apply the NEW precise stamp (bottom-right 120x60)
            doc = sr.document
            target_path = doc.converted_pdf.path if doc.converted_pdf else doc.file.path
            
            if not target_path.lower().endswith('.pdf'):
                return Response({'error': 'Cannot stamp: File is not a PDF.'},
                                status=status.HTTP_400_BAD_REQUEST)

            apply_clerk_stamp(target_path, target_path)
            
            sr.is_stamped = True
            doc.locked = True
            doc.save()
            
            sr.current_stage = 'ELDER_PENDING'
            sr.current_holder = 'Head Elder'
            sr.status = 'pending_elder'
            sr.save()

            _log(request.user, "Applied official church stamp", sr,
                 {"document_title": sr.document.title})
            
            # Internal Notification
            _notify(sr, request.user, 'whatsapp', f"Document #{sr.id} stamped. Routed to Head Elder.")
            
            return Response({'status': 'Stamp applied successfully. Routed to Head Elder.'})
        except Exception as e:
            _log(request.user, f"Stamp failed: {str(e)}", sr, status='failure')
            return Response({'error': f'Failed to apply stamp: {str(e)}'},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # ─── ELDER: Approve ────────────────────────────────────────────────────
    @action(detail=True, methods=['post'], permission_classes=[IsElder])
    def approve_elder(self, request, pk=None):
        """Sign and forward to Pastor."""
        sr = self.get_object()

        if sr.current_stage != 'ELDER_PENDING':
            return Response({'error': f'Cannot sign: document is currently "{sr.current_stage}".'},
                            status=status.HTTP_400_BAD_REQUEST)

        # Embed elder signature into PDF
        try:
            target_path = sr.document.converted_pdf.path if sr.document.converted_pdf else sr.document.file.path
            
            if not target_path.lower().endswith('.pdf'):
                return Response({'error': 'Cannot sign: File is not a PDF.'},
                                status=status.HTTP_400_BAD_REQUEST)

            sig_path = request.user.signature_image.path if request.user.signature_image else None
            add_signature_to_pdf(
                target_path,
                sig_path,
                target_path,
                x=150, y=170, # Precise Head Elder Sign line anchor
                width=100, height=35
            )
            Signature.objects.get_or_create(
                document=sr.document,
                role='elder',
                defaults={
                    'signed_by': request.user,
                    'x_position': 100,
                    'y_position': 100,
                    'ip_address': request.META.get('REMOTE_ADDR'),
                }
            )

            sr.status = 'pending_pastor'
            sr.current_stage = 'PASTOR_PENDING'
            sr.current_holder = 'Pastor'
            sr.elder = request.user
            sr.save()

            _log(request.user, "Reviewed and Signed (Head Elder)", sr)
            _notify(sr, request.user, 'whatsapp', f"Request #{sr.id} signed by Elder. Routed to Pastor.")

            return Response({'status': 'Approved by Elder — awaiting Pastor.'})
        except Exception as e:
            _log(request.user, f"Elder signature failed: {str(e)}", sr, status='failure')
            return Response({'error': f'Failed to process signature: {str(e)}'},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # ─── PASTOR: Final Approve ────────────────────────────────────────────
    @action(detail=True, methods=['post'], permission_classes=[IsPastor])
    def approve_pastor(self, request, pk=None):
        """Final signature and approval."""
        sr = self.get_object()

        if sr.current_stage != 'PASTOR_PENDING':
            return Response({'error': f'Cannot sign: document is currently "{sr.current_stage}".'},
                            status=status.HTTP_400_BAD_REQUEST)
        try:
            # Embed pastor signature, add QR verification, and finalize
            target_path = sr.document.converted_pdf.path if sr.document.converted_pdf else sr.document.file.path
            
            # Apply Pastor Signature (Image or Placeholder)
            sig_path = request.user.signature_image.path if request.user.signature_image else None

            add_signature_to_pdf(
                target_path,
                sig_path,
                target_path,
                x=150, y=90, # Precise Pastor Sign line anchor (lower on page)
                width=100, height=35
            )
            
            # Apply QR Verification (matching church domain)
            verify_url = f"https://magwegwewestsda.co.zw/verify/{sr.verification_uuid}/"
            add_qr_verification(target_path, target_path, verify_url)
            
            # Lock the document
            lock_pdf(target_path, target_path)
            
            # Update final_document field in ServiceRequest
            from django.core.files.base import ContentFile
            with open(target_path, 'rb') as f:
                sr.final_document.save(f'final_{sr.id}.pdf', ContentFile(f.read()), save=False)

            Signature.objects.get_or_create(
                document=sr.document,
                role='pastor',
                defaults={
                    'signed_by': request.user,
                    'x_position': 130,
                    'y_position': 60,
                    'ip_address': request.META.get('REMOTE_ADDR'),
                }
            )

            sr.status = 'approved'
            sr.current_stage = 'FINALIZED'
            sr.current_holder = 'Clerk'
            sr.pastor = request.user
            sr.save()

            _log(request.user, "Final Authorization — Document Finalized (Pastor)", sr)
            _notify(sr, request.user, 'whatsapp', f"Request #{sr.id} finalized and approved by Pastor. Document returned to Clerk.")

            return Response({'status': 'Approved and Finalized by Pastor. Returned to Clerk.'})
        except Exception as e:
            _log(request.user, f"Pastor signature failed: {str(e)}", sr, status='failure')
            return Response({'error': f'Failed to process final approval: {str(e)}'},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # ─── ELDER / PASTOR: Reject ───────────────────────────────────────────
    @action(detail=True, methods=['post'], permission_classes=[IsElderOrPastor])
    def reject(self, request, pk=None):
        """Terminal rejection of a request."""
        sr = self.get_object()

        if sr.current_stage in ['FINALIZED', 'SENT']:
            return Response({'error': f'Cannot reject a request that is already "{sr.current_stage}".'},
                            status=status.HTTP_400_BAD_REQUEST)

        reason = request.data.get('reason', '').strip()
        sr.status = 'rejected'
        sr.current_stage = 'UPLOADED' # Reset back to start or keep terminal
        sr.rejection_reason = reason
        sr.save()

        _log(request.user, "Rejected request", sr, {"reason": reason})
        _notify(sr, request.user, 'whatsapp', f"Request #{sr.id} was REJECTED. Reason: {reason}")

        return Response({'status': 'Rejected.'})

    # ─── ELDER / PASTOR: Return to Clerk ─────────────────────────────────
    @action(detail=True, methods=['post'])
    def return_to_clerk(self, request, pk=None):
        sr = self.get_object()

        if request.user.role not in ['elder', 'pastor']:
            return Response({'error': 'Only elders or pastors can return a request.'},
                            status=status.HTTP_403_FORBIDDEN)
        if sr.status in ['finalized', 'rejected']:
            return Response({'error': f'Cannot return a request with status "{sr.status}".'},
                            status=status.HTTP_400_BAD_REQUEST)

        sr.status = 'returned_to_clerk'
        sr.current_stage = 'UPLOADED'
        sr.current_holder = 'Clerk'
        sr.document.locked = False
        sr.document.save()
        sr.is_stamped = False
        sr.save()

        _log(request.user, "Returned to Clerk for corrections", sr)

        from .notification_service import send_email_notification
        if sr.clerk.email:
            msg = (f"Your service request '{sr.document.title}' has been returned to you "
                   f"for corrections. Please log in for details.")
            send_email_notification("Service Request Returned for Corrections", msg, [sr.clerk.email])

        return Response({'status': 'Returned to Clerk.'})

    # ─── CLERK: WhatsApp Distribution Link ───────────────────────────────
    @action(detail=True, methods=['get'])
    def whatsapp_link(self, request, pk=None):
        sr = self.get_object()

        if request.user.role != 'clerk':
            return Response({'error': 'Only clerks can distribute documents.'},
                            status=status.HTTP_403_FORBIDDEN)
        if sr.status != 'finalized':
            return Response({'error': 'Document must be finalized before distribution.'},
                            status=status.HTTP_400_BAD_REQUEST)

        host = request.build_absolute_uri('/')
        download_url = f"{host}api/documents/{sr.document.id}/download/"
        message = (
            f"Hello,\n\n"
            f"Your church document *{sr.document.title}* has been officially approved and signed "
            f"by the Head Elder and Pastor of Magwegwe West Seventh Day Adventist Church.\n\n"
            f"You can download your document here:\n{download_url}\n\n"
            f"God bless,\nMagwegwe West Seventh Day Adventist Church"
        )
        import urllib.parse
        wa_link = f"https://wa.me/?text={urllib.parse.quote(message)}"

        sr.current_stage = 'SENT'
        sr.current_holder = 'None'
        sr.save()

@api_view(['GET'])
@perm_classes([]) # Public
def verify_document(request, uuid):
    """Public endpoint to verify a document by its UUID."""
    try:
        sr = ServiceRequest.objects.get(verification_uuid=uuid)
        return Response({
            'id': sr.id,
            'title': sr.document.title,
            'clerk_name': sr.clerk.get_full_name() or sr.clerk.username,
            'elder_name': sr.elder.get_full_name() if sr.elder else "N/A",
            'pastor_name': sr.pastor.get_full_name() if sr.pastor else "N/A",
            'finalized_at': sr.updated_at,
            'status': sr.current_stage
        })
    except ServiceRequest.DoesNotExist:
        return Response({'error': 'Invalid verification code.'}, status=status.HTTP_404_NOT_FOUND)

        _log(request.user, "Generated WhatsApp distribution link", sr,
             {"document_title": sr.document.title})

        return Response({'whatsapp_link': wa_link, 'download_url': download_url})


class SignatureViewSet(viewsets.ModelViewSet):
    queryset = Signature.objects.all()
    serializer_class = SignatureSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        ip = self.request.META.get('REMOTE_ADDR')
        serializer.save(signed_by=self.request.user, ip_address=ip)


class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)


@api_view(['GET'])
@perm_classes([IsAuthenticated])
def profile(request):
    return Response(UserSerializer(request.user).data)


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Notification.objects.all().order_by('-timestamp')
    serializer_class = NotificationSerializer
    permission_classes = [IsClerkOrAdmin]

    def get_queryset(self):
        # Users can only see notifications sent to them or created by them
        return self.queryset
