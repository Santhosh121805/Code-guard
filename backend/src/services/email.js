import nodemailer from 'nodemailer';
import { logger } from '../utils/logger.js';

export class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Verify connection configuration
    this.verifyConnection();
  }

  async verifyConnection() {
    try {
      await this.transporter.verify();
      logger.info('Email service connected successfully');
    } catch (error) {
      logger.error('Email service connection failed:', error);
    }
  }

  async sendEmail({ to, subject, html, text }) {
    try {
      const mailOptions = {
        from: `"CodeGuardian AI" <${process.env.SMTP_USER}>`,
        to,
        subject,
        html,
        text,
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info('Email sent successfully', { 
        messageId: info.messageId,
        to,
        subject 
      });
      
      return { success: true, messageId: info.messageId };
    } catch (error) {
      logger.error('Failed to send email:', error);
      return { success: false, error: error.message };
    }
  }

  async sendVerificationEmail(email, name) {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=temp-token`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🛡️ CodeGuardian AI</h1>
            <p>Verify Your Email Address</p>
          </div>
          <div class="content">
            <h2>Hello ${name || 'there'}!</h2>
            <p>Thank you for joining CodeGuardian AI. To complete your registration, please verify your email address by clicking the button below:</p>
            <a href="${verificationUrl}" class="button">Verify Email Address</a>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p><a href="${verificationUrl}">${verificationUrl}</a></p>
            <p>This link will expire in 24 hours for security reasons.</p>
            <p>If you didn't create this account, you can safely ignore this email.</p>
          </div>
          <div class="footer">
            <p>© 2024 CodeGuardian AI. All rights reserved.</p>
            <p>This is an automated message, please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      CodeGuardian AI - Verify Your Email Address
      
      Hello ${name || 'there'}!
      
      Thank you for joining CodeGuardian AI. To complete your registration, please verify your email address by visiting:
      
      ${verificationUrl}
      
      This link will expire in 24 hours for security reasons.
      
      If you didn't create this account, you can safely ignore this email.
    `;

    return await this.sendEmail({
      to: email,
      subject: 'Verify Your CodeGuardian AI Account',
      html,
      text,
    });
  }

  async sendPasswordResetEmail(email, name, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🛡️ CodeGuardian AI</h1>
            <p>Password Reset Request</p>
          </div>
          <div class="content">
            <h2>Hello ${name || 'there'}!</h2>
            <p>We received a request to reset your password for your CodeGuardian AI account.</p>
            <a href="${resetUrl}" class="button">Reset Password</a>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p><a href="${resetUrl}">${resetUrl}</a></p>
            <div class="warning">
              <strong>⚠️ Security Notice:</strong><br>
              • This link will expire in 1 hour for security reasons<br>
              • If you didn't request this reset, please ignore this email<br>
              • Never share this link with anyone
            </div>
          </div>
          <div class="footer">
            <p>© 2024 CodeGuardian AI. All rights reserved.</p>
            <p>This is an automated message, please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      CodeGuardian AI - Password Reset Request
      
      Hello ${name || 'there'}!
      
      We received a request to reset your password for your CodeGuardian AI account.
      
      To reset your password, visit: ${resetUrl}
      
      This link will expire in 1 hour for security reasons.
      
      If you didn't request this reset, please ignore this email.
    `;

    return await this.sendEmail({
      to: email,
      subject: 'Reset Your CodeGuardian AI Password',
      html,
      text,
    });
  }

  async sendVulnerabilityAlert(email, name, vulnerability, repository) {
    const dashboardUrl = `${process.env.FRONTEND_URL}/dashboard/repository/${repository.id}`;
    
    const severityColors = {
      CRITICAL: '#dc3545',
      HIGH: '#fd7e14',
      MEDIUM: '#ffc107',
      LOW: '#28a745',
    };

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #dc3545 0%, #fd7e14 100%); color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .vulnerability { background: white; border-left: 4px solid ${severityColors[vulnerability.severity]}; padding: 15px; margin: 20px 0; }
          .severity { color: ${severityColors[vulnerability.severity]}; font-weight: bold; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚨 Security Alert</h1>
            <p>New Vulnerability Detected</p>
          </div>
          <div class="content">
            <h2>Hello ${name || 'there'}!</h2>
            <p>CodeGuardian AI has detected a new <span class="severity">${vulnerability.severity}</span> severity vulnerability in your repository:</p>
            
            <div class="vulnerability">
              <h3>${vulnerability.title}</h3>
              <p><strong>Repository:</strong> ${repository.name}</p>
              <p><strong>File:</strong> ${vulnerability.filePath}</p>
              <p><strong>Line:</strong> ${vulnerability.lineNumber}</p>
              <p><strong>Type:</strong> ${vulnerability.type}</p>
              <p><strong>Severity:</strong> <span class="severity">${vulnerability.severity}</span></p>
              ${vulnerability.description ? `<p><strong>Description:</strong> ${vulnerability.description}</p>` : ''}
            </div>
            
            <a href="${dashboardUrl}" class="button">View Details</a>
            
            <p>Please review this vulnerability and take appropriate action to secure your code.</p>
          </div>
          <div class="footer">
            <p>© 2024 CodeGuardian AI. All rights reserved.</p>
            <p>To stop receiving these alerts, update your notification preferences in the dashboard.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      CodeGuardian AI - Security Alert
      
      Hello ${name || 'there'}!
      
      A new ${vulnerability.severity} severity vulnerability has been detected:
      
      Repository: ${repository.name}
      File: ${vulnerability.filePath}:${vulnerability.lineNumber}
      Type: ${vulnerability.type}
      Title: ${vulnerability.title}
      
      View details: ${dashboardUrl}
      
      Please review this vulnerability and take appropriate action.
    `;

    return await this.sendEmail({
      to: email,
      subject: `🚨 ${vulnerability.severity} Security Vulnerability Detected`,
      html,
      text,
    });
  }

  async sendWeeklySecurityReport(email, name, stats, repositories) {
    const dashboardUrl = `${process.env.FRONTEND_URL}/dashboard`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .stats { display: flex; justify-content: space-around; margin: 20px 0; }
          .stat { text-align: center; background: white; padding: 15px; border-radius: 8px; margin: 0 5px; }
          .stat-number { font-size: 24px; font-weight: bold; color: #667eea; }
          .repo-list { background: white; padding: 15px; margin: 20px 0; border-radius: 8px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📊 Weekly Security Report</h1>
            <p>Your CodeGuardian AI Summary</p>
          </div>
          <div class="content">
            <h2>Hello ${name || 'there'}!</h2>
            <p>Here's your weekly security summary from CodeGuardian AI:</p>
            
            <div class="stats">
              <div class="stat">
                <div class="stat-number">${stats.totalVulnerabilities || 0}</div>
                <div>Total Vulnerabilities</div>
              </div>
              <div class="stat">
                <div class="stat-number">${stats.newVulnerabilities || 0}</div>
                <div>New This Week</div>
              </div>
              <div class="stat">
                <div class="stat-number">${stats.fixedVulnerabilities || 0}</div>
                <div>Fixed This Week</div>
              </div>
            </div>
            
            ${repositories.length > 0 ? `
              <div class="repo-list">
                <h3>Repository Status</h3>
                ${repositories.map(repo => `
                  <p><strong>${repo.name}</strong> - ${repo.vulnerabilityCount} vulnerabilities (Score: ${repo.securityScore}/100)</p>
                `).join('')}
              </div>
            ` : ''}
            
            <a href="${dashboardUrl}" class="button">View Dashboard</a>
            
            <p>Keep up the great work securing your code! 🛡️</p>
          </div>
          <div class="footer">
            <p>© 2024 CodeGuardian AI. All rights reserved.</p>
            <p>To stop receiving these reports, update your notification preferences.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      CodeGuardian AI - Weekly Security Report
      
      Hello ${name || 'there'}!
      
      Your weekly security summary:
      
      - Total Vulnerabilities: ${stats.totalVulnerabilities || 0}
      - New This Week: ${stats.newVulnerabilities || 0}
      - Fixed This Week: ${stats.fixedVulnerabilities || 0}
      
      Repository Status:
      ${repositories.map(repo => 
        `${repo.name}: ${repo.vulnerabilityCount} vulnerabilities (Score: ${repo.securityScore}/100)`
      ).join('\n')}
      
      View your dashboard: ${dashboardUrl}
    `;

    return await this.sendEmail({
      to: email,
      subject: '📊 Your Weekly Security Report - CodeGuardian AI',
      html,
      text,
    });
  }
}