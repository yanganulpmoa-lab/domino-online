import {DurableObject} from 'cloudflare:workers';
import {act,freshRoom,advance} from './game.js';
const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
export default {
 async fetch(request,env){
  const url=new URL(request.url);
  if(url.pathname!=='/api')return env.ASSETS.fetch(request);
  if(request.method!=='POST')return json({error:'Gunakan POST.'},405);
  if(request.headers.get('Origin')&&request.headers.get('Origin')!==url.origin)return json({error:'Origin tidak valid.'},403);
  try{
   const raw=await request.text();if(raw.length>8192)return json({error:'Permintaan terlalu besar.'},413);
   const data=JSON.parse(raw);if(!data||typeof data!=='object'||Array.isArray(data))throw Error('Permintaan tidak valid.');
   data.code=data.action==='create'?crypto.randomUUID().replaceAll('-','').slice(0,12).toUpperCase():String(data.code||'').trim().toUpperCase();
   if(!/^[A-F0-9]{12}$/.test(data.code))throw Error('Kode room tidak valid.');
   return env.ROOMS.get(env.ROOMS.idFromName(data.code)).fetch(new Request('https://room/api',{method:'POST',body:JSON.stringify(data)}));
  }catch(error){return json({error:error.message},400);}
 }
};
export class DominoRoom extends DurableObject {
 async save(room){
  await this.ctx.storage.put('room',room);
  const alarm=room.started&&room.winners===null?Math.min(room.deadline,room.expiresAt):room.expiresAt;
  await this.ctx.storage.setAlarm(alarm);
 }
 async fetch(request){
  return this.ctx.blockConcurrencyWhile(async()=>{
   try{
    const data=await request.json(),now=Date.now();let room=await this.ctx.storage.get('room');
    if(room?.expiresAt&&room.expiresAt<=now){await this.ctx.storage.deleteAll();room=null;}
    if(data.action==='create'){if(room)throw Error('Kode terpakai. Coba lagi.');room=freshRoom();room.expiresAt=now+7*86400000;}
    if(!room)throw Error('Room tidak ditemukan atau sudah kedaluwarsa.');
    room.expiresAt ||= now+7*86400000;
    if(advance(room,now))await this.save(room);
    const working=structuredClone(room),result=act(working,data,now);
    if(data.action!=='state'){working.expiresAt=now+7*86400000;await this.save(working);}
    return json(result);
   }catch(error){return json({error:error.message},400);}
  });
 }
 async alarm(){
  return this.ctx.blockConcurrencyWhile(async()=>{
   const room=await this.ctx.storage.get('room');if(!room)return;
   const now=Date.now();if(!room.expiresAt||room.expiresAt<=now){await this.ctx.storage.deleteAll();return;}
   advance(room,now);await this.save(room);
  });
 }
}
