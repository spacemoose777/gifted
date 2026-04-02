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

const DEFAULT_REMINDER_DAYS = [30, 14, 7, 0];
const TIMEZONE = 'Pacific/Auckland';
const MILESTONE_AGES = new Set([16, 18, 21, 30, 40, 50, 60, 70, 80, 90, 100]);

/**
 * Returns today's date in Auckland local time as a UTC midnight Date.
 * Cloud Functions run in UTC, so `new Date()` gives the UTC clock — which
 * can be a full day behind NZ time. Using Intl.DateTimeFormat ensures we
 * treat "today" as what Auckland residents see on their calendar.
 */
function todayInAuckland(): Date {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE })
    .format(new Date())
    .split('-')
    .map(Number); // [YYYY, MM, DD]
  return new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
}

/** Days until the next occurrence of a MM-DD date (ignores year). */
function daysUntilAnnual(mmdd: string): number {
  const today = todayInAuckland();
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

/** Returns the milestone age at next birthday, or null if not a milestone / year unknown. */
function getMilestoneAge(birthDate: string): number | null {
  const [year, month, day] = birthDate.split('-').map(Number);
  if (year === 0) return null; // year unknown
  const today = todayInAuckland();
  const next = new Date(Date.UTC(today.getUTCFullYear(), month - 1, day));
  if (next < today) next.setUTCFullYear(today.getUTCFullYear() + 1);
  const age = next.getUTCFullYear() - year;
  return MILESTONE_AGES.has(age) ? age : null;
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
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
    timeZone: TIMEZONE,
    secrets: [SENDGRID_API_KEY],
  },
  async () => {
    sgMail.setApiKey(SENDGRID_API_KEY.value());
    const fromEmail = SENDGRID_FROM_EMAIL.value();
    const appUrl = APP_URL.value();

    const { users } = await auth.listUsers();
    logger.info(`Processing ${users.length} user(s)`);

    let emailsSent = 0;

    // ── Helper: get partner UIDs for a user ─────────────────────────────────
    async function getPartnerUids(uid: string): Promise<string[]> {
      const userDoc = await db.doc(`users/${uid}`).get();
      if (!userDoc.exists) return [];
      const familyId = userDoc.data()?.familyId as string | undefined;
      if (!familyId) return [];
      const familyDoc = await db.doc(`families/${familyId}`).get();
      if (!familyDoc.exists) return [];
      const memberUids = (familyDoc.data()?.memberUids as string[]) ?? [];
      return memberUids.filter((id) => id !== uid);
    }

    for (const user of users) {
      if (!user.email) continue;
      const recipientFirstName = firstNameFromEmail(user.email);

      // ── Own birthday reminders ──────────────────────────────────────────
      const peopleSnap = await db.collection(`users/${user.uid}/people`).get();

      for (const personDoc of peopleSnap.docs) {
        const data = personDoc.data();
        const birthDate = data.birthDate as string | undefined;
        const name = data.name as string | undefined;
        if (!birthDate || !name) continue;

        const reminderDays = (data.reminderDays as number[] | undefined) ?? DEFAULT_REMINDER_DAYS;
        const days = daysUntilBirthday(birthDate);
        if (!reminderDays.includes(days)) continue;

        const milestoneAge = getMilestoneAge(birthDate);
        let subject: string;
        let body: string;
        if (days === 0) {
          if (milestoneAge) {
            subject = `Today is ${name}'s ${ordinal(milestoneAge)} birthday! 🎂`;
            body = `It's <strong>${name}'s ${ordinal(milestoneAge)} birthday</strong> today — what a milestone! 🎉`;
          } else {
            subject = `Today is ${name}'s birthday! 🎂`;
            body = `It's <strong>${name}</strong>'s birthday today! Wishing them a wonderful day 🎉`;
          }
        } else {
          const daysText = `${days} days`;
          if (milestoneAge) {
            subject = `Milestone: ${name} is turning ${ordinal(milestoneAge)} in ${daysText}!`;
            body = `<strong>${name}</strong> is turning <strong>${ordinal(milestoneAge)}</strong> in <strong>${daysText}</strong>. This is a big one — time to start planning something special!`;
          } else {
            subject = `Reminder: ${name}'s birthday is in ${daysText}`;
            body = `Just a heads-up — <strong>${name}</strong>'s birthday is in <strong>${daysText}</strong>. Now's a great time to sort out a gift!`;
          }
        }

        await sgMail.send({
          to: user.email,
          from: fromEmail,
          subject,
          html: buildEmail(recipientFirstName, subject, body, appUrl, 'View gift ideas →', '/'),
        });
        logger.info(`Birthday reminder → ${user.email}: ${name} in ${days}d${milestoneAge ? ` (${milestoneAge}th)` : ''}`);
        emailsSent++;
      }

      // ── Own event reminders ─────────────────────────────────────────────
      const eventsSnap = await db.collection(`users/${user.uid}/events`).get();

      for (const eventDoc of eventsSnap.docs) {
        const data = eventDoc.data();
        const date = data.date as string | undefined;
        const eventName = data.name as string | undefined;
        const personIds = (data.personIds as string[]) ?? [];
        if (!date || !eventName) continue;

        const days = daysUntilAnnual(date);
        if (![30, 14, 7].includes(days)) continue;

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

      // ── Shared (family member) birthday + event reminders ───────────────
      const partnerUids = await getPartnerUids(user.uid);

      for (const partnerUid of partnerUids) {
        // Partner's non-private people — use the RECIPIENT's reminder preferences
        // (the person who owns the entry controls the schedule; recipient gets same intervals)
        const partnerPeopleSnap = await db.collection(`users/${partnerUid}/people`).get();
        for (const personDoc of partnerPeopleSnap.docs) {
          const data = personDoc.data();
          if (data.isPrivate) continue;
          const birthDate = data.birthDate as string | undefined;
          const name = data.name as string | undefined;
          if (!birthDate || !name) continue;

          const reminderDays = (data.reminderDays as number[] | undefined) ?? DEFAULT_REMINDER_DAYS;
          const days = daysUntilBirthday(birthDate);
          if (!reminderDays.includes(days)) continue;

          const milestoneAge = getMilestoneAge(birthDate);
          let subject: string;
          let body: string;
          if (days === 0) {
            if (milestoneAge) {
              subject = `Today is ${name}'s ${ordinal(milestoneAge)} birthday! 🎂`;
              body = `It's <strong>${name}'s ${ordinal(milestoneAge)} birthday</strong> today — what a milestone! 🎉`;
            } else {
              subject = `Today is ${name}'s birthday! 🎂`;
              body = `It's <strong>${name}</strong>'s birthday today! Wishing them a wonderful day 🎉`;
            }
          } else {
            const daysText = `${days} days`;
            if (milestoneAge) {
              subject = `Milestone: ${name} is turning ${ordinal(milestoneAge)} in ${daysText}!`;
              body = `<strong>${name}</strong> is turning <strong>${ordinal(milestoneAge)}</strong> in <strong>${daysText}</strong>. This is a big one — time to start planning something special!`;
            } else {
              subject = `Reminder: ${name}'s birthday is in ${daysText}`;
              body = `Just a heads-up — <strong>${name}</strong>'s birthday is in <strong>${daysText}</strong>. Now's a great time to sort out a gift!`;
            }
          }

          await sgMail.send({
            to: user.email,
            from: fromEmail,
            subject,
            html: buildEmail(recipientFirstName, subject, body, appUrl, 'View gift ideas →', '/'),
          });
          logger.info(`Shared birthday reminder → ${user.email}: ${name} (from ${partnerUid}) in ${days}d${milestoneAge ? ` (${milestoneAge}th)` : ''}`);
          emailsSent++;
        }

        // Partner's non-private events
        const partnerEventsSnap = await db.collection(`users/${partnerUid}/events`).get();
        for (const eventDoc of partnerEventsSnap.docs) {
          const data = eventDoc.data();
          if (data.isPrivate) continue;
          const date = data.date as string | undefined;
          const eventName = data.name as string | undefined;
          const personIds = (data.personIds as string[]) ?? [];
          if (!date || !eventName) continue;

          const days = daysUntilAnnual(date);
          if (![30, 14, 7].includes(days)) continue;

          // Resolve names from partner's people collection
          const names: string[] = [];
          for (const pid of personIds) {
            const pDoc = await db.doc(`users/${partnerUid}/people/${pid}`).get();
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
          logger.info(`Shared event reminder → ${user.email}: ${eventName} (from ${partnerUid}) in ${days}d`);
          emailsSent++;
        }
      }

      // ── Christmas reminder ──────────────────────────────────────────────
      const christmasDays = daysUntilAnnual('12-25');
      if ([30, 14, 7].includes(christmasDays)) {
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
