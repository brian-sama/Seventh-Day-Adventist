from django.contrib import admin
from .models import ServiceRequest, UserActivity, Document

@admin.register(ServiceRequest)
class ServiceRequestAdmin(admin.ModelAdmin):
    list_display = ('id', 'document', 'clerk', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('document__title', 'clerk__username')

@admin.register(UserActivity)
class UserActivityAdmin(admin.ModelAdmin):
    list_display = ('user', 'action', 'timestamp')
    list_filter = ('timestamp', 'action')
    search_fields = ('user__username', 'action')

@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ('title', 'uploaded_by', 'timestamp', 'locked')
    search_fields = ('title', 'uploaded_by__username')
