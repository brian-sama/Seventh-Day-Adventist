from django.db import migrations
from django.contrib.auth import get_user_model

def seed_production_users(apps, schema_editor):
    User = get_user_model()
    
    users = [
        {
            'username': 'system_admin',
            'email': 'admin@magwegwewestsda.co.zw',
            'password': 'admin123',
            'role': 'admin',
            'is_staff': True,
            'is_superuser': True,
            'first_name': 'System',
            'last_name': 'Administrator'
        },
        {
            'username': 'clerk_test',
            'email': 'clerk@magwegwewestsda.co.zw',
            'password': 'admin123',
            'role': 'clerk',
            'first_name': 'Test',
            'last_name': 'Clerk'
        },
        {
            'username': 'elder_test',
            'email': 'elder@magwegwewestsda.co.zw',
            'password': 'admin123',
            'role': 'elder',
            'first_name': 'Test',
            'last_name': 'Elder'
        },
        {
            'username': 'pastor_test',
            'email': 'pastor@magwegwewestsda.co.zw',
            'password': 'admin123',
            'role': 'pastor',
            'first_name': 'Test',
            'last_name': 'Pastor'
        }
    ]

    for user_data in users:
        password = user_data.pop('password')
        # Use email as the unique identifier for lookup
        user, created = User.objects.get_or_create(email=user_data['email'], defaults=user_data)
        user.username = user_data['username']
        user.set_password(password)
        user.save()

def remove_production_users(apps, schema_editor):
    pass # No need to remove specifically for this task

class Migration(migrations.Migration):

    dependencies = [
        ('api', '0006_document_converted_pdf_servicerequest_final_document_and_more'),
    ]

    operations = [
        migrations.RunPython(seed_production_users, remove_production_users),
    ]
