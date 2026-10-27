export const TURN_MS = 20000;
export function freshRoom() {
  return {players:[],board:[],stock:[],turn:0,started:false,winners:null,passes:0,roundId:null,turnId:0,deadline:0,opening:5,events:[]};
}
export function sides(room,tile) {
  if(!room.board.length) return tile[0]===5&&tile[1]===5?['right']:[];
  return ['left','right'].filter(s=>tile.includes(s==='left'?room.board[0][0]:room.board.at(-1)[1]));
}
function note(room,text) {room.events=(room.events||[]).concat(text).slice(-8);}
function finishBlocked(room) {
  const scores=room.players.map(p=>p.hand.reduce((n,t)=>n+t[0]+t[1],0));
  room.winners=scores.flatMap((s,i)=>s===Math.min(...scores)?[i]:[]);room.deadline=0;
}
function next(room,now) {room.turn=(room.turn+1)%room.players.length;room.turnId=(room.turnId||0)+1;room.deadline=now+TURN_MS;}
function place(room,index,side,now) {
  const player=room.players[room.turn],tile=[...player.hand[index]];
  if(room.board.length) {
    const end=side==='left'?room.board[0][0]:room.board.at(-1)[1];
    if(side==='left'?tile[1]!==end:tile[0]!==end) tile.reverse();
  }
  player.hand.splice(index,1);
  if(side==='left') room.board.unshift(tile);else room.board.push(tile);
  room.passes=0;
  if(!player.hand.length){room.winners=[room.turn];room.deadline=0;}else next(room,now);
}
export function advance(room,now=Date.now()) {
  if(!room.started||room.winners!==null)return false;
  let changed=false;
  if(!room.deadline){room.deadline=now+TURN_MS;room.turnId=(room.turnId||0)+1;changed=true;}
  if(now>=room.deadline){
    const p=room.players[room.turn];
    if(!room.board.length){
      const holder=room.players.findIndex(p=>p.hand.some(t=>t[0]===5&&t[1]===5));
      if(holder>=0){room.turn=holder;const i=room.players[holder].hand.findIndex(t=>t[0]===5&&t[1]===5);note(room,room.players[holder].name+': balak 5 dipasang otomatis (waktu habis).');place(room,i,'right',now);}
      else {room.winners=[];room.deadline=0;note(room,'Ronde lama berakhir. Host dapat memulai ronde baru.');}
    }else {note(room,p.name+': lewat, waktu 20 detik habis.');room.passes=0;next(room,now);}
    changed=true;
  }
  for(let i=0;i<room.players.length&&room.winners===null;i++) {
    const p=room.players[room.turn];
    if(p.hand.some(t=>sides(room,t).length))break;
    note(room,p.name+': otomatis lewat, tidak ada kartu cocok.');
    room.passes++;changed=true;
    if(room.passes>=room.players.length){finishBlocked(room);break;}
    next(room,now);
  }
  return changed;
}
export function act(room,data,now=Date.now()) {
  let kind=data.action,token=data.token;
  if(!['create','join','state','start','restart','play'].includes(kind))throw Error('Aksi tidak dikenal.');
  if(kind==='create')kind='join';
  if(kind==='join'){
    if(room.started||room.players.length>=4)throw Error('Room sudah bermain atau penuh.');
    const name=String(data.name||'').trim().slice(0,24);if(!name)throw Error('Isi nama pemain dahulu.');
    token=crypto.randomUUID();room.players.push({name,token,hand:[]});
  }
  const me=room.players.findIndex(p=>p.token===token);if(me<0)throw Error('Sesi tidak valid.');
  advance(room,now);
  if(kind==='start'||kind==='restart'){
    if(me!==0||![2,4].includes(room.players.length))throw Error('Host dapat memulai dengan tepat 2 atau 4 pemain.');
    if(room.started&&room.winners===null)throw Error('Permainan masih berjalan.');
    const deck=[];for(let a=0;a<=6;a++)for(let b=a;b<=6;b++)deck.push([a,b]);
    for(let i=deck.length-1;i>0;i--){const j=crypto.getRandomValues(new Uint32Array(1))[0]%(i+1);[deck[i],deck[j]]=[deck[j],deck[i]];}
    room.players.forEach(p=>{p.hand=deck.splice(-(28/room.players.length));});
    const opener=room.players.findIndex(p=>p.hand.some(t=>t[0]===5&&t[1]===5));
    Object.assign(room,{board:[],stock:[],turn:opener,started:true,winners:null,passes:0,opening:5,dice:null,rollUntil:0,roundId:crypto.randomUUID(),turnId:(room.turnId||0)+1,deadline:now+TURN_MS,events:[]});
    note(room,room.players[opener].name+' membuka dengan balak 5.');
  }
  if(kind==='play'){
    if(!room.started||room.winners!==null||room.turn!==me)throw Error('Tunggu giliran Anda.');
    if(data.turnId!==room.turnId)throw Error('Giliran telah berubah. Pilih kartu kembali.');
    const p=room.players[me],i=data.tile;
    if(!Number.isInteger(i)||i<0||i>=p.hand.length)throw Error('Kartu tidak valid.');
    const side=data.side;
    if(!sides(room,p.hand[i]).includes(side))throw Error(!room.board.length?'Pembuka wajib balak 5.':'Kartu tidak cocok dengan ujung ini.');
    place(room,i,side,now);advance(room,now);
  }
  const p=room.players[me];
  return {code:data.code,token,me,hand:p.hand,players:room.players.map(p=>({name:p.name,count:p.hand.length})),stock:0,serverNow:now,...Object.fromEntries(['board','turn','started','winners','roundId','turnId','deadline','events'].map(k=>[k,room[k]]))};
}
