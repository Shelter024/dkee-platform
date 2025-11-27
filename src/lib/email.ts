import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.FROM_EMAIL || 'DK Executive <noreply@dkexecutive.com>';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[Email] RESEND_API_KEY not configured. Email not sent:', { to: options.to, subject: options.subject });
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    if (error) {
      console.error('[Email] Send failed:', error);
      return { success: false, error: error.message };
    }

    console.log('[Email] Sent successfully:', { to: options.to, subject: options.subject, id: data?.id });
    return { success: true, messageId: data?.id };
  } catch (error: any) {
    console.error('[Email] Send exception:', error);
    return { success: false, error: error.message };
  }
}

export async function sendVerificationEmail(email: string, token: string) {
  const verifyUrl = `${process.env.NEXTAUTH_URL}/auth/verify-email?token=${token}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #1e3a8a 0%, #dc2626 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .header h1 { color: white; margin: 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; padding: 12px 30px; background: #1e3a8a; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to DK Executive Engineers!</h1>
        </div>
        <div class="content">
          <h2>Verify Your Email Address</h2>
          <p>Thank you for registering with DK Executive Engineers. To complete your registration and access all features, please verify your email address.</p>
          <a href="${verifyUrl}" class="button">Verify Email Address</a>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #6b7280;">${verifyUrl}</p>
          <p><strong>This link will expire in 24 hours.</strong></p>
          <p>If you didn't create an account with us, please ignore this email.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} DK Executive Engineers. All rights reserved.</p>
          <p>Accra, Ghana | +233 24 101 8947</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: 'Verify Your Email - DK Executive Engineers',
    html,
  });
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #1e3a8a 0%, #dc2626 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .header h1 { color: white; margin: 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; padding: 12px 30px; background: #dc2626; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .warning { background: #fef2f2; border-left: 4px solid #dc2626; padding: 12px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1> Password Reset Request</h1>
        </div>
        <div class="content">
          <h2>Reset Your Password</h2>
          <p>We received a request to reset the password for your DK Executive Engineers account.</p>
          <a href="${resetUrl}" class="button">Reset Password</a>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #6b7280;">${resetUrl}</p>
          <div class="warning">
            <strong> This link will expire in 1 hour.</strong>
          </div>
          <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
          <p>For security reasons, this link can only be used once.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} DK Executive Engineers. All rights reserved.</p>
          <p>Accra, Ghana | +233 24 101 8947</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: 'Reset Your Password - DK Executive Engineers',
    html,
  });
}

export async function sendServiceNotificationEmail(
  email: string,
  customerName: string,
  serviceDetails: {
    serviceType: string;
    vehicleMake: string;
    vehicleModel: string;
    scheduledDate?: Date;
    status: string;
  }
) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #1e3a8a 0%, #dc2626 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .header h1 { color: white; margin: 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .details { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; }
        .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
        .detail-row:last-child { border-bottom: none; }
        .button { display: inline-block; padding: 12px 30px; background: #1e3a8a; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1> Service Update</h1>
        </div>
        <div class="content">
          <h2>Hello ${customerName},</h2>
          <p>We have an update regarding your vehicle service request.</p>
          <div class="details">
            <div class="detail-row">
              <span><strong>Service Type:</strong></span>
              <span>${serviceDetails.serviceType}</span>
            </div>
            <div class="detail-row">
              <span><strong>Vehicle:</strong></span>
              <span>${serviceDetails.vehicleMake} ${serviceDetails.vehicleModel}</span>
            </div>
            ${serviceDetails.scheduledDate ? `
            <div class="detail-row">
              <span><strong>Scheduled Date:</strong></span>
              <span>${serviceDetails.scheduledDate.toLocaleDateString()}</span>
            </div>
            ` : ''}
            <div class="detail-row">
              <span><strong>Status:</strong></span>
              <span style="color: ${serviceDetails.status === 'COMPLETED' ? '#10b981' : '#f59e0b'};">${serviceDetails.status}</span>
            </div>
          </div>
          <a href="${process.env.NEXTAUTH_URL}/dashboard/customer/services" class="button">View Service Details</a>
          <p>If you have any questions, please don't hesitate to contact us.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} DK Executive Engineers. All rights reserved.</p>
          <p>Accra, Ghana | +233 24 101 8947 | services@dkexecutive.com</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `Service Update: ${serviceDetails.serviceType}`,
    html,
  });
}

export async function sendInvoiceEmail(
  email: string,
  customerName: string,
  invoiceNumber: string,
  amount: number,
  pdfUrl?: string
) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #1e3a8a 0%, #dc2626 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .header h1 { color: white; margin: 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .amount { font-size: 32px; color: #1e3a8a; font-weight: bold; text-align: center; margin: 20px 0; }
        .button { display: inline-block; padding: 12px 30px; background: #1e3a8a; color: white; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
        .button-secondary { background: #6b7280; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1> New Invoice</h1>
        </div>
        <div class="content">
          <h2>Hello ${customerName},</h2>
          <p>A new invoice has been generated for your recent service.</p>
          <p style="text-align: center;"><strong>Invoice Number: ${invoiceNumber}</strong></p>
          <div class="amount">GH ${amount.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <div style="text-align: center;">
            <a href="${process.env.NEXTAUTH_URL}/dashboard/customer/invoices" class="button">View Invoice Online</a>
            ${pdfUrl ? `<a href="${pdfUrl}" class="button button-secondary">Download PDF</a>` : ''}
          </div>
          <p style="margin-top: 30px;">Payment can be made via:</p>
          <ul>
            <li>Mobile Money (MTN/Vodafone/AirtelTigo)</li>
            <li>Bank Transfer</li>
            <li>Credit/Debit Card</li>
            <li>Cash at our office</li>
          </ul>
          <p>Thank you for your business!</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} DK Executive Engineers. All rights reserved.</p>
          <p>Accra, Ghana | +233 24 101 8947 | billing@dkexecutive.com</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `Invoice ${invoiceNumber} - DK Executive Engineers`,
    html,
  });
}
