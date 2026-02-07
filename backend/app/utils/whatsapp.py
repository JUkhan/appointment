import os
from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException
import logging

logger = logging.getLogger(__name__)


def send_whatsapp_message(to_number: str, message: str) -> bool:
    """
    Send a WhatsApp message using Twilio API

    Args:
        to_number: Recipient's phone number (with country code, e.g., +8801234567890)
        message: Message text to send

    Returns:
        bool: True if message sent successfully, False otherwise
    """
    try:
        # Get Twilio credentials from environment variables
        account_sid = os.getenv('TWILIO_ACCOUNT_SID')
        auth_token = os.getenv('TWILIO_AUTH_TOKEN')
        from_number = os.getenv('TWILIO_WHATSAPP_FROM', 'whatsapp:+14155238886')

        # Validate credentials
        if not account_sid or not auth_token:
            logger.error('Twilio credentials not configured')
            return False

        # Format the recipient number
        if not to_number.startswith('whatsapp:'):
            to_number = f'whatsapp:{to_number}'

        # Initialize Twilio client
        client = Client(account_sid, auth_token)

        # Send message
        message_response = client.messages.create(
            body=message,
            from_=from_number,
            to=to_number
        )

        logger.info(f'WhatsApp message sent successfully. SID: {message_response.sid}')
        return True

    except TwilioRestException as e:
        logger.error(f'Twilio error: {e.msg}')
        return False
    except Exception as e:
        logger.error(f'Error sending WhatsApp message: {str(e)}')
        return False


def format_transaction_message(products: list, total_price: float, business_name: str = None) -> str:
    """
    Format transaction details into a WhatsApp message

    Args:
        products: List of product dictionaries with productName, type, quantity, unitPrice
        total_price: Total transaction price
        business_name: Optional business name

    Returns:
        str: Formatted message
    """
    # Start message with greeting
    lines = []

    if business_name:
        lines.append(f"*{business_name}*")
        lines.append("")

    lines.append("📋 *Transaction Receipt*")
    lines.append("=" * 30)
    lines.append("")

    # Add product details
    for i, product in enumerate(products, 1):
        product_name = product.get('productName', 'Unknown')
        product_type = product.get('type', '')
        quantity = product.get('quantity', 0)
        unit_price = product.get('unitPrice', 0)
        subtotal = quantity * unit_price

        # Format product line
        if product_type:
            lines.append(f"{i}. *{product_name}* ({product_type})")
        else:
            lines.append(f"{i}. *{product_name}*")

        lines.append(f"   Qty: {quantity} × ৳{unit_price:.2f} = ৳{subtotal:.2f}")
        lines.append("")

    # Add total
    lines.append("=" * 30)
    lines.append(f"*Total: ৳{total_price:.2f}*")
    lines.append("")
    lines.append("Thank you for your purchase! 🙏")

    return "\n".join(lines)
