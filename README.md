# National Seminar on Education & Mental Health - Registration Website

Registration portal for the National Seminar on **Education & Mental Health: Bridging the Gap** organized by Mata Sushila Institute of Education (22-23 March 2026).

## Features

- **Participant Registration** – Collect name, email, phone, designation, institution
- **Fee Structure** – Student (₹250), Faculty (₹350), Professional (₹400) + optional paper submission (₹1000)
- **Razorpay Payment** – Secure online payment integration
- **Unique QR Code** – Each participant gets a verification QR code after payment
- **Admin Dashboard** – View all registrations, export to CSV/Excel
- **Google Sheets Sync** (optional) – Auto-append registrations to a Google Sheet

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env.local` and fill in:

```bash
cp .env.example .env.local
```

**Required for payments:**
- `RAZORPAY_KEY_ID` – From [Razorpay Dashboard](https://dashboard.razorpay.com/) → Settings → API Keys (Test mode)
- `RAZORPAY_KEY_SECRET` – Same place (click Generate/Regenerate to see the secret)
- `NEXT_PUBLIC_RAZORPAY_KEY_ID` – **Must be the same value as RAZORPAY_KEY_ID** (e.g. `rzp_test_xxxx`). Used by the checkout popup. If missing, Razorpay shows "Oops something went wrong".

**Optional:**
- `NEXT_PUBLIC_ADMIN_PASSWORD` – Password for `/admin` (default: seminar2026)
- `BLOB_READ_WRITE_TOKEN` – For Vercel Blob photo storage (recommended for 1000+ participants)
- `GOOGLE_SHEET_ID` + `GOOGLE_SHEETS_CREDENTIALS` – For Google Sheets sync

### 3. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Pages

| Page | URL | Description |
|------|-----|-------------|
| Registration | `/` | Main registration form |
| Success | `/success?id=xxx` | QR code and confirmation after payment |
| Admin | `/admin` | View registrations, export CSV |

## Cloud Photo Storage (Recommended for 1000+ Participants)

Without cloud storage, photos are stored as base64 in `participants.json`, which becomes very large with many registrations.

1. Go to [Vercel Dashboard](https://vercel.com/dashboard) → **Storage** → **Create Database** → **Blob**
2. Create a Blob store (or use existing)
3. Copy the `BLOB_READ_WRITE_TOKEN` from the store settings
4. Add to `.env.local`:
   ```
   BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxx
   ```

Works locally and on Vercel.

## Google Sheets Setup (Optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project → **APIs & Services** → **Enable APIs** → enable **Google Sheets API**
3. **APIs & Services** → **Credentials** → **Create Credentials** → **Service Account**
4. Create the service account → **Keys** tab → **Add Key** → **Create new key** → **JSON** (download the file)
5. Create a Google Sheet (or use existing)
6. **Share the sheet** with the service account email (found in the JSON as `client_email`, e.g. `xxx@project.iam.gserviceaccount.com`) — give it **Editor** access
7. Copy the **Sheet ID** from the URL: `https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit`
8. Add to `.env.local`:
   - `GOOGLE_SHEET_ID` = the Sheet ID (no quotes, no spaces)
   - `GOOGLE_SHEETS_CREDENTIALS` = the entire JSON file content as a **single line** (minify it: remove newlines, or use a tool like [jsonformatter.org](https://jsonformatter.org/json-minify))

Add header row in **Sheet1** (first row):  
`ID, Full Name, Email, Phone, Gender, Photo, Designation, Institution, Paper Submission, Amount, Payment ID, Order ID, Paid At, Created At, QR Code`

**If sync fails:** Check the terminal/console when a registration completes. Common fixes:
- **403/Permission denied** → Share the sheet with the service account email (Editor)
- **404/Not found** → Verify GOOGLE_SHEET_ID matches the ID in your sheet URL
- **Invalid JSON** → Minify GOOGLE_SHEETS_CREDENTIALS to a single line (no line breaks)

## QR Code Verification at Event

The QR code contains a JSON payload with participant ID. You can:

1. **Manual** – Use the admin dashboard to search/verify by ID
2. **Scanner app** – Use any QR scanner; the payload includes the participant ID to verify via `/api/verify-qr` (POST with `{ "id": "uuid" }`)

## Data Storage

- **Default**: Participants are stored in `data/participants.json`
- **With Google Sheets**: Each registration is also appended to your sheet

## Deployment (Make it Online)

### Option 1: Vercel (Recommended – Free & Easy)

1. **Push your code to GitHub** (if not already):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/seminar-registration.git
   git push -u origin main
   ```

2. **Deploy on Vercel**:
   - Go to [vercel.com](https://vercel.com) → Sign up / Log in
   - Click **Add New** → **Project** → Import your GitHub repo
   - Add **Environment Variables** (from your `.env.local`):
     - `RAZORPAY_KEY_ID`
     - `RAZORPAY_KEY_SECRET`
     - `NEXT_PUBLIC_RAZORPAY_KEY_ID`
     - `NEXT_PUBLIC_ADMIN_PASSWORD` (optional)
     - `GOOGLE_SHEET_ID` + `GOOGLE_SHEETS_CREDENTIALS` (recommended for production)
   - `BLOB_READ_WRITE_TOKEN` (for photo uploads)
   - Click **Deploy**

3. **Important for production**: Vercel’s filesystem is read-only. Google Sheets is required. Set up **Google Sheets** (see above) so registrations are saved. Without it, registration will fail. Google Sheets is required on Vercel.

4. **Razorpay**: For live payments, switch to **Live** keys in Razorpay Dashboard and update the env vars in Vercel.

---

### Option 2: Railway (Persistent Storage)

1. Go to [railway.app](https://railway.app) → Sign up
2. **New Project** → **Deploy from GitHub** → Select your repo
3. Add environment variables (same as above)
4. Railway provides persistent storage, so `data/participants.json` will persist.

---

### Option 3: Manual (VPS / Your Server)

```bash
npm run build
npm start
```

Runs on port 3000. Use a process manager (PM2) and reverse proxy (Nginx) for production.
# seminar-registration
# seminar-registration
