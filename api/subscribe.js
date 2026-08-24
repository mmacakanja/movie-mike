import { neon } from '@neondatabase/serverless';
import crypto from 'node:crypto';

const normalizeEmail=value=>String(value||'').trim().toLowerCase().slice(0,254);
const validEmail=value=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export default async function handler(req,res){
  if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).end()}
  if(!process.env.DATABASE_URL||!process.env.RESEND_API_KEY||!process.env.UPDATE_FROM_EMAIL)return res.status(503).json({error:'Subscriptions are not available yet.'});
  const email=normalizeEmail(req.body?.email);
  if(!validEmail(email))return res.status(400).json({error:'Please enter a valid email address.'});
  const sql=neon(process.env.DATABASE_URL);
  await sql`CREATE TABLE IF NOT EXISTS update_subscribers (
    id BIGSERIAL PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    unsubscribe_token TEXT NOT NULL UNIQUE,
    active BOOLEAN NOT NULL DEFAULT FALSE,
    confirmed BOOLEAN NOT NULL DEFAULT FALSE,
    confirmation_token TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`ALTER TABLE update_subscribers ADD COLUMN IF NOT EXISTS confirmed BOOLEAN NOT NULL DEFAULT FALSE`;
  await sql`ALTER TABLE update_subscribers ADD COLUMN IF NOT EXISTS confirmation_token TEXT`;
  const existing=await sql`SELECT active,confirmed FROM update_subscribers WHERE email=${email} LIMIT 1`;
  if(existing[0]?.active&&existing[0]?.confirmed)return res.status(200).json({ok:true,alreadySubscribed:true});
  const unsubscribeToken=crypto.randomBytes(24).toString('hex'),confirmationToken=crypto.randomBytes(24).toString('hex');
  if(existing.length)await sql`UPDATE update_subscribers SET unsubscribe_token=${unsubscribeToken},confirmation_token=${confirmationToken},active=FALSE,confirmed=FALSE WHERE email=${email}`;
  else await sql`INSERT INTO update_subscribers(email,unsubscribe_token,confirmation_token,active,confirmed) VALUES(${email},${unsubscribeToken},${confirmationToken},FALSE,FALSE)`;
  const site=(process.env.SITE_URL||'https://movie-mike.vercel.app').replace(/\/$/,'');
  const confirmUrl=`${site}/api/confirm-subscription?token=${encodeURIComponent(confirmationToken)}`;
  const sent=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({from:process.env.UPDATE_FROM_EMAIL,to:[email],subject:'Confirm your Movie Mike subscription',html:`<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto"><p style="letter-spacing:.12em;color:#9b6b10;font-weight:bold">MOVIE MIKE</p><h1>One last click.</h1><p>Confirm that you want occasional Movie Mike updates.</p><p><a href="${confirmUrl}" style="display:inline-block;background:#efb64d;color:#17120a;padding:12px 18px;border-radius:999px;text-decoration:none;font-weight:bold">Confirm subscription</a></p><p style="font-size:12px;color:#777">If you did not request this, ignore this email.</p></div>`})});
  if(!sent.ok)return res.status(502).json({error:'Unable to send the confirmation email.'});
  return res.status(201).json({ok:true,alreadySubscribed:false,confirmationRequired:true});
}
