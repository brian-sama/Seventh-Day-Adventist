from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CustomAuthToken, UserViewSet, DocumentViewSet, ServiceRequestViewSet, SignatureViewSet, CommentViewSet

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'documents', DocumentViewSet)
router.register(r'requests', ServiceRequestViewSet)
router.register(r'signatures', SignatureViewSet)
router.register(r'comments', CommentViewSet)

urlpatterns = [
    path('auth/login/', CustomAuthToken.as_view()),
    path('', include(router.urls)),
]
