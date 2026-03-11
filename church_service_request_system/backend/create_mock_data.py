import os
import django
from django.core.files import File
from PIL import Image

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import User

def create_dummy_signature(filename, text, color):
    img = Image.new('RGB', (150, 50), color=(255, 255, 255))
    # Simple dummy "signature" image
    from PIL import ImageDraw
    d = ImageDraw.Draw(img)
    d.text((10, 10), text, fill=color)
    img.save(filename)
    return filename

def run():
    print("Creating mock users...")
    
    users_data = [
        {'username': 'clerk1', 'role': 'clerk', 'password': 'password123', 'color': 'black'},
        {'username': 'elder1', 'role': 'elder', 'password': 'password123', 'color': 'blue'},
        {'username': 'pastor1', 'role': 'pastor', 'password': 'password123', 'color': 'red'}
    ]

    for ud in users_data:
        if not User.objects.filter(username=ud['username']).exists():
            user = User.objects.create_user(
                username=ud['username'],
                password=ud['password'],
                role=ud['role'],
                phone_number='+1234567890'
            )
            sig_file = create_dummy_signature(f"{ud['username']}_sig.jpg", f"{ud['username']} sig", ud['color'])
            with open(sig_file, 'rb') as f:
                user.signature_image.save(f"{ud['username']}_sig.jpg", File(f))
            user.save()
            os.remove(sig_file)
            print(f"Created {ud['username']}")

if __name__ == '__main__':
    run()
