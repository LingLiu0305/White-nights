import * as THREE from 'three';

// Fixed seeds keep the paper and drawn contours stable between frames.
export function paperTexture(water=false){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=512;
  const ctx=canvas.getContext('2d');let seed=47;
  const random=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646};
  ctx.fillStyle='#f6f2ef';ctx.fillRect(0,0,512,512);
  for(let i=0;i<14000;i++){
    const value=160+Math.floor(random()*80);
    ctx.fillStyle=`rgba(${value},${value},${value},${.025+random()*.09})`;
    ctx.fillRect(random()*512,random()*512,random()*2+.4,random()*3+.5);
  }
  for(let i=0;i<240;i++){
    const x=random()*512,y=random()*512;
    ctx.strokeStyle=water?'rgba(255,255,255,.4)':'rgba(133,117,144,.095)';
    ctx.lineWidth=water?1.5:random()*11+1;ctx.beginPath();ctx.moveTo(x,y);
    ctx.quadraticCurveTo(x+12,y-2,x+random()*45+10,y+2);ctx.stroke();
  }
  const texture=new THREE.CanvasTexture(canvas);
  texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
  texture.colorSpace=THREE.SRGBColorSpace;
  if(water)texture.repeat.set(1,18);
  return texture;
}

// A repeating stone pattern adds scale to the promenade without thousands of
// individual paving meshes. Top-face box UVs run across width / along length.
export function pavingTexture(){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=256;
  const ctx=canvas.getContext('2d');
  ctx.fillStyle='#b9afbc';ctx.fillRect(0,0,256,256);
  for(let row=0;row<8;row++)for(let col=-1;col<4;col++){
    const x=col*86+(row%2)*43,y=row*32;
    const tone=218+Math.round(Math.sin(row*17+col*11)*7);
    ctx.fillStyle=`rgb(${tone},${tone-5},${tone+1})`;ctx.fillRect(x+1,y+1,84,30);
    ctx.fillStyle='rgba(255,249,235,.22)';ctx.fillRect(x+2,y+2,82,1);
  }
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(1,55);
  return texture;
}

export function drawnEdges(geometry){
  const edges=new THREE.EdgesGeometry(geometry,25),a=edges.attributes.position,points=[];
  const from=new THREE.Vector3(),to=new THREE.Vector3(),previous=new THREE.Vector3(),next=new THREE.Vector3();
  for(let i=0;i<a.count;i+=2){
    from.fromBufferAttribute(a,i);to.fromBufferAttribute(a,i+1);previous.copy(from);
    const steps=Math.max(2,Math.min(18,Math.ceil(from.distanceTo(to)*5)));
    for(let j=1;j<=steps;j++){
      next.lerpVectors(from,to,j/steps);
      if(j<steps){const wobble=Math.sin(i*17+j*13)*.007;next.x+=wobble;next.y+=Math.cos(i+j*7)*.006;next.z-=wobble;}
      points.push(previous.x,previous.y,previous.z,next.x,next.y,next.z);previous.copy(next);
    }
  }
  edges.dispose();const result=new THREE.BufferGeometry();result.setAttribute('position',new THREE.Float32BufferAttribute(points,3));return result;
}

export function sky(){
  const geometry=new THREE.SphereGeometry(100,32,20),positions=geometry.attributes.position,colors=[];
  const upper=new THREE.Color('#9d9cb9'),horizon=new THREE.Color('#b9b6cc'),lower=new THREE.Color('#b4b3cc');
  for(let i=0;i<positions.count;i++){
    const y=positions.getY(i)/100;
    const c=y>0?horizon.clone().lerp(upper,Math.min(1,y*2.8)):horizon.clone().lerp(lower,Math.min(1,-y*3));
    colors.push(c.r,c.g,c.b);
  }
  geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  return new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.BackSide,depthWrite:false,fog:false}));
}

// Batch static architecture by material so extended city blocks do not add
// thousands of draw calls. Interactive groups retain their own hit identity.
export function batchArchitecture(root,mergeGeometries){
  root.updateMatrixWorld(true);
  const owners=[root,...root.children.filter(o=>o.isGroup&&o.userData.location)];
  for(const owner of owners){
    const inverse=owner.matrixWorld.clone().invert(),buckets=new Map(),remove=[];
    owner.traverse(object=>{
      if(!object.isMesh&&!object.isLineSegments)return;
      if(!object.material.visible||object.userData.location)return;
      let parent=object.parent;while(parent&&parent!==owner){if(parent.userData.location)return;parent=parent.parent;}
      const key=`${object.type}:${object.material.uuid}`;
      if(!buckets.has(key))buckets.set(key,{material:object.material,line:object.isLineSegments,geometries:[]});
      const geometry=object.geometry.index?object.geometry.toNonIndexed():object.geometry.clone();
      geometry.applyMatrix4(inverse.clone().multiply(object.matrixWorld));
      buckets.get(key).geometries.push(geometry);remove.push(object);
    });
    // Remove children first, including contours attached to mesh parents.
    for(const object of remove.reverse())object.removeFromParent();
    for(const {material,line,geometries} of buckets.values()){
      const geometry=mergeGeometries(geometries,false);geometries.forEach(g=>g.dispose());
      const object=line?new THREE.LineSegments(geometry,material):new THREE.Mesh(geometry,material);
      object.castShadow=object.receiveShadow=!line;owner.add(object);
    }
  }
}
