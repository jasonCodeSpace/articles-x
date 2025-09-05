import { Resend } from 'resend';
import { DailyEmailTemplate } from '@/components/email-template';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';

const resend = new Resend(process.env.RESEND_API_KEY);

interface DailySummary {
  date: string;
  summary_content: string;
  top_article_title: string;
}

interface TopArticle {
  id: string;
  title: string;
  author_name: string;
  view_count: number;
  category?: string;
}

interface SendDailyEmailParams {
  to: string[];
  dailySummary: DailySummary;
  topArticles: TopArticle[];
}

export async function sendDailyEmail({
  to,
  dailySummary,
  topArticles
}: SendDailyEmailParams) {
  try {
    // Create the email template component
    const emailComponent = createElement(DailyEmailTemplate, {
      dailySummary,
      topArticles
    });

    // Render the component to HTML string
    const htmlContent = renderToString(emailComponent);

    // Send the email
    const { data, error } = await resend.emails.send({
      from: 'Xarticle Daily <daily@xarticle.news>',
      to,
      subject: `Daily Article: ${dailySummary.top_article_title}`,
      html: htmlContent,
    });

    if (error) {
      console.error('Error sending email:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    console.log('Email sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error in sendDailyEmail:', error);
    throw error;
  }
}

// Helper function to validate email configuration
export function validateEmailConfig() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY environment variable is required');
  }
}

// Helper function to get default recipient list
export function getDefaultRecipients(): string[] {
  const recipients = process.env.EMAIL_RECIPIENTS;
  if (!recipients) {
    console.warn('No EMAIL_RECIPIENTS configured, using default');
    return ['admin@xarticle.news'];
  }
  return recipients.split(',').map(email => email.trim());
}