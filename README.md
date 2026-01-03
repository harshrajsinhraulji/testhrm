# Godoo HR

This is a NextJS starter app for an HR management system called Godoo.

To get started, take a look at src/app/page.tsx.

## Deploying to Vercel

You can deploy this application to Vercel by following these steps:

1.  **Push to GitHub:** Make sure your project code is pushed to a GitHub repository.

2.  **Import Project on Vercel:**
    *   Go to your [Vercel Dashboard](https://vercel.com/new).
    *   Click "Import Git Repository" and select the repository you just pushed to.
    *   Vercel will automatically detect that it's a Next.js project.

3.  **Configure Environment Variables:**
    *   In the Vercel project settings, navigate to the "Environment Variables" section.
    *   You need to add the following variables:

| Variable | Description | Example Value |
| :--- | :--- | :--- |
| `DATABASE_URL` | Your PostgreSQL connection string. Use the one from your cloud provider (e.g., Neon, Vercel Postgres, Supabase). | `postgres://user:password@host:port/dbname` |
| `JWT_SECRET` | A long, random, secret string used for signing authentication tokens. | `your-super-secret-and-long-random-string` |

4.  **Deploy:**
    *   Click the "Deploy" button. Vercel will build and deploy your application.
    *   Once deployed, you will get a public URL for your live application.
