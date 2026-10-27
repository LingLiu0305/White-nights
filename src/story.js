import { chapters } from './content.js';
import {validPlayer,WALK_START} from './walking.js';
export const SAVE_KEY = 'white-nights-progress-v1';
export const TEXT_REVISION = 2;
const integerIn=(v,min,max)=>Number.isInteger(v)&&v>=min&&v<=max;
export function createState(saved) {
  const completed=integerIn(saved?.completed,-1,chapters.length-1)?saved.completed:-1;
  const chapter=integerIn(saved?.chapter,0,Math.min(completed+1,chapters.length-1))?saved.chapter:0;
  const line=integerIn(saved?.line,0,chapters[chapter].lines.length-1)?saved.line:0;
  const cursors=chapters.map((c,index)=>{
    if(index>completed+1)return 0;
    const cursor=saved?.cursors?.[index];
    return integerIn(cursor,0,c.lines.length-1)?cursor:index===chapter?line:0;
  });
  const cursorIds=chapters.map((c,i)=>c.lines[cursors[i]].id);
  if(Array.isArray(saved?.cursorIds))saved.cursorIds.forEach((id,i)=>{if(i<chapters.length&&i<=completed+1){const found=chapters[i].lines.findIndex(l=>l.id===id);if(found>=0){cursors[i]=found;cursorIds[i]=id;}}});
  const introSeen=typeof saved?.introSeen==='boolean'?saved.introSeen:!!saved;
  const mapPlayer=validPlayer(saved?.mapPlayer)?{...saved.mapPlayer}:{x:WALK_START[0],z:WALK_START[1],facing:0};
  return {introSeen,introVersion:1,mapPlayer,cursorIds,chapter,line:cursors[chapter],cursors,completed,mode:'map',textRevision:TEXT_REVISION};
}
export function transition(state,event) {
  switch(event.type) {
    case 'INTRO': return state.mode==='map'?{...state,mode:'intro'}:state;
    case 'INTRO_DONE': return {...state,introSeen:true,mode:'map'};
    case 'PLAYER': return validPlayer(event.player)?{...state,mapPlayer:{...event.player}}:state;
    case 'START': {
      const chapter=event.chapter;
      if(state.mode!=='map'||!integerIn(chapter,0,Math.min(state.completed+1,chapters.length-1))) return state;
      return {...state,chapter,line:state.cursors[chapter],mode:'travel'};
    }
    case 'ARRIVE': return state.mode==='travel'?{...state,mode:'reading'}:state;
    case 'PREVIOUS':
      if(state.mode!=='reading'||state.line===0)return state;
      return {...state,line:state.line-1,cursorIds:state.cursorIds.map((id,i)=>i===state.chapter?chapters[i].lines[state.line-1].id:id),cursors:state.cursors.map((v,i)=>i===state.chapter?state.line-1:v)};
    case 'NEXT':
      if(state.mode!=='reading') return state;
      if(state.line+1<chapters[state.chapter].lines.length) return {...state,line:state.line+1,cursorIds:state.cursorIds.map((id,i)=>i===state.chapter?chapters[i].lines[state.line+1].id:id),cursors:state.cursors.map((v,i)=>i===state.chapter?state.line+1:v)};
      return {...state,mode:'end',cursorIds:state.cursorIds.map((id,i)=>i===state.chapter?chapters[i].lines[0].id:id),completed:Math.max(state.completed,state.chapter),cursors:state.cursors.map((v,i)=>i===state.chapter?0:v)};
    case 'MAP':
      if(state.mode==='end') {
        const chapter=Math.min(state.completed+1,chapters.length-1);
        return {...state,mode:'map',chapter,line:state.cursors[chapter]};
      }
      return {...state,mode:'map'};
    case 'RESET': return createState();
    default:return state;
  }
}
export function readSave(storage) {
  try {
    const saved=JSON.parse(storage.getItem(SAVE_KEY));
    // Paragraph numbers from the short edition no longer refer to the same text.
    // Preserve chapter unlocks, while introducing the revised story from its beginning.
    if(saved&&saved.textRevision!==TEXT_REVISION)return {completed:saved.completed,chapter:0,line:0,textRevision:TEXT_REVISION,editionUpdated:true};
    return saved;
  } catch {return null;}
}
export function writeSave(storage,state) {
  try {storage.setItem(SAVE_KEY,JSON.stringify({...state,cursorIds:chapters.map((c,i)=>c.lines[state.cursors?.[i]??(i===state.chapter?state.line:0)]?.id),textRevision:TEXT_REVISION}));return true;} catch {return false;}
}
