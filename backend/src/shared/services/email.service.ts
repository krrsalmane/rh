import nodemailer from 'nodemailer';
import { env } from '../../config/env';

// Create a transporter if SMTP is configured
const createTransporter = () => {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
    console.warn('⚠️ SMTP is not fully configured. Emails will be logged to console instead.');
    return null;
  }

  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT || 587,
    secure: env.SMTP_PORT === 465, // true for 465, false for other ports
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });
};

const transporter = createTransporter();

export async function sendEmail(to: string, subject: string, html: string, attachments: any[] = []) {
  try {
    if (!transporter) {
      console.log(`\n📧 [EMAIL SIMULATION]`);
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Content:\n${html}\n`);
      if (attachments.length > 0) {
        console.log(`Attachments: ${attachments.map(a => a.filename).join(', ')}`);
      }
      return;
    }

    const info = await transporter.sendMail({
      from: env.SMTP_FROM || '"Maya HR" <noreply@maya-hr.com>',
      to,
      subject,
      html,
      attachments,
    });

    console.log(`✉️ Email sent: ${info.messageId}`);
  } catch (error) {
    console.error('❌ Error sending email:', error);
    // Don't rethrow - we don't want to block the application flow
  }
}

// Professional CSS styles for emails
const emailStyles = `
  body { font-family: 'Inter', Helvetica, Arial, sans-serif; color: #333; line-height: 1.6; }
  .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; }
  .header { background-color: #2563eb; color: white; padding: 15px; border-radius: 6px 6px 0 0; text-align: center; }
  .content { padding: 20px; }
  .field { margin-bottom: 12px; }
  .label { font-weight: bold; color: #4b5563; }
  .value { color: #1f2937; }
  .footer { margin-top: 20px; padding-top: 15px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; text-align: center; }
  .button { display: inline-block; padding: 10px 20px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; }
`;

// Templates
export async function sendLeaveRequestEmail(data: {
  employeeName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason?: string;
  document?: { path: string; originalName: string };
}) {
  const hrEmail = env.HR_EMAIL || 'rh@maya-hr.com';
  const subject = `[Nouvelle Demande] Congé - ${data.employeeName}`;
  
  const attachments = [];
  let documentInfo = '';
  
  if (data.document) {
    attachments.push({
      filename: data.document.originalName,
      path: data.document.path,
    });
    documentInfo = `<p class="field"><span class="label">Document joint :</span> <span class="value">${data.document.originalName} (Ci-joint)</span></p>`;
  }

  const html = `
    <html>
      <head><style>${emailStyles}</style></head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Nouvelle Demande de Congé</h2>
          </div>
          <div class="content">
            <p>Une nouvelle demande de congé a été soumise :</p>
            <p class="field"><span class="label">Employé :</span> <span class="value">${data.employeeName}</span></p>
            <p class="field"><span class="label">Type de congé :</span> <span class="value">${data.leaveType}</span></p>
            <p class="field"><span class="label">Période :</span> <span class="value">Du ${data.startDate} au ${data.endDate}</span></p>
            <p class="field"><span class="label">Motif :</span> <span class="value">${data.reason || 'Non précisé'}</span></p>
            ${documentInfo}
            <div style="text-align: center; margin-top: 30px;">
              <a href="http://localhost:5173/leaves" class="button">Traiter la demande</a>
            </div>
          </div>
          <div class="footer">
            <p>Ceci est un message automatique de Maya HR. Merci de ne pas y répondre.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  await sendEmail(hrEmail, subject, html, attachments);
}

export async function sendLeaveStatusEmail(to: string, data: {
  employeeName: string;
  status: 'approved' | 'rejected';
  leaveType: string;
  startDate: string;
  endDate: string;
  note?: string;
}) {
  const isApproved = data.status === 'approved';
  const statusText = isApproved ? 'Approuvée' : 'Refusée';
  const subject = `[${statusText}] Votre demande de congé`;
  const headerColor = isApproved ? '#059669' : '#dc2626'; // Green for approved, Red for rejected
  
  const html = `
    <html>
      <head><style>${emailStyles}</style></head>
      <body>
        <div class="container">
          <div class="header" style="background-color: ${headerColor};">
            <h2>Demande de Congé ${statusText}</h2>
          </div>
          <div class="content">
            <p>Bonjour ${data.employeeName},</p>
            <p>Votre demande de congé a été traitée :</p>
            <p class="field"><span class="label">Type de congé :</span> <span class="value">${data.leaveType}</span></p>
            <p class="field"><span class="label">Période :</span> <span class="value">Du ${data.startDate} au ${data.endDate}</span></p>
            <p class="field"><span class="label">Statut :</span> <span class="value" style="font-weight: bold; color: ${headerColor};">${statusText}</span></p>
            ${data.note ? `<p class="field"><span class="label">Note :</span> <span class="value">${data.note}</span></p>` : ''}
            <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <p>Merci,</p>
            <p>L'équipe RH</p>
          </div>
          <div class="footer">
            <p>Ceci est un message automatique de Maya HR. Merci de ne pas y répondre.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  await sendEmail(to, subject, html);
}
