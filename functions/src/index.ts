import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { logger } from 'firebase-functions/v2';
import { defineSecret, defineString } from 'firebase-functions/params';
import sgMail from '@sendgrid/mail';

initializeApp();

const auth = getAuth();
const db = getFirestore();

// ─── Config ──────────────────────────────────────────────────────────────────

const SENDGRID_API_KEY = defineSecret('SENDGRID_API_KEY');
const SENDGRID_FROM_EMAIL = defineString('SENDGRID_FROM_EMAIL');
const APP_URL = defineString('APP_URL');

// ─── Helpers ─────────────────────────────────────────────────────────────────

const REMINDER_DAYS = [30, 14, 7];

/** Days until the next occurrence of a MM-DD date (ignores year). */
function daysUntilAnnual(mmdd: string): number {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const [month, day] = mmdd.split('-').map(Number);
  const next = new Date(Date.UTC(today.getUTCFullYear(), month - 1, day));
  if (next < today) next.setUTCFullYear(today.getUTCFullYear() + 1);
  return Math.round((next.getTime() - today.getTime()) / 86_400_000);
}

/** Days until birthday — handles YYYY-MM-DD and 0000-MM-DD. */
function daysUntilBirthday(birthDate: string): number {
  const parts = birthDate.split('-');
  return daysUntilAnnual(`${parts[1]}-${parts[2]}`);
}

function firstNameFromEmail(email: string): string {
  const raw = email.split('@')[0].replace(/[._-]/g, ' ');
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function buildEmail(
  recipientFirstName: string,
  subject: string,
  body: string,
  appUrl: string,
  ctaLabel = 'Open Gifted →',
  ctaPath = '/',
): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#f5f0ff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:520px;background:#ffffff;border-radius:16px;padding:36px;box-shadow:0 1px 4px rgba(0,0,0,0.06);">
          <tr>
            <td>
              <p style="margin:0 0 4px;font-size:22px;font-weight:600;color:#4c1d95;">Gifted</p>
              <hr style="border:none;border-top:1px solid #ede9fe;margin:16px 0;" />
              <p style="font-size:16px;color:#2d1b69;margin:0 0 12px;">Kia ora ${recipientFirstName},</p>
              <p style="font-size:16px;color:#2d1b69;margin:0 0 24px;">${body}</p>
              <a href="${appUrl}${ctaPath}"
                 style="display:inline-block;background:#a78bfa;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:12px 28px;border-radius:12px;">
                ${ctaLabel}
              </a>
              <hr style="border:none;border-top:1px solid #ede9fe;margin:28px 0 16px;" />
              <p style="font-size:12px;color:#a78bfa;margin:0;">You're receiving this from Gifted.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Scheduled function ───────────────────────────────────────────────────────

export const sendBirthdayReminders = onSchedule(
  {
    schedule: '0 8 * * *',
    timeZone: 'UTC',
    secrets: [SENDGRID_API_KEY],
  },
  async () => {
    sgMail.setApiKey(SENDGRID_API_KEY.value());
    const fromEmail = SENDGRID_FROM_EMAIL.value();
    const appUrl = APP_URL.value();

    const { users } = await auth.listUsers();
    logger.info(`Processing ${users.length} user(s)`);

    let emailsSent = 0;

    for (const user of users) {
      if (!user.email) continue;
      const recipientFirstName = firstNameFromEmail(user.email);

      // ── Birthday reminders ──────────────────────────────────────────────
      const peopleSnap = await db.collection(`users/${user.uid}/people`).get();

      for (const personDoc of peopleSnap.docs) {
        const data = personDoc.data();
        const birthDate = data.birthDate as string | undefined;
        const name = data.name as string | undefined;
        if (!birthDate || !name) continue;

        const days = daysUntilBirthday(birthDate);
        if (!REMINDER_DAYS.includes(days)) continue;

        const daysText = `${days} days`;
        const subject = `Reminder: ${name}'s birthday is in ${daysText}`;
        const body = `Just a heads-up — <strong>${name}</strong>'s birthday is in <strong>${daysText}</strong>. Now's a great time to sort out a gift!`;

        await sgMail.send({
          to: user.email,
          from: fromEmail,
          subject,
          html: buildEmail(recipientFirstName, subject, body, appUrl, 'View gift ideas →', '/'),
        });
        logger.info(`Birthday reminder → ${user.email}: ${name} in ${days}d`);
        emailsSent++;
      }

      // ── Event reminders ─────────────────────────────────────────────────
      const eventsSnap = await db.collection(`users/${user.uid}/events`).get();

      for (const eventDoc of eventsSnap.docs) {
        const data = eventDoc.data();
        const date = data.date as string | undefined;
        const eventName = data.name as string | undefined;
        const personIds = (data.personIds as string[]) ?? [];
        if (!date || !eventName) continue;

        const days = daysUntilAnnual(date);
        if (!REMINDER_DAYS.includes(days)) continue;

        // Look up people names for multi-person events
        const names: string[] = [];
        for (const pid of personIds) {
          const pDoc = await db.doc(`users/${user.uid}/people/${pid}`).get();
          if (pDoc.exists) names.push((pDoc.data()?.name as string).split(' ')[0]);
        }
        const namesLabel = names.length > 0 ? names.join(' & ') + '\'s ' : '';

        const daysText = `${days} days`;
        const subject = `Reminder: ${namesLabel}${eventName} is in ${daysText}`;
        const body = `Just a heads-up — <strong>${namesLabel}${eventName}</strong> is in <strong>${daysText}</strong>.`;

        await sgMail.send({
          to: user.email,
          from: fromEmail,
          subject,
          html: buildEmail(recipientFirstName, subject, body, appUrl, 'Open Gifted →', '/'),
        });
        logger.info(`Event reminder → ${user.email}: ${eventName} in ${days}d`);
        emailsSent++;
      }

      // ── Christmas reminder ──────────────────────────────────────────────
      const christmasDays = daysUntilAnnual('12-25');
      if ((REMINDER_DAYS as number[]).includes(christmasDays)) {
        const daysText = `${christmasDays} days`;
        const subject = `Reminder: Christmas is in ${daysText}`;
        const body = `Christmas is in <strong>${daysText}</strong>. Time to check your gift lists!`;

        await sgMail.send({
          to: user.email,
          from: fromEmail,
          subject,
          html: buildEmail(recipientFirstName, subject, body, appUrl, 'Open Gifted →', '/'),
        });
        logger.info(`Christmas reminder → ${user.email} in ${christmasDays}d`);
        emailsSent++;
      }
    }

    logger.info(`Done. ${emailsSent} email(s) sent.`);
  },
);
