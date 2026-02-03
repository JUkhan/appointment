from flask_mail import Message
from app import mail
import logging

logger = logging.getLogger(__name__)

def send_subscription_expiration_reminder(client_email, business_name, days_remaining, end_date):
    """
    Send subscription expiration reminder email

    Args:
        client_email: Client's email address
        business_name: Client's business name
        days_remaining: Number of days until expiration
        end_date: Subscription end date
    """
    try:
        subject = f"Subscription Expiring Soon - {business_name}"

        body = f"""
Dear {business_name},

This is a friendly reminder that your subscription will expire in {days_remaining} day(s).

Expiration Date: {end_date.strftime('%Y-%m-%d %H:%M UTC')}

To continue enjoying uninterrupted service, please renew your subscription before the expiration date.

If you have any questions or need assistance, please don't hesitate to contact our support team.

Best regards,
The Appointment System Team
        """

        html_body = f"""
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
        <h2 style="color: #ff9800;">Subscription Expiring Soon</h2>
        <p>Dear <strong>{business_name}</strong>,</p>

        <p>This is a friendly reminder that your subscription will expire in <strong>{days_remaining} day(s)</strong>.</p>

        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Expiration Date:</strong> {end_date.strftime('%Y-%m-%d %H:%M UTC')}</p>
        </div>

        <p>To continue enjoying uninterrupted service, please renew your subscription before the expiration date.</p>

        <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>

        <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
        <p style="color: #666; font-size: 12px;">
            Best regards,<br>
            The Appointment System Team
        </p>
    </div>
</body>
</html>
        """

        msg = Message(
            subject=subject,
            recipients=[client_email],
            body=body,
            html=html_body
        )

        mail.send(msg)
        logger.info(f"Successfully sent expiration reminder to {client_email}")
        return True

    except Exception as e:
        logger.error(f"Failed to send email to {client_email}: {str(e)}")
        return False
