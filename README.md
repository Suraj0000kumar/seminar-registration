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
- `RAZORPAY_KEY_ID` – From [Razorpay Dashboard](https://dashboard.razorpay.com/) → Settings → API Keys
- `RAZORPAY_KEY_SECRET` – Same place
- `NEXT_PUBLIC_RAZORPAY_KEY_ID` – Same as RAZORPAY_KEY_ID (for frontend)

**Optional:**
- `NEXT_PUBLIC_ADMIN_PASSWORD` – Password for `/admin` (default: seminar2026)
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

## Google Sheets Setup (Optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project → Enable **Google Sheets API**
3. Create **Service Account** → Keys → Add key (JSON)
4. Create a Google Sheet
5. Share the sheet with the service account email (as Editor)
6. Add to `.env.local`:
   - `GOOGLE_SHEET_ID` = ID from sheet URL
   - `GOOGLE_SHEETS_CREDENTIALS` = contents of the JSON file (as single line)

Add header row in Sheet1:  
`ID, Full Name, Email, Phone, Gender, Designation, Institution, Paper Submission, Amount, Payment ID, Order ID, Paid At, Created At, QR Code`

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
   - Click **Deploy**

3. **Important for production**: Vercel’s filesystem is temporary. Set up **Google Sheets** (see above) so registrations are saved. Without it, data is lost on each deploy.

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
