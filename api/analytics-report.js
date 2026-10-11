import { neon } from '@neondatabase/serverless';
export default async function handler(req,res) {
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).end();}
  const supplied=String(req.headers['x-admin-secret']||'');
  if(!process.env.REVIEW_ADMIN_SECRET||supplied!==process.env.REVIEW_ADMIN_SECRET)return res.status(401).json({error:'Invalid owner passcode'});
  if(!process.env.DATABASE_URL)return res.status(503).json({error:'Database unavailable'});
  const days=Number(req.body?.days);
  if(![0,7,30,90].includes(days))return res.status(400).json({error:'Invalid period'});
  try {
    const sql=neon(process.env.DATABASE_URL);
    const [totals,movies,genres,daily]=await Promise.all([
      sql`SELECT event_type, COUNT(*)::int AS count FROM movie_analytics_events WHERE (${days}=0 OR created_at >= NOW() - ${days} * INTERVAL '1 day') GROUP BY event_type`,
      sql`SELECT event_value AS title, COUNT(*)::int AS count FROM movie_analytics_events WHERE event_type='movie_opened' AND (${days}=0 OR created_at >= NOW() - ${days} * INTERVAL '1 day') GROUP BY event_value ORDER BY count DESC LIMIT 10`,
      sql`SELECT event_value AS genre, COUNT(*)::int AS count FROM movie_analytics_events WHERE event_type='genre_selected' AND (${days}=0 OR created_at >= NOW() - ${days} * INTERVAL '1 day') GROUP BY event_value ORDER BY count DESC LIMIT 10`,
      sql`SELECT TO_CHAR(created_at AT TIME ZONE 'America/Chicago','YYYY-MM-DD') AS day, COUNT(*)::int AS count FROM movie_analytics_events WHERE (${days}=0 OR created_at >= NOW() - ${days} * INTERVAL '1 day') GROUP BY day ORDER BY day DESC LIMIT 30`
    ]);
    return res.status(200).json({totals,movies,genres,daily});
  } catch(e){console.error('Analytics report failed',e);return res.status(500).json({error:'Unable to load analytics'});}
}
