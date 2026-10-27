import test from 'node:test';
import assert from 'node:assert/strict';
let starts=0;
globalThis.window={AudioContext:class{constructor(){this.state='running';this.currentTime=0;this.destination={};}createOscillator(){return {frequency:{setValueAtTime(){}},connect(){},start(){starts++;},stop(){}};}createGain(){return {gain:{setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){}};}}};
const sound=await import('../public/sound.js');
test('suara move, fanfare kemenangan, dan tombol mute',()=>{
 sound.unlockAudio();sound.moveSound();assert.equal(starts,2);const initial=starts;sound.victorySound();assert.ok(starts-initial>20);
 sound.toggleAudio();const muted=starts;sound.moveSound();sound.victorySound();assert.equal(starts,muted);assert.equal(sound.soundEnabled(),false);
 sound.toggleAudio();assert.equal(sound.soundEnabled(),true);assert.ok(starts>muted);
});
