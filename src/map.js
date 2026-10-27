import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { locations, chapters } from './content.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {paperTexture,drawnEdges,sky,batchArchitecture} from './scene-art.js';
import {WALK_START,WALK_PLACES,walkStep,nearbyPlace,routeOnPaving,pavingHeight,cameraDirection,validPlayer} from './walking.js';

export function createMap(container,{onSelect,onNearby,onFail,onWalk,initialPlayer}) {
  let renderer;
  try { renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'}); }
  catch { onFail(); return null; }
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.setClearColor(0x000000,0);
  container.append(renderer.domElement);
  renderer.domElement.tabIndex=0;
  renderer.domElement.setAttribute('aria-label','Petersburg story map. Use arrow keys to walk; press Enter near a place to explore. Drag to turn the view.');
  const scene=new THREE.Scene();
  scene.fog=new THREE.Fog(0xb9b6cc,20,82);scene.add(sky());
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let mobile=container.clientWidth<760,chapterIndex=0,cameraMove=null,introDone=null,interacting=false,lastInteraction=0;
  const camera=new THREE.PerspectiveCamera(mobile?61:50,1,.1,180);
  const controls=new OrbitControls(camera,renderer.domElement);
  controls.enableDamping=true;controls.enablePan=false;controls.enableZoom=true;
  controls.minPolarAngle=.8;controls.maxPolarAngle=1.42;
  controls.minAzimuthAngle=-.62;controls.maxAzimuthAngle=.62;
  controls.minDistance=12;controls.maxDistance=31;
  function pose(index=chapterIndex){
    const shifts=[0,-.7,.65,-.3,0];
    return {position:new THREE.Vector3(shifts[index]+(mobile?.4:2.1),mobile?7.4:6.7,mobile?17:14.8),target:new THREE.Vector3(0,-.4,-4+index*.3)};
  }
  const initial=pose();camera.position.copy(initial.position);controls.target.copy(initial.target);controls.update();
  function finishIntro(){if(introDone){const done=introDone;introDone=null;done()}}
  function moveCamera(destination,duration=1000,done){
    cameraMove=null;
    if(reduced){camera.position.copy(destination.position);controls.target.copy(destination.target);controls.update();done?.();return;}
    cameraMove={from:camera.position.clone(),targetFrom:controls.target.clone(),...destination,start:performance.now(),duration,done};
  }
  controls.addEventListener('start',()=>{walkKeys.clear();walking=false;interacting=true;cameraMove=null;finishIntro()});
  controls.addEventListener('end',()=>{interacting=false;lastInteraction=performance.now()});
  const ambient=new THREE.HemisphereLight(0xe9e2f6,0x756584,2.1);scene.add(ambient);
  const sunlight=new THREE.DirectionalLight(0xffdfb8,2.1);
  sunlight.position.set(-10,18,8); sunlight.castShadow=true;
  sunlight.shadow.mapSize.set(2048,2048);
  Object.assign(sunlight.shadow.camera,{left:-18,right:18,top:18,bottom:-18});
  sunlight.shadow.normalBias=.04;scene.add(sunlight);
  const tones=new THREE.DataTexture(new Uint8Array([128,184,230]),3,1,THREE.RedFormat);
  tones.minFilter=tones.magFilter=THREE.NearestFilter;tones.needsUpdate=true;
  const paper=paperTexture(),waterPaper=paperTexture(true);
  const lightTarget=sunlight.color.clone(),fogTarget=scene.fog.color.clone();
  const materials=new Map();
  const mat=color=>{if(!materials.has(color))materials.set(color,new THREE.MeshToonMaterial({color,gradientMap:tones,map:paper}));return materials.get(color)};
  const ink=new THREE.LineBasicMaterial({color:0x534961,transparent:true,opacity:.55});
  function mesh(geometry,color,parent,x=0,y=0,z=0,outline=false) {
    const m=new THREE.Mesh(geometry,mat(color));m.position.set(x,y,z);
    m.castShadow=m.receiveShadow=true;parent.add(m);
    if(outline)m.add(new THREE.LineSegments(drawnEdges(geometry),ink));
    return m;
  }
  const box=(w,h,d,color,parent,x=0,y=0,z=0,outline=false)=>mesh(new THREE.BoxGeometry(w,h,d),color,parent,x,y,z,outline);
  const world=new THREE.Group();scene.add(world);
  // Continuous banks reach past the view; there is no floating platform edge.
  for(const side of [-1,1])box(46,.2,160,0xc8bdce,world,side*25,-.24,-35);
  const water=box(3.9,.08,160,0x80b2c3,world,0,-.09,-35);
  water.material=new THREE.MeshToonMaterial({color:0x8cbdc9,gradientMap:tones,map:waterPaper});
  for(const x of [-2.2,2.2]) {
    box(.35,.45,110,0xc8bacd,world,x,0,-40,true);
    box(1.8,.13,110,0xd9c7ce,world,x+Math.sign(x)*.9,.02,-40);
    for(let z=-90;z<=15;z+=.85)box(.045,.48,.045,0x656078,world,x,.42,z);
    box(.055,.055,110,0x656078,world,x,.66,-40);
    box(.035,.035,110,0x82758d,world,x,.35,-40);
  }
  const distantWindow=new THREE.PlaneGeometry(.24,.34);
  function building(x,z,w,d,h,color,roof=0x6c8c85,location,options={}) {
    const variant=options.variant??Math.abs(Math.round(x*7+z*3))%4;
    const simple=options.simple??false;
    const g=new THREE.Group();g.position.set(x,0,z);g.userData.location=location;world.add(g);
    box(w,h,d,color,g,0,h/2,0,true);
    box(w+.16,.13,d+.16,0xe9e0cb,g,0,h,0,true);
    box(w+.1,.15,d+.1,0xcbbeb3,g,0,.18,0,true);
    if(simple){
      // Shared flat windows keep perimeter construction light. Distant facades
      // need rhythm and warm dots, not individual frames and projecting sills.
      for(let y=.85;y<h-.3;y+=1.1){
        for(let px=-w/2+.55;px<w/2-.3;px+=1.05)for(const side of [-1,1]){
          const win=mesh(distantWindow,Math.sin(px*4+y+x)>0.7?0xf4dba1:0x81899d,g,px,y,side*(d/2+.012));
          if(side<0)win.rotation.y=Math.PI;
        }
        for(let pz=-d/2+.55;pz<d/2-.3;pz+=1.05)for(const side of [-1,1]){
          const win=mesh(distantWindow,0x81899d,g,side*(w/2+.012),y,pz);win.rotation.y=side*Math.PI/2;
        }
      }
    }
    for(let level=.8;!simple&&level<h-.2;level+=.8) {
      if(!simple)box(w+.04,.055,d+.04,0xe7d7c5,g,0,level+.33,0);
      for(let px=-w/2+.36;px<w/2-.2;px+=.58) {
        for(const side of [-1,1]) {
          if(!simple&&(variant===1||options.pink)&&side===1&&Math.abs(px)<.5&&level<1.3)continue;
          if(!simple)box(.29,.43,.025,0xeadbc2,g,px,level,side*(d/2+.025));
          box(.19,.32,.028,Math.sin(x*13+z*7+px*5+level)>0.65?0xf4dba1:0x81899d,g,px,level+.02,side*(d/2+.04));
          if(!simple)box(.34,.045,.08,0xf0e3d0,g,px,level-.23,side*(d/2+.06));
        }
      }
      for(let pz=-d/2+.36;pz<d/2-.2;pz+=.6) for(const side of [-1,1]){
        if(!simple)box(.025,.42,.28,0xeadbc2,g,side*(w/2+.02),level,pz);
        box(.03,.31,.18,Math.sin(x+z+pz*9+level)>0.7?0xf4dba1:0x81899d,g,side*(w/2+.04),level+.02,pz);
      }
    }
    if(!simple&&(variant===1||options.pink)){
      // A shallow recessed carriage gate, with a separate stone arch surround.
      const opening=new THREE.Shape();opening.moveTo(-.36,0);opening.lineTo(-.36,.68);
      opening.absarc(0,.68,.36,Math.PI,0,true);opening.lineTo(.36,0);opening.closePath();
      mesh(new THREE.ShapeGeometry(opening),0x504f64,g,0,.1,d/2+.045);
      const arch=new THREE.Shape();arch.moveTo(-.47,0);arch.lineTo(-.47,.68);
      arch.absarc(0,.68,.47,Math.PI,0,true);arch.lineTo(.47,0);arch.lineTo(.36,0);
      arch.lineTo(.36,.68);arch.absarc(0,.68,.36,0,Math.PI,false);arch.lineTo(-.36,0);arch.closePath();
      mesh(new THREE.ExtrudeGeometry(arch,{depth:.08,bevelEnabled:false}),0xe9deca,g,0,.1,d/2+.06,true);
    }else box(.44,.72,.06,0x4c5e61,g,0,.45,d/2+.04,!simple);
    if(variant===2){
      // A low roof behind a parapet breaks up the repeated triangular silhouette.
      box(w+.06,.2,d+.06,roof,g,0,h+.19,0,true);
      for(const side of [-1,1])box(w+.2,.16,.13,0xe9e0cb,g,0,h+.35,side*d/2,true);
    }else if(variant===3){
      const v=[-w/2-.13,0,-d/2-.13,w/2+.13,0,-d/2-.13,w/2+.13,0,d/2+.13,-w/2-.13,0,d/2+.13,0,.55,-d*.25,0,.55,d*.25];
      const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(v,3));
      geo.setIndex([0,4,1,1,4,5,1,5,2,2,5,3,3,5,4,3,4,0]);geo.computeVertexNormals();
      // Batching expects UVs on every mesh, including custom roof geometry.
      geo.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,1,0,1,1,0,1,.5,.25,.5,.75],2));
      mesh(geo,roof,g,0,h+.06,0,true);
    }else{
      const roofShape=new THREE.Shape();roofShape.moveTo(-w/2-.15,0);roofShape.lineTo(0,options.pink?.42:.65);roofShape.lineTo(w/2+.15,0);roofShape.closePath();
      mesh(new THREE.ExtrudeGeometry(roofShape,{depth:d+.3,bevelEnabled:false}),roof,g,0,h+.06,-d/2-.15,true);
    }
    box(.24,.5,.26,0xc9a9a1,g,w*.25,h+.5,-d*.2,!simple);
    if(!simple&&(variant===1||options.pink))for(const side of [-1,1]){
      box(.12,h-.4,.1,0xeee0ca,g,side*(w/2-.16),h/2+.1,d/2+.08);
      box(.21,.13,.16,0xeee0ca,g,side*(w/2-.16),h-.2,d/2+.1);
    }
    if(options.pink){
      // The dreamer's familiar little pink house, recalled in the opening pages.
      const pediment=new THREE.Shape();pediment.moveTo(-.65,0);pediment.lineTo(0,.35);pediment.lineTo(.65,0);pediment.closePath();
      mesh(new THREE.ExtrudeGeometry(pediment,{depth:.12,bevelEnabled:false}),0xf0e2cc,g,0,h+.1,d/2+.1,true);
      for(const side of [-1,1])box(.33,.07,.16,0xe6b9ba,g,side*.65,.5,d/2+.12);
    }
    return g;
  }
  const palette=[0xe5c9b2,0xd6bcc7,0xe4d9be,0xc8bdd0,0xd5c6d8];
  let bi=0;
  for(const side of [-1,1]) for(const z of [-6.4,-2.8,4.4,7]) {
    const x=side*5.1;
    const pink=side<0&&z===-2.8;
    building(x,z,2.4,1.7,pink?1.9:2.2+(bi%3)*.45,pink?0xe6b5bc:palette[bi%5],pink?0x827e9b:0x858ca5,
      side<0&&z===4.4?'home':side>0&&z===-2.8?'house':undefined,pink?{pink:true,variant:0}:{});bi++;
  }
  for(const side of [-1,1]) for(const z of [-6,-2,2.2,6]) {
    building(side*9,z,2.4,2.4,2.3+(bi%3)*.55,palette[bi%5],bi%2?0x8c97ad:0x8d819f);bi++;
  }
  // More streets continue beyond the first facades. Varying roof lines close
  // the bare side gaps without covering the embankment or its four entrances.
  for(const side of [-1,1])for(const z of [-10.2,-5.6,-.9,3.9,8.8,13.3]){
    const offset=(Math.abs(z)*7%3)*.32;
    building(side*(12.7+offset),z,3.3,3.15,3.1+(bi%4)*.43,palette[bi%5],bi%2?0x858aa4:0x8d829e);bi++;
  }
  for(const side of [-1,1])for(const z of [10.2,14.5]){
    building(side*9.1,z,2.9,2.65,3.7+(bi%3)*.45,palette[bi%5],bi%2?0x8996a5:0x89829d);bi++;
  }
  // Staggered receding facades give the canal a skyline and atmospheric depth.
  for(const side of [-1,1])for(const z of [-11,-16,-22,-29,-37,-46]){
    building(side*5.5,z,3.1,3.5,3.2+(bi%4)*.65,palette[bi%5],bi%2?0x8a87a5:0x8295aa);bi++;
    building(side*10,z-1,3.3,3.8,4+(bi%3),palette[bi%5],0x85839f);bi++;
  }
  for(const side of [-1,1])building(side*6.5,11,3.7,3.2,4.4,palette[side+2],0x858aa2);
  // Perimeter blocks extend beyond the rotated views. Paired rows form
  // continuous blocks; gaps between blocks read as cross streets.
  for(const side of [-1,1])for(const x of [18,25,32,39])for(const z of [-48,-38,-28,-18,-8,2,12,22]){
    const index=Math.abs(x+z),height=2.5+(index%5)*.36;
    building(side*x,z,5.4,3.6,height,palette[index%5],index%2?0x8d829e:0x8993a5,undefined,{simple:true,variant:index%4});
    building(side*x,z+3.6,5.4,3.4,height+.25,palette[(index+2)%5],0x89839e,undefined,{simple:true,variant:(index+1)%4});
  }
  // Connect the canal district to the outer grid; intersections remain open.
  for(const side of [-1,1]){
    for(const x of [15.6,21.5,28.5,35.5])box(1.15,.035,83,0xb3acbf,world,side*x,-.115,-14);
    for(const z of [-12.8,-2.8,7.2,17.2]){
      box(33,.035,1.15,0xb3acbf,world,side*25,-.112,z);
      for(const dz of [-.68,.68])box(33,.045,.09,0xd9cbd1,world,side*25,-.08,z+dz);
    }
  }
  // Block joints make the existing continuous stone quay read at close range.
  for(const x of [-2.2,2.2])for(let z=-22;z<13;z+=1.2){
    box(.36,.018,.025,0x9a91a9,world,x,.23,z);
    box(.025,.27,.025,0x9a91a9,world,x-Math.sign(x)*.18,.08,z);
  }
  // Small pavilion gives the skyline one distinctive vertical landmark.
  const pavilion=building(7,-6.5,2.1,1.8,3.4,0xe0d3bc,0x6f8986,'house',{variant:0});
  mesh(new THREE.CylinderGeometry(.62,.72,.6,12),0xe1d4bb,pavilion,0,4.4,0,true);
  mesh(new THREE.SphereGeometry(.74,16,8,0,Math.PI*2,0,Math.PI/2),0x74948d,pavilion,0,4.7,0,true);
  mesh(new THREE.ConeGeometry(.13,1,8),0x827c68,pavilion,0,5.85,0);

  function bridge(z) {
    const g=new THREE.Group();g.position.z=z;g.userData.location=z<0?'bridge':'canal';world.add(g);
    const s=new THREE.Shape();s.moveTo(-3,.2);s.lineTo(-3,.9);s.quadraticCurveTo(0,1.7,3,.9);s.lineTo(3,.2);s.lineTo(2.3,.2);s.quadraticCurveTo(0,1.15,-2.3,.2);s.closePath();
    mesh(new THREE.ExtrudeGeometry(s,{depth:1.3,bevelEnabled:false}),0xe5d9c5,g,0,0,-.65,true);
    for(const zz of [-.68,.68])for(let x=-2.9;x<3;x+=.38){
      const y=.95+.4*(1-(x/3)**2);
      box(.045,.55,.045,0x575b64,g,x,y+.18,zz);
    }
    for(const zz of [-.68,.68]) {
      const points=[];for(let x=-3;x<=3.01;x+=.1)points.push(new THREE.Vector3(x,1.4+.4*(1-(x/3)**2),zz));
      g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color:0x575b64})));
    }
  }
  bridge(1.3);bridge(-5.5);
  function tree(x,z,size=1) {
    box(.13,1.3*size,.13,0x8a786b,world,x,.65*size,z);
    mesh(new THREE.IcosahedronGeometry(.72*size,1),0x8a9f85,world,x,1.65*size,z,true);
    mesh(new THREE.IcosahedronGeometry(.53*size,0),0xa7b098,world,x+.24,2.15*size,z);
  }
  [[-7,1],[-7,-1],[-7,-4],[-10.6,7.3],[7,1],[7,3],[7,5],[10.6,-7.3],[-10.5,-7],[-4,7.7],[4,7.7]].forEach(([x,z],i)=>tree(x,z,.75+(i%3)*.15));
  for(const x of [-3.3,3.3])for(const z of [-7,-3,3,7]) {
    box(.07,1.4,.07,0x62656a,world,x,.75,z);
    mesh(new THREE.SphereGeometry(.16,8,6),0xffdda2,world,x,1.5,z);
    mesh(new THREE.ConeGeometry(.23,.18,4),0x5e6968,world,x,1.72,z);
  }
  for(const z of [-.8,4.1]) {
    box(.5,.08,1.1,0x9a7f6b,world,3.1,.35,z,true);
    box(.07,.4,1.1,0x9a7f6b,world,3.3,.52,z,true);
    for(const zz of [-.35,.35])box(.38,.3,.06,0x65666b,world,3.1,.17,z+zz);
  }
  const boat=mesh(new THREE.SphereGeometry(.45,12,6),0xc9ab8c,world,-.65,.02,4.8,true);boat.scale.set(.7,.25,2);
  // Location hit targets are intentionally generous, while labels remain keyboard-operable.
  const pins=[];
  for(const loc of locations) {
    const ring=mesh(new THREE.RingGeometry(.24,.32,32),0x776457,world,loc.position[0],.13,loc.position[2]);ring.rotation.x=-Math.PI/2;
    const target=new THREE.Mesh(new THREE.CylinderGeometry(.7,.7,1,12),new THREE.MeshBasicMaterial({visible:false}));
    target.position.set(loc.position[0],.5,loc.position[2]);target.userData.location=loc.id;world.add(target);
    const label=document.createElement('button');label.className='map-label';label.setAttribute('aria-label',loc.en);
    label.innerHTML=`<span class="pin-dot" aria-hidden="true"></span><span class="pin-name">${loc.en.charAt(0)+loc.en.slice(1).toLowerCase()}</span>`;label.addEventListener('click',e=>{if(e.pointerType==='touch'&&selectedPlace!==loc.id){selectedPlace=loc.id;updateHighlight();return;}selectedPlace=loc.id;onSelect(loc.id)});
    label.addEventListener('mouseenter',()=>{hoverPlace=loc.id;updateHighlight()});label.addEventListener('mouseleave',()=>{hoverPlace=null;updateHighlight()});
    label.addEventListener('focus',()=>{hoverPlace=loc.id;updateHighlight()});label.addEventListener('blur',()=>{hoverPlace=null;updateHighlight()});container.append(label);
    pins.push({id:loc.id,label,point:new THREE.Vector3(loc.position[0],1.65,loc.position[2])});
  }
  // A small, clothed dreamer replaces the abstract pawn. Draw it in a separate
  // depth layer: buildings cannot hide the wayfinding figure, but its own limbs
  // and clothing still occlude correctly.
  const markerScene=new THREE.Scene(),marker=new THREE.Group();markerScene.add(marker);
  markerScene.add(new THREE.HemisphereLight(0xffeed5,0x79728f,2.4));
  const markerLight=new THREE.DirectionalLight(0xffe4bd,2);markerLight.position.set(-3,6,5);markerScene.add(markerLight);
  const halo=new THREE.Mesh(new THREE.RingGeometry(.32,.35,48),new THREE.MeshBasicMaterial({color:0xe5bc78,side:THREE.DoubleSide,transparent:true,opacity:.8}));
  halo.rotation.x=-Math.PI/2;halo.position.y=.035;marker.add(halo);
  const person=new THREE.Group();person.rotation.y=.32;marker.add(person);
  // Boots, trouser legs, a flared wool coat and contrasting lapels.
  for(const side of [-1,1]){
    box(.115,.10,.22,0x514859,person,side*.10,.085,.045,true);
    mesh(new THREE.CylinderGeometry(.065,.055,.30,8),0x655f76,person,side*.10,.25,0,true);
  }
  const coatProfile=[[.22,.33],[.20,.43],[.16,.65],[.21,.83],[.14,.91]].map(([x,y])=>new THREE.Vector2(x,y));
  mesh(new THREE.LatheGeometry(coatProfile,14),0x67718c,person,0,0,0,true);
  box(.025,.47,.025,0x41495e,person,0,.58,.185);
  for(const side of [-1,1]){
    const sleeve=mesh(new THREE.CapsuleGeometry(.065,.30,4,8),0x67718c,person,side*.235,.66,0,true);sleeve.rotation.z=side*.15;
    mesh(new THREE.SphereGeometry(.063,10,8),0xdfb794,person,side*.26,.44,.02);
    const lapel=box(.075,.20,.035,0xa9a5b4,person,side*.07,.79,.165,true);lapel.rotation.z=side*-.26;
  }
  for(const y of [.49,.60,.71])mesh(new THREE.SphereGeometry(.018,6,6),0xdfc395,person,.045,y,.19);
  mesh(new THREE.CylinderGeometry(.055,.065,.09,10),0xdfb794,person,0,.94,0);
  const head=mesh(new THREE.SphereGeometry(.145,16,12),0xe3bfa0,person,0,1.08,0,true);head.scale.set(.86,1.1,.9);
  mesh(new THREE.SphereGeometry(.15,16,10,0,Math.PI*2,0,Math.PI*.54),0x625262,person,0,1.105,-.012,true);
  const fringe=mesh(new THREE.SphereGeometry(.08,10,8),0x625262,person,-.068,1.17,.055);fringe.scale.set(1,.65,.7);
  for(const side of [-1,1]){
    mesh(new THREE.SphereGeometry(.025,8,6),0xdfb794,person,side*.126,1.065,0);
    mesh(new THREE.SphereGeometry(.011,6,6),0x514958,person,side*.047,1.09,.119);
  }
  mesh(new THREE.SphereGeometry(.022,8,6),0xd6a889,person,0,1.055,.133);
  box(.07,.035,.075,0xebe0cd,person,0,.915,.06);
  let routeLine,journey=null,paused=false,selectedPlace=null,hoverPlace=null,nearbyId=null;
  let walkPosition=validPlayer(initialPlayer)?[initialPlayer.x,initialPlayer.z]:[...WALK_START],walking=false,lastFrame=performance.now(),lastWalkSave=0;
  const reportWalk=()=>onWalk?.({x:walkPosition[0],z:walkPosition[1],facing:person.rotation.y});
  const cameraForward=new THREE.Vector3(),followPoint=new THREE.Vector3();
  const walkKeys=new Set();
  batchArchitecture(world,mergeGeometries);
  const interactive=[];
  world.traverse(object=>{if(object.userData.location&&object.isGroup){interactive.push(object);object.traverse(child=>{if(child.material)child.material=child.material.clone()})}});
  function highlight(id){
    for(const pin of pins)pin.label.classList.toggle('is-highlighted',pin.id===id);
    for(const group of interactive)group.traverse(child=>{
      if(child.material?.emissive){child.material.emissive.set(group.userData.location===id?0x635449:0);child.material.emissiveIntensity=.2;}
      if(child.isLineSegments)child.material.opacity=group.userData.location===id?.9:.55;
    });
  }
  function updateHighlight(){highlight(selectedPlace||nearbyId||hoverPlace)}
  function updateNearby(){
    const id=nearbyPlace(walkPosition,1.25,nearbyId);
    if(id!==nearbyId){nearbyId=id;onNearby?.(id)}
    updateHighlight();
  }
  function placeMarker(x,z){marker.position.set(x,pavingHeight(x,z),z)}
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();let down;
  function hitPlace(event){
    const rect=renderer.domElement.getBoundingClientRect();pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);
    raycaster.setFromCamera(pointer,camera);
    for(const hit of raycaster.intersectObjects(world.children,true)){
      let obj=hit.object;while(obj&&obj!==world){if(obj.userData.location)return obj.userData.location;obj=obj.parent;}
      // An opaque facade must block picking a location behind it.
      if(hit.object.isMesh&&hit.object.material.visible)return null;
    }
    return null;
  }
  renderer.domElement.addEventListener('pointerdown',e=>{down=[e.clientX,e.clientY];renderer.domElement.focus({preventScroll:true})});
  renderer.domElement.addEventListener('pointermove',e=>{if(!interacting&&!journey&&e.pointerType!=='touch'){hoverPlace=hitPlace(e);updateHighlight()}});
  renderer.domElement.addEventListener('pointerleave',()=>{hoverPlace=null;updateHighlight()});
  renderer.domElement.addEventListener('pointerup',e=>{
    if(journey||!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>6)return;
    const id=hitPlace(e);if(!id)return;
    if(e.pointerType==='touch'&&selectedPlace!==id){selectedPlace=id;updateHighlight();return;}
    selectedPlace=id;onSelect(id);
  });
  function resize(){
    const {width,height}=container.getBoundingClientRect();if(!width||!height)return;
    const wasMobile=mobile;mobile=width<760;camera.aspect=width/height;camera.fov=mobile?61:50;
    camera.updateProjectionMatrix();renderer.setSize(width,height);
    if(wasMobile!==mobile){cameraMove=null;const p=pose();camera.position.copy(p.position);controls.target.copy(p.target);finishIntro();}
  }
  new ResizeObserver(resize).observe(container);resize();
  function finishTravel(){if(!journey)return;const j=journey;journey=null;marker.position.copy(j.points.at(-1));walkPosition=[marker.position.x,marker.position.z];controls.enabled=true;reportWalk();j.onArrive();}
  function setChapter(index){
    chapterIndex=index;person.rotation.y=.32;finishIntro();moveCamera(pose(),1300);
    placeMarker(...walkPosition);updateNearby();
    fogTarget.set(index===2?0xb0aec8:index===4?0xc6c2cf:0xb9b6cc);
    lightTarget.set(index===2?0xd8ceee:index===4?0xffecd2:0xffdfb8);
    if(reduced){scene.fog.color.copy(fogTarget);sunlight.color.copy(lightTarget);}
    if(routeLine){scene.remove(routeLine);routeLine.geometry.dispose();routeLine.material.dispose();routeLine=null;}
  }
  function travel(_route,onArrive){
    if(journey)return;finishIntro();walkKeys.clear();walking=false;selectedPlace=null;hoverPlace=null;nearbyId=null;onNearby?.(null);highlight(null);moveCamera(pose(),2800);
    const destination=WALK_PLACES[chapters[chapterIndex].place];
    const points=routeOnPaving(walkPosition,destination).map(([x,z])=>new THREE.Vector3(x,pavingHeight(x,z),z));
    const distances=[0];for(let i=1;i<points.length;i++)distances.push(distances[i-1]+points[i].distanceTo(points[i-1]));
    if(routeLine){scene.remove(routeLine);routeLine.geometry.dispose();routeLine.material.dispose();}
    routeLine=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineDashedMaterial({color:0xc39761,dashSize:.25,gapSize:.16,transparent:true,opacity:.85}));routeLine.computeLineDistances();scene.add(routeLine);
    journey={points,distances,onArrive,start:performance.now(),duration:nearbyPlace(walkPosition)===chapters[chapterIndex].place?350:Math.min(8000,Math.max(500,distances.at(-1)/3.5*1000))};controls.enabled=false;
    marker.position.copy(points[0]);if(reduced)queueMicrotask(finishTravel);
  }
  const particlePositions=[];
  for(let i=0;i<38;i++)particlePositions.push(Math.sin(i*17)*11,1+(i%9)*.62,-22+(i*13%36));
  const particleGeometry=new THREE.BufferGeometry();particleGeometry.setAttribute('position',new THREE.Float32BufferAttribute(particlePositions,3));
  const particles=new THREE.Points(particleGeometry,new THREE.PointsMaterial({color:0xffe5b5,size:.035,transparent:true,opacity:.5,depthWrite:false}));scene.add(particles);
  const projected=new THREE.Vector3();
  function frame(now){
    requestAnimationFrame(frame);
    const dt=Math.min((now-lastFrame)/1000,.05);lastFrame=now;
    if(paused)return;
    if(!journey&&!interacting&&walkKeys.size){
      const dx=Number(walkKeys.has('ArrowRight'))-Number(walkKeys.has('ArrowLeft'));
      const dz=Number(walkKeys.has('ArrowDown'))-Number(walkKeys.has('ArrowUp'));
      camera.getWorldDirection(cameraForward);
      const direction=cameraDirection([dx,dz],[cameraForward.x,cameraForward.z]);
      const next=walkStep(walkPosition,direction,dt*2.65);
      walking=Math.hypot(next[0]-walkPosition[0],next[1]-walkPosition[1])>.001;
      if(walking){
        person.rotation.y=Math.atan2(next[0]-walkPosition[0],next[1]-walkPosition[1]);
        walkPosition=next;placeMarker(...walkPosition);updateNearby();
        followPoint.copy(marker.position).project(camera);
        if(Math.abs(followPoint.x)>.5||followPoint.y<-.3||followPoint.y>.5){
          const gain=reduced?1:Math.min(1,dt*3);
          const shift=new THREE.Vector3((walkPosition[0]-controls.target.x)*gain,0,(walkPosition[1]-controls.target.z)*gain);
          camera.position.add(shift);controls.target.add(shift);
        }
        if(now-lastWalkSave>2000){reportWalk();lastWalkSave=now;}
      }
    }else walking=false;
    if(journey){
      const j=journey,t=Math.min((now-j.start)/j.duration,1),distance=t*j.distances.at(-1);
      let seg=1;while(seg<j.distances.length-1&&distance>j.distances[seg])seg++;
      const fraction=(distance-j.distances[seg-1])/(j.distances[seg]-j.distances[seg-1]||1);
      marker.position.lerpVectors(j.points[seg-1],j.points[seg],fraction);
      marker.position.y=pavingHeight(marker.position.x,marker.position.z);
      const direction=new THREE.Vector3().subVectors(j.points[seg],j.points[seg-1]);person.rotation.y=Math.atan2(direction.x,direction.z);
      if(t>=1)finishTravel();
    }
    if(cameraMove){
      const m=cameraMove,t=Math.min((now-m.start)/m.duration,1),ease=t*t*(3-2*t);
      camera.position.lerpVectors(m.from,m.position,ease);controls.target.lerpVectors(m.targetFrom,m.target,ease);
      if(t===1){cameraMove=null;m.done?.();}
    }else if(!reduced&&!interacting&&!journey&&now-lastInteraction>3000){
      camera.position.x+=Math.sin(now*.00017)*.00025;camera.position.y+=Math.cos(now*.00023)*.00012;
    }
    person.position.y=walking&&!reduced?Math.sin(now*.017)*.025:0;
    if(!reduced){halo.scale.setScalar(1+Math.sin(now*.0012)*.07);waterPaper.offset.y=now*.000003;particles.position.y=Math.sin(now*.00013)*.2;particles.position.x=Math.sin(now*.00009)*.2;}

    scene.fog.color.lerp(fogTarget,.035);sunlight.color.lerp(lightTarget,.035);
    // Lift oblique views enough to retain the bridges and walkable riverbank.
    // Straight-on views may still sit low among the facades.
    const sideView=Math.min(1,Math.abs(controls.getAzimuthalAngle())/.62)**2;
    controls.maxPolarAngle=1.42-.52*sideView;
    controls.minDistance=12+14*sideView;
    controls.update();
    for(const {label,point} of pins){projected.copy(point).project(camera);label.style.left=`${(projected.x*.5+.5)*100}%`;label.style.top=`${(-projected.y*.5+.5)*100}%`;label.hidden=projected.z>1||projected.z< -1||Math.abs(projected.x)>.94||Math.abs(projected.y)>.8;}
    renderer.render(scene,camera);
    renderer.clearDepth();renderer.autoClear=false;renderer.render(markerScene,camera);renderer.autoClear=true;
  }
  requestAnimationFrame(frame);setChapter(0);
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();paused=true;cameraMove=null;finishIntro();finishTravel();onFail();});
  return {travel,finishTravel,setChapter,
    setWalkKey(code,pressed){if(pressed){if(paused||journey||interacting)return;cameraMove=null;finishIntro();hoverPlace=null;selectedPlace=null;updateHighlight();walkKeys.add(code)}else {walkKeys.delete(code);if(!walkKeys.size)reportWalk()}},
    clearWalkKeys(){walkKeys.clear();walking=false;reportWalk()},
    exploreNearby(){if(!paused&&!journey&&nearbyId){selectedPlace=nearbyId;onSelect(nearbyId);return true}return false},
    resetStory(){walkKeys.clear();walkPosition=[...WALK_START];chapterIndex=0;selectedPlace=null;hoverPlace=null;placeMarker(...walkPosition);updateNearby();reportWalk()},
    introduce(done){
      introDone=done;
      if(reduced){cameraMove=null;const p=pose();camera.position.copy(p.position);controls.target.copy(p.target);finishIntro();return;}
      camera.position.set(4,13,24);controls.target.set(0,1,-5);controls.update();moveCamera(pose(),3000,finishIntro);
    },
    focusPlace(id,done){
      finishIntro();selectedPlace=id;updateHighlight();
      const loc=locations.find(l=>l.id===id);if(!loc){done?.();return;}
      const [x,,z]=loc.position;
      moveCamera({position:new THREE.Vector3(x*.2,mobile?6.8:5.5,z+16),target:new THREE.Vector3(x*.65,1,z-2)},950,done);
    },
    reset(){finishIntro();selectedPlace=null;hoverPlace=null;updateHighlight();const p=pose();const shift=new THREE.Vector3(walkPosition[0],0,walkPosition[1]+2);p.position.add(shift);p.target.add(shift);moveCamera(p,1000)},pause(value){paused=value;if(value){walkKeys.clear();reportWalk();}controls.enabled=!value&&!journey}};
}
