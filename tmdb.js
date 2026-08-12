const API='https://api.themoviedb.org/3';

const normalize=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();

export default async function handler(req,res){
  const token=process.env.TMDB_READ_TOKEN;
  if(!token)return res.status(503).json({error:'TMDB_READ_TOKEN is not configured'});
  const title=String(req.query.title||'').trim();
  if(!title)return res.status(400).json({error:'title is required'});
  try{
    const headers={Authorization:`Bearer ${token}`,accept:'application/json'};
    const search=await fetch(`${API}/search/movie?query=${encodeURIComponent(title)}&include_adult=false&language=en-US&page=1`,{headers});
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
    const detail=await fetch(`${API}/movie/${hit.id}?language=en-US&append_to_response=credits`,{headers});
    if(!detail.ok)throw new Error(`TMDB detail ${detail.status}`);
    const d=await detail.json();
    const director=d.credits?.crew?.find(x=>x.job==='Director')?.name||null;
    const cast=(d.credits?.cast||[]).slice(0,4).map(x=>x.name);
    const payload={
      tmdbId:d.id,
      title:d.title,
      year:d.release_date?Number(d.release_date.slice(0,4)):null,
      runtime:d.runtime||null,
      genres:(d.genres||[]).map(x=>x.name),
      director,
      cast,
      overview:d.overview||'',
      poster:d.poster_path?`https://image.tmdb.org/t/p/w500${d.poster_path}`:null,
      backdrop:d.backdrop_path?`https://image.tmdb.org/t/p/w780${d.backdrop_path}`:null
    };
    res.setHeader('Cache-Control','s-maxage=604800, stale-while-revalidate=2592000');
    return res.status(200).json(payload);
  }catch(err){
    return res.status(500).json({error:'Unable to load movie metadata'});
  }
}
