# WhatsApp Integration Setup

This application uses Twilio API to send WhatsApp messages to customers after successful transactions.

## Prerequisites

1. A Twilio account (sign up at https://www.twilio.com/try-twilio)
2. WhatsApp sandbox enabled (for testing) or approved WhatsApp Business profile (for production)

## Setup Steps

### 1. Create Twilio Account

1. Go to https://www.twilio.com/try-twilio
2. Sign up for a free trial account
3. Verify your email and phone number

### 2. Get Your Credentials

1. Log in to your Twilio Console (https://console.twilio.com/)
2. Find your **Account SID** and **Auth Token** on the dashboard
3. Copy these values

### 3. Enable WhatsApp Sandbox (For Testing)

1. In Twilio Console, go to **Messaging** → **Try it out** → **Send a WhatsApp message**
2. Follow the instructions to join your WhatsApp sandbox:
   - Send the provided code (e.g., "join <unique-code>") to the Twilio WhatsApp number
   - You'll receive a confirmation message
3. Note the sandbox WhatsApp number (e.g., +14155238886)

### 4. Configure Environment Variables

Create or update your `.env` file with the following:

```env
# Twilio WhatsApp Configuration
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

**Important Notes:**
- Replace `your_account_sid_here` with your actual Account SID
- Replace `your_auth_token_here` with your actual Auth Token
- The `TWILIO_WHATSAPP_FROM` is the sandbox number for testing
- For production, you'll need to request a WhatsApp Business API approval from Twilio

### 5. Install Dependencies

```bash
pip install -r requirements.txt
```

### 6. Test the Integration

When creating a transaction with a mobile number:
- The mobile number should include country code (e.g., +8801712345678)
- The system will automatically send a WhatsApp message with transaction details
- Check Twilio Console logs for message status

## Phone Number Format

The mobile number should be in international format:
- **Bangladesh**: +8801712345678
- **USA**: +12025551234
- **India**: +919876543210

The system automatically adds the `whatsapp:` prefix when sending messages.

## Production Setup

For production use:

1. **Apply for WhatsApp Business API**:
   - Go to Twilio Console → Messaging → WhatsApp
   - Submit your business profile for approval
   - This process can take several days

2. **Get Your WhatsApp-Enabled Number**:
   - After approval, you'll receive a dedicated WhatsApp number
   - Update `TWILIO_WHATSAPP_FROM` in your `.env` file

3. **Remove Sandbox Limitation**:
   - With approved Business API, you can send to any number
   - No need for recipients to join sandbox

## Message Format

The WhatsApp message includes:
- Business name (if available)
- List of products with quantities and prices
- Total amount
- Thank you message

Example:
```
*Business Name*

📋 *Transaction Receipt*
==============================

1. *Napa* (tablet)
   Qty: 10 × ৳1.70 = ৳17.00

2. *Minaril*
   Qty: 5 × ৳2.50 = ৳12.50

==============================
*Total: ৳29.50*

Thank you for your purchase! 🙏
```

## Troubleshooting

### Messages Not Sending

1. **Check Twilio Console Logs**:
   - Go to Monitor → Logs → Messaging
   - Look for error messages

2. **Verify Credentials**:
   - Ensure Account SID and Auth Token are correct
   - Check that environment variables are loaded

3. **Check Phone Number Format**:
   - Must include country code
   - Must be a valid WhatsApp number

4. **Sandbox Limitations**:
   - In sandbox mode, recipient must have joined sandbox
   - Check Twilio Console → Messaging → WhatsApp sandbox settings

### Celery Not Processing Tasks

1. **Check Celery Worker**:
   ```bash
   celery -A app.celery_config.celery worker --loglevel=info
   ```

2. **Check Redis Connection**:
   - Ensure Redis is running
   - Verify `CELERY_BROKER_URL` in `.env`

## Cost

- **Free Trial**: $15 credit for testing
- **Production Pricing**:
  - User-initiated conversations: Free
  - Business-initiated conversations: ~$0.005-0.01 per message (varies by country)
  - Check current rates: https://www.twilio.com/whatsapp/pricing

## Security

- **Never commit** your `.env` file to version control
- Keep your Auth Token secure
- Rotate credentials regularly
- Use environment-specific credentials for dev/staging/prod

## Support

For issues with:
- **Twilio API**: https://support.twilio.com
- **This Integration**: Check application logs or contact dev team
