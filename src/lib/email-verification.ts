import crypto from 'crypto';
import { sendEmail } from './email';

export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function getVerificationExpiry(): Date {
  // Token expires in 24 hours
  return new Date(Date.now() + 24 * 60 * 60 * 1000);
}

export async function sendVerificationEmail(
  email: string,
  name: string,
  token: string
): Promise<void> {
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify-email?token=${token}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #1e40af; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9fafb; padding: 30px; }
        .button { display: inline-block; padding: 12px 30px; background-color: #1e40af; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>DKee Executive Engineers</h1>
        </div>
        <div class="content">
          <h2>Welcome, ${name}!</h2>
          <p>Thank you for registering with DKee Executive Engineers. Please verify your email address to continue.</p>
          <p>Click the button below to verify your email:</p>
          <div style="text-align: center;">
            <a href="${verificationUrl}" class="button">Verify Email Address</a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #1e40af;">${verificationUrl}</p>
          <p><strong>This link will expire in 24 hours.</strong></p>
          <p>After email verification, your account will be reviewed by our admin team for final approval.</p>
          <p>If you didn't create an account, please ignore this email.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} DKee Executive Engineers. All rights reserved.</p>
          <p>Automotive & Property Services</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Welcome, ${name}!

Thank you for registering with DKee Executive Engineers.

Please verify your email address by visiting:
${verificationUrl}

This link will expire in 24 hours.

After email verification, your account will be reviewed by our admin team for final approval.

If you didn't create an account, please ignore this email.

---
DKee Executive Engineers - Automotive & Property Services
  `;

  await sendEmail({
    to: email,
    subject: 'Verify Your Email - DKee Executive Engineers',
    text,
    html,
  });
}

export async function sendAccountApprovedEmail(
  email: string,
  name: string
): Promise<void> {
  const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL}/login`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #059669; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9fafb; padding: 30px; }
        .button { display: inline-block; padding: 12px 30px; background-color: #059669; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✓ Account Approved!</h1>
        </div>
        <div class="content">
          <h2>Welcome aboard, ${name}!</h2>
          <p>Great news! Your DKee Executive Engineers account has been approved.</p>
          <p>You now have full access to our platform:</p>
          <ul>
            <li>Request automotive services (repairs, maintenance, diagnostics)</li>
            <li>Browse property listings (sales, rentals, leases)</li>
            <li>Track your service requests in real-time</li>
            <li>View invoices and payment history</li>
            <li>Contact our support team</li>
          </ul>
          <div style="text-align: center;">
            <a href="${loginUrl}" class="button">Login to Your Account</a>
          </div>
          <p>If you have any questions, feel free to reach out to our support team.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} DKee Executive Engineers. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Account Approved!

Welcome aboard, ${name}!

Great news! Your DKee Executive Engineers account has been approved.

You now have full access to our platform:
- Request automotive services (repairs, maintenance, diagnostics)
- Browse property listings (sales, rentals, leases)
- Track your service requests in real-time
- View invoices and payment history
- Contact our support team

Login here: ${loginUrl}

If you have any questions, feel free to reach out to our support team.

---
DKee Executive Engineers
  `;

  await sendEmail({
    to: email,
    subject: 'Your Account Has Been Approved! - DKee Executive Engineers',
    text,
    html,
  });
}

export async function sendAccountRejectedEmail(
  email: string,
  name: string,
  reason: string
): Promise<void> {
  const contactUrl = `${process.env.NEXT_PUBLIC_APP_URL}/contact`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #dc2626; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9fafb; padding: 30px; }
        .button { display: inline-block; padding: 12px 30px; background-color: #1e40af; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
        .reason-box { background-color: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Account Registration Update</h1>
        </div>
        <div class="content">
          <h2>Hello, ${name}</h2>
          <p>Thank you for your interest in DKee Executive Engineers.</p>
          <p>Unfortunately, we are unable to approve your account registration at this time.</p>
          <div class="reason-box">
            <strong>Reason:</strong><br>
            ${reason}
          </div>
          <p>If you believe this is an error or would like to discuss this decision, please contact our support team.</p>
          <div style="text-align: center;">
            <a href="${contactUrl}" class="button">Contact Support</a>
          </div>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} DKee Executive Engineers. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Account Registration Update

Hello, ${name}

Thank you for your interest in DKee Executive Engineers.

Unfortunately, we are unable to approve your account registration at this time.

Reason: ${reason}

If you believe this is an error or would like to discuss this decision, please contact our support team at ${contactUrl}

---
DKee Executive Engineers
  `;

  await sendEmail({
    to: email,
    subject: 'Account Registration Update - DKee Executive Engineers',
    text,
    html,
  });
}
