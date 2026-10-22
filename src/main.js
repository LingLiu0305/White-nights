import '@fontsource-variable/manrope';
import './style.css';
import {chapters,locations} from './content.js';
import {createState,transition,readSave,writeSave} from './story.js';
import {createMap} from './map.js';
import {Soundtrack} from './music.js';

const $=s=>document.querySelector(s);
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let storage;try{storage=window.localStorage}catch{}
const saved=readSave(storage);
let state=createState(saved),selected=state.chapter,typing=false,typeTimer,toastTimer,map;
let imageToken=0;
const asset=name=>`${import.meta.env.BASE_URL}assets/${name}`;
const mapView=$('#map-view'),reader=$('#reader');
// A missing portrait must never hide the speaker's name or interrupt the story.
document.querySelectorAll('.speaker-portrait img').forEach(img=>{
  img.addEventListener('error',()=>img.parentElement.classList.add('portrait-missing'));
  if(img.complete&&!img.naturalWidth)img.parentElement.classList.add('portrait-missing');
});
function notify(message){clearTimeout(toastTimer);$('#toast').textContent=message;$('#toast').hidden=false;toastTimer=setTimeout(()=>$('#toast').hidden=true,4200)}
function save(){if(!writeSave(storage,state)){$('#save-status').hidden=false;$('#save-status').textContent='Progress cannot be saved on this device. You can still read. / 本机无法保存，仍可继续阅读。'}}
function showDialog(dialog){dialog.showModal();}
document.querySelectorAll('dialog').forEach(dialog=>{
  dialog.querySelectorAll('.close-dialog,.close-dialog-inline').forEach(button=>button.onclick=()=>dialog.close());
  dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close()}});
});
function labelFor(index){return `${state.cursors[index]>0?'Continue':index<=state.completed?'Reread':'Begin'} ${chapters[index].labelEn}`;}
const sentenceCase=text=>text.charAt(0)+text.slice(1).toLowerCase();
function renderMap(){
  mapView.hidden=false;mapView.inert=false;reader.hidden=true;$('#travel-overlay').hidden=true;
  document.body.classList.remove('is-reading','is-travelling');map?.pause(false);map?.setChapter(selected);
  const chapter=chapters[selected];
  $('#chapter-label').textContent=chapter.labelEn;
  $('#chapter-title-en').textContent=sentenceCase(chapter.en);
  const start=$('#start-story');start.innerHTML=`${labelFor(selected)} <span aria-hidden="true">↗</span>`;start.disabled=false;
  $('#chapter-list').replaceChildren();
  chapters.forEach((c,index)=>{
    const button=document.createElement('button');button.className=`chapter-tab ${selected===index?'active':''}`;
    button.disabled=index>state.completed+1;button.setAttribute('aria-label',`${c.labelEn}: ${sentenceCase(c.en)}${button.disabled?', locked':''}`);
    button.setAttribute('aria-current',selected===index?'step':'false');
    button.innerHTML=`<span>${index===4?'Morning':`Night ${c.roman}`}</span><span class="chapter-state" aria-hidden="true">${index<=state.completed?'✓':''}</span>`;
    button.onclick=()=>{selected=index;renderMap()};$('#chapter-list').append(button);
  });
  save();
}
function selectPlace(id){
  if(state.mode!=='map')return;
  const place=locations.find(l=>l.id===id);if(!place)return;
  $('#places-dialog').close();
  $('#place-en').textContent=sentenceCase(place.en);$('#place-name').textContent=place.name;
  $('#place-description').textContent=place.description;$('#place-note').textContent=place.note;
  $('#place-description-en').textContent=place.descriptionEn;$('#place-note-en').textContent=place.noteEn;
  const button=$('#place-start');button.hidden=chapters[selected].place!==id;
  button.textContent=`${labelFor(selected)} ↗`;button.onclick=()=>{$('#location-dialog').close();startChapter(selected)};
  showDialog($('#location-dialog'));
}
for(const location of locations){
  const button=document.createElement('button');button.className='place-link';button.setAttribute('aria-label',`Place: ${sentenceCase(location.en)}`);
  button.innerHTML=`${sentenceCase(location.en)}<span class="place-arrow" aria-hidden="true">↗</span>`;
  button.onclick=()=>selectPlace(location.id);$('#place-buttons').append(button);
}
function fallback(){
  map?.pause(true);map=null;
  $('#map-fallback').hidden=false;$('#map-canvas').hidden=true;$('#reset-view').hidden=true;
  document.querySelector('.map-hint').textContent='Open Places to explore';
}
map=createMap($('#map-canvas'),{onSelect:selectPlace,onFail:fallback});
function startChapter(index){
  const next=transition(state,{type:'START',chapter:index});if(next===state)return;
  state=next;selected=index;save();
  $('#travel-roman').textContent=chapters[index].label;
  $('#travel-title').textContent=chapters[index].labelEn;
  $('#travel-subtitle').textContent=sentenceCase(chapters[index].en);
  $('#travel-overlay').hidden=false;mapView.inert=true;document.body.classList.add('is-travelling');
  $('#skip-travel').focus();
  if(map)map.travel(chapters[index].route,arrive);else queueMicrotask(arrive);
}
function arrive(){
  if(state.mode!=='travel')return;state=transition(state,{type:'ARRIVE'});save();
  map?.pause(true);$('#travel-overlay').hidden=true;mapView.hidden=true;reader.hidden=false;
  document.body.classList.remove('is-travelling');document.body.classList.add('is-reading');
  reader.dataset.tint=chapters[state.chapter].tint;
  $('#reader-chapter').textContent=chapters[state.chapter].labelEn;
  $('#reader-subtitle').textContent=sentenceCase(chapters[state.chapter].en);
  currentImage='';reader.focus({preventScroll:true});renderLine();
}
let currentImage='';
function setBackground(name){
  if(currentImage===name)return;currentImage=name;
  const token=++imageToken,background=$('#scene-backdrop'),img=new Image();
  background.style.backgroundImage='none';
  img.onload=()=>{if(token===imageToken)background.style.backgroundImage=`url("${img.src}")`};
  img.onerror=()=>{if(token===imageToken)notify('The illustration could not load. You can keep reading. / 背景未载入，仍可阅读。')};
  img.src=asset(name);
}
function showText(line,fraction=1){
  $('#dialogue-zh').textContent=line.text.slice(0,Math.ceil(line.text.length*fraction));
  $('#dialogue-en').textContent=line.en.slice(0,Math.ceil(line.en.length*fraction));
}
function finishTyping(){clearInterval(typeTimer);typing=false;showText(chapters[state.chapter].lines[state.line]);$('#dialogue').setAttribute('aria-busy','false');}
function renderLine(){
  clearInterval(typeTimer);const chapter=chapters[state.chapter],line=chapter.lines[state.line];
  setBackground(line.image||chapter.image);
  $('#reading-scene').textContent=line.sectionEn;
  $('#previous-line').disabled=state.line===0;
  $('#chapter-end').hidden=true;$('#reading-deck').hidden=false;
  const voice=line.speaker==='梦想家'?'left':['姑娘','娜斯坚卡'].includes(line.speaker)?'right':'narration';
  $('#reading-deck').dataset.voice=voice;
  $('#portrait-left').hidden=voice!=='left';$('#portrait-right').hidden=voice!=='right';
  $('#right-speaker-name').textContent=line.speakerEn;$('#right-speaker-zh').textContent=line.speaker;
  $('#speaker').textContent=line.speakerEn;$('#speaker').hidden=voice!=='narration';
  $('#line-count').textContent=`${String(state.line+1).padStart(2,'0')} / ${String(chapter.lines.length).padStart(2,'0')}`;
  $('#reading-progress').style.width=`${(state.line+1)/chapter.lines.length*100}%`;
  $('#dialogue').classList.toggle('inner-voice',line.speaker==='独白');
  $('#dialogue').scrollTop=0;
  if(reduced){finishTyping();return;}
  let count=0;typing=true;showText(line,0);$('#dialogue').setAttribute('aria-busy','true');
  typeTimer=setInterval(()=>{count+=2;showText(line,Math.min(count/line.text.length,1));if(count>=line.text.length)finishTyping()},28);
}
function nextLine(){
  if(state.mode!=='reading')return;
  if(typing){finishTyping();return;}
  state=transition(state,{type:'NEXT'});save();
  if(state.mode==='end'){
    $('#reading-deck').hidden=true;$('#chapter-end').hidden=false;
    $('#end-label').textContent=`End of ${chapters[state.chapter].labelEn}`;
    $('#end-title').textContent=chapters[state.chapter].ending;
    $('#end-title-en').textContent=chapters[state.chapter].endingEn;
    $('#end-map').focus({preventScroll:true});
  }else renderLine();
}
function returnToMap(){
  clearInterval(typeTimer);typing=false;state=transition(state,{type:'MAP'});selected=state.chapter;
  renderMap();$('#start-story').focus({preventScroll:true});
}
function previousLine(){
  if(state.mode!=='reading')return;
  const previous=transition(state,{type:'PREVIOUS'});if(previous===state)return;
  state=previous;save();renderLine();finishTyping();
}
$('#start-story').onclick=()=>startChapter(selected);
$('#skip-travel').onclick=()=>{if(map)map.finishTravel();else arrive()};
$('#reset-view').onclick=()=>map?.reset();
$('#next-line').onclick=nextLine;
$('#previous-line').onclick=previousLine;
// Keep prose selectable: a double-click must never turn the page on its first click.
// Finish the typewriter before the browser begins a selection gesture.
$('#dialogue').onpointerdown=()=>{if(typing)finishTyping()};
$('#back-map').onclick=returnToMap;$('#end-map').onclick=returnToMap;
$('#history-open').onclick=()=>{
  const content=$('#history-content');content.replaceChildren();
  chapters[state.chapter].lines.slice(0,state.line+1).forEach(line=>{
    const section=document.createElement('section'),name=document.createElement('small'),text=document.createElement('p'),english=document.createElement('p');
    name.textContent=`${line.speakerEn} · ${line.speaker}`;text.textContent=line.text;text.lang='zh-CN';text.className='translation';
    english.textContent=line.en;english.lang='en';
    section.append(name,english,text);content.append(section);
  });
  showDialog($('#history-dialog'));content.scrollTop=content.scrollHeight;
};
$('#about-open').onclick=()=>showDialog($('#about-dialog'));
$('#places-open').onclick=()=>showDialog($('#places-dialog'));
$('#reset-progress').onclick=()=>{$('#about-dialog').close();showDialog($('#reset-dialog'))};
$('#confirm-reset').onclick=()=>{$('#reset-dialog').close();state=transition(state,{type:'RESET'});selected=0;renderMap();notify('A new beginning. / 新的夜晚，从这里开始。');$('#start-story').focus()};
document.addEventListener('keydown',e=>{
  if(e.repeat||document.querySelector('dialog[open]'))return;
  if((e.code==='Space'||e.code==='ArrowRight'||e.code==='ArrowLeft')&&state.mode==='reading'){
    if(e.target.closest('button,a,input,select,textarea'))return;
    e.preventDefault();if(e.code==='ArrowLeft')previousLine();else nextLine();
  }
});
const music=new Soundtrack();
const musicButtons=[$('#sound'),$('#reader-sound')];
function updateMusicControls(){
  musicButtons.forEach((button,index)=>{button.setAttribute('aria-pressed',String(music.playing));button.setAttribute('aria-label',`${music.playing?'Pause':'Play'} ${index?'reading music':'music'}`)});
  $('#sound-label').textContent=music.playing?'Sound on':'Sound off';
  $('#reader-sound').textContent=music.playing?'Ⅱ':'♫';
}
async function toggleMusic(){
  musicButtons.forEach(button=>button.disabled=true);
  try{
    if(music.playing)await music.stop();else{await music.start();notify(music.volume===0?'Music is on at zero volume. Adjust it in the reader.':'Music is on. / 音乐已开启。')}
  }catch{notify('Music could not start. Please try again. / 音乐未能启动，请重试。')}
  finally{updateMusicControls();musicButtons.forEach(button=>button.disabled=false);}
}
musicButtons.forEach(button=>button.onclick=toggleMusic);
$('#music-volume').oninput=e=>music.setVolume(Number(e.target.value)/100);
window.addEventListener('pagehide',()=>music.dispose().catch(()=>{}));
document.addEventListener('visibilitychange',()=>{map?.pause(document.hidden||state.mode==='reading'||state.mode==='end')});
renderMap();
if(saved?.editionUpdated)notify('Expanded story: your unlocked chapters are kept. / 故事已扩写，已解锁章节已保留。');
