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
   - `SMTP_*` for real email notifications
   - `NOTIFY_EMAIL`
3. Start locally:
   `npm start`
4. Open:
   - Homepage: http://localhost:4000/
   - Admin dashboard: http://localhost:4000/admin

## Production notes
- Keep `GET /api/contact` protected behind authentication before public deployment.
- Use a real database for larger lead volume.
- Configure environment variables on your host platform.

## Data storage
Submissions are kept in `data/submissions.json` for demo and small-business usage. This is enough for a local MVP and can be swapped to PostgreSQL, MongoDB, or SQLite later without changing the controller interface.
# CleaningCompany
