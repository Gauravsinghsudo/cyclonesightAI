<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# CycloneSight AI

This repository contains everything you need to run the CycloneSight AI application locally and deploy to production.

View your app in AI Studio: https://ai.studio/apps/f2970669-654f-4ee0-b883-5b9042f21d39

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Authentication database

Authentication uses PostgreSQL. Create an empty PostgreSQL database, import
`cyclone_sight_ai_database.sql`, then add its connection string to `.env.local`:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/cyclone_sight_ai"
DATABASE_SSL="false"
```

The application will not create accounts until `DATABASE_URL` is configured.

## Deploy to Vercel

Vercel serves the Vite PWA and routes `/api/*` requests to the Express serverless function. Import the PostgreSQL schema, then add `DATABASE_URL`, `DATABASE_SSL`, `GEMINI_API_KEY`, and optional MOSDAC credentials under **Vercel Project Settings → Environment Variables** before production use.

