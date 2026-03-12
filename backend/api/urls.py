from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CustomAuthToken, UserViewSet, DocumentViewSet, ServiceRequestViewSet, SignatureViewSet, CommentViewSet, NotificationViewSet, profile
from . import views

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'documents', DocumentViewSet)
router.register(r'requests', ServiceRequestViewSet)
router.register(r'signatures', SignatureViewSet)
router.register(r'comments', CommentViewSet)
router.register(r'notifications', NotificationViewSet)

urlpatterns = [
    path('auth/login/', CustomAuthToken.as_view()),
    path('auth/profile/', profile, name='auth_profile'),
    path('', include(router.urls)),
    path('verify/<str:uuid>/', views.verify_document, name='verify_document'),
]
