# Gifted

A personal PWA for storing gift ideas per person and sending automated birthday reminder emails.

**Stack:** Next.js 14 · TypeScript · Firebase (Auth + Firestore) · SendGrid · Vercel

---

## Local Setup

### 1. Clone and install

```bash
git clone https://github.com/spacemoose777/gifted.git
cd gifted
npm install
```

### 2. Environment variables

Copy `.env.local.example` to `.env.local` and fill in all values:

```bash
cp .env.local.example .env.local
```

See the **Environment Variables** section below for where to find each value.

### 3. Run dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

### Firebase Client (`NEXT_PUBLIC_FIREBASE_*`)

1. Go to [Firebase Console](https://console.firebase.google.com) → your project
2. Project Settings → General → Your apps → Web app → SDK setup
3. Copy the config object values into `.env.local`

### Firebase Admin (`FIREBASE_*`)

1. Firebase Console → Project Settings → Service accounts
2. Click **Generate new private key** → download JSON
3. Copy `project_id` → `FIREBASE_PROJECT_ID`
4. Copy `client_email` → `FIREBASE_CLIENT_EMAIL`
5. Copy `private_key` → `FIREBASE_PRIVATE_KEY` (keep the `\n` characters, wrap in quotes)

### SendGrid

1. Create a [SendGrid](https://sendgrid.com) account
2. Settings → API Keys → Create API Key (Full Access)
3. Set `SENDGRID_API_KEY`
4. Verify a sender email address and set `SENDGRID_FROM_EMAIL`

### App URL

Set `NEXT_PUBLIC_APP_URL` to `http://localhost:3000` for development, or your Vercel URL in production.

---

## Firebase Console Setup

### Authentication

1. Firebase Console → Authentication → Get started
2. Sign-in method → Enable **Email/Password**

### Firestore

1. Firebase Console → Firestore Database → Create database
2. Choose **Production mode** (rules are managed via `firestore.rules`)
3. Select a region close to your users

### Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
```

### Cloud Functions

See `/functions/README.md` (added in Phase 8).

---

## Deployment (Vercel)

1. Push to GitHub
2. Import repo in [Vercel](https://vercel.com)
3. Add all environment variables from `.env.local` in Vercel project settings
4. Deploy

---

## Project Structure

```
src/
├── app/              # Next.js App Router pages
├── components/       # React components
│   └── ui/           # Reusable primitives
├── contexts/         # React context providers
├── hooks/            # Custom React hooks
├── lib/              # Firebase, Firestore, crypto utilities
└── types/            # TypeScript interfaces
functions/            # Firebase Cloud Functions
public/               # Static assets, PWA manifest
firestore.rules       # Firestore security rules
```
