# Gemini API Setup Guide

## Step 1: Create .env File

Create a `.env` file in the `hungrysaver-client` directory (same level as `package.json`).

## Step 2: Add Gemini API Key

Add the following line to your `.env` file:

```env
VITE_GEMINI_API_KEY=AIzaSyA4SGwjaEOHQCmVhrY59hTCa9HUxPqowkQ
```

**Important:** The `VITE_` prefix is required for Vite to expose this variable to your client-side code.

## Step 3: Access the API Key in Code

In your TypeScript/JavaScript files, access the API key like this:

```typescript
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
```

## Step 4: Restart Development Server

After creating or updating the `.env` file, restart your development server:

```bash
npm run dev
```

## Security Notes

- The `.env` file is already in `.gitignore` and will not be committed to version control
- Never commit your API keys to the repository
- For production deployments, set environment variables in your hosting platform (Netlify, Vercel, etc.)

## Production Deployment

When deploying to production, add the environment variable in your hosting platform:

- **Netlify**: Site settings → Environment variables
- **Vercel**: Project settings → Environment variables
- **Render**: Environment tab in your service settings

Add: `VITE_GEMINI_API_KEY=AIzaSyA4SGwjaEOHQCmVhrY59hTCa9HUxPqowkQ`

