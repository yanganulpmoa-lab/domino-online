export function freshRoom() {
  return { players: [], board: [], stock: [], turn: 0, started: false, winners: null, passes: 0, dice: null, rollUntil: 0, roundId: null };
}
export function act(room, data) {
  let kind = data.action, token = data.token;
  if (!['create','join','state','start','restart','play','draw','pass'].includes(kind)) throw Error('Aksi tidak dikenal.');
  if (kind === 'create') kind = 'join';
  if (kind === 'join') {
    if (room.started || room.players.length >= 4) throw Error('Room sudah bermain atau penuh.');
    const name = String(data.name || '').trim().slice(0,24);
    if (!name) throw Error('Isi nama pemain dahulu.');
    token = crypto.randomUUID();
    room.players.push({name, token, hand: []});
  }
  const me = room.players.findIndex(p => p.token === token);
  if (me < 0) throw Error('Sesi tidak valid. Silakan bergabung kembali.');
  const player = room.players[me];
  if (kind === 'start' || kind === 'restart') {
    if (me !== 0 || ![2,4].includes(room.players.length)) throw Error('Hanya host yang dapat memulai dengan tepat 2 atau 4 pemain.');
    if (room.started && room.winners === null) throw Error('Permainan masih berjalan.');
    const deck = [];
    for (let a=0;a<=6;a++) for(let b=a;b<=6;b++) deck.push([a,b]);
    for(let i=deck.length-1;i>0;i--) { const j=crypto.getRandomValues(new Uint32Array(1))[0]%(i+1); [deck[i],deck[j]]=[deck[j],deck[i]]; }
    room.players.forEach(p => { p.hand = deck.splice(-(28 / room.players.length)); });
    const dice = 1 + crypto.getRandomValues(new Uint32Array(1))[0] % 6;
    const opener = room.players.findIndex(p => p.hand.some(t => t[0] === dice && t[1] === dice));
    Object.assign(room,{board:[],stock:[],turn:opener,started:true,winners:null,passes:0,dice,rollUntil:Date.now()+2500,roundId:crypto.randomUUID()});
  }
  if (['play','draw','pass'].includes(kind)) {
    if (!room.started || room.winners !== null || room.turn !== me) throw Error('Tunggu giliran Anda.');
    if (Date.now() < (room.rollUntil || 0)) throw Error('Tunggu dadu selesai berputar.');
    if (kind === 'draw') throw Error('Semua kartu sudah dibagikan. Lewati jika tidak bisa bermain.');
    const board=room.board;
    const fits=t=>!board.length ? (!room.dice || (t[0]===room.dice && t[1]===room.dice)) : t.includes(board[0][0]) || t.includes(board.at(-1)[1]);
    if (kind==='play') {
      if(!Number.isInteger(data.tile)||data.tile<0||data.tile>=player.hand.length) throw Error('Kartu tidak valid.');
      const side=data.side || 'right', tile=[...player.hand[data.tile]];
      if(!['left','right'].includes(side)) throw Error('Sisi tidak valid.');
      if (!board.length && room.dice && (tile[0]!==room.dice || tile[1]!==room.dice)) throw Error('Kartu pembuka wajib balak '+room.dice+'.');
      if(board.length) {
        const end=side==='left'?board[0][0]:board.at(-1)[1];
        if(!tile.includes(end)) throw Error('Angka kartu tidak cocok dengan ujung meja.');
        if(side==='left'?tile[1]!==end:tile[0]!==end) tile.reverse();
      }
      player.hand.splice(data.tile,1);
      if(side==='left') board.unshift(tile); else board.push(tile);
      room.passes=0;
      if(!player.hand.length) room.winners=[me];
    } else {
      if(player.hand.some(fits)) throw Error('Masih ada kartu yang bisa dimainkan.');
      if(kind==='draw') {
        if(!room.stock.length) throw Error('Stok habis. Lewati giliran.');
        player.hand.push(room.stock.pop());
      } else {
        if(room.stock.length) throw Error('Ambil kartu dari stok dahulu.');
        room.passes++;
        if(room.passes>=room.players.length) {
          const scores=room.players.map(p=>p.hand.reduce((n,t)=>n+t[0]+t[1],0));
          room.winners=scores.flatMap((s,i)=>s===Math.min(...scores)?[i]:[]);
        }
      }
    }
    if(kind!=='draw') room.turn=(me+1)%room.players.length;
  }
  return {code:data.code,token,me,hand:player.hand,players:room.players.map(p=>({name:p.name,count:p.hand.length})),stock:room.stock.length,...Object.fromEntries(['board','turn','started','winners','dice','rollUntil','roundId'].map(k=>[k,room[k]]))};
}
