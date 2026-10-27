import test from 'node:test';
import assert from 'node:assert/strict';
import {act,freshRoom,advance,sides,TURN_MS} from '../src/game.js';
function start(count=2){const room=freshRoom(),sessions=[];for(let i=0;i<count;i++)sessions.push(act(room,{action:'join',name:'Pemain '+i},1000));act(room,{action:'start',token:sessions[0].token},1000);return {room,sessions};}
function play(room,index,side,now=1001){return act(room,{action:'play',token:room.players[room.turn].token,tile:index,side,turnId:room.turnId},now);}
test('2/4 pemain, semua kartu dibagikan dan pembuka wajib balak 5',()=>{
 for(const count of [2,4])for(let round=0;round<20;round++){
  const {room}=start(count);assert.equal(room.stock.length,0);assert.ok(room.players.every(p=>p.hand.length===28/count));assert.equal(new Set(room.players.flatMap(p=>p.hand.map(t=>t.join(',')))).size,28);
  const hand=room.players[room.turn].hand,index=hand.findIndex(t=>t[0]===5&&t[1]===5);assert.ok(index>=0);
  assert.throws(()=>play(room,hand.findIndex(t=>t[0]!==5||t[1]!==5),'right'));
  play(room,index,'right');assert.deepEqual(room.board[0],[5,5]);
  for(let i=0;i<150&&room.winners===null;i++){
   const p=room.players[room.turn],index=p.hand.findIndex(t=>sides(room,t).length);assert.ok(index>=0);
   play(room,index,sides(room,p.hand[index])[0]);
   for(let j=1;j<room.board.length;j++)assert.equal(room.board[j-1][1],room.board[j][0]);
   assert.equal(room.board.length+room.players.reduce((s,p)=>s+p.hand.length,0),28);
  }
  assert.ok(room.winners?.length);act(room,{action:'restart',token:room.players[0].token},2000);assert.equal(room.board.length,0);assert.equal(room.deadline,22000);
 }
});
test('3 pemain tidak boleh mulai',()=>{const r=freshRoom();const a=act(r,{action:'join',name:'A'});act(r,{action:'join',name:'B'});act(r,{action:'join',name:'C'});assert.throws(()=>act(r,{action:'start',token:a.token}));});
test('legal sisi kiri, kanan, keduanya, dan tidak cocok',()=>{const r={board:[[2,3],[3,6]]};assert.deepEqual(sides(r,[1,2]),['left']);assert.deepEqual(sides(r,[1,6]),['right']);assert.deepEqual(sides(r,[2,6]),['left','right']);assert.deepEqual(sides(r,[1,4]),[]);});
test('otomatis melewati pemain buntu dan menyelesaikan meja buntu',()=>{
 const {room}=start();room.board=[[5,5]];room.turn=0;room.players[0].hand=[[1,2]];room.players[1].hand=[[2,5]];advance(room,1001);assert.equal(room.turn,1);assert.equal(room.deadline,1001+TURN_MS);assert.equal(room.passes,1);assert.match(room.events.at(-1),/otomatis lewat/);
 room.players[1].hand=[[3,4]];advance(room,1002);assert.deepEqual(room.winners,[0]);assert.equal(room.deadline,0);
});
test('20 detik: belum waktunya tidak lewat, sesudahnya lewat; pembuka otomatis balak 5',()=>{
 const {room}=start();const opener=room.turn;assert.equal(room.deadline,21000);advance(room,20999);assert.equal(room.board.length,0);advance(room,21000);assert.deepEqual(room.board[0],[5,5]);assert.match(room.events.find(t=>t.includes('dipasang otomatis')),/balak 5/);
 room.board=[[5,5]];room.turn=0;room.players[0].hand=[[1,5]];room.players[1].hand=[[2,5]];room.deadline=40000;const id=room.turnId;advance(room,40000);assert.equal(room.turn,1);assert.equal(room.deadline,60000);assert.ok(room.turnId>id);assert.equal(room.winners,null);
});
test('giliran dan tangan pribadi divalidasi oleh server',()=>{
 const {room,sessions}=start();const view=act(room,{action:'state',token:sessions[0].token},1001);assert.ok(view.players.every(p=>!('token' in p)&&!('hand' in p)));
 const index=room.players[room.turn].hand.findIndex(t=>t[0]===5&&t[1]===5);assert.throws(()=>act(room,{action:'play',token:room.players[room.turn].token,tile:index,side:'right',turnId:-1},1001));
 assert.throws(()=>act(room,{action:'play',token:room.players[(room.turn+1)%2].token,tile:0,side:'right',turnId:room.turnId},1001));
});
