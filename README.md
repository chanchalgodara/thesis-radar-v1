<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/4dba6274-86cc-418b-80ed-0ea9b2bedd45

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Deploy on Vercel (with database)

The app uses **Neon Postgres** (serverless) so it runs on Vercel without a file-based DB.

1. **Add Neon Postgres**  
   In the [Vercel Marketplace](https://vercel.com/marketplace), add **Neon** (or **Postgres**) to your project. This sets `DATABASE_URL` (or `POSTGRES_URL`) in your project env.

2. **Deploy**  
   Connect the repo to Vercel and deploy. Build command: `npm run build`. The API is served by the Express app as a serverless function; the frontend is served from the build output.

3. **Local dev with DB**  
   For local API + DB, set `DATABASE_URL` (or `POSTGRES_URL`) in `.env` or `.env.local`, e.g. from Neon’s dashboard or `vercel env pull`.
