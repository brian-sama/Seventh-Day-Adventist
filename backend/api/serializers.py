from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Document, ServiceRequest, Signature, Comment, UserActivity, Notification

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ['id', 'username', 'password', 'email', 'first_name', 'last_name',
                  'role', 'phone_number', 'signature_image']
        read_only_fields = ['signature_image']

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = super().create(validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user


class DocumentSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(source='uploaded_by.username', read_only=True)
    signatures = serializers.SerializerMethodField()

    class Meta:
        model = Document
        fields = ['id', 'title', 'file', 'converted_pdf', 'uploaded_by', 'uploaded_by_name',
                  'timestamp', 'locked', 'document_hash', 'signatures']
        read_only_fields = ['uploaded_by', 'locked', 'document_hash', 'converted_pdf']

    def get_signatures(self, obj):
        sigs = obj.signatures.all().order_by('timestamp')
        return SignatureSerializer(sigs, many=True).data


class ServiceRequestSerializer(serializers.ModelSerializer):
    document = DocumentSerializer(read_only=True)
    document_id = serializers.PrimaryKeyRelatedField(
        queryset=Document.objects.all(), source='document', write_only=True
    )
    pastor_name = serializers.CharField(source='pastor.username', read_only=True)
    document_title = serializers.CharField(source='document.title', read_only=True)
    document_hash = serializers.CharField(source='document.document_hash', read_only=True)
    can_approve = serializers.SerializerMethodField()
    can_reject = serializers.SerializerMethodField()

    class Meta:
        model = ServiceRequest
        fields = [
            'id', 'document', 'document_id', 'document_title', 'document_hash',
            'clerk', 'clerk_name', 'elder', 'elder_name', 'pastor', 'pastor_name',
            'status', 'current_stage', 'current_holder', 'is_stamped', 'rejection_reason',
            'verification_uuid', 'final_document', 'can_approve', 'can_reject',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'clerk', 'elder', 'pastor', 'status', 'current_stage', 
            'current_holder', 'is_stamped', 'rejection_reason', 'verification_uuid', 'final_document'
        ]

    def get_can_approve(self, obj):
        user = self.context['request'].user
        if user.role == 'clerk' and obj.current_stage == 'UPLOADED':
            return True
        if user.role == 'elder' and obj.current_stage == 'ELDER_PENDING':
            return True
        if user.role == 'pastor' and obj.current_stage == 'PASTOR_PENDING':
            return True
        return False

    def get_can_reject(self, obj):
        user = self.context['request'].user
        if user.role in ['elder', 'pastor'] and obj.current_stage in ['ELDER_PENDING', 'PASTOR_PENDING']:
            return True
        return False


class SignatureSerializer(serializers.ModelSerializer):
    signed_by_name = serializers.CharField(source='signed_by.username', read_only=True)

    class Meta:
        model = Signature
        fields = ['id', 'document', 'signed_by', 'signed_by_name', 'role',
                  'signature_image', 'x_position', 'y_position', 'page_number',
                  'ip_address', 'timestamp']
        read_only_fields = ['signed_by', 'ip_address']


class CommentSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.username', read_only=True)

    class Meta:
        model = Comment
        fields = ['id', 'request', 'author', 'author_name', 'text', 'timestamp']
        read_only_fields = ['author']


class UserActivitySerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    user_role = serializers.CharField(source='user.role', read_only=True)

    class Meta:
        model = UserActivity
        fields = ['id', 'user', 'username', 'user_role', 'action',
                  'service_request', 'timestamp', 'details', 'status']
        read_only_fields = ['user']


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'
