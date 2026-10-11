import { neon } from '@neondatabase/serverless';
const TYPES = new Set(['movie_opened','movie_search','genre_selected','guest_column_viewed']);
export default async function handler(req,res) {
  if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).end();}
  res.setHeader('Cache-Control','no-store');
  if(!process.env.DATABASE_URL)return res.status(503).json({error:'Database unavailable'});
  const type=String(req.body?.type||'');
  const value=typeof req.body?.value==='string'?req.body.value.trim():null;
  if(!TYPES.has(type)|| (value && value.length>120))return res.status(400).json({error:'Invalid event'});
  if((type==='movie_opened'||type==='genre_selected')&&!value)return res.status(400).json({error:'Missing value'});
  try {
    const sql=neon(process.env.DATABASE_URL);
    await sql`INSERT INTO movie_analytics_events(event_type,event_value) VALUES(${type},${value})`;
    return res.status(202).json({ok:true});
  } catch(e){console.error('Analytics event failed',e);return res.status(500).json({error:'Unable to record event'});}
}
