import { Pool } from 'pg';

// This creates a single, shared connection pool.
// The `process.env.DATABASE_URL` is read from your .env.local file.
// The Next.js Edge Runtime, where API routes run, can be picky about connections.
// The `?pg-bouncer=true&connection_limit=1` is often needed for serverless environments
// like Vercel or when using Neon to prevent connection exhaustion.
const connectionString = `${process.env.DATABASE_URL}?pg-bouncer=true&connection_limit=1`;

const pool = new Pool({
  connectionString,
});

export default pool;
