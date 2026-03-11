import logging
from twilio.rest import Client
from django.conf import settings

logger = logging.getLogger(__name__)

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
