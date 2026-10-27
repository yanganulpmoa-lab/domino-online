import {unlockAudio,toggleAudio,soundEnabled,moveSound,passSound,victorySound} from './sound.js';
import {layoutBoard} from './board-layout.js';
const $=id=>document.getElementById(id);
let state=null,busy=false,selected=null,drag=null,clockOffset=0,expiredRefresh=0,suppressClickUntil=0;
const pipPositions={0:[],1:[[50,50]],2:[[27,25],[73,75]],3:[[27,25],[50,50],[73,75]],4:[[27,25],[73,25],[27,75],[73,75]],5:[[27,25],[73,25],[50,50],[27,75],[73,75]],6:[[27,22],[73,22],[27,50],[73,50],[27,78],[73,78]]};
const now=()=>Date.now()+clockOffset;
const myTurn=()=>state?.started&&state.winners===null&&state.me===state.turn&&now()<state.deadline;
function legal(t){if(!state.board.length)return t[0]===5&&t[1]===5?['right']:[];return ['left','right'].filter(s=>t.includes(s==='left'?state.board[0][0]:state.board.at(-1)[1]));}
function tile(t){const e=document.createElement('button');e.className='tile';e.type='button';e.setAttribute('aria-label',t[0]+' dan '+t[1]);for(const n of t){const half=document.createElement('span');half.className='half';half.dataset.value=n;for(const [x,y] of pipPositions[n]){const pip=document.createElement('i');pip.className='pip';pip.style.left=x+'%';pip.style.top=y+'%';half.append(pip)}e.append(half)}return e;}
async function request(action,extra={},quiet=false){if(busy)return;busy=true;const session=state;try{const response=await fetch('/api',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,code:state?.code,token:state?.token,...extra})});const data=await response.json();if(!response.ok)throw Error(data.error||'Permintaan gagal');if(action==='state'&&state!==session)return;clockOffset=data.serverNow-Date.now();const previous=state;const changed=!state||state.roundId!==data.roundId||state.turnId!==data.turnId;if(changed){cancelDrag();selected=null;}state=data;presentEffects(previous,data);sessionStorage.setItem('domino-session',JSON.stringify({code:data.code,token:data.token}));if(!drag)render();$('connection').textContent='● Terhubung';if(!quiet)$('message').textContent='';}catch(error){if(quiet)$('connection').textContent='Menghubungkan kembali…';else{$('message').textContent=error.message;setTimeout(()=>request('state',{},true),100);}}finally{busy=false;}}
function highlight(){const allowed=myTurn()&&selected!==null?legal(state.hand[selected]):[];for(const s of ['left','right']){$(s).disabled=!allowed.includes(s);$(s).classList.toggle('available',allowed.includes(s));}const tiles=[...$('board').querySelectorAll('.tile')];tiles.forEach(t=>t.classList.remove('endpoint'));if(allowed.includes('left'))tiles[0]?.classList.add('endpoint');if(allowed.includes('right'))tiles.at(-1)?.classList.add('endpoint');$('hand').querySelectorAll('.tile').forEach((t,i)=>t.classList.toggle('selected',i===selected));}
function render(){if(!state)return;$('lobby').hidden=true;$('game').hidden=false;$('room').textContent=state.code;$('start').hidden=state.started||state.me!==0;$('start').disabled=![2,4].includes(state.players.length);$('restart').hidden=state.winners===null||state.me!==0;
$('players').replaceChildren(...state.players.map((p,i)=>{const e=document.createElement('div');e.className='player'+(state.started&&state.winners===null&&state.turn===i?' active':'');e.textContent=p.name+(i===state.me?' (Anda)':'')+' · '+p.count+' kartu';return e}));
renderBoard();
$('hand').replaceChildren(...state.hand.map((t,i)=>{const e=tile(t),playable=myTurn()&&legal(t).length;e.disabled=!playable;e.classList.add(playable?'playable':'unplayable');e.onclick=()=>{if(Date.now()<suppressClickUntil)return;selected=i;highlight();};e.onpointerdown=event=>beginDrag(event,i,e);return e}));
$('status').textContent=state.winners!==null?(state.winners.length?'Pemenang: '+state.winners.map(i=>state.players[i].name).join(', '):'Ronde berakhir. Mulai ronde baru.'):!state.started?'Menunggu 2 atau 4 pemain…':state.turn===state.me?'Giliran Anda':'Giliran '+state.players[state.turn].name;
$('events').replaceChildren(...(state.events||[]).slice(-3).map(text=>{const e=document.createElement('div');e.textContent=text;return e}));$('hint').textContent=myTurn()?'Seret kartu yang menyala ke ujung meja yang disorot. Bisa juga pilih kartu lalu ketuk ujungnya.':'Kartu yang dapat dimainkan akan menyala saat giliran Anda.';highlight();tick();}
function boardHeight(){return Math.max(210,Math.min(340,Math.round(window.innerHeight*.4)));}
function renderBoard(){
 const board=$('board');board.replaceChildren();
 if(!state.board.length){board.textContent='Pembuka: balak 5';board.style.height=boardHeight()+'px';return;}
 const layout=layoutBoard(state.board,Math.max(160,board.clientWidth),boardHeight());
 board.style.height=layout.height+'px';
 state.board.forEach((t,i)=>{const e=tile(t),p=layout.positions[i];e.classList.add('board-tile');e.classList.toggle('double',p.double);e.dataset.index=i;e.dataset.direction=p.direction;e.dataset.double=p.double;e.tabIndex=-1;e.setAttribute('aria-disabled','true');e.setAttribute('aria-label',(p.double?'Balak ':'')+t[0]+' dan '+t[1]);e.style.width=layout.short+'px';e.style.height=layout.long+'px';e.style.left=p.x+'px';e.style.top=p.y+'px';e.style.transform='translate(-50%,-50%) rotate('+p.angle+'deg)';board.append(e);});
}
let resizeFrame;
new ResizeObserver(()=>{cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(()=>{if(state?.board&&!drag){renderBoard();highlight();}});}).observe($('board'));
function beginDrag(event,index,element){if(!myTurn()||!legal(state.hand[index]).length||busy||event.button!==0)return;selected=index;highlight();drag={index,x:event.clientX,y:event.clientY,turnId:state.turnId,ghost:null};try{element.setPointerCapture(event.pointerId)}catch{};}
function cancelDrag(){drag?.ghost?.remove();drag=null;for(const s of ['left','right'])$(s).classList.remove('hover');}
document.addEventListener('pointermove',event=>{if(!drag)return;if(!drag.ghost&&Math.hypot(event.clientX-drag.x,event.clientY-drag.y)>6){drag.ghost=tile(state.hand[drag.index]);drag.ghost.classList.add('ghost');document.body.append(drag.ghost);}if(drag.ghost){event.preventDefault();drag.ghost.style.left=event.clientX-25+'px';drag.ghost.style.top=event.clientY-50+'px';const side=dropSide(event.clientX,event.clientY);for(const s of ['left','right'])$(s).classList.toggle('hover',s===side);}}, {passive:false});
function dropSide(x,y){const node=document.elementFromPoint(x,y);for(const s of ['left','right'])if(node?.closest('#'+s)&&!$(s).disabled)return s;const end=node?.closest('#board .tile.endpoint');if(end){const tiles=[...$('board').querySelectorAll('.tile')];const options=legal(state.hand[selected]);if(tiles.length===1)return options.length===1?options[0]:(x<end.getBoundingClientRect().left+end.offsetWidth/2?'left':'right');return end===tiles[0]?'left':'right';}return null;}
document.addEventListener('pointerup',event=>{if(!drag)return;const moved=!!drag.ghost,side=moved?dropSide(event.clientX,event.clientY):null;if(moved)suppressClickUntil=Date.now()+250;cancelDrag();if(side)play(side);else if(moved)render();});document.addEventListener('pointercancel',()=>{cancelDrag();if(state)render();});
function play(side){if(selected===null||!myTurn()||busy)return;const i=selected;selected=null;request('play',{tile:i,side,turnId:state.turnId});}
for(const side of ['left','right'])$(side).onclick=()=>play(side);
function tick(){if(!state)return;const active=state.started&&state.winners===null;$('timer').hidden=!active;if(!active)return;const remaining=Math.max(0,Math.ceil((state.deadline-now())/1000));$('seconds').textContent=remaining;$('progress').value=remaining;$('timer').classList.toggle('urgent',remaining<=5);if(!remaining){cancelDrag();$('board').querySelectorAll('.endpoint').forEach(e=>e.classList.remove('endpoint'));$('hand').querySelectorAll('.tile').forEach(e=>{e.disabled=true;e.classList.remove('playable');e.classList.add('unplayable')});for(const s of ['left','right']){$(s).disabled=true;$(s).classList.remove('available');}if(Date.now()-expiredRefresh>1000){expiredRefresh=Date.now();request('state',{},true);}}}
for(const mode of ['create','join'])$(mode).onclick=()=>{if(!$('name').value.trim()){$('message').textContent='Isi nama Anda dahulu.';$('name').focus();return;}request(mode,{name:$('name').value,code:$('code').value})};for(const mode of ['start','restart'])$(mode).onclick=()=>request(mode);
$('copy').onclick=async()=>{try{await navigator.clipboard.writeText(location.origin+'/?room='+state.code);$('message').textContent='Undangan disalin.'}catch{$('message').textContent='Bagikan alamat web dan kode: '+state.code}};
$('leave').onclick=()=>{cancelDrag();sessionStorage.removeItem('domino-session');state=null;selected=null;$('game').hidden=true;$('lobby').hidden=false;$('message').textContent='Kursi tetap tersimpan di room sebelumnya.'};$('code').value=new URLSearchParams(location.search).get('room')||'';try{state=JSON.parse(sessionStorage.getItem('domino-session'));if(state)request('state')}catch{sessionStorage.removeItem('domino-session')}
setInterval(()=>{if(state&&!document.hidden&&!drag)request('state',{},true)},1500);setInterval(tick,150);document.addEventListener('visibilitychange',()=>{if(state&&!document.hidden)request('state',{},true)});


