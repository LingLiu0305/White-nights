import * as THREE from 'three';

// The map avatar borrows the portrait's swept brown hair, open blue-grey coat,
// warm waistcoat and dark cravat. Its root remains the navigation transform.
export function createDreamer(gradientMap=null){
  const person=new THREE.Group(),materials=new Map();
  const c={coat:0x737f98,edge:0x919aad,vest:0xa28b78,shirt:0xf0e0c1,tie:0x596273,
    skin:0xe8c7a2,shade:0xcda989,hair:0x806b59,hairLight:0x97826a,ink:0x504a50,boot:0x4d4854,pants:0x656675};
  function part(geometry,color,parent,x=0,y=0,z=0){
    if(!materials.has(color))materials.set(color,new THREE.MeshToonMaterial({color,gradientMap}));
    const m=new THREE.Mesh(geometry,materials.get(color));m.position.set(x,y,z);parent.add(m);return m;
  }
  const sphere=new THREE.SphereGeometry(1,20,14);
  function ellipsoid(parent,color,x,y,z,sx,sy,sz){const m=part(sphere,color,parent,x,y,z);m.scale.set(sx,sy,sz);return m;}
  function patch(parent,color,points,z){
    const shape=new THREE.Shape();points.forEach(([x,y],i)=>i?shape.lineTo(x,y):shape.moveTo(x,y));shape.closePath();
    return part(new THREE.ExtrudeGeometry(shape,{depth:.009,bevelEnabled:false}),color,parent,0,0,z);
  }
  function stroke(parent,color,points,r=.003){
    const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
    return part(new THREE.TubeGeometry(curve,12,r,5,false),color,parent);
  }
  const legs=[],arms=[];
  for(const side of [-1,1]){
    const hip=new THREE.Group();hip.position.set(side*.085,.61,0);person.add(hip);legs.push(hip);
    part(new THREE.CylinderGeometry(.066,.052,.43,12),c.pants,hip,0,-.215,0);
    ellipsoid(hip,c.boot,0,-.50,.038,.069,.071,.132).name=side<0?'left-boot':'right-boot';
    part(new THREE.CylinderGeometry(.058,.064,.12,12),c.boot,hip,0,-.41,-.015);
    ellipsoid(hip,0x383843,0,-.55,.038,.070,.018,.132);
    stroke(hip,0x85818a,[[0,-.08,.063],[0,-.24,.057],[0,-.36,.05]],.003);
  }
  const torso=new THREE.Group();person.add(torso);
  const profile=[[.17,.46],[.18,.53],[.145,.76],[.18,.99],[.12,1.06]].map(([x,y])=>new THREE.Vector2(x,y));
  const coat=part(new THREE.LatheGeometry(profile,24),c.coat,torso);coat.scale.z=.65;
  // The coat opens onto a visible waistcoat rather than a row of buttons on a cylinder.
  patch(torso,c.vest,[[-.08,.56],[-.11,.90],[-.065,1.035],[.065,1.035],[.11,.90],[.08,.56],[0,.52]],.119);
  patch(torso,c.shirt,[[-.067,1.07],[.067,1.07],[.045,.93],[0,.88],[-.045,.93]],.133);
  for(const side of [-1,1]){
    const lapel=points=>points.map(([x,y])=>[side*x,y]);
    patch(torso,c.edge,lapel([[.05,1.04],[.14,1.015],[.15,.94],[.095,.92],[.13,.88],[.042,.72],[.071,.92]]),.145);
    patch(torso,c.coat,lapel([[.14,1.01],[.18,.98],[.17,.56],[.085,.47],[.07,.76],[.13,.88],[.095,.92]]),.129);
    stroke(torso,0x586277,[[side*.14,1.01,.156],[side*.15,.94,.156],[side*.095,.92,.156],[side*.13,.88,.156],[side*.042,.72,.156]],.003);
    stroke(torso,c.edge,[[side*.10,.63,.143],[side*.155,.65,.122]],.006);
    const arm=new THREE.Group();arm.position.set(side*.177,.973,0);arm.rotation.z=side*.10;torso.add(arm);arms.push(arm);
    ellipsoid(arm,c.coat,side*.018,-.105,0,.059,.145,.065);
    ellipsoid(arm,c.coat,side*.035,-.27,.012,.050,.13,.054);
    part(new THREE.CylinderGeometry(.052,.052,.035,12),c.shirt,arm,side*.035,-.378,.012);
    ellipsoid(arm,c.skin,side*.035,-.426,.020,.047,.062,.033);
    ellipsoid(arm,c.shade,side*.003,-.411,.044,.019,.032,.022).rotation.z=-side*.4;
    stroke(arm,c.edge,[[side*.071,-.10,.022],[side*.080,-.22,.025],[side*.078,-.35,.03]],.003);
  }
  for(const y of [.60,.68,.76]){
    ellipsoid(torso,0x756458,.008,y,.138,.012,.012,.006);
    ellipsoid(torso,0xcfb697,.006,y+.003,.144,.005,.005,.003);
  }
  part(new THREE.CylinderGeometry(.049,.058,.13,16),c.skin,torso,0,1.085,0);
  for(const side of [-1,1])patch(torso,c.shirt,[[side*.015,1.115],[side*.067,1.085],[side*.058,1.02],[0,1.052]],.075);
  ellipsoid(torso,c.tie,0,1.055,.148,.037,.029,.022);
  patch(torso,c.tie,[[-.026,1.04],[-.055,.93],[-.01,.85],[.043,.94],[.021,1.04]],.154);
  stroke(torso,0x7d8290,[[-.004,1.01,.157],[.007,.95,.157],[-.01,.87,.157]],.0025);
  // A tapered jaw and a restrained nose give the small face a profile.
  const head=new THREE.Group();head.position.y=1.245;torso.add(head);
  const faceGeometry=new THREE.SphereGeometry(1,24,18),positions=faceGeometry.attributes.position;
  for(let i=0;i<positions.count;i++){
    const y=positions.getY(i),jaw=y<-.15?1+(y+.15)*.25:1;
    positions.setXYZ(i,positions.getX(i)*.115*jaw,y*.149,positions.getZ(i)*.108);
  }
  faceGeometry.computeVertexNormals();part(faceGeometry,c.skin,head);
  for(const side of [-1,1]){
    ellipsoid(head,c.skin,side*.113,-.015,-.006,.024,.038,.019);
    ellipsoid(head,c.shade,side*.124,-.015,.005,.009,.023,.008);
    ellipsoid(head,0xeee4ca,side*.043,.016,.099,.024,.010,.009);
    ellipsoid(head,0x777262,side*.041,.016,.107,.008,.009,.004);
    ellipsoid(head,c.ink,side*.040,.016,.110,.0035,.006,.0025);
    stroke(head,c.hair,[[side*.023,.043,.102],[side*.043,.049,.104],[side*.067,.043,.093]],.005);
    stroke(head,c.ink,[[side*.020,.020,.107],[side*.043,.026,.110],[side*.066,.021,.098]],.002);
  }
  ellipsoid(head,c.skin,0,-.014,.107,.015,.033,.028);
  ellipsoid(head,c.shade,.010,-.038,.114,.009,.005,.008);
  stroke(head,0xad846c,[[-.024,-.070,.089],[0,-.073,.099],[.020,-.068,.092]],.0025);
  // A back mass plus overlapping swept locks leaves the forehead and eyes visible.
  ellipsoid(head,c.hair,0,.051,-.040,.123,.126,.095);
  const locks=[[-.061,.107,.010,.091,.058,.092,-.35],[.018,.133,.018,.099,.053,.085,.20],
    [.078,.093,.002,.060,.073,.071,.30],[-.084,.045,.034,.043,.067,.049,-.30]];
  for(const [x,y,z,sx,sy,sz,angle] of locks)ellipsoid(head,c.hair,x,y,z,sx,sy,sz).rotation.z=angle;
  patch(head,c.hair,[[-.10,.095],[-.04,.154],[.075,.135],[.046,.091],[-.011,.054],[-.076,.028],[-.058,.063],[-.109,.015]],.085);
  for(let i=0;i<4;i++)stroke(head,c.hairLight,[[.047-i*.014,.143,.088],[.012-i*.019,.110,.101],[-.048-i*.014,.070-i*.005,.095]],.002);
  stroke(head,c.hairLight,[[.082,.111,.063],[.108,.065,.034],[.112,.01,.004]],.002);
  function animate(now,moving,reduced){
    const stride=moving&&!reduced?Math.sin(now*.012)*.30:0;
    legs.forEach((leg,i)=>{leg.rotation.x=(i?1:-1)*stride});
    arms.forEach((arm,i)=>{arm.rotation.x=(i?-1:1)*stride*.65});
    torso.position.y=moving&&!reduced?Math.abs(Math.sin(now*.012))*.012:0;
  }
  return {person,animate};
}
