import { neon } from '@neondatabase/serverless';

const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export async function notifySubscribers({title,score,message,subject}){
  if(!process.env.DATABASE_URL||!process.env.RESEND_API_KEY||!process.env.UPDATE_FROM_EMAIL)return {sent:0,configured:false};
  const sql=neon(process.env.DATABASE_URL);
  await sql`CREATE TABLE IF NOT EXISTS update_subscribers (
    id BIGSERIAL PRIMARY KEY, email TEXT NOT NULL UNIQUE, unsubscribe_token TEXT NOT NULL UNIQUE,
    active BOOLEAN NOT NULL DEFAULT FALSE, confirmed BOOLEAN NOT NULL DEFAULT FALSE, confirmation_token TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`ALTER TABLE update_subscribers ADD COLUMN IF NOT EXISTS confirmed BOOLEAN NOT NULL DEFAULT FALSE`;
  const subscribers=await sql`SELECT email,unsubscribe_token FROM update_subscribers WHERE active=TRUE AND confirmed=TRUE ORDER BY id`;
  if(!subscribers.length)return {sent:0,configured:true};
  const site=(process.env.SITE_URL||'https://movie-mike.vercel.app').replace(/\/$/,'');
  let sent=0;
  for(let i=0;i<subscribers.length;i+=50){
    const batch=subscribers.slice(i,i+50);
    const results=await Promise.all(batch.map(async s=>{
      const unsubscribe=`${site}/api/unsubscribe?token=${encodeURIComponent(s.unsubscribe_token)}`;
      const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({
        from:process.env.UPDATE_FROM_EMAIL,to:[s.email],subject:subject||`New on Movie Mike: ${title}`,
        html:`<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto"><p style="letter-spacing:.12em;color:#9b6b10;font-weight:bold">MOVIE MIKE</p><h1>${esc(title)}</h1><p>${message?esc(message):`Mike has added a new rating${Number.isFinite(Number(score))?`: <strong>${Number(score).toFixed(1)}</strong> out of 7`:''}.`}</p><p><a href="${site}">Visit Movie Mike</a></p><p style="font-size:12px;color:#777"><a href="${unsubscribe}">Unsubscribe</a></p></div>`
      })});return r.ok;
    }));
    sent+=results.filter(Boolean).length;
  }
  return {sent,configured:true};
}
