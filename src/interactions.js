// Stable paragraph anchors keep events attached to their story beats.
export const interactions = [
 {id:'n2-listen',addedVersion:2,chapterId:'night-2',anchor:'night-2-p018',resume:'night-2-p019',kind:'choice',title:'A story she is ready to share',hint:'Choose how to listen. The story and its ending remain the same.',image:'canal-night.png',choices:[
  {id:'quiet',label:'Listen quietly',response:'I let the silence settle between us. She gathers her thoughts, and begins at the beginning.'},
  {id:'ask',label:'Ask about her childhood',response:'“Where should your story begin?” I ask. “With my grandmother,” she says, and her voice softens.'}]},
 {id:'n2-take-letter',chapterId:'night-2',anchor:'night-2-p039',resume:'night-2-p040',kind:'accept',title:'A letter already written',hint:'She holds it out to you.',image:'canal-night.png'},
 {id:'n4-footsteps',chapterId:'night-4',anchor:'night-4-p029',resume:'night-4-p030',kind:'turn',title:'Footsteps',hint:'Someone is approaching.',image:'canal-night.png'},
 {id:'n1-observe-city',chapterId:'night-1',anchor:'night-1-p001',resume:'night-1-p002',kind:'observe',title:'A city of familiar strangers',hint:'Take a moment to look around.',image:'summer-street.png',objects:[
  {id:'window',name:'The open window',x:.22,y:.33,text:'Someone has opened a window to the evening air. A small, ordinary gesture—and a life continuing beyond my reach.'},
  {id:'house',name:'The familiar house',x:.46,y:.4,text:'I notice the shutters before I notice the people. Buildings have become easier companions; they never ask why I walk alone.'},
  {id:'cart',name:'The moving cart',x:.74,y:.65,text:'A chair travels down the street with its legs in the air. Even the furniture seems to have somewhere else to go.'}
 ]},
 {id:'n3-wait-by-canal',chapterId:'night-3',anchor:'night-3-p009',resume:'night-3-p010',kind:'observe',title:'Before the appointed hour',hint:'Yesterday evening · Where does your attention wander?',image:'canal-night.png',objects:[
  {id:'bridge',name:'The bridge',x:.36,y:.56,text:'Every figure on the bridge is a possibility, until it comes close enough to become a stranger.'},
  {id:'water',name:'The water',x:.48,y:.66,text:'The water carries the last light beneath the bridge. It seems able to go on without an answer.'},
  {id:'street',name:'The distant street',x:.78,y:.37,text:'Her eyes keep returning to the street. I follow her gaze, although we are hoping for different things.'}
 ]},
 {id:'morning-read-letter',chapterId:'morning',anchor:'morning-p002',resume:'morning-p005',kind:'letter',title:'A letter from Nastenka',image:'rainy-room-window.png',phase:'envelope',paragraphs:['morning-p003','morning-p004']},
 {id:'morning-letter-return',chapterId:'morning',anchor:'morning-p005',resume:'morning-p007',kind:'letter',title:'The rest of her letter',image:'rainy-room-window.png',phase:'paper',paragraphs:['morning-p006']}
];
export const interactionById=id=>interactions.find(event=>event.id===id);
export const interactionAt=(chapterId,lineId)=>interactions.find(event=>event.chapterId===chapterId&&event.anchor===lineId);
export function pendingInteraction(state,chapterId,lineId){
 const event=interactionAt(chapterId,lineId);
 return event&&!['completed','skipped'].includes(state.interactions?.[event.id]?.status)?event:null;
}
export const placeMemories={
 home:[
  {after:0,text:'The room has not changed, but tomorrow has. There is someone to meet beyond these walls.'},
  {after:1,text:'For once, being alone does not mean being unnecessary. Her sealed letter has given the evening a purpose.'},
  {after:2,text:'Rain returns me to the window. I think again of what she said, and of what I could not say.'},
  {after:4,text:'A letter rests in the familiar room. The brief happiness was real, even though the room is mine alone again.'}
 ],
 canal:[
  {after:0,text:'This is where tomorrow first became a promise: the same railing, the same hour.'},
  {after:1,text:'Her story changed the riverbank. I had come to be heard; I stayed to listen.'},
  {after:2,text:'Two people can wait beside the same water and look toward different futures.'},
  {after:3,text:'Here, the tomorrow we imagined gave way to someone else’s return.'},
  {after:4,text:'The water keeps moving. I can remember the meeting without asking it to last forever.'}
 ],
 house:[{after:1,text:'Behind these windows was a sheltered life: a grandmother, borrowed books, and the hope of a return.'}],
 bridge:[{after:0,text:'A familiar walk has become a walk I can share.'},{after:3,text:'For a little while, walking together made our imagined tomorrow feel close enough to touch.'}]
};
export const unlockedMemories=(id,completed)=>(placeMemories[id]||[]).filter(memory=>memory.after<=completed);

// Two excerpts from the existing chapter; no new outcome or completion score.
export const keepsakeCandidates={
 "night-1":["night-1-p035","night-1-p037"],
 "night-2":["night-2-p013","night-2-p041"],
 "night-3":["night-3-p020","night-3-p023"],
 "night-4":["night-4-p028","night-4-p036"],
 morning:["morning-p013","morning-p015"]
};
