import test from 'node:test';
import assert from 'node:assert/strict';
import {layoutBoard} from '../public/board-layout.js';
const tiles=Array.from({length:28},(_,i)=>i%4===0?[5,5]:[2,6]);
test('balak melintang, kartu biasa mengikuti arah jalur',()=>{
 for(const width of [180,260,360,600,1000])for(const deck of [tiles,Array.from({length:28},()=>[5,5])]){
  const layout=layoutBoard(deck,width);
  for(const p of layout.positions){
   assert.equal(p.width>p.height,p.double?p.direction==='down':p.direction!=='down');
   assert.ok(p.x-p.width/2>=0);assert.ok(p.x+p.width/2<=width);assert.ok(p.y-p.height/2>=0);assert.ok(p.y+p.height/2<=layout.height);
  }
 }
});
test('semua kartu bersentuhan, tanpa celah atau tumpang tindih',()=>{
 for(const width of [180,260,360,600,1000])for(const deck of [tiles,Array.from({length:28},()=>[5,5]),Array.from({length:28},()=>[1,6])]){
  const l=layoutBoard(deck,width);
  for(let i=0;i<l.positions.length;i++)for(let j=i+1;j<l.positions.length;j++){
   const a=l.positions[i],b=l.positions[j],dx=Math.abs(a.x-b.x)-(a.width+b.width)/2,dy=Math.abs(a.y-b.y)-(a.height+b.height)/2;
   assert.ok(dx>=0||dy>=0,'Kartu bertumpuk '+i+':'+j);
   if(j===i+1)assert.ok((dx===0&&dy<0)||(dy===0&&dx<0),'Kartu tidak bersentuhan '+i+':'+j);
  }
 }
});
test('belokan menyambung di tengah separuh kartu horizontal',()=>{
 const l=layoutBoard(Array.from({length:15},()=>[1,6]),260);
 let found=false;
 for(let i=1;i<l.positions.length;i++){
  const a=l.positions[i-1],b=l.positions[i];
  if(a.direction!=='down'&&b.direction==='down'){
   found=true;assert.equal(b.y-b.height/2,a.y+a.height/2);
   assert.equal(Math.abs(b.x-a.x),a.width/2-l.short/2);
  }
 }
 assert.ok(found);
});
