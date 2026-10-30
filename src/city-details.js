import * as THREE from 'three';

// Near-field ornament shares the map's toon materials and static batching.
// Nothing here changes the walkable footprint or the four story destinations.
export function cityDetails({mesh,box}) {
  const stone=0xe8d9c4,iron=0x555367,wood=0x987c74;
  function rod(parent,a,b,r=.018,color=iron){
    const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),delta=end.clone().sub(start);
    const m=mesh(new THREE.CylinderGeometry(r,r,delta.length(),5),color,parent);
    m.position.copy(start.add(end).multiplyScalar(.5));
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());
    return m;
  }
  function loop(parent,points,color=iron,r=.012){
    for(let i=1;i<points.length;i++)rod(parent,points[i-1],points[i],r,color);
  }
  function facade(parent,width,height,depth,step,balcony){
    for(let y=.8;y<height-.2;y+=.8){
      for(let x=-width/2+.36;x<width/2-.2;x+=step){
        // Small transoms and a central mullion give the existing dark panes depth.
        box(.018,.32,.035,stone,parent,x,y+.02,depth+.065);
        box(.19,.018,.035,stone,parent,x,y+.08,depth+.066);
        box(.32,.045,.10,stone,parent,x,y+.25,depth+.055);
      }
    }
    for(const side of [-1,1])for(let y=.35;y<height-.18;y+=.28){
      box(.17,.14,.06,stone,parent,side*(width/2-.10),y,depth+.035);
    }
    // The projecting cornice has a shadow line underneath and a lighter cap.
    box(width+.12,.06,.13,0xb6a4ad,parent,0,height-.12,depth+.04);
    box(width+.22,.055,.20,stone,parent,0,height-.04,depth+.07);
    if(balcony&&height>2.4){
      const y=1.34;
      box(.85,.085,.39,stone,parent,0,y,depth+.18);
      for(let x=-.37;x<=.38;x+=.185){
        rod(parent,[x,y+.06,depth+.36],[x,y+.43,depth+.36]);
      }
      rod(parent,[-.43,y+.43,depth+.36],[.43,y+.43,depth+.36],.023);
      for(const side of [-1,1]){
        rod(parent,[side*.43,y+.43,depth],[side*.43,y+.43,depth+.36],.023);
        rod(parent,[side*.28,y-.25,depth+.015],[side*.28,y-.03,depth+.28],.028,0xaba0ad);
      }
    }
  }
  function building(g,{w,d,h,variant,x,z,pink}){
    if(Math.abs(z)>18||Math.abs(x)>15)return;
    // Dress all visible elevations; reserve balconies for the canal-facing side.
    for(const side of [-1,1]){
      const front=new THREE.Group();front.rotation.y=side<0?Math.PI:0;g.add(front);
      // Carriage-gate elevations intentionally keep their entrance unobstructed.
      if(!(variant===1||pink))facade(front,w,h,d/2,.58,false);
      const flank=new THREE.Group();flank.rotation.y=side*Math.PI/2;g.add(flank);
      facade(flank,d,h,w/2,.6,side===-Math.sign(x)&&!pink);
    }
    // Seams follow each roof form instead of lying flat above the silhouette.
    if(variant===0||variant===1){
      const rise=pink?.42:.65;
      for(let z=-d/2;z<=d/2;z+=.36)for(const side of [-1,1]){
        rod(g,[0,h+.075+rise,z],[side*(w/2+.15),h+.075,z],.008,0x77758d);
      }
      rod(g,[0,h+.08+rise,-d/2-.15],[0,h+.08+rise,d/2+.15],.024,0xa3a0b2);
    }
    box(.33,.065,.35,0xb9a5a4,g,w*.25,h+.76,-d*.2);
    box(.18,.015,.19,0x655b6b,g,w*.25,h+.798,-d*.2);
    // Drainpipes sit flush to the facade, clear of the riverbank path.
    rod(g,[w/2-.08,.22,d/2+.11],[w/2-.08,h-.1,d/2+.11],.023,0x8d8395);
    for(let y=.5;y<h;y+=.8)box(.075,.035,.065,0xbdb1b8,g,w/2-.08,y,d/2+.11);
  }
  function bridge(g){
    for(const z of [-.705,.705]){
      for(let x=-2.85;x<2.85;x+=.38){
        const cx=x+.19,base=.95+.4*(1-(cx/3)**2);
        loop(g,[[cx-.12,base+.18,z],[cx,base+.37,z],[cx+.12,base+.18,z],[cx,base-.01,z],[cx-.12,base+.18,z]],iron,.01);
      }
      // Stone voussoirs follow the underside of the original curved arch.
      for(let t=0;t<=1.001;t+=1/16){
        const x=-2.3+4.6*t,y=.2+1.9*t*(1-t);
        rod(g,[x,y+.025,z],[x*1.09,y+.23,z],.012,0xb3a1a9);
      }
      box(.27,.33,.12,stone,g,0,.85,z,true);
      for(const x of [-2.92,2.92]){
        box(.20,.7,.24,stone,g,x,1.1,z,true);
        box(.28,.07,.31,stone,g,x,1.48,z,true);
        mesh(new THREE.SphereGeometry(.095,8,6),iron,g,x,1.60,z);
      }
    }
  }
  function lantern(parent,x,z){
    const g=new THREE.Group();g.position.set(x,0,z);parent.add(g);
    box(.19,.10,.19,iron,g,0,.12,0,true);
    mesh(new THREE.CylinderGeometry(.045,.075,1.25,8),iron,g,0,.76,0);
    for(const y of [.26,1.28])mesh(new THREE.CylinderGeometry(.085,.085,.055,8),iron,g,0,y,0);
    mesh(new THREE.CylinderGeometry(.13,.08,.29,4),0xf3d9a3,g,0,1.51,0);
    for(const x of [-.095,.095])for(const z of [-.095,.095])rod(g,[x*.6,1.36,z*.6],[x,1.66,z],.013);
    mesh(new THREE.CylinderGeometry(.17,.17,.035,4),iron,g,0,1.67,0);
    mesh(new THREE.ConeGeometry(.23,.17,4),iron,g,0,1.77,0);
    mesh(new THREE.SphereGeometry(.037,8,6),iron,g,0,1.90,0);
  }
  function bench(parent,x,z){
    for(let i=0;i<4;i++)box(.065,.045,1.05,wood,parent,x-.12+i*.08,.38,z,true);
    for(let i=0;i<3;i++)box(.045,.075,1.05,wood,parent,x-.16,.52+i*.10,z,true);
    for(const dz of [-.38,.38]){
      for(const dx of [-.12,.12])rod(parent,[x+dx,.1,z+dz],[x+dx,.38,z+dz],.025);
      rod(parent,[x-.16,.12,z+dz],[x-.16,.78,z+dz],.023);
      rod(parent,[x-.16,.58,z+dz],[x+.15,.58,z+dz],.022);
      rod(parent,[x+.15,.39,z+dz],[x+.15,.58,z+dz],.022);
    }
  }
  function boat(parent){
    const g=new THREE.Group();g.position.set(-.65,.02,4.8);g.rotation.y=-.17;parent.add(g);
    // Open hull: a rim, recessed floor and separate thwarts replace the solid oval.
    const shape=new THREE.Shape();shape.moveTo(0,-.9);shape.bezierCurveTo(.55,-.45,.44,.58,0,.95);shape.bezierCurveTo(-.44,.58,-.55,-.45,0,-.9);
    const hole=new THREE.Path();hole.moveTo(0,-.72);hole.bezierCurveTo(-.35,-.37,-.29,.44,0,.75);hole.bezierCurveTo(.29,.44,.35,-.37,0,-.72);shape.holes.push(hole);
    const hull=mesh(new THREE.ExtrudeGeometry(shape,{depth:.14,bevelEnabled:true,bevelThickness:.025,bevelSize:.025,bevelSegments:1,steps:1}),0xbfa38d,g,0,.07,0,true);hull.rotation.x=-Math.PI/2;
    const floor=shape.clone();floor.holes=[];
    const inside=mesh(new THREE.ShapeGeometry(floor),0x89766e,g,0,.075,0);inside.rotation.x=-Math.PI/2;
    for(const z of [-.35,.30])box(.57,.05,.12,0xcbb099,g,0,.22,z,true);
    rod(g,[-.48,.26,-.57],[.57,.28,.61],.024,wood);
    box(.10,.025,.28,0xc6a88a,g,.57,.28,.66,true).rotation.y=.73;
    return g;
  }
  return {building,bridge,lantern,bench,boat};
}
