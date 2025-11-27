// SMS sending utility using Twilio
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

let client: any = null;
if (accountSid && authToken) {
  client = twilio(accountSid, authToken);
}

export async function sendSMS(to: string, body: string): Promise<void> {
  if (!client) {
    console.log('Twilio not configured, SMS would be sent:', { to, body });
    return;
  }

  await client.messages.create({
    from: fromNumber,
    to,
    body,
  });
}
