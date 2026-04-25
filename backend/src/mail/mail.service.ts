import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('MAIL_HOST') || 'smtp.gmail.com',
      port: this.configService.get('MAIL_PORT') || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: this.configService.get('MAIL_USER'),
        pass: this.configService.get('MAIL_PASS'),
      },
    });
  }

  async sendMail(to: string, subject: string, text: string, html?: string) {
    if (!this.configService.get('MAIL_USER')) {
      console.log('Mail service not configured. Skipping email to:', to);
      return;
    }

    try {
      await this.transporter.sendMail({
        from: `"CMS Portal" <${this.configService.get('MAIL_USER')}>`,
        to,
        subject,
        text,
        html,
      });
      console.log('Email sent to:', to);
    } catch (error) {
      console.error('Error sending email:', error);
    }
  }

  async sendAnnouncementNotification(studentEmails: string[], announcement: any) {
    const subject = `New Update: ${announcement.title}`;
    const text = `New update available: ${announcement.description}\nType: ${announcement.type}\nLink: ${announcement.link || 'N/A'}`;
    const html = `
      <h3>New Update from CMS Portal</h3>
      <p><strong>Title:</strong> ${announcement.title}</p>
      <p><strong>Type:</strong> ${announcement.type}</p>
      <p><strong>Description:</strong> ${announcement.description}</p>
      ${announcement.link ? `<p><a href="${announcement.link}">Click here for more details</a></p>` : ''}
    `;

    for (const email of studentEmails) {
      if (email) {
        await this.sendMail(email, subject, text, html);
      }
    }
  }

  async sendUploadSectionNotification(studentEmails: string[], sectionName: string) {
    const subject = `New Upload Section Added: ${sectionName}`;
    const text = `A new document/certification upload section has been added: ${sectionName}. Please login to upload your documents.`;
    const html = `
      <h3>New Upload Section Added</h3>
      <p>A new document or certification upload section has been added: <strong>${sectionName}</strong>.</p>
      <p>Please login to the Certificates Management Portal to upload the required documents.</p>
    `;

    for (const email of studentEmails) {
      if (email) {
        await this.sendMail(email, subject, text, html);
      }
    }
  }
}
