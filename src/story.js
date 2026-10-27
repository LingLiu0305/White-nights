import {chapters,locations} from './content.js';
import {validPlayer,WALK_START} from './walking.js';
import {interactions,interactionById,unlockedMemories} from './interactions.js';
export const SAVE_KEY='white-nights-progress-v1';
export const TEXT_REVISION=2;
const integerIn=(v,min,max)=>Number.isInteger(v)&&v>=min&&v<=max;
const indexOf=(chapter,id)=>chapters[chapter].lines.findIndex(line=>line.id===id);
const phaseFor=e=>e.phase||'observe';
const allowedPhase=(e,p)=>e.kind==='letter'?['envelope','paper'].includes(p):e.kind==='turn'?['observe','looked'].includes(p):p===phaseFor(e);
function updateActive(state,updates){
 const active={...state.activeInteraction,...updates};
 return {...state,activeInteraction:active,interactions:{...state.interactions,[active.id]:{...state.interactions[active.id],phase:active.phase,scrollRatio:active.scrollRatio}}};
}
function resumeRecord(e,record,replay=false){return {id:e.id,phase:!replay&&allowedPhase(e,record?.phase)?record.phase:phaseFor(e),scrollRatio:!replay&&Number.isFinite(record?.scrollRatio)?Math.max(0,Math.min(1,record.scrollRatio)):0,replay};}
function moveTo(state,line){return {...state,line,cursors:state.cursors.map((v,i)=>i===state.chapter?line:v),cursorIds:state.cursorIds.map((v,i)=>i===state.chapter?chapters[i].lines[line].id:v),readThrough:state.readThrough.map((v,i)=>i===state.chapter?Math.max(v,line):v)};}
function exposeLetter(state){
 const active=state.activeInteraction,e=interactionById(active?.id);
 if(e?.kind!=='letter'||active.phase!=='paper')return state;
 const through=Math.max(...e.paragraphs.map(id=>indexOf(state.chapter,id)));
 return {...state,readThrough:state.readThrough.map((n,i)=>i===state.chapter?Math.max(n,through):n)};
}
export function createState(saved){
 const completed=integerIn(saved?.completed,-1,chapters.length-1)?saved.completed:-1;
 const chapter=integerIn(saved?.chapter,0,Math.min(completed+1,chapters.length-1))?saved.chapter:0;
 const line=integerIn(saved?.line,0,chapters[chapter].lines.length-1)?saved.line:0;
 const cursors=chapters.map((c,i)=>{
  if(i>completed+1)return 0;
  const idIndex=indexOf(i,saved?.cursorIds?.[i]);
  return idIndex>=0?idIndex:integerIn(saved?.cursors?.[i],0,c.lines.length-1)?saved.cursors[i]:i===chapter?line:0;
 });
 const readThrough=chapters.map((c,i)=>i>completed+1?-1:integerIn(saved?.readThrough?.[i],-1,c.lines.length-1)?Math.max(saved.readThrough[i],cursors[i]):i<=completed?c.lines.length-1:cursors[i]);
 const records={};
 for(const e of interactions){
  const ci=chapters.findIndex(c=>c.id===e.chapterId);if(ci>completed+1)continue;
  const record=saved?.interactions?.[e.id];
  if(record&&['active','completed','skipped'].includes(record.status))records[e.id]={status:record.status,phase:allowedPhase(e,record.phase)?record.phase:phaseFor(e),scrollRatio:Number.isFinite(record.scrollRatio)?Math.max(0,Math.min(1,record.scrollRatio)):0,seen:Array.isArray(record.seen)?[...new Set(record.seen.filter(id=>e.objects?.some(o=>o.id===id)))]:[]};
  else if(saved&&!saved.interactionSchemaVersion&&(ci<=completed||indexOf(ci,e.anchor)<cursors[ci]))records[e.id]={status:'skipped',seen:[]};
 }
 let activeInteraction=null;
 const a=saved?.activeInteraction,e=interactionById(a?.id);
 if(e&&e.chapterId===chapters[chapter].id&&e.anchor===chapters[chapter].lines[cursors[chapter]].id&&allowedPhase(e,a.phase)){
  activeInteraction={id:e.id,phase:a.phase,scrollRatio:Number.isFinite(a.scrollRatio)?Math.max(0,Math.min(1,a.scrollRatio)):0,replay:!!a.replay};
  records[e.id]??={status:'active',seen:[]};
 }
 const keptLines={},placeMemorySeen={};
 for(let i=0;i<=completed;i++){const id=saved?.keptLines?.[chapters[i].id];if(indexOf(i,id)>=0)keptLines[chapters[i].id]=id;}
 for(const place of locations){const version=saved?.placeMemorySeen?.[place.id];if(integerIn(version,-1,completed))placeMemorySeen[place.id]=version;}
 return {chapter,line:cursors[chapter],cursors,cursorIds:chapters.map((c,i)=>c.lines[cursors[i]].id),completed,mode:'map',textRevision:TEXT_REVISION,
  introSeen:typeof saved?.introSeen==='boolean'?saved.introSeen:!!saved,introVersion:1,
  mapPlayer:validPlayer(saved?.mapPlayer)?{x:saved.mapPlayer.x,z:saved.mapPlayer.z,facing:saved.mapPlayer.facing}:{x:WALK_START[0],z:WALK_START[1],facing:0},
  interactionSchemaVersion:1,interactions:records,activeInteraction,readThrough,placeMemorySeen,keptLines};
}
export function transition(state,event){
 switch(event.type){
  case 'INTRO': return state.mode==='map'?{...state,mode:'intro'}:state;
  case 'INTRO_DONE': return {...state,introSeen:true,mode:'map'};
  case 'PLAYER': return validPlayer(event.player)?{...state,mapPlayer:{...event.player}}:state;
  case 'START':{
   const chapter=event.chapter;if(state.mode!=='map'||!integerIn(chapter,0,Math.min(state.completed+1,chapters.length-1)))return state;
   const active=interactionById(state.activeInteraction?.id);
   const interrupted=interactions.find(e=>e.chapterId===chapters[chapter].id&&e.anchor===chapters[chapter].lines[state.cursors[chapter]].id&&state.interactions[e.id]?.status==='active');
   return {...state,chapter,line:state.cursors[chapter],mode:'travel',activeInteraction:active?.chapterId===chapters[chapter].id?state.activeInteraction:interrupted?resumeRecord(interrupted,state.interactions[interrupted.id]):null};
  }
  case 'ARRIVE':return state.mode==='travel'?{...state,mode:'reading'}:state;
  case 'PREVIOUS':return state.mode==='reading'&&state.line>0?moveTo({...state,activeInteraction:null},state.line-1):state;
  case 'NEXT':{
   if(state.mode!=='reading')return state;
   if(state.line+1<chapters[state.chapter].lines.length)return moveTo({...state,activeInteraction:null},state.line+1);
   return {...state,mode:'end',completed:Math.max(state.completed,state.chapter),activeInteraction:null,
    readThrough:state.readThrough.map((v,i)=>i===state.chapter?chapters[i].lines.length-1:v),
    cursors:state.cursors.map((v,i)=>i===state.chapter?0:v),cursorIds:state.cursorIds.map((v,i)=>i===state.chapter?chapters[i].lines[0].id:v)};
  }
  case 'INTERACTION_OPEN':{
   const e=interactionById(event.id);if(state.mode!=='reading'||!e||e.chapterId!==chapters[state.chapter].id||e.anchor!==chapters[state.chapter].lines[state.line].id)return state;
   const old=state.interactions[e.id],replay=!!event.replay||(state.activeInteraction?.id===e.id&&state.activeInteraction.replay);if(['completed','skipped'].includes(old?.status)&&!replay)return state;
   const active=state.activeInteraction?.id===e.id?state.activeInteraction:resumeRecord(e,old,!!replay);
   return exposeLetter({...state,mode:'interaction',activeInteraction:active,interactions:{...state.interactions,[e.id]:{...old,status:active.replay?old.status:'active',phase:active.phase,scrollRatio:active.scrollRatio,seen:old?.seen||[]}}});
  }
  case 'INTERACTION_PHASE':{
   const e=interactionById(state.activeInteraction?.id);if(state.mode!=='interaction'||e?.kind!=='letter'||event.phase!=='paper')return state;
   return exposeLetter(updateActive(state,{phase:'paper'}));
  }
  case 'INTERACTION_LOOK':return state.mode==='interaction'&&interactionById(state.activeInteraction?.id)?.kind==='turn'?updateActive(state,{phase:'looked'}):state;
  case 'INTERACTION_SCROLL':return state.mode==='interaction'&&Number.isFinite(event.ratio)?updateActive(state,{scrollRatio:Math.max(0,Math.min(1,event.ratio))}):state;
  case 'INTERACTION_OBJECT':{
   const id=state.activeInteraction?.id,e=interactionById(id);if(state.mode!=='interaction'||!e?.objects?.some(o=>o.id===event.object))return state;
   const old=state.interactions[id];return {...state,interactions:{...state.interactions,[id]:{...old,seen:[...new Set([...old.seen,event.object])]}}};
  }
  case 'INTERACTION_SUSPEND':return state.mode==='interaction'?{...state,mode:'reading'}:state;
  case 'INTERACTION_FINISH':{
   const a=state.activeInteraction,e=interactionById(event.id);
   if(state.mode!=='interaction'||!e||a?.id!==event.id)return state;
   if(a.replay)return {...state,mode:'reading',activeInteraction:null};
   let next={...state,mode:'reading',activeInteraction:null,interactions:{...state.interactions,[e.id]:{...state.interactions[e.id],status:event.skip||event.dialogue?'skipped':'completed'}}};
   if(event.dialogue&&e.kind==='letter'){
    next.interactions['morning-letter-return']={status:'skipped',seen:[]};
    return moveTo(next,state.line+1);
   }
   return moveTo(next,indexOf(state.chapter,e.resume));
  }
  case 'PLACE_READ':{
   const latest=unlockedMemories(event.id,state.completed).at(-1);if(!latest)return state;
   return {...state,placeMemorySeen:{...state.placeMemorySeen,[event.id]:latest.after}};
  }
  case 'KEEP_LINE':{
   const ci=chapters.findIndex(c=>c.id===event.chapterId);if(ci<0||ci>state.completed||indexOf(ci,event.lineId)<0)return state;
   return {...state,keptLines:{...state.keptLines,[event.chapterId]:event.lineId}};
  }
  case 'MAP':{
   if(state.mode==='end'){const chapter=Math.min(state.completed+1,chapters.length-1);return {...state,mode:'map',chapter,line:state.cursors[chapter]};}
   return {...state,mode:'map'};
  }
  case 'RESET':return createState();
  default:return state;
 }
}
export function readSave(storage){
 try{
  const saved=JSON.parse(storage.getItem(SAVE_KEY));
  if(saved&&saved.textRevision!==TEXT_REVISION)return {completed:saved.completed,chapter:0,line:0,textRevision:TEXT_REVISION,editionUpdated:true};
  return saved;
 }catch{return null;}
}
export function writeSave(storage,state){try{storage.setItem(SAVE_KEY,JSON.stringify({...state,textRevision:TEXT_REVISION}));return true;}catch{return false;}}
