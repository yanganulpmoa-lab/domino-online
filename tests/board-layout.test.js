import test from 'node:test';
import assert from 'node:assert/strict';
import {layoutBoard} from '../public/board-layout.js';
const tiles=Array.from({length:28},(_,i)=>i%4===0?[5,5]:[2,6]);
test('balak melintang, kartu biasa mengikuti arah jalur',()=>{
 for(const width of [260,360,600,1000]){
  const layout=layoutBoard(tiles,width);
  for(const p of layout.positions){
   const vertical=p.direction==='down';
   assert.equal(p.width>p.height, p.double?vertical:!vertical);
   assert.ok(p.x-p.width/2>=0);assert.ok(p.x+p.width/2<=layout.width);assert.ok(p.y-p.height/2>=0);assert.ok(p.y+p.height/2<=layout.height);
  }
 }
});
test('jalur membelok tanpa tumpang tindih untuk 28 kartu dan semua balak',()=>{
 for(const width of [180,260,360,600,1000])for(const deck of [tiles,Array.from({length:28},()=>[5,5])]){
  const l=layoutBoard(deck,width);
  for(let i=0;i<l.positions.length;i++)for(let j=i+1;j<l.positions.length;j++){
   const a=l.positions[i],b=l.positions[j];
   assert.ok(Math.abs(a.x-b.x)>=(a.width+b.width)/2||Math.abs(a.y-b.y)>=(a.height+b.height)/2);
  }
  if(l.positions.length>l.columns)assert.ok(l.positions.some(p=>p.direction==='west'));
 }
});
