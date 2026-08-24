import { neon } from '@neondatabase/serverless';

const API='https://api.themoviedb.org/3';
const normalize=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();

async function cacheSql(){
  if(!process.env.DATABASE_URL) return null;
  const sql=neon(process.env.DATABASE_URL);
  await sql`CREATE TABLE IF NOT EXISTS movie_metadata_cache (
    title_key TEXT PRIMARY KEY,
    requested_title TEXT NOT NULL,
    year_hint TEXT,
    payload JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  return sql;
}

export default async function handler(req,res){
  const token=process.env.TMDB_READ_TOKEN;
  if(!token)return res.status(503).json({error:'TMDB_READ_TOKEN is not configured'});
  const title=String(req.query.title||'').trim();
  const year=String(req.query.year||'').trim();
  if(!title)return res.status(400).json({error:'title is required'});
  const key=`${normalize(title)}|${year}`;

  try{
    const sql=await cacheSql();
    if(sql){
      const rows=await sql`SELECT payload FROM movie_metadata_cache WHERE title_key=${key} LIMIT 1`;
      if(rows.length){
        res.setHeader('Cache-Control','public, max-age=3600, s-maxage=31536000, stale-while-revalidate=2592000');
        return res.status(200).json({...rows[0].payload,cache:'neon'});
      }
    }

    const headers={Authorization:`Bearer ${token}`,accept:'application/json'};
    const search=await fetch(`${API}/search/movie?query=${encodeURIComponent(title)}&include_adult=false&language=en-US&page=1${year?`&year=${encodeURIComponent(year)}`:''}`,{headers});
    if(!search.ok)throw new Error(`TMDB search ${search.status}`);
    const data=await search.json();
    if(!data.results?.length)return res.status(404).json({error:'Movie not found'});
    const target=normalize(title);
    const ranked=[...data.results].sort((a,b)=>{
      const ax=Math.max(normalize(a.title)===target?3:0,normalize(a.original_title)===target?2:0)+(a.popularity||0)/10000;
      const bx=Math.max(normalize(b.title)===target?3:0,normalize(b.original_title)===target?2:0)+(b.popularity||0)/10000;
      return bx-ax;
    });
    const hit=ranked[0];
    const detail=await fetch(`${API}/movie/${hit.id}?language=en-US&append_to_response=credits,external_ids`,{headers});
    if(!detail.ok)throw new Error(`TMDB detail ${detail.status}`);
    const d=await detail.json();
    const director=d.credits?.crew?.find(x=>x.job==='Director')?.name||null;
    const cast=(d.credits?.cast||[]).slice(0,4).map(x=>x.name);
    const payload={
      tmdbId:d.id, imdbId:d.imdb_id||d.external_ids?.imdb_id||null, title:d.title,
      year:d.release_date?Number(d.release_date.slice(0,4)):null, runtime:d.runtime||null,
      genres:(d.genres||[]).map(x=>x.name), director, cast, overview:d.overview||'',
      poster:d.poster_path?`https://image.tmdb.org/t/p/w500${d.poster_path}`:null,
      backdrop:d.backdrop_path?`https://image.tmdb.org/t/p/w780${d.backdrop_path}`:null
    };
    if(sql){
      await sql`INSERT INTO movie_metadata_cache(title_key,requested_title,year_hint,payload,updated_at)
        VALUES(${key},${title},${year||null},${JSON.stringify(payload)}::jsonb,NOW())
        ON CONFLICT(title_key) DO UPDATE SET payload=EXCLUDED.payload, updated_at=NOW()`;
    }
    res.setHeader('Cache-Control','public, max-age=3600, s-maxage=31536000, stale-while-revalidate=2592000');
    return res.status(200).json({...payload,cache:sql?'saved':'edge'});
  }catch(err){
    return res.status(500).json({error:'Unable to load movie metadata'});
  }
}
