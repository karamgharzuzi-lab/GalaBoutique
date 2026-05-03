# GalaBoutique

Luxury fashion boutique — mobile-first e-commerce web app.

**Stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS · Firebase (Firestore, Storage, Auth, FCM, Cloud Functions) · next-intl (EN/HE + RTL)

---

## Prerequisites

- Node.js 20+
- Firebase CLI: `npm install -g firebase-tools`
- A Firebase project on the **Blaze (pay-as-you-go) plan** (required for Cloud Functions v2)

---

## 1 — Firebase Project Setup

### 1.1 Enable products
| Product | How |
|---|---|
| **Firestore** | Build → Firestore Database → Create database → production mode |
| **Storage** | Build → Storage → Get started → production mode |
| **Authentication** | Build → Auth → Sign-in providers → **Email/Password** → Enable |
| **Cloud Messaging** | Auto-enabled; generate a **VAPID key** under Project Settings → Cloud Messaging → Web Push certificates |

### 1.2 Upgrade to Blaze plan
Build → Upgrade → Blaze. Cloud Functions v2 requires this.

### 1.3 Register a Web App
Project Settings → Your apps → Add app → **Web** → copy the config into `.env.local`.

---

## 2 — Create the first admin user

1. Firebase Console → Authentication → Users → **Add user**
2. Enter your admin email + password
3. Use these credentials at `/en/admin/login`

---

## 3 — Local development

```bash
cp .env.example .env.local   # fill in Firebase values
npm install
npm run dev                  # → http://localhost:3000
```

Seed `/config/shipping` in Firestore Console (or use the admin Settings page):
```json
{ "north": 45, "center": 30, "south": 40, "freeShippingThreshold": 500 }
```

---

## 4 — Deploy Cloud Functions

```bash
cd functions && npm install && npm run build && cd ..
firebase login
firebase deploy --only functions
```

> Functions deploy to region `me-west1` (Tel Aviv). Change in `functions/src/index.ts` if needed.

---

## 5 — Deploy Firestore rules + indexes

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

---

## 6 — PWA Icons

Place two PNGs in `/public/icons/`:
- `icon-192.png` — 192×192 px
- `icon-512.png` — 512×512 px

---

## 7 — FCM Setup (push notifications)

1. Firebase Console → Project Settings → Cloud Messaging → Web Push certificates → **Generate key pair**
2. Paste into `.env.local` as `NEXT_PUBLIC_VAPID_KEY`
3. The service worker at `/public/firebase-messaging-sw.js` needs your Firebase config values hardcoded (SW scope has no access to `process.env`) — replace the empty strings with real values.

---

## 8 — Project structure

```
app/[locale]/
  page.tsx               ← Storefront home
  shop/                  ← Product grid + filters
  product/[id]/          ← Product detail + gallery
  cart/                  ← Cart + order form
  order-confirm/         ← Confirmation screen
  admin/
    login/               ← Admin auth
    dashboard/           ← Stats + low-stock alerts
    products/            ← CRUD product management
    inventory/           ← Inline qty editing
    orders/              ← Order management + WhatsApp
    settings/            ← Shipping price config
components/
  storefront/            ← Header, BottomNav, ProductCard, StorefrontLayout
  admin/                 ← AdminLayout, ProductForm
  ui/                    ← Button, Card, Badge, Toast, Skeleton, Modal
lib/
  firebase.ts            ← Firebase init
  fcm.ts                 ← FCM token registration
  cart.ts                ← localStorage cart
  shipping.ts            ← Shipping config + calculation
  products.ts            ← Firestore product CRUD
  orders.ts              ← Firestore order submit + transaction
  auth.ts                ← Firebase Auth helpers
  types.ts               ← Shared TypeScript types
functions/src/index.ts   ← Cloud Function: onNewOrder (FCM notification)
locales/en.json          ← All English UI strings
locales/he.json          ← All Hebrew UI strings
public/
  manifest.json                  ← PWA manifest
  firebase-messaging-sw.js       ← FCM background handler
  offline.html                   ← Offline fallback page
```

---

## 9 — Key behaviours

| Feature | Implementation |
|---|---|
| Cart persistence | `localStorage` — survives tab close and PWA relaunch |
| Language / RTL | `next-intl` + Tailwind RTL utilities + `dir` on `<html>` |
| Admin auth guard | `AdminLayout` checks `onAuthStateChanged`; redirects to login |
| Auto-logout | 8 h inactivity timer in `AdminLayout` |
| Inventory deduction | Firestore `runTransaction` in `submitOrder` — atomic, no oversell |
| Free shipping | Live calculation in `calculateShipping`; updates instantly |
| Push notifications | FCM multicast via Cloud Function triggered on order creation |

---

## 10 — Environment variables

| Variable | Where to find |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Console → Project Settings → Your apps |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Same |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Same |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Same |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Same |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Same |
| `NEXT_PUBLIC_VAPID_KEY` | Project Settings → Cloud Messaging → Web Push certificates |

---

## Getting Started (original scaffolding note)

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
