from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (CustomAuthToken, UserViewSet, MinistryRequestViewSet, 
                    ReportViewSet, SignatureViewSet, CommentViewSet, 
                    NotificationViewSet, profile, verify_request)
from . import views

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'ministry-requests', MinistryRequestViewSet, basename='ministry-request')
router.register(r'reports', ReportViewSet, basename='report')
router.register(r'signatures', SignatureViewSet)
router.register(r'comments', CommentViewSet)
router.register(r'notifications', NotificationViewSet)

urlpatterns = [
    path('auth/login/', CustomAuthToken.as_view()),
    path('auth/profile/', profile, name='auth_profile'),
    path('', include(router.urls)),
    path('verify/<str:uuid>/', verify_request, name='verify_request'),
]
