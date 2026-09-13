const HIDDEN_TITLES=new Set(['man on the run']);
function filterHiddenMovies(payload){
  if(!payload||!Array.isArray(payload.movies))return payload;
  return {...payload,movies:payload.movies.filter(m=>!HIDDEN_TITLES.has(String(m?.title||'').trim().toLowerCase()))};
}
export default async function handler(req,res){
  const url=process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  if(!url)return res.status(503).json({error:'Google Sheet bridge is not configured'});
  if(req.method==='GET'){
    try{
      const r=await fetch(url,{cache:'no-store'}); const text=await r.text();
      res.setHeader('Content-Type','application/json'); res.setHeader('Cache-Control','no-store');
      if(!r.ok)return res.status(502).send(text);
      try{return res.status(200).json(filterHiddenMovies(JSON.parse(text)));}
      catch(e){return res.status(502).json({error:'Google Sheet returned invalid JSON'});}
    }catch(e){return res.status(500).json({error:'Unable to read Google Sheet'});}
  }
  if(req.method==='POST'){
    const supplied=req.headers['x-admin-secret'];
    if(!process.env.REVIEW_ADMIN_SECRET || supplied!==process.env.REVIEW_ADMIN_SECRET)return res.status(401).json({error:'Invalid owner passcode'});
    try{
      const r=await fetch(url,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({...req.body,secret:process.env.SHEETS_WEBHOOK_SECRET||''})});
      const text=await r.text();
      res.setHeader('Content-Type','application/json'); return res.status(r.ok?200:502).send(text);
    }catch(e){return res.status(500).json({error:'Unable to update Google Sheet'});}
  }
  res.setHeader('Allow','GET, POST'); return res.status(405).end();
}
