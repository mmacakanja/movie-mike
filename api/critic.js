export default async function handler(req,res){
  const key=process.env.OMDB_API_KEY;
  if(!key)return res.status(503).json({error:'OMDB_API_KEY is not configured'});
  const imdbId=String(req.query.imdbId||'').trim();
  const title=String(req.query.title||'').trim();
  if(!imdbId && !title)return res.status(400).json({error:'imdbId or title is required'});
  try{
    const url=imdbId
      ? `https://www.omdbapi.com/?apikey=${encodeURIComponent(key)}&i=${encodeURIComponent(imdbId)}&type=movie`
      : `https://www.omdbapi.com/?apikey=${encodeURIComponent(key)}&t=${encodeURIComponent(title)}&type=movie`;
    const r=await fetch(url);
    const d=await r.json();
    if(!r.ok || d.Response==='False')return res.status(404).json({error:'Critic score not found'});
    const meta = d.Metascore && d.Metascore!=='N/A' ? Number(d.Metascore) : null;
    return res.status(200).json({metacritic:meta});
  }catch(e){return res.status(500).json({error:'Unable to load critic score'});}
}
