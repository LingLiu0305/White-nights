import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { locations, chapters } from './content.js';

export function createMap(container,{onSelect,onFail}) {
  let renderer;
  try { renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'}); }
  catch { onFail(); return null; }
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.setClearColor(0x000000,0);
  container.append(renderer.domElement);
  renderer.domElement.setAttribute('aria-label','可旋转的彼得堡故事地图；也可使用下方地点按钮');
  const scene=new THREE.Scene();
  const camera=new THREE.OrthographicCamera(-15,15,12,-12,.1,150);
  camera.position.set(24,27,29);
  const controls=new OrbitControls(camera,renderer.domElement);
  controls.enableDamping=true; controls.enablePan=false;
  controls.minPolarAngle=.45; controls.maxPolarAngle=1.15;
  controls.minZoom=.8; controls.maxZoom=1.6;
  controls.target.set(0,0,0);
  controls.update(); controls.saveState();
  const ambient=new THREE.HemisphereLight(0xfff6e8,0x79728f,2.3);scene.add(ambient);
  const sunlight=new THREE.DirectionalLight(0xffe9c5,2.5);
  sunlight.position.set(-12,25,12); sunlight.castShadow=true;
  sunlight.shadow.mapSize.set(2048,2048);
  Object.assign(sunlight.shadow.camera,{left:-18,right:18,top:18,bottom:-18});
  sunlight.shadow.normalBias=.04;scene.add(sunlight);
  const tones=new THREE.DataTexture(new Uint8Array([100,165,230]),3,1,THREE.RedFormat);
  tones.minFilter=tones.magFilter=THREE.NearestFilter;tones.needsUpdate=true;
  const materials=new Map();
  const mat=color=>{if(!materials.has(color))materials.set(color,new THREE.MeshToonMaterial({color,gradientMap:tones}));return materials.get(color)};
  const ink=new THREE.LineBasicMaterial({color:0x514c63,transparent:true,opacity:.48});
  function mesh(geometry,color,parent,x=0,y=0,z=0,outline=false) {
    const m=new THREE.Mesh(geometry,mat(color));m.position.set(x,y,z);
    m.castShadow=m.receiveShadow=true;parent.add(m);
    if(outline)m.add(new THREE.LineSegments(new THREE.EdgesGeometry(geometry,25),ink));
    return m;
  }
  const box=(w,h,d,color,parent,x=0,y=0,z=0,outline=false)=>mesh(new THREE.BoxGeometry(w,h,d),color,parent,x,y,z,outline);
  const world=new THREE.Group();scene.add(world);
  box(23,.8,17,0xb5a6ad,world,0,-.65,0,true);
  box(23,.12,17,0xd9d3b8,world,0,-.18,0);
  box(3.9,.08,17.1,0x8dafb4,world,0,-.09,0);
  // Continuous promenades and stone retaining walls frame the canal.
  for(const x of [-2.2,2.2]) {
    box(.35,.45,17,0xe6dcca,world,x,0,0,true);
    box(1.8,.13,17,0xe9dfca,world,x+Math.sign(x)*.9,.02,0);
    for(let z=-8;z<=8;z+=.8) {
      box(.055,.48,.055,0x676777,world,x,.42,z);
    }
    box(.07,.07,17,0x676777,world,x,.66,0);
    box(.04,.04,17,0x777684,world,x,.35,0);
  }
  // Subtle drawn ripple marks instead of reflective photorealistic water.
  for(let i=0;i<55;i++) {
    const x=-1.6+((i*37)%100)/100*3.2,z=-8+((i*29)%100)/100*16;
    box(.18+(i%4)*.13,.008,.025,i%3?0xb8cccc:0xe8dcca,world,x,-.035,z);
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
          box(.19,.32,.028,level>1.5?0x687d86:0xb3b8b1,g,px,level+.02,side*(d/2+.04));
          box(.34,.045,.08,0xf0e3d0,g,px,level-.23,side*(d/2+.06));
        }
      }
      for(let pz=-d/2+.36;pz<d/2-.2;pz+=.6) for(const side of [-1,1]){
        box(.025,.42,.28,0xeadbc2,g,side*(w/2+.02),level,pz);
        box(.03,.31,.18,0x72848b,g,side*(w/2+.04),level+.02,pz);
      }
    }
    box(.44,.72,.06,0x4c5e61,g,0,.45,d/2+.04,true);
    const roofShape=new THREE.Shape();roofShape.moveTo(-w/2-.15,0);roofShape.lineTo(0,.75);roofShape.lineTo(w/2+.15,0);roofShape.closePath();
    const geo=new THREE.ExtrudeGeometry(roofShape,{depth:d+.3,bevelEnabled:false});
    mesh(geo,roof,g,0,h+.06,-d/2-.15,true);
    box(.24,.6,.26,0xc9a9a1,g,w*.25,h+.6,-d*.2,true);
    return g;
  }
  const palette=[0xe5c9b2,0xd6bcc7,0xe4d9be,0xc8cbb7,0xd5c6d8];
  let bi=0;
  for(const side of [-1,1]) for(const z of [-6.4,-2.8,4.4,7]) {
    const x=side*5.1;
    building(x,z,2.4,1.7,2.2+(bi%3)*.45,palette[bi%5],0x78918e,
      side<0&&z===4.4?'home':side>0&&z===-2.8?'house':undefined);bi++;
  }
  for(const side of [-1,1]) for(const z of [-6,-2,2.2,6]) {
    building(side*9,z,2.4,2.4,2.3+(bi%3)*.55,palette[bi%5],bi%2?0x839c91:0x78758b);bi++;
  }
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
    const label=document.createElement('button');label.className='map-label';label.setAttribute('aria-label',`地图上的${loc.name}`);
    label.innerHTML=`<span>${loc.number}</span>${loc.name}`;label.addEventListener('click',()=>onSelect(loc.id));container.append(label);
    pins.push({label,point:new THREE.Vector3(loc.position[0],1.1,loc.position[2])});
  }
  const marker=new THREE.Group();scene.add(marker);
  const halo=new THREE.Mesh(new THREE.RingGeometry(.35,.45,36),new THREE.MeshBasicMaterial({color:0xce9254,side:THREE.DoubleSide}));
  halo.rotation.x=-Math.PI/2;halo.position.y=.17;marker.add(halo);
  mesh(new THREE.SphereGeometry(.25,16,12),0xc68d45,marker,0,.62,0,true);
  mesh(new THREE.ConeGeometry(.14,.3,12),0xc68d45,marker,0,.33,0);
  // Wayfinding symbols remain visible when a building is between them and the camera.
  marker.traverse(object=>{if(object.material){object.material=object.material.clone();object.material.depthTest=false;object.material.depthWrite=false;object.renderOrder=10}});
  let routeLine,journey=null,paused=false;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();let down;
  renderer.domElement.addEventListener('pointerdown',e=>{down=[e.clientX,e.clientY]});
  renderer.domElement.addEventListener('pointerup',e=>{
    if(journey||!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>6)return;
    const rect=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);
    raycaster.setFromCamera(pointer,camera);
    for(const hit of raycaster.intersectObjects(world.children,true)){
      let obj=hit.object;while(obj&&obj!==world){if(obj.userData.location){onSelect(obj.userData.location);return;}obj=obj.parent;}
    }
  });
  function resize(){
    const {width,height}=container.getBoundingClientRect();if(!width||!height)return;
    const aspect=width/height,half=aspect<1?17/aspect:14;
    camera.left=-half*aspect;camera.right=half*aspect;camera.top=half;camera.bottom=-half;
    camera.updateProjectionMatrix();renderer.setSize(width,height);
  }
  new ResizeObserver(resize).observe(container);resize();
  function finishTravel(){if(!journey)return;const j=journey;journey=null;marker.position.copy(j.points.at(-1));controls.enabled=true;j.onArrive();}
  function setChapter(index){
    const start=chapters[index].route[0];marker.position.set(start[0],0,start[1]);
    sunlight.color.set(index===2?0xe2dcfa:index===4?0xfff0dc:0xffe9c5);
    if(routeLine){scene.remove(routeLine);routeLine.geometry.dispose();routeLine.material.dispose();routeLine=null;}
  }
  function travel(route,onArrive){
    if(journey)return;const points=route.map(([x,z])=>new THREE.Vector3(x,.17,z));
    const distances=[0];for(let i=1;i<points.length;i++)distances.push(distances[i-1]+points[i].distanceTo(points[i-1]));
    if(routeLine){scene.remove(routeLine);routeLine.geometry.dispose();routeLine.material.dispose();}
    routeLine=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineDashedMaterial({color:0xc39761,dashSize:.25,gapSize:.16,transparent:true,opacity:.85}));routeLine.computeLineDistances();scene.add(routeLine);
    journey={points,distances,onArrive,start:performance.now(),duration:4400};controls.enabled=false;
    marker.position.copy(points[0]);if(reduced)queueMicrotask(finishTravel);
  }
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
    if(!reduced)halo.scale.setScalar(1+Math.sin(now*.002)*.12);
    controls.update();
    for(const {label,point} of pins){projected.copy(point).project(camera);label.style.left=`${(projected.x*.5+.5)*100}%`;label.style.top=`calc(${(-projected.y*.5+.5)*100}% - 27px)`;}
    renderer.render(scene,camera);
  }
  requestAnimationFrame(frame);setChapter(0);
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();paused=true;finishTravel();onFail();});
  return {travel,finishTravel,setChapter,reset(){controls.reset()},pause(value){paused=value;controls.enabled=!value&&!journey}};
}
