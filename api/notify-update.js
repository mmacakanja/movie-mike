import { notifySubscribers } from './notify.js';

export default async function handler(req,res){
  if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).end()}
  const supplied=req.headers['x-admin-secret'];
  if(!process.env.REVIEW_ADMIN_SECRET||supplied!==process.env.REVIEW_ADMIN_SECRET)return res.status(401).json({error:'Invalid owner passcode'});
  const title=String(req.body?.title||'Movie Mike has been updated').trim().slice(0,160);
  const message=String(req.body?.message||'There is something new to see on Movie Mike.').trim().slice(0,1000);
  try{const result=await notifySubscribers({title,message,subject:`New on Movie Mike: ${title}`});return res.status(200).json({ok:true,...result})}
  catch(e){return res.status(500).json({error:'Unable to send update email.'})}
}
