from rest_framework.permissions import BasePermission


class IsClerk(BasePermission):
    """Allows access only to users with the 'clerk' role."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'clerk')


class IsElder(BasePermission):
    """Allows access only to users with the 'elder' role."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'elder')


class IsPastor(BasePermission):
    """Allows access only to users with the 'pastor' role."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'pastor')


class IsAdminRole(BasePermission):
    """Allows access only to users with the 'admin' role."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'admin')


class IsClerkOrAdmin(BasePermission):
    """Allows access to clerks and admins."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role in ['clerk', 'admin'])


class IsElderOrPastor(BasePermission):
    """Allows access to elders and pastors."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role in ['elder', 'pastor'])
