from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Document, ServiceRequest, Signature, Comment

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'phone_number', 'signature_image']
        read_only_fields = ['role', 'signature_image']

class DocumentSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(source='uploaded_by.username', read_only=True)
    
    class Meta:
        model = Document
        fields = ['id', 'title', 'file', 'uploaded_by', 'uploaded_by_name', 'timestamp', 'locked']
        read_only_fields = ['uploaded_by', 'locked']

class ServiceRequestSerializer(serializers.ModelSerializer):
    document = DocumentSerializer(read_only=True)
    document_id = serializers.PrimaryKeyRelatedField(queryset=Document.objects.all(), source='document', write_only=True)
    clerk_name = serializers.CharField(source='clerk.username', read_only=True)
    elder_name = serializers.CharField(source='elder.username', read_only=True)
    pastor_name = serializers.CharField(source='pastor.username', read_only=True)

    class Meta:
        model = ServiceRequest
        fields = ['id', 'document', 'document_id', 'clerk', 'clerk_name', 'elder', 'elder_name', 'pastor', 'pastor_name', 'status', 'created_at', 'updated_at']
        read_only_fields = ['clerk', 'elder', 'pastor', 'status']

class SignatureSerializer(serializers.ModelSerializer):
    signed_by_name = serializers.CharField(source='signed_by.username', read_only=True)

    class Meta:
        model = Signature
        fields = ['id', 'document', 'signed_by', 'signed_by_name', 'signature_image', 'timestamp']
        read_only_fields = ['signed_by']

class CommentSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.username', read_only=True)

    class Meta:
        model = Comment
        fields = ['id', 'request', 'author', 'author_name', 'text', 'timestamp']
        read_only_fields = ['author']
