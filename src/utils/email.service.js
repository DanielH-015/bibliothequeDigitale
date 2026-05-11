import nodemailer from 'nodemailer';

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail', // Using Gmail as the default provider
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  // Sends an account verification email containing the deep link
  sendVerificationEmail = async (toEmail, token, firstName) => {
    // The link points to our new GET route to bypass Gmail security
    const deepLinkUrl = `http://172.20.10.2:5000/api/auth/verify-email-link?token=${token}`;

    const mailOptions = {
      from: `"Digital Library" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: "Verify your Digital Library Account",
      html: `
        <h2>Welcome to Digital Library, ${firstName}!</h2>
        <p>Thank you for registering. Please click the button below to verify your email address and activate your account.</p>
        <a href="${deepLinkUrl}" style="background-color: #FFB300; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px;">Verify My Account</a>
        <p style="margin-top: 20px; color: #888;">If the button doesn't work, copy and paste this raw link into a Note app to open it:</p>
        <p style="color: blue;">${deepLinkUrl}</p>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Verification email successfully sent to ${toEmail}`);
    } catch (error) {
      console.error("Error sending verification email:", error);
      throw new Error("Failed to send verification email.");
    }
  }

  // Sends a password reset email containing the deep link
  sendPasswordResetEmail = async (toEmail, token, firstName) => {
    // The link points to our GET route to bypass Gmail security, then redirects to the App
    const deepLinkUrl = `http://172.20.10.2:5000/api/auth/reset-password-link?token=${token}`;

    const mailOptions = {
      from: `"Digital Library" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: "Reset your Digital Library Password",
      html: `
        <h2>Hello ${firstName},</h2>
        <p>We received a request to reset your password. Click the button below to create a new password.</p>
        <a href="${deepLinkUrl}" style="background-color: #0F172A; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px;">Reset Password</a>
        <p style="margin-top: 20px; color: #888;">If you did not request this, please ignore this email. This link will expire in 1 hour.</p>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Password reset email successfully sent to ${toEmail}`);
    } catch (error) {
      console.error("Error sending reset password email:", error);
      throw new Error("Failed to send password reset email.");
    }
  }
}

export const emailService = new EmailService();
