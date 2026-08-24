import { neon } from '@neondatabase/serverless';

export default async function handler(req,res){
  if(!process.env.DATABASE_URL)return res.status(503).send('Subscriptions are not configured.');
  const token=String(req.query.token||'').trim();
  if(!token)return res.status(400).send('Missing confirmation token.');
  const sql=neon(process.env.DATABASE_URL);
  const rows=await sql`UPDATE update_subscribers SET active=TRUE,confirmed=TRUE,confirmation_token=NULL WHERE confirmation_token=${token} RETURNING id`;
  res.setHeader('Content-Type','text/html; charset=utf-8');
  if(!rows.length)return res.status(400).send('<!doctype html><meta name="viewport" content="width=device-width"><title>Invalid link</title><body style="font-family:system-ui;background:#090b0e;color:#f3f1ed;padding:40px"><h1>That confirmation link is invalid or expired.</h1><p><a style="color:#efb64d" href="/">Return to Movie Mike</a></p></body>');
  return res.status(200).send('<!doctype html><meta name="viewport" content="width=device-width"><title>Subscribed</title><body style="font-family:system-ui;background:#090b0e;color:#f3f1ed;padding:40px"><h1>You are subscribed.</h1><p>New ratings and occasional Movie Mike dispatches will now find you.</p><p><a style="color:#efb64d" href="/">Return to Movie Mike</a></p></body>');
}
