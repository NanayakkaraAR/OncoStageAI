import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendPasswordResetEmail = async (
  email: string,
  firstName: string,
  resetLink: string
): Promise<void> => {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Password Reset Request</h2>
      <p>Hi ${firstName},</p>
      <p>We received a request to reset your password for your OncoStage AI account. Click the link below to reset your password:</p>
      <p>
        <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 6px;">
          Reset Password
        </a>
      </p>
      <p>Or copy and paste this link in your browser:</p>
      <p style="word-break: break-all; color: #666;">${resetLink}</p>
      <p style="color: #999; font-size: 12px;">This link will expire in 1 hour.</p>
      <p style="color: #999; font-size: 12px;">If you did not request this, please ignore this email.</p>
      <hr style="border: none; border-top: 1px solid #ddd; margin-top: 20px;">
      <p style="color: #999; font-size: 12px;">OncoStage AI</p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: 'Password Reset - OncoStage AI',
      html: htmlContent,
    });
    console.log(`Password reset email sent to ${email}`);
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send reset email');
  }
};

export const sendWelcomeEmail = async (
  email: string,
  firstName: string,
  role: string
): Promise<void> => {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Welcome to OncoStage AI, ${firstName}!</h2>
      <p>Your account has been successfully created as a <strong>${role}</strong>.</p>
      <p>You can now log in and start using OncoStage AI to help with lung cancer stage predictions and patient management.</p>
      <p style="color: #999; font-size: 12px;">OncoStage AI - Advanced Lung Cancer Staging Solution</p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: 'Welcome to OncoStage AI',
      html: htmlContent,
    });
    console.log(`Welcome email sent to ${email}`);
  } catch (error) {
    console.error('Error sending welcome email:', error);
    throw new Error('Failed to send welcome email');
  }
};
