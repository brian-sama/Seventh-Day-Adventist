from django.db import models
from django.contrib.auth.models import AbstractUser
import hashlib
import uuid


class User(AbstractUser):
    ROLE_CHOICES = (
        ('clerk', 'Clerk'),
        ('elder', 'Elder'),
        ('pastor', 'Pastor'),
        ('admin', 'System Administrator'),
    )
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='clerk')
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    signature_image = models.ImageField(upload_to='signatures/', blank=True, null=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']


class Document(models.Model):
    title = models.CharField(max_length=255)
    file = models.FileField(upload_to='documents/')
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE)
    timestamp = models.DateTimeField(auto_now_add=True)
    locked = models.BooleanField(default=False)
    document_hash = models.CharField(max_length=64, blank=True, null=True)
    converted_pdf = models.FileField(upload_to='documents/converted/', blank=True, null=True)

    def compute_hash(self):
        """Compute and store a SHA256 hash of the document file."""
        if self.file:
            sha256 = hashlib.sha256()
            self.file.seek(0)
            for chunk in iter(lambda: self.file.read(8192), b''):
                sha256.update(chunk)
            self.file.seek(0)
            return sha256.hexdigest()
        return None


class ServiceRequest(models.Model):
    STATUS_CHOICES = (
        ('pending_elder', 'Pending Elder Review'),
        ('pending_pastor', 'Pending Pastor Review'),
        ('returned_to_clerk', 'Returned to Clerk'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('finalized', 'Finalized'),
    )
    STAGE_CHOICES = (
        ('UPLOADED', 'Uploaded'),
        ('VERIFIED', 'Clerk Verified'),
        ('ELDER_PENDING', 'Awaiting Elder'),
        ('ELDER_SIGNED', 'Elder Signed'),
        ('PASTOR_PENDING', 'Awaiting Pastor'),
        ('FINALIZED', 'Finalized'),
        ('SENT', 'Sent via WhatsApp'),
    )
    document = models.ForeignKey(Document, on_delete=models.CASCADE)
    clerk = models.ForeignKey(User, related_name='requests_created', on_delete=models.CASCADE)
    elder = models.ForeignKey(User, related_name='requests_reviewed', null=True, blank=True, on_delete=models.SET_NULL)
    pastor = models.ForeignKey(User, related_name='requests_approved', null=True, blank=True, on_delete=models.SET_NULL)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='pending_elder')
    current_stage = models.CharField(max_length=50, choices=STAGE_CHOICES, default='UPLOADED')
    current_holder = models.CharField(max_length=100, default='Clerk')
    is_stamped = models.BooleanField(default=False)
    rejection_reason = models.TextField(blank=True, null=True)
    verification_uuid = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    final_document = models.FileField(upload_to='documents/finalized/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Signature(models.Model):
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='signatures')
    signed_by = models.ForeignKey(User, on_delete=models.CASCADE)
    role = models.CharField(max_length=20, blank=True, null=True)
    signature_image = models.ImageField(upload_to='applied_signatures/', blank=True, null=True)
    x_position = models.IntegerField(default=100)
    y_position = models.IntegerField(default=100)
    page_number = models.IntegerField(default=1)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        # Prevent duplicate signatures per role per document
        unique_together = ('document', 'role')


class Comment(models.Model):
    request = models.ForeignKey(ServiceRequest, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    text = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)


class UserActivity(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    action = models.CharField(max_length=255)
    service_request = models.ForeignKey(ServiceRequest, on_delete=models.CASCADE, null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    details = models.JSONField(default=dict, blank=True)
    status = models.CharField(max_length=20, default='success') # success, failure, pending

    class Meta:
        verbose_name_plural = "User Activities"
        ordering = ['-timestamp']


class Notification(models.Model):
    CHANNEL_CHOICES = (
        ('whatsapp', 'WhatsApp'),
        ('email', 'Email'),
    )
    request = models.ForeignKey(ServiceRequest, on_delete=models.CASCADE, related_name='notifications')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    channel = models.CharField(max_length=20, choices=CHANNEL_CHOICES)
    message = models.TextField()
    status = models.CharField(max_length=20, default='pending') # pending, sent, failed
    sent_at = models.DateTimeField(null=True, blank=True)
    error_message = models.TextField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Notification for {self.request.id} via {self.channel}"
