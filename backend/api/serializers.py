from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import MinistryRequest, Report, Signature, Comment, UserActivity, Notification

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ['id', 'username', 'password', 'email', 'first_name', 'last_name',
                  'role', 'phone_number', 'signature_image', 'stamp_image']
        read_only_fields = ['signature_image', 'stamp_image']

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = super().create(validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user


class ReportSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(source='uploaded_by.username', read_only=True)

    class Meta:
        model = Report
        fields = ['id', 'title', 'file', 'uploaded_by', 'uploaded_by_name', 'quarter', 'year', 'timestamp']
        read_only_fields = ['uploaded_by', 'timestamp']


class MinistryRequestSerializer(serializers.ModelSerializer):
    clerk_name = serializers.CharField(source='clerk.username', read_only=True)
    pastor_name = serializers.CharField(source='pastor.username', read_only=True)
    elder_name = serializers.CharField(source='elder.username', read_only=True)
    signatures = serializers.SerializerMethodField()
    can_approve = serializers.SerializerMethodField()
    can_sign = serializers.SerializerMethodField()
    can_finalize = serializers.SerializerMethodField()

    class Meta:
        model = MinistryRequest
        fields = [
            'id', 'clerk', 'clerk_name', 'receiving_church', 'receiving_location',
            'request_type', 'invited_name', 'invited_church', 'event_type', 'event_date',
            'elder_name', 'elder_contact', 'clerk_name', 'clerk_contact',
            'pastor', 'pastor_name', 'elder', 'elder_name', 'pastor_approved', 'elder_signed',
            'status', 'rejection_reason', 'verification_uuid', 'final_pdf',
            'signatures', 'can_approve', 'can_sign', 'can_finalize', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'clerk', 'pastor', 'elder', 'pastor_approved', 'elder_signed',
            'status', 'rejection_reason', 'verification_uuid', 'final_pdf'
        ]

    def get_signatures(self, obj):
        sigs = obj.signatures.all().order_by('timestamp')
        return SignatureSerializer(sigs, many=True).data

    def get_can_approve(self, obj):
        user = self.context['request'].user
        return user.role == 'pastor' and obj.status == 'pending' and not obj.pastor_approved

    def get_can_sign(self, obj):
        user = self.context['request'].user
        return user.role == 'elder' and not obj.elder_signed

    def get_can_finalize(self, obj):
        user = self.context['request'].user
        return user.role == 'clerk' and obj.pastor_approved and not obj.final_pdf


class SignatureSerializer(serializers.ModelSerializer):
    signed_by_name = serializers.CharField(source='signed_by.username', read_only=True)

    class Meta:
        model = Signature
        fields = ['id', 'request', 'signed_by', 'signed_by_name', 'role',
                  'signature_image', 'timestamp']
        read_only_fields = ['signed_by']


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
                  'ministry_request', 'timestamp', 'details', 'status']
        read_only_fields = ['user']


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'
