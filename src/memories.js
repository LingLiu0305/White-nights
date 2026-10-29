// A memory may be opened only after its corresponding paragraph has been read.
export const memories=[
 {id:'grandmother',chapterId:'night-2',anchor:'night-2-p019',title:'The house with three windows',image:'memory-grandmother-room.png',objects:[
  {id:'windows',name:'The three windows',x:.48,y:.32,text:'Three windows look out from the house where Nastenka grew up with her grandmother.'},
  {id:'chair',name:'Grandmother’s chair',x:.18,y:.66,text:'Much of Nastenka’s life has been spent in this quiet room, close to her grandmother.'}]},
 {id:'upstairs',chapterId:'night-2',anchor:'night-2-p027',title:'At the upstairs door',image:'memory-upstairs-door.png',objects:[
  {id:'bundle',name:'The little bundle',x:.53,y:.72,text:'She packed her clothes into a small bundle before going to his room.'},
  {id:'door',name:'The closed door',x:.68,y:.43,text:'At the door she faced a future she could not yet name.'}]}
];
export const memoryById=id=>memories.find(m=>m.id===id);
export const memoryAt=(chapterId,lineId)=>memories.find(m=>m.chapterId===chapterId&&m.anchor===lineId);
