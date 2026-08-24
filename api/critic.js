import { neon } from '@neondatabase/serverless';

const normalize=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();

async function cacheSql(){
  if(!process.env.DATABASE_URL) return null;
  const sql=neon(process.env.DATABASE_URL);
  await sql`CREATE TABLE IF NOT EXISTS critic_score_cache (
    score_key TEXT PRIMARY KEY,
    requested_title TEXT,
    imdb_id TEXT,
    metacritic INTEGER,
    found BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  return sql;
}

export default async function handler(req,res){
  const key=process.env.OMDB_API_KEY;
  if(!key)return res.status(503).json({error:'OMDB_API_KEY is not configured'});
  const imdbId=String(req.query.imdbId||'').trim();
  const title=String(req.query.title||'').trim();
  const requestedTitle=String(req.query.requestedTitle||title||'').trim();
  if(!imdbId && !title)return res.status(400).json({error:'imdbId or title is required'});
  const scoreKey=imdbId||`title:${normalize(title)}`;
  try{
    const sql=await cacheSql();
    if(sql){
      const rows=await sql`SELECT metacritic, found FROM critic_score_cache WHERE score_key=${scoreKey} LIMIT 1`;
      if(rows.length){
        if(!rows[0].found)return res.status(404).json({error:'Critic score not found',cache:'neon'});
        return res.status(200).json({metacritic:rows[0].metacritic,cache:'neon'});
      }
    }
    const url=imdbId
      ? `https://www.omdbapi.com/?apikey=${encodeURIComponent(key)}&i=${encodeURIComponent(imdbId)}&type=movie`
      : `https://www.omdbapi.com/?apikey=${encodeURIComponent(key)}&t=${encodeURIComponent(title)}&type=movie`;
    const r=await fetch(url); const d=await r.json();
    const found=r.ok&&d.Response!=='False';
    const meta=found&&d.Metascore&&d.Metascore!=='N/A'?Number(d.Metascore):null;
    if(sql){
      await sql`INSERT INTO critic_score_cache(score_key,requested_title,imdb_id,metacritic,found,updated_at)
        VALUES(${scoreKey},${requestedTitle||null},${imdbId||null},${meta},${Boolean(found&&meta!==null)},NOW())
        ON CONFLICT(score_key) DO UPDATE SET requested_title=EXCLUDED.requested_title, imdb_id=EXCLUDED.imdb_id, metacritic=EXCLUDED.metacritic, found=EXCLUDED.found, updated_at=NOW()`;
    }
    if(!found||meta===null)return res.status(404).json({error:'Critic score not found'});
    res.setHeader('Cache-Control','public, max-age=3600, s-maxage=31536000');
    return res.status(200).json({metacritic:meta,cache:sql?'saved':'edge'});
  }catch(e){return res.status(500).json({error:'Unable to load critic score'});}
}
