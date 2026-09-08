import { neon } from '@neondatabase/serverless';
function clean(s,max=800){return String(s||'').trim().slice(0,max)}
export default async function handler(req,res){
  if(!process.env.DATABASE_URL)return res.status(503).json({error:'Comments database is not configured'});
  const sql=neon(process.env.DATABASE_URL);
  await sql`CREATE TABLE IF NOT EXISTS movie_comments (
    id BIGSERIAL PRIMARY KEY, movie_title TEXT NOT NULL, display_name TEXT NOT NULL,
    body TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  if(req.method==='GET'){
    const title=clean(req.query.title,200);
    if(title){
      const rows=await sql`SELECT id, movie_title, display_name, body, created_at FROM movie_comments WHERE movie_title=${title} ORDER BY created_at DESC LIMIT 50`;
      return res.status(200).json({comments:rows});
    }
    const rows=await sql`SELECT id, movie_title, display_name, body, created_at FROM movie_comments ORDER BY created_at DESC LIMIT 8`;
    return res.status(200).json({comments:rows});
  }
  if(req.method==='POST'){
    const title=clean(req.body?.title,200), name=clean(req.body?.name,60), body=clean(req.body?.body,800);
    if(!title||!name||!body)return res.status(400).json({error:'title, name and comment are required'});
    await sql`INSERT INTO movie_comments(movie_title,display_name,body) VALUES(${title},${name},${body})`;
    return res.status(201).json({ok:true});
  }
  res.setHeader('Allow','GET, POST'); return res.status(405).end();
}
