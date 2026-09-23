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

## Deploy to Render

This project includes a `render.yaml` Blueprint specification. To deploy on Render:
1. Connect your repository `Gauravsinghsudo/cyclonesightAI` on [Render](https://render.com).
2. Create a Web Service with Build Command `npm install && npm run build` and Start Command `npm start`.
3. Set environment variables (`GEMINI_API_KEY`, `DATABASE_URL`, `DATABASE_SSL`, `MOSDAC_USERNAME`, `MOSDAC_PASSWORD`).

