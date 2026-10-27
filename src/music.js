// A small original score, synthesised locally. No audio download or service is required.
const melody=[62,69,65,64,62,65,69,72,70,69,65,64,60,64,67,69,65,64,62,57,62,65,64,62];
const bass=[50,46,48,45];
export class Soundtrack {
  constructor(contextFactory=()=>new (window.AudioContext||window.webkitAudioContext)()){
    this.contextFactory=contextFactory;this.context=null;this.volume=.45;this.playing=false;this.timer=null;this.voices=new Set();
  }
  async start(){
    if(this.playing)return;
    const context=this.context||this.contextFactory();this.context=context;
    try{
      await context.resume();
      if(context.state!=='running')throw new Error('Audio playback was not enabled');
      if(!this.master){
        this.master=context.createGain();this.master.gain.value=this.volume;
        const filter=context.createBiquadFilter();filter.type='lowpass';filter.frequency.value=2200;
        this.master.connect(filter);filter.connect(context.destination);
      }
      this.playing=true;this.step=0;this.nextTime=context.currentTime+.05;
      this.schedule();this.timer=setInterval(()=>this.schedule(),120);
    }catch(error){await this.dispose();throw error;}
  }
  note(midi,time,duration,level){
    const ctx=this.context,osc=ctx.createOscillator(),envelope=ctx.createGain();
    osc.type='triangle';osc.frequency.value=440*2**((midi-69)/12);
    envelope.gain.setValueAtTime(0,time);envelope.gain.linearRampToValueAtTime(level,time+.04);
    envelope.gain.exponentialRampToValueAtTime(.0001,time+duration);
    osc.connect(envelope);envelope.connect(this.master);this.voices.add(osc);
    osc.onended=()=>{this.voices.delete(osc);osc.disconnect();envelope.disconnect()};
    osc.start(time);osc.stop(time+duration+.03);
  }
  schedule(){
    if(!this.playing)return;
    const beat=60/68;
    if(this.nextTime<this.context.currentTime)this.nextTime=this.context.currentTime+.03;
    while(this.nextTime<this.context.currentTime+.8){
      this.note(melody[this.step%melody.length],this.nextTime,beat*1.7,.18);
      if(this.step%6===0){const root=bass[Math.floor(this.step/6)%bass.length];this.note(root,this.nextTime,beat*5.8,.12);this.note(root+7,this.nextTime+.02,beat*5.5,.045);}
      this.step++;this.nextTime+=beat;
    }
  }
  footsteps(){
    if(!this.playing||!this.context||this.context.state!=='running')return;
    // A quiet, short low pulse; the visible prompt carries the same information.
    try{for(let i=0;i<3;i++)this.note(40,this.context.currentTime+.05+i*.32,.13,.035)}catch{}
  }
  setVolume(value){this.volume=Math.max(0,Math.min(1,value));if(this.master)this.master.gain.setTargetAtTime(this.volume,this.context.currentTime,.08);}
  async stop(){
    this.playing=false;clearInterval(this.timer);this.timer=null;
    for(const osc of this.voices){try{osc.stop()}catch{}}this.voices.clear();
    if(this.context&&this.context.state!=='closed')await this.context.suspend();
  }
  async dispose(){await this.stop();if(this.context&&this.context.state!=='closed')await this.context.close();this.context=null;this.master=null;}
}
