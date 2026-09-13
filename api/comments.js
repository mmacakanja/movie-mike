import { neon } from '@neondatabase/serverless';
function clean(s,max=800){return String(s||'').trim().slice(0,max)}
function escHtml(s=''){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
async function sendCommentEmail({title,name,body}){
  const key=process.env.RESEND_API_KEY;
  if(!key)return {sent:false,reason:'not_configured'};
  const to=process.env.COMMENT_NOTIFY_EMAIL||'mmacakanja@gmail.com';
  const from=process.env.COMMENT_NOTIFY_FROM||'Movie Mike <onboarding@resend.dev>';
  try{
    const r=await fetch('https://api.resend.com/emails',{
      method:'POST',
      headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},
      body:JSON.stringify({
        from,to:[to],
        subject:`New Movie Mike comment: ${title}`,
        html:`<h2>New comment on ${escHtml(title)}</h2><p><strong>${escHtml(name)}</strong></p><p>${escHtml(body).replace(/\n/g,'<br>')}</p><p><a href="https://www.mikesmovieratings.com">Open Movie Mike</a></p>`
      })
    });
    return {sent:r.ok,status:r.status};
  }catch(e){return {sent:false,reason:'send_failed'};}
}
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
    const email=await sendCommentEmail({title,name,body});
    return res.status(201).json({ok:true,emailSent:Boolean(email.sent)});
  }
  res.setHeader('Allow','GET, POST'); return res.status(405).end();
}
