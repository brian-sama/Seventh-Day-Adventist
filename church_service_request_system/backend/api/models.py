from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    ROLE_CHOICES = (
        ('clerk', 'Clerk'),
        ('elder', 'Elder'),
        ('pastor', 'Pastor'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='clerk')
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    signature_image = models.ImageField(upload_to='signatures/', blank=True, null=True)

class Document(models.Model):
    title = models.CharField(max_length=255)
    file = models.FileField(upload_to='documents/')
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE)
    timestamp = models.DateTimeField(auto_now_add=True)
    locked = models.BooleanField(default=False)

class ServiceRequest(models.Model):
    STATUS_CHOICES = (
        ('pending_elder', 'Pending Elder Review'),
        ('pending_pastor', 'Pending Pastor Review'),
        ('returned_to_clerk', 'Returned to Clerk'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    )
    document = models.ForeignKey(Document, on_delete=models.CASCADE)
    clerk = models.ForeignKey(User, related_name='requests_created', on_delete=models.CASCADE)
    elder = models.ForeignKey(User, related_name='requests_reviewed', null=True, blank=True, on_delete=models.SET_NULL)
    pastor = models.ForeignKey(User, related_name='requests_approved', null=True, blank=True, on_delete=models.SET_NULL)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='pending_elder')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class Signature(models.Model):
    document = models.ForeignKey(Document, on_delete=models.CASCADE)
    signed_by = models.ForeignKey(User, on_delete=models.CASCADE)
    signature_image = models.ImageField(upload_to='applied_signatures/', blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)

class Comment(models.Model):
    request = models.ForeignKey(ServiceRequest, on_delete=models.CASCADE)
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    text = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
