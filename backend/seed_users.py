import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

def seed():
    users = [
        {
            'username': 'system_admin',
            'email': 'admin@church.org',
            'password': 'admin123',
            'role': 'admin',
            'is_staff': True,
            'is_superuser': True,
            'first_name': 'System',
            'last_name': 'Administrator'
        },
        {
            'username': 'clerk_test',
            'email': 'clerk@church.org',
            'password': 'admin123',
            'role': 'clerk',
            'first_name': 'Test',
            'last_name': 'Clerk'
        },
        {
            'username': 'elder_test',
            'email': 'elder@church.org',
            'password': 'admin123',
            'role': 'elder',
            'first_name': 'Test',
            'last_name': 'Elder'
        },
        {
            'username': 'pastor_test',
            'email': 'pastor@church.org',
            'password': 'admin123',
            'role': 'pastor',
            'first_name': 'Test',
            'last_name': 'Pastor'
        }
    ]

    for user_data in users:
        password = user_data.pop('password')
        user, created = User.objects.get_or_create(username=user_data['username'], defaults=user_data)
        user.set_password(password)
        user.save()
        if created:
            print(f"Created user: {user.username} with role: {user.role}")
        else:
            print(f"Updated password for user: {user.username}")

if __name__ == '__main__':
    seed()
