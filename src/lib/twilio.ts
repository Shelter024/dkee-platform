import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const phoneNumber = process.env.TWILIO_PHONE_NUMBER;

let twilioClient: twilio.Twilio | null = null;

if (accountSid && authToken) {
  twilioClient = twilio(accountSid, authToken);
}

export async function sendOTP(phone: string, otp: string): Promise<boolean> {
  if (!twilioClient || !phoneNumber) {
    console.warn('Twilio not configured. OTP would be:', otp);
    return false;
  }

  try {
    await twilioClient.messages.create({
      body: `Your DK Executive Engineers verification code is: ${otp}. Valid for 10 minutes.`,
      from: phoneNumber,
      to: phone,
    });
    return true;
  } catch (error) {
    console.error('Failed to send OTP:', error);
    return false;
  }
}

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
