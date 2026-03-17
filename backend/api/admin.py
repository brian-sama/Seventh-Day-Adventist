from django.contrib import admin
from .models import User, MinistryRequest, Report, UserActivity, Signature, Comment, Notification

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('email', 'username', 'role', 'is_staff')
    search_fields = ('email', 'username')

@admin.register(MinistryRequest)
class MinistryRequestAdmin(admin.ModelAdmin):
    list_display = ('id', 'request_type', 'clerk', 'status', 'event_date', 'created_at')
    list_filter = ('status', 'request_type', 'created_at')
    search_fields = ('receiving_church', 'invited_name', 'clerk__username')

@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ('title', 'uploaded_by', 'quarter', 'year', 'timestamp')
    list_filter = ('quarter', 'year')
    search_fields = ('title', 'uploaded_by__username')

@admin.register(UserActivity)
class UserActivityAdmin(admin.ModelAdmin):
    list_display = ('user', 'action', 'timestamp', 'status')
    list_filter = ('timestamp', 'action', 'status')
    search_fields = ('user__username', 'action')

@admin.register(Signature)
class SignatureAdmin(admin.ModelAdmin):
    list_display = ('request', 'signed_by', 'role', 'timestamp')

@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ('request', 'author', 'timestamp')

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('request', 'user', 'channel', 'status', 'timestamp')
    list_filter = ('channel', 'status')
