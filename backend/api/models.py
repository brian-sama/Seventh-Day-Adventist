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
    stamp_image = models.ImageField(upload_to='stamps/', blank=True, null=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']


class MinistryRequest(models.Model):
    REQUEST_TYPE_CHOICES = (
        ('preacher', 'Preacher Invitation'),
        ('choir', 'Choir/Group Invitation'),
    )
    STATUS_CHOICES = (
        ('pending', 'Pending Approval'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    )
    
    clerk = models.ForeignKey(User, related_name='requests_created', on_delete=models.CASCADE)
    receiving_church = models.CharField(max_length=255)
    receiving_location = models.CharField(max_length=255)

    request_type = models.CharField(max_length=20, choices=REQUEST_TYPE_CHOICES)

    invited_name = models.CharField(max_length=255)
    invited_church = models.CharField(max_length=255)

    event_type = models.CharField(max_length=255)
    event_date = models.DateField()

    elder_name = models.CharField(max_length=255)
    elder_contact = models.CharField(max_length=50)

    clerk_name = models.CharField(max_length=255)
    clerk_contact = models.CharField(max_length=50)

    pastor = models.ForeignKey(User, related_name='requests_pastor', null=True, blank=True, on_delete=models.SET_NULL)
    elder = models.ForeignKey(User, related_name='requests_elder', null=True, blank=True, on_delete=models.SET_NULL)

    pastor_approved = models.BooleanField(default=False)
    elder_signed = models.BooleanField(default=False)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    rejection_reason = models.TextField(blank=True, null=True)
    verification_uuid = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    final_pdf = models.FileField(upload_to='requests/finalized/', blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Report(models.Model):
    title = models.CharField(max_length=255)
    file = models.FileField(upload_to='reports/')
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE)
    quarter = models.CharField(max_length=10)
    year = models.IntegerField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} ({self.quarter} {self.year})"


class Signature(models.Model):
    request = models.ForeignKey(MinistryRequest, on_delete=models.CASCADE, related_name='signatures')
    signed_by = models.ForeignKey(User, on_delete=models.CASCADE)
    role = models.CharField(max_length=20, blank=True, null=True)
    signature_image = models.ImageField(upload_to='applied_signatures/', blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('request', 'role')


class Comment(models.Model):
    request = models.ForeignKey(MinistryRequest, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    text = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)


class UserActivity(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    action = models.CharField(max_length=255)
    ministry_request = models.ForeignKey(MinistryRequest, on_delete=models.CASCADE, null=True, blank=True)
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
    request = models.ForeignKey(MinistryRequest, on_delete=models.CASCADE, related_name='notifications')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    channel = models.CharField(max_length=20, choices=CHANNEL_CHOICES)
    message = models.TextField()
    status = models.CharField(max_length=20, default='pending') # pending, sent, failed
    sent_at = models.DateTimeField(null=True, blank=True)
    error_message = models.TextField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Notification for {self.request.id} via {self.channel}"
