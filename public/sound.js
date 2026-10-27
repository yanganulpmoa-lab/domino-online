let context=null,enabled=true;
try{enabled=localStorage.getItem('domino-sound')!=='off';}catch{}
export function soundEnabled(){return enabled;}
export function unlockAudio(){
 if(!enabled)return;
 try{const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;context ||= new Audio();if(context.state==='suspended')context.resume().catch(()=>{});}catch{}
}
export function toggleAudio(){enabled=!enabled;try{localStorage.setItem('domino-sound',enabled?'on':'off');}catch{}if(enabled){unlockAudio();moveSound();}return enabled;}
function tone(frequency,delay=0,duration=.12,volume=.08,type='sine'){
 if(!enabled||!context||context.state!=='running')return;
 try{const start=context.currentTime+delay,osc=context.createOscillator(),gain=context.createGain();osc.type=type;osc.frequency.setValueAtTime(frequency,start);gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(volume,start+.008);gain.gain.exponentialRampToValueAtTime(.001,start+duration);osc.connect(gain);gain.connect(context.destination);osc.start(start);osc.stop(start+duration+.02);}catch{}
}
export function moveSound(count=1){for(let i=0;i<Math.min(count,4);i++){tone(780,i*.12,.06,.1,'triangle');tone(260,i*.12+.025,.09,.06,'sine');}}
export function passSound(){tone(330,0,.12,.045);tone(247,.08,.15,.035);}
export function victorySound(){
 const melody=[[523,0,.15],[659,.16,.15],[784,.32,.15],[1047,.5,.4],[784,.95,.15],[1047,1.15,.65],[1319,1.85,.65]];
 for(const [f,t,d] of melody){tone(f,t,d,.08,'triangle');tone(f/2,t,d,.035,'sine');}
 for(let i=0;i<7;i++){tone(100,i*.28,.13,.07,'triangle');tone(1568,i*.28+.14,.05,.025,'square');}
 for(const f of [523,659,784,1047])tone(f,2.55,1,.04,'triangle');
}