function updateSoundButton(){const enabled=soundEnabled();$('sound').textContent=enabled?'🔊 Suara aktif':'🔇 Suara mati';$('sound').setAttribute('aria-pressed',String(enabled));}
$('sound').onclick=()=>{toggleAudio();updateSoundButton();};
document.addEventListener('pointerdown',()=>unlockAudio(),{capture:true});document.addEventListener('keydown',()=>unlockAudio(),{capture:true});updateSoundButton();
const celebrated=new Set();
function closeVictory(){$('victory').close();$('confetti').replaceChildren();}
$('closeVictory').onclick=closeVictory;
$('victoryAgain').onclick=()=>{closeVictory();request('restart');};
function presentEffects(previous,current){
 if(previous?.roundId===current.roundId&&Array.isArray(previous.board)){
  const moves=current.board.length-previous.board.length;
  if(moves>0)moveSound(moves);
  else if(current.turnId!==previous.turnId&&current.winners===null)passSound();
 }
 if(previous?.roundId!==current.roundId&&$('victory').open)closeVictory();
 if(!current.winners?.length)return;
 const key='domino-victory-'+current.code+'-'+current.roundId;
 if(celebrated.has(key))return;
 celebrated.add(key);
 try{if(sessionStorage.getItem(key))return;sessionStorage.setItem(key,'1');}catch{}
 const mine=current.winners.includes(current.me),names=current.winners.map(i=>current.players[i].name).join(' & ');
 $('victoryTitle').textContent=mine?'ANDA MENANG!':'LUAR BIASA!';
 $('victoryNames').textContent=names;
 $('victorySubtitle').textContent=current.winners.length>1?'Seri! Sama-sama juara di meja ini.':mine?'Meja ini milik Anda. Saatnya rayakan!':'Berikan tepuk tangan untuk sang juara!';
 $('victoryAgain').hidden=current.me!==0;
 $('victory').showModal();victorySound();
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 if(!reduced){
  const colors=['#ffcc00','#ff654c','#a4ffab','#74c8ff','#ff9bde'];
  for(let i=0;i<100;i++){const e=document.createElement('i');e.style.setProperty('--x',Math.random()*100+'vw');e.style.setProperty('--delay',Math.random()*1.1+'s');e.style.setProperty('--drift',(Math.random()-.5)*300+'px');e.style.setProperty('--spin',(Math.random()-.5)*1440+'deg');e.style.background=colors[i%colors.length];$('confetti').append(e);}
  setTimeout(()=>$('confetti').replaceChildren(),6500);
 }
}
window.addEventListener('resize',()=>{if(state?.board&&!drag){renderBoard();highlight();}});
