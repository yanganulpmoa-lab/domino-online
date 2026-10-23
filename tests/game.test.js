import test from 'node:test';
import assert from 'node:assert/strict';
import {act,freshRoom} from '../src/game.js';
test('2–4 pemain: kartu utuh, giliran, akhir ronde, dan privasi tangan',()=>{
 for(const count of [2,4]) for(let round=0;round<10;round++) {
  const room=freshRoom(),sessions=[];
  for(let i=0;i<count;i++) sessions.push(act(room,{action:'join',name:'Pemain '+i,code:'ABCDEF123456'}));
  assert.throws(()=>act(room,{action:'start',token:sessions[1].token}));
  act(room,{action:'start',token:sessions[0].token});
  assert.equal(room.stock.length,0);assert.ok(room.players.every(p=>p.hand.length===28/count));assert.ok(room.dice>=1&&room.dice<=6);assert.ok(room.players[room.turn].hand.some(t=>t[0]===room.dice&&t[1]===room.dice));
  assert.throws(()=>act(room,{action:'play',token:room.players[room.turn].token,tile:0}));room.rollUntil=0;
  const wrong=room.players[room.turn].hand.findIndex(t=>t[0]!==room.dice||t[1]!==room.dice);assert.throws(()=>act(room,{action:'play',token:room.players[room.turn].token,tile:wrong}));
  const all=[...room.stock,...room.players.flatMap(p=>p.hand)];
  assert.equal(all.length,28);assert.equal(new Set(all.map(t=>t.join(','))).size,28);
  const view=act(room,{action:'state',token:sessions[0].token});
  assert.ok(view.players.every(p=>!('hand' in p)&&!('token' in p)));
  assert.throws(()=>act(room,{action:'play',token:sessions[(room.turn+1)%count].token,tile:0}));
  for(let step=0;step<300&&room.winners===null;step++) {
   const p=room.players[room.turn],base={token:p.token};let move;
   for(let i=0;i<p.hand.length;i++) {
    if(!room.board.length ? p.hand[i][0]===room.dice&&p.hand[i][1]===room.dice : p.hand[i].includes(room.board.at(-1)[1])) {move={action:'play',tile:i,side:'right'};break;}
    if(room.board.length&&p.hand[i].includes(room.board[0][0])) {move={action:'play',tile:i,side:'left'};break;}
   }
   act(room,{...base,...(move||{action:room.stock.length?'draw':'pass'})});
   for(let i=1;i<room.board.length;i++) assert.equal(room.board[i-1][1],room.board[i][0]);
   assert.equal(room.stock.length+room.board.length+room.players.reduce((n,p)=>n+p.hand.length,0),28);
  }
  assert.ok(room.winners?.length);
  act(room,{action:'restart',token:sessions[0].token});assert.equal(room.board.length,0);
 }
});

test('3 pemain tidak boleh mulai',()=>{const r=freshRoom();const a=act(r,{action:'join',name:'A'});act(r,{action:'join',name:'B'});act(r,{action:'join',name:'C'});assert.throws(()=>act(r,{action:'start',token:a.token}));});
