import { neon } from '@neondatabase/serverless';
export default async function handler(req,res){
  if(!process.env.DATABASE_URL)return res.status(200).json({configured:false,scores:[]});
  try{
    const sql=neon(process.env.DATABASE_URL);
    await sql`CREATE TABLE IF NOT EXISTS critic_score_cache (
      score_key TEXT PRIMARY KEY, requested_title TEXT, imdb_id TEXT, metacritic INTEGER,
      found BOOLEAN NOT NULL DEFAULT TRUE, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;
    const rows=await sql`SELECT requested_title, metacritic FROM critic_score_cache WHERE found=TRUE AND metacritic IS NOT NULL AND requested_title IS NOT NULL`;
    return res.status(200).json({configured:true,scores:rows});
  }catch(e){return res.status(500).json({configured:false,scores:[]});}
}
