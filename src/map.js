import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { locations, chapters } from './content.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {paperTexture,drawnEdges,sky,batchArchitecture} from './scene-art.js';

export function createMap(container,{onSelect,onFail}) {
  let renderer;
  try { renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'}); }
  catch { onFail(); return null; }
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.setClearColor(0x000000,0);
  container.append(renderer.domElement);
  renderer.domElement.setAttribute('aria-label','Rotatable Petersburg story map. Places also has keyboard-accessible location buttons.');
  const scene=new THREE.Scene();
  scene.fog=new THREE.Fog(0xb9b6cc,15,60);scene.add(sky());
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let mobile=container.clientWidth<760,chapterIndex=0,cameraMove=null,introDone=null,interacting=false,lastInteraction=0;
  const camera=new THREE.PerspectiveCamera(mobile?61:50,1,.1,180);
  const controls=new OrbitControls(camera,renderer.domElement);
  controls.enableDamping=true;controls.enablePan=false;controls.enableZoom=true;
  controls.minPolarAngle=.94;controls.maxPolarAngle=1.42;
  controls.minAzimuthAngle=-.4;controls.maxAzimuthAngle=.4;
  controls.minDistance=12;controls.maxDistance=31;
  function pose(index=chapterIndex){
    const shifts=[0,-.7,.65,-.3,0];
    return {position:new THREE.Vector3(shifts[index]+(mobile?.4:2.1),mobile?7.4:6.7,mobile?17:14.8),target:new THREE.Vector3(0,-.4,-7+index*.3)};
  }
  const initial=pose();camera.position.copy(initial.position);controls.target.copy(initial.target);controls.update();
  function finishIntro(){if(introDone){const done=introDone;introDone=null;done()}}
  function moveCamera(destination,duration=1000,done){
    cameraMove=null;
    if(reduced){camera.position.copy(destination.position);controls.target.copy(destination.target);controls.update();done?.();return;}
    cameraMove={from:camera.position.clone(),targetFrom:controls.target.clone(),...destination,start:performance.now(),duration,done};
  }
  controls.addEventListener('start',()=>{interacting=true;cameraMove=null;finishIntro()});
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
  function building(x,z,w,d,h,color,roof=0x6c8c85,location) {
    const g=new THREE.Group();g.position.set(x,0,z);g.userData.location=location;world.add(g);
    box(w,h,d,color,g,0,h/2,0,true);
    box(w+.16,.13,d+.16,0xe9e0cb,g,0,h,0,true);
    box(w+.1,.15,d+.1,0xcbbeb3,g,0,.18,0,true);
    for(let level=.8;level<h-.2;level+=.8) {
      box(w+.04,.055,d+.04,0xe7d7c5,g,0,level+.33,0);
      for(let px=-w/2+.36;px<w/2-.2;px+=.58) {
        for(const side of [-1,1]) {
          box(.29,.43,.025,0xeadbc2,g,px,level,side*(d/2+.025));
          box(.19,.32,.028,Math.sin(x*13+z*7+px*5+level)>0.65?0xf4dba1:0x81899d,g,px,level+.02,side*(d/2+.04));
          box(.34,.045,.08,0xf0e3d0,g,px,level-.23,side*(d/2+.06));
        }
      }
      for(let pz=-d/2+.36;pz<d/2-.2;pz+=.6) for(const side of [-1,1]){
        box(.025,.42,.28,0xeadbc2,g,side*(w/2+.02),level,pz);
        box(.03,.31,.18,Math.sin(x+z+pz*9+level)>0.7?0xf4dba1:0x81899d,g,side*(w/2+.04),level+.02,pz);
      }
    }
    box(.44,.72,.06,0x4c5e61,g,0,.45,d/2+.04,true);
    const roofShape=new THREE.Shape();roofShape.moveTo(-w/2-.15,0);roofShape.lineTo(0,.75);roofShape.lineTo(w/2+.15,0);roofShape.closePath();
    const geo=new THREE.ExtrudeGeometry(roofShape,{depth:d+.3,bevelEnabled:false});
    mesh(geo,roof,g,0,h+.06,-d/2-.15,true);
    box(.24,.6,.26,0xc9a9a1,g,w*.25,h+.6,-d*.2,true);
    return g;
  }
  const palette=[0xe5c9b2,0xd6bcc7,0xe4d9be,0xc8bdd0,0xd5c6d8];
  let bi=0;
  for(const side of [-1,1]) for(const z of [-6.4,-2.8,4.4,7]) {
    const x=side*5.1;
    building(x,z,2.4,1.7,2.2+(bi%3)*.45,palette[bi%5],0x858ca5,
      side<0&&z===4.4?'home':side>0&&z===-2.8?'house':undefined);bi++;
  }
  for(const side of [-1,1]) for(const z of [-6,-2,2.2,6]) {
    building(side*9,z,2.4,2.4,2.3+(bi%3)*.55,palette[bi%5],bi%2?0x8c97ad:0x8d819f);bi++;
  }
  // Staggered receding facades give the canal a skyline and atmospheric depth.
  for(const side of [-1,1])for(const z of [-11,-16,-22,-29,-37,-46]){
    building(side*5.5,z,3.1,3.5,3.2+(bi%4)*.65,palette[bi%5],bi%2?0x8a87a5:0x8295aa);bi++;
    building(side*10,z-1,3.3,3.8,4+(bi%3),palette[bi%5],0x85839f);bi++;
  }
  for(const side of [-1,1])building(side*6.5,11,3.7,3.2,4.4,palette[side+2],0x858aa2);
  // Small pavilion gives the skyline one distinctive vertical landmark.
  const pavilion=building(7,-6.5,2.1,1.8,3.4,0xe0d3bc,0x6f8986,'house');
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
    label.innerHTML=`<span class="pin-dot" aria-hidden="true"></span><span class="pin-name">${loc.en.charAt(0)+loc.en.slice(1).toLowerCase()}</span>`;label.addEventListener('click',e=>{if(e.pointerType==='touch'&&selectedPlace!==loc.id){selectedPlace=loc.id;highlight(loc.id);return;}selectedPlace=loc.id;onSelect(loc.id)});
    label.addEventListener('mouseenter',()=>highlight(loc.id));label.addEventListener('mouseleave',()=>highlight(selectedPlace));
    label.addEventListener('focus',()=>highlight(loc.id));label.addEventListener('blur',()=>highlight(selectedPlace));container.append(label);
    pins.push({id:loc.id,label,point:new THREE.Vector3(loc.position[0],1.1,loc.position[2])});
  }
  const marker=new THREE.Group();scene.add(marker);
  const halo=new THREE.Mesh(new THREE.RingGeometry(.35,.45,36),new THREE.MeshBasicMaterial({color:0xce9254,side:THREE.DoubleSide}));
  halo.rotation.x=-Math.PI/2;halo.position.y=.17;marker.add(halo);
  mesh(new THREE.SphereGeometry(.25,16,12),0xc68d45,marker,0,.62,0,true);
  mesh(new THREE.ConeGeometry(.14,.3,12),0xc68d45,marker,0,.33,0);
  // Wayfinding symbols remain visible when a building is between them and the camera.
  marker.traverse(object=>{if(object.material){object.material=object.material.clone();object.material.depthTest=false;object.material.depthWrite=false;object.renderOrder=10}});
  let routeLine,journey=null,paused=false,selectedPlace=null;
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
  renderer.domElement.addEventListener('pointerdown',e=>{down=[e.clientX,e.clientY]});
  renderer.domElement.addEventListener('pointermove',e=>{if(!interacting&&!journey&&e.pointerType!=='touch')highlight(hitPlace(e)||selectedPlace)});
  renderer.domElement.addEventListener('pointerleave',()=>highlight(selectedPlace));
  renderer.domElement.addEventListener('pointerup',e=>{
    if(journey||!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>6)return;
    const id=hitPlace(e);if(!id)return;
    if(e.pointerType==='touch'&&selectedPlace!==id){selectedPlace=id;highlight(id);return;}
    selectedPlace=id;onSelect(id);
  });
  function resize(){
    const {width,height}=container.getBoundingClientRect();if(!width||!height)return;
    const wasMobile=mobile;mobile=width<760;camera.aspect=width/height;camera.fov=mobile?61:50;
    camera.updateProjectionMatrix();renderer.setSize(width,height);
    if(wasMobile!==mobile){cameraMove=null;const p=pose();camera.position.copy(p.position);controls.target.copy(p.target);finishIntro();}
  }
  new ResizeObserver(resize).observe(container);resize();
  function finishTravel(){if(!journey)return;const j=journey;journey=null;marker.position.copy(j.points.at(-1));controls.enabled=true;j.onArrive();}
  function setChapter(index){
    chapterIndex=index;finishIntro();moveCamera(pose(),1300);
    const start=chapters[index].route[0];marker.position.set(start[0],0,start[1]);
    fogTarget.set(index===2?0xb0aec8:index===4?0xc6c2cf:0xb9b6cc);
    lightTarget.set(index===2?0xd8ceee:index===4?0xffecd2:0xffdfb8);
    if(reduced){scene.fog.color.copy(fogTarget);sunlight.color.copy(lightTarget);}
    if(routeLine){scene.remove(routeLine);routeLine.geometry.dispose();routeLine.material.dispose();routeLine=null;}
  }
  function travel(route,onArrive){
    if(journey)return;finishIntro();selectedPlace=null;highlight(null);moveCamera(pose(),2800);const points=route.map(([x,z])=>new THREE.Vector3(x,.17,z));
    const distances=[0];for(let i=1;i<points.length;i++)distances.push(distances[i-1]+points[i].distanceTo(points[i-1]));
    if(routeLine){scene.remove(routeLine);routeLine.geometry.dispose();routeLine.material.dispose();}
    routeLine=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineDashedMaterial({color:0xc39761,dashSize:.25,gapSize:.16,transparent:true,opacity:.85}));routeLine.computeLineDistances();scene.add(routeLine);
    journey={points,distances,onArrive,start:performance.now(),duration:4400};controls.enabled=false;
    marker.position.copy(points[0]);if(reduced)queueMicrotask(finishTravel);
  }
  const particlePositions=[];
  for(let i=0;i<38;i++)particlePositions.push(Math.sin(i*17)*11,1+(i%9)*.62,-22+(i*13%36));
  const particleGeometry=new THREE.BufferGeometry();particleGeometry.setAttribute('position',new THREE.Float32BufferAttribute(particlePositions,3));
  const particles=new THREE.Points(particleGeometry,new THREE.PointsMaterial({color:0xffe5b5,size:.035,transparent:true,opacity:.5,depthWrite:false}));scene.add(particles);
  const projected=new THREE.Vector3();
  function frame(now){
    requestAnimationFrame(frame);if(paused)return;
    if(journey){
      const j=journey,t=Math.min((now-j.start)/j.duration,1),distance=t*j.distances.at(-1);
      let seg=1;while(seg<j.distances.length-1&&distance>j.distances[seg])seg++;
      const fraction=(distance-j.distances[seg-1])/(j.distances[seg]-j.distances[seg-1]||1);
      marker.position.lerpVectors(j.points[seg-1],j.points[seg],fraction);
      if(t>=1)finishTravel();
    }
    if(cameraMove){
      const m=cameraMove,t=Math.min((now-m.start)/m.duration,1),ease=t*t*(3-2*t);
      camera.position.lerpVectors(m.from,m.position,ease);controls.target.lerpVectors(m.targetFrom,m.target,ease);
      if(t===1){cameraMove=null;m.done?.();}
    }else if(!reduced&&!interacting&&!journey&&now-lastInteraction>3000){
      camera.position.x+=Math.sin(now*.00017)*.00025;camera.position.y+=Math.cos(now*.00023)*.00012;
    }
    if(!reduced){halo.scale.setScalar(1+Math.sin(now*.0012)*.07);waterPaper.offset.y=now*.000003;particles.position.y=Math.sin(now*.00013)*.2;particles.position.x=Math.sin(now*.00009)*.2;}

    scene.fog.color.lerp(fogTarget,.035);sunlight.color.lerp(lightTarget,.035);
    controls.update();
    for(const {label,point} of pins){projected.copy(point).project(camera);label.style.left=`${(projected.x*.5+.5)*100}%`;label.style.top=`${(-projected.y*.5+.5)*100}%`;label.hidden=projected.z>1||projected.z< -1||Math.abs(projected.x)>.94||Math.abs(projected.y)>.8;}
    renderer.render(scene,camera);
  }
  requestAnimationFrame(frame);setChapter(0);
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();paused=true;cameraMove=null;finishIntro();finishTravel();onFail();});
  return {travel,finishTravel,setChapter,
    introduce(done){
      introDone=done;
      if(reduced){cameraMove=null;const p=pose();camera.position.copy(p.position);controls.target.copy(p.target);finishIntro();return;}
      camera.position.set(4,13,24);controls.target.set(0,1,-5);controls.update();moveCamera(pose(),4200,finishIntro);
    },
    focusPlace(id,done){
      finishIntro();selectedPlace=id;highlight(id);
      const loc=locations.find(l=>l.id===id);if(!loc){done?.();return;}
      const [x,,z]=loc.position;
      moveCamera({position:new THREE.Vector3(x*.2,mobile?6.8:5.5,z+16),target:new THREE.Vector3(x*.65,1,z-2)},950,done);
    },
    reset(){finishIntro();selectedPlace=null;highlight(null);moveCamera(pose(),1000)},pause(value){paused=value;controls.enabled=!value&&!journey}};
}
