import { neon } from '@neondatabase/serverless';

export default async function handler(req,res){
  if(!process.env.DATABASE_URL)return res.status(503).send('Subscriptions are not configured.');
  const token=String(req.query.token||'').trim();
  if(!token)return res.status(400).send('Missing unsubscribe token.');
  const sql=neon(process.env.DATABASE_URL);
  await sql`CREATE TABLE IF NOT EXISTS update_subscribers (
    id BIGSERIAL PRIMARY KEY, email TEXT NOT NULL UNIQUE, unsubscribe_token TEXT NOT NULL UNIQUE,
    active BOOLEAN NOT NULL DEFAULT FALSE, confirmed BOOLEAN NOT NULL DEFAULT FALSE, confirmation_token TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`UPDATE update_subscribers SET active=FALSE WHERE unsubscribe_token=${token}`;
  res.setHeader('Content-Type','text/html; charset=utf-8');
  return res.status(200).send('<!doctype html><meta name="viewport" content="width=device-width"><title>Unsubscribed</title><body style="font-family:system-ui;background:#090b0e;color:#f3f1ed;padding:40px"><h1>You are unsubscribed.</h1><p>No hard feelings. Movie Mike has survived harsher reviews.</p><p><a style="color:#efb64d" href="/">Return to Movie Mike</a></p></body>');
}
