import logging
from django.conf import settings
from django.core.mail import send_mail

try:
    from twilio.rest import Client as TwilioClient
except ImportError:
    TwilioClient = None

logger = logging.getLogger(__name__)

def send_email_notification(subject, message, recipient_list):
    """
    Sends an email notification using Django's core mail system.
    """
    try:
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            recipient_list,
            fail_silently=False,
        )
        return True
    except Exception as e:
        logger.error(f"Failed to send email notification: {e}")
        return False

def send_whatsapp_notification(to_number, message):
    if not getattr(settings, 'TWILIO_ACCOUNT_SID', None):
        print(f"\n[MOCK WhatsApp to {to_number}]:\n{message}\n")
        logger.info(f"MOCK WhatsApp to {to_number}: {message}")
        return True

    try:
        client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        msg = client.messages.create(
            from_=f"whatsapp:{settings.TWILIO_PHONE_NUMBER}",
            body=message,
            to=f"whatsapp:{to_number}"
        )
        return msg.sid
    except Exception as e:
        logger.error(f"Failed to send WhatsApp message: {e}")
        return False
