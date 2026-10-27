import test from 'node:test';
import assert from 'node:assert/strict';
import {layoutBoard} from '../public/board-layout.js';
const tiles=Array.from({length:28},(_,i)=>i%4===0?[5,5]:[2,6]);
test('balak melintang, kartu biasa mengikuti arah jalur',()=>{
 for(const width of [180,260,360,600,1000])for(const deck of [tiles,Array.from({length:28},()=>[5,5])]){
  const layout=layoutBoard(deck,width);
  for(const p of layout.positions){
   assert.equal(p.width>p.height,p.double?['down','up'].includes(p.direction):!['down','up'].includes(p.direction));
   assert.ok(p.x-p.width/2>=0);assert.ok(p.x+p.width/2<=width);assert.ok(p.y-p.height/2>=0);assert.ok(p.y+p.height/2<=layout.height);
  }
 }
});
test('semua kartu bersentuhan, tanpa celah atau tumpang tindih',()=>{
 for(const width of [180,260,360,600,1000])for(const deck of [tiles,Array.from({length:28},()=>[5,5]),Array.from({length:28},()=>[1,6])]){
  const l=layoutBoard(deck,width);
  for(let i=0;i<l.positions.length;i++)for(let j=i+1;j<l.positions.length;j++){
   const a=l.positions[i],b=l.positions[j],dx=Math.abs(a.x-b.x)-(a.width+b.width)/2,dy=Math.abs(a.y-b.y)-(a.height+b.height)/2;
   assert.ok(dx>=-1e-7||dy>=-1e-7,'Kartu bertumpuk '+i+':'+j);
   if(j===i+1)assert.ok((Math.abs(dx)<1e-7&&dy<0)||(Math.abs(dy)<1e-7&&dx<0),'Kartu tidak bersentuhan '+i+':'+j);
  }
 }
});
test('balak 5 tetap di pusat dan seluruh rantai muat tanpa geser',()=>{
 for(const width of [180,260,360,600,1000])for(const height of [210,300,340])for(let anchor=0;anchor<28;anchor++){
  const deck=Array.from({length:28},()=>[1,6]);deck[anchor]=[5,5];
  const l=layoutBoard(deck,width,height);assert.equal(l.positions[anchor].x,width/2);assert.equal(l.positions[anchor].y,height/2);assert.equal(l.height,height);
  for(const p of l.positions){assert.ok(p.x-p.width/2>=-1e-7);assert.ok(p.x+p.width/2<=width+1e-7);assert.ok(p.y-p.height/2>=-1e-7);assert.ok(p.y+p.height/2<=height+1e-7);}
 }
});
test('penambahan kartu pada kedua ujung tidak menggeser pusat pembuka',()=>{
 const deck=[[1,5],[5,5],[5,2]];const l=layoutBoard(deck,500);
 assert.equal(l.positions[1].x,250);assert.equal(l.positions[1].y,150);
 assert.ok(l.positions[0].x<250);assert.ok(l.positions[2].x>250);
});
