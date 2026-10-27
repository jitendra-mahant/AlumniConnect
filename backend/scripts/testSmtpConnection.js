const nodemailer = require('nodemailer');
const env = require('../config/env');

async function testConnection() {
  console.log('Testing Brevo SMTP configuration...');
  console.log('Host:', env.smtpHost);
  console.log('Port:', env.smtpPort);
  console.log('Secure (SSL):', env.smtpSecure);
  console.log('User:', env.smtpUser);
  console.log('Pass prefix:', env.smtpPass.substring(0, 10) + '...');
  console.log('From:', env.emailFrom);

  const transporter = nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpSecure,
    auth: {
      user: env.smtpUser,
      pass: env.smtpPass,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });

  try {
    console.log('Verifying SMTP connection...');
    await transporter.verify();
    console.log('SUCCESS: SMTP connection verified successfully!');

    // Test sending an actual transactional email to the verified sender email
    console.log('Sending test email to:', env.smtpFrom);
    const info = await transporter.sendMail({
      from: env.emailFrom,
      to: env.smtpFrom,
      subject: 'AlumniConnect Brevo SMTP Test Verification',
      text: 'This is a test email verifying that Brevo SMTP is successfully configured and delivering transactional emails in AlumniConnect.',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #1e3a8a;">AlumniConnect SMTP Verification</h2>
          <p>Congratulations! Brevo SMTP integration with Nodemailer is working correctly.</p>
          <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        </div>
      `,
    });
    console.log('SUCCESS: Test email sent successfully! Message ID:', info.messageId);
    process.exit(0);
  } catch (error) {
    console.error('ERROR verifying or sending via SMTP:', error);
    process.exit(1);
  }
}

testConnection();
