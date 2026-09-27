import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end();
  }
  if (!process.env.DATABASE_URL) return res.status(503).json({ error: 'Metadata cache unavailable' });
  try {
    const sql = neon(process.env.DATABASE_URL);
    const rows = await sql`SELECT title_key AS key, payload FROM movie_metadata_cache`;
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300, stale-while-revalidate=3600');
    return res.status(200).json({ movies: rows });
  } catch (error) {
    return res.status(503).json({ error: 'Metadata cache unavailable' });
  }
}
