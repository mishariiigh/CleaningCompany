# Clean Eagle

A production-style cleaning company website and quote intake system built with Node.js, Express, and a static front-end. It includes a polished landing page, quote request form, and a simple admin dashboard for reviewing submissions.

## Project overview
- Public marketing website at `/`
- Quote request form at `/` and API endpoint `POST /api/contact`
- Admin dashboard at `/admin` to review saved submissions
- Health endpoint at `GET /api/health`
- Data storage in `data/submissions.json`

## Features
- Responsive marketing site for a cleaning business
- Client quote form with validation and spam protection
- Submission persistence to JSON storage
- SMTP email fallback when configured
- Local demo mode for development without email credentials
- Admin dashboard for viewing received requests

## Tech stack
- Node.js
- Express
- CORS
- Rate limiting
- Nodemailer
- Vanilla HTML/CSS/JS front-end

## Setup
1. Install dependencies:
   `npm install`
2. Copy `.env.example` to `.env` and configure:
   - `PORT`
   - `ALLOWED_ORIGINS`
   - `ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET`
   - `SMTP_*` for real email notifications
   - `NOTIFY_EMAIL`
3. Start locally:
   `npm start`
4. Open:
   - Homepage: http://localhost:4000/
   - Admin dashboard: http://localhost:4000/admin

## Production notes
- Configure `ADMIN_PASSWORD` and a unique, randomly generated `ADMIN_SESSION_SECRET` in the deployment environment. Never commit `.env` or real secrets.
- Configure `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` on Vercel for durable lead storage. Vercel's function filesystem is temporary; JSON storage is only used for local development.
- Set `APP_URL` to the deployed site URL and configure `SMTP_*` plus `NOTIFY_EMAIL` for real email delivery.

## Deploy to Vercel
1. Import this repository into Vercel. The included `vercel.json` routes the site and API through the Express function and includes the `public` assets.
2. Create an Upstash Redis database and add its REST URL and token as Vercel environment variables.
3. Add `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, and `APP_URL` in Vercel project settings. Generate a unique secret rather than reusing the admin password.
4. Add the SMTP variables if quote requests should send email notifications. Without SMTP, quote requests still save and the mailer logs a dry-run message.
5. Redeploy after setting environment variables, then visit `/admin` and sign in with `ADMIN_PASSWORD`.

## Data storage
Submissions are kept in `data/submissions.json` for demo and small-business usage. This is enough for a local MVP and can be swapped to PostgreSQL, MongoDB, or SQLite later without changing the controller interface.
# CleaningCompany
