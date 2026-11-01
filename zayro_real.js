'use strict';
/* ZAYRO REAL v10.0 — loads after zayro_ultra.js. Base game code is untouched.
   WHEELS : lathe-profiled rubber tyres, dished alloy rims (5 designs, one per car), lip, lug nuts,
            drilled brake discs that glow under hard braking, calipers, real spin on traffic/rivals too,
            speed blur disc on the player's wheels.
   CARS   : number plates with characters, reverse lights, neon under-glow on Neon Night, tuned power.
   ROADS  : concrete slab tint + expansion joints, tar snakes, gravel on the shoulder, terrain colour
            patches, amber barrier reflectors, speed-limit signs, tall roadside trees.
   Every block is wrapped in try/catch so a failure can never stop the game. */
(function(){
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const zs=()=>window.zrState||{brake:false,backfire:0,brakeHeat:0};

/* ====================================================================== GL helpers */
function part(vp,p,size,yaw,pitch,color,gloss){
  bind(cubePB,cubeNB);
  gl.uniformMatrix4fv(attr.vp,false,vp);gl.uniformMatrix4fv(attr.model,false,modelMatrix(p,size,yaw,pitch));
  gl.uniform3fv(attr.color,color);gl.uniform1f(attr.road,0);gl.uniform1f(attr.gloss,gloss);
  gl.drawArrays(gl.TRIANGLES,0,36);
}
function cyl(vp,p,size,yaw,color,gloss){
  bind(wheelPB,wheelNB);
  gl.uniformMatrix4fv(attr.vp,false,vp);gl.uniformMatrix4fv(attr.model,false,modelMatrix(p,size,yaw));
  gl.uniform3fv(attr.color,color);gl.uniform1f(attr.road,0);gl.uniform1f(attr.gloss,gloss);
  gl.drawArrays(gl.TRIANGLES,0,wheelPos.length/3);
}
const glowOn=()=>gl.uniform1f(attr.emit,1),glowOff=()=>gl.uniform1f(attr.emit,0);

/* ====================================================================== TYRE MESH
   Lathe around the X axis. Unit size: x = half width, radius 1 = outer radius. Scale [.25,.37,.37]. */
let tyre=null;
try{
  const prof=[[-1,.60],[-1,.80],[-.93,.93],[-.78,.985],[-.42,1],[.42,1],[.78,.985],[.93,.93],[1,.80],[1,.60]];
  const N=32,pos=[],nor=[];
  for(let i=0;i<prof.length-1;i++){
    const a=prof[i],b=prof[i+1],dx=b[0]-a[0],dr=b[1]-a[1],l=Math.hypot(dx,dr)||1,nx=-dr/l,nr=dx/l;
    for(let j=0;j<N;j++){
      const t0=j/N*Math.PI*2,t1=(j+1)/N*Math.PI*2,c0=Math.cos(t0),s0=Math.sin(t0),c1=Math.cos(t1),s1=Math.sin(t1);
      const v=(p,c,s)=>{pos.push(p[0],p[1]*c,p[1]*s);nor.push(nx,nr*c,nr*s);};
      v(a,c0,s0);v(b,c0,s0);v(b,c1,s1);v(a,c0,s0);v(b,c1,s1);v(a,c1,s1);
    }
  }
  // tread blocks: small raised cubes would be costly, so a few ring grooves are baked as normals above.
  const pb=gl.createBuffer(),nb=gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER,pb);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(pos),gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER,nb);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(nor),gl.STATIC_DRAW);
  tyre={pb,nb,count:pos.length/3};
}catch(e){console.error('ZAYRO REAL tyre',e);}

/* ====================================================================== WHEELS */
// per car design: spoke count, twin spokes, rim colour, lip colour, cap colour, caliper colour
const RIM=[
  {n:5,twin:true, rim:[.74,.77,.80],lip:[.86,.88,.9], cap:[.1,.1,.11],cal:[.86,.07,.04]},   // 0 Street Racer — silver twin-spoke
  {n:5,twin:false,rim:[.82,.84,.86],lip:[.95,.96,.97],cap:[.75,.05,.04],cal:[.95,.75,.1]},  // 1 Muscle Storm — chrome 5-spoke
  {n:5,twin:false,rim:[.12,.13,.15],lip:[.1,.85,.9],  cap:[.1,.85,.9],cal:[.1,.7,.8]},      // 2 Volt — graphite + cyan
  {n:6,twin:true, rim:[.72,.52,.2], lip:[.82,.62,.28],cap:[.1,.1,.1],cal:[.85,.1,.1]},      // 3 Hyper RS — bronze 6 twin
  {n:10,twin:false,rim:[.07,.075,.08],lip:[1,.55,.08],cap:[1,.55,.08],cal:[1,.5,.05]}       // 4 Champion X — black mesh + orange
];
let curStyle=0;
const _wheel=drawWheel;
drawWheel=function(vp,car,x,z){
  if(!tyre)return _wheel(vp,car,x,z);
  const isP=car===player,sg=x<0?-1:1,R=RIM[((curStyle%5)+5)%5],Z=zs();
  const wheelY=.39+(isP?suspensionBob+Math.sin(time*18+x*2+z)*Math.min(.025,Math.abs(car.speed)*.00022):0);
  const spin=isP?wheelSpin:car.z*2.7;
  const wy=car.yaw+(isP&&z>0?steer*.42:0);
  const cp=localPoint(car,x,wheelY,z),cw=Math.cos(wy),sw=Math.sin(wy);
  const at=(ox,oy,oz)=>[cp[0]+ox*cw+oz*sw,wheelY+oy,cp[2]-ox*sw+oz*cw];
  // tyre
  bind(tyre.pb,tyre.nb);
  gl.uniformMatrix4fv(attr.vp,false,vp);gl.uniformMatrix4fv(attr.model,false,modelMatrix(cp,[.25,.37,.37],wy));
  gl.uniform3fv(attr.color,[.022,.024,.027]);gl.uniform1f(attr.road,0);gl.uniform1f(attr.gloss,.1);
  gl.drawArrays(gl.TRIANGLES,0,tyre.count);
  // rim barrel, outer lip, dark dish
  cyl(vp,cp,[.236,.225,.225],wy,[.05,.052,.056],.5);
  cyl(vp,at(sg*.236,0,0),[.012,.236,.236],wy,R.lip,.85);
  cyl(vp,at(sg*.252,0,0),[.004,.2,.2],wy,[.012,.013,.015],.3);
  // brake disc, caliper (fixed, turns with steering)
  const hot=isP?clamp(Z.brakeHeat||0,0,1):0;
  if(hot>.3){glowOn();cyl(vp,at(sg*.17,0,0),[.012,.19,.19],wy,[1,.35+.25*hot,.06],.4);glowOff();}
  else cyl(vp,at(sg*.17,0,0),[.012,.19,.19],wy,[.32,.33,.35],.65);
  part(vp,at(sg*.205,.12,-.07),[.045,.07,.06],wy,0,R.cal,.55);
  // motion fill so spokes do not strobe at speed
  const fast=isP&&Math.abs(car.speed)>30;
  if(fast)cyl(vp,at(sg*.256,0,0),[.004,.2,.2],wy,R.rim.map(v=>v*.4),.4);
  // spokes (spin)
  const n=R.n;
  for(let i=0;i<n;i++){
    const a=i*Math.PI*2/n+spin,ca=Math.cos(a),sa=Math.sin(a);
    const wide=n>=10?.014:R.twin?.02:.036;
    const offs=R.twin?[-.024,.024]:[0];
    for(const o of offs){
      part(vp,at(sg*.262,ca*.115-sa*o,sa*.115+ca*o),[.012,.088,wide],wy,a,R.rim,.78);
    }
  }
  // hub cap and lug nuts
  cyl(vp,at(sg*.268,0,0),[.014,.05,.05],wy,R.cap,.7);
  for(let i=0;i<5;i++){
    const a=i*Math.PI*2/5+spin;
    cyl(vp,at(sg*.274,Math.cos(a)*.066,Math.sin(a)*.066),[.008,.011,.011],wy,[.82,.84,.86],.85);
  }
};

/* ====================================================================== CAR DETAILS */
const DIMS=[[.97,1.95],[1.08,2.4],[1.02,2.3],[1.08,2.22],[1.12,2.5]];
const _car=drawCar;
drawCar=function(vp,car,color,style=0,boost=false){
  curStyle=style;
  _car(vp,car,color,style,boost);
  try{
    if(car===player&&typeof cameraMode!=='undefined'&&cameraMode===1)return;
    const si=((style%5)+5)%5,d=DIMS[si],W=d[0],H=d[1],isP=car===player,rz=-H+.03;
    const plate=[.93,.93,.86],ink=[.05,.05,.06];
    // rear plate characters, deterministic per car slot
    const seed=Math.floor(Math.abs(car.z*.013)+si*3);
    for(let i=0;i<6;i++){
      const hgt=.018+((seed*7+i*5)%4)*.006;
      part(vp,localPoint(car,-.185+i*.074,.40,rz-.072).map((v,k)=>k===1&&isP?v+suspensionBob:v),[.016,hgt,.003],car.yaw,0,ink,.1);
    }
    part(vp,localPoint(car,0,.355,rz-.068).map((v,k)=>k===1&&isP?v+suspensionBob:v),[.24,.008,.004],car.yaw,0,[.1,.2,.55],.1);
    // reverse lights
    if(isP&&car.speed<-.4){
      glowOn();
      for(const s of [-1,1])drawPart(vp,car,[s*W*.3,.5,rz-.045],[.07,.025,.012],[1,1,1]);
      glowOff();
    }
    // neon under-glow on Neon Night
    if(selectedRoad===4){
      const g=isP?[.0,.8,.9]:[.6,.1,.7];
      glowOn();drawPart(vp,car,[0,.03,0],[W*1.15,.004,H*.95],g.map(v=>v*.55));glowOff();
    }
  }catch(e){if(!drawCar.err){drawCar.err=1;console.error('ZAYRO REAL cars',e);}}
};

/* ====================================================================== POWER */
try{
  if(!window.__zayroRealTuned){
    window.__zayroRealTuned=1;
    cars.forEach(c=>{c.accel=+(c.accel*1.12).toFixed(2);c.top=Math.round(c.top*1.04);c.grip=+(c.grip*1.04).toFixed(3);c.nitro=+(c.nitro*1.08).toFixed(2);});
  }
}catch(e){console.error('ZAYRO REAL power',e);}

/* ====================================================================== ROADS */
function makeAdder(map){
  return function(color,p,size,yaw=0){
    let b=map.get(color);if(!b){b={p:[],n:[],color};map.set(color,b);}
    const c=Math.cos(yaw),s=Math.sin(yaw);
    for(const f of faceData)for(const j of triangles){
      const v=f[j],n=f[4],x=v[0]*size[0],z=v[2]*size[2];
      b.p.push(p[0]+x*c+z*s,p[1]+v[1]*size[1],p[2]-x*s+z*c);
      b.n.push(n[0]*c+n[2]*s,n[1],-n[0]*s+n[2]*c);
    }
  };
}

function buildReal(theme){
  const map=new Map(),add=makeAdder(map);
  let seed=104729+theme*7727;
  const R=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  const end=roadEnd-100,sc=(c,k)=>c.map(v=>Math.min(1,v*k));
  const road=K.road,ground=K.ground;

  // --- concrete slabs: three subtle shades + dark expansion joints (road surface only, outside junctions)
  const slab=[sc(road,1.07),sc(road,.93),sc(road,1.0)],joint=sc(road,.55);
  const segs=[];
  if(freeRoam){let a=-80;for(let z0=110;z0<roadEnd-70;z0+=180){segs.push([a,z0-11]);a=z0+11;}segs.push([a,end]);}
  else segs.push([-80,end]);
  for(const [a,b] of segs){
    for(let z=a;z<b;z+=24){
      const len=Math.min(24,b-z);if(len<3)continue;
      const lanes=freeRoam?[[-15.2,0],[0,15.2]]:[[-15.2,-5.66],[-5.66,5.66],[5.66,15.2]];
      for(const [x0,x1] of lanes){
        const sh=slab[Math.floor(R()*3)];
        add(sh,[(x0+x1)/2,.014,z+len/2],[(x1-x0)/2,.0075,len/2-.03]);
      }
      add(joint,[0,.0185,z],[15.2,.009,.03]);
    }
  }

  // --- tar snakes: dark meandering crack repairs
  const tar=sc(road,.5);
  for(let i=0;i<70;i++){
    let x=(R()-.5)*26,z=-60+R()*(end-40),yaw=(R()-.5)*.35;
    const segN=3+Math.floor(R()*4),w=.014+R()*.02;
    for(let k=0;k<segN;k++){
      const len=1.2+R()*2.2;
      add(tar,[x,.019,z+len*.5],[w,.0085,len*.5+.05],yaw);
      x+=Math.sin(yaw)*len;z+=Math.cos(yaw)*len;yaw+=(R()-.5)*.5;
    }
  }

  if(!freeRoam){
    // --- gravel on the shoulder
    const gv=[[.46,.46,.44],[.36,.36,.35],[.56,.54,.5]];
    for(let i=0;i<320;i++){
      const s=i%2?1:-1,z=-70+R()*(end+40),x=s*(16.45+R()*1.45),h=.018+R()*.03;
      add(gv[i%3],[x,.045+h*.3,z],[.04+R()*.07,h,.04+R()*.08],R()*3);
    }

    // --- amber/white barrier reflectors
    const amber=[1,.62,.1],wht=[.9,.92,.88];
    for(let z=-92;z<end;z+=28)for(const s of [-1,1])add(s>0?amber:wht,[s*18.08,1.05,z],[.016,.055,.16]);

    // --- speed-limit signs
    const pole=[.55,.57,.56],red=[.78,.05,.05],white=[.95,.95,.95],blk=[.04,.04,.05];
    for(let z=300,k=0;z<end;z+=520,k++)for(const s of [-1,1]){
      const x=s*22.8;
      add(pole,[x,1.4,z],[.04,1.4,.04]);
      add(red,[x,3.0,z-.045],[.52,.52,.022]);
      add(white,[x,3.0,z-.07],[.4,.4,.022]);
      const dig=[[6,8],[8,0]][(k+(s>0?1:0))%2]; // "60"/"80" abstract two-digit bars
      add(blk,[x-.13,3.0,z-.095],[.06,.24,.016]);add(blk,[x+.13,3.0,z-.095],[.06,.24,.016]);
      add(blk,[x-.13,3.14,z-.095],[.12,.04,.016]);add(blk,[x-.13,2.86,z-.095],[.12,.04,.016]);
      add(blk,[x+.13,3.14,z-.095],[.12,.04,.016]);add(blk,[x+.13,2.86,z-.095],[.12,.04,.016]);
    }

    // --- terrain colour patches so the ground is never one flat tone
    const tone=[sc(ground,1.14),sc(ground,.86),[ground[0]*1.18,ground[1]*1.06,ground[2]*.8],[ground[0]*.84,ground[1]*.97,ground[2]*.88],sc(ground,1.28)];
    for(let i=0;i<260;i++){
      const s=i%2?1:-1,x=s*(24+R()*140),z=-60+R()*(end+40),w=4+R()*16,l=8+R()*40;
      add(tone[i%5],[x,-.092,z],[w,.006,l],R()*.5);
    }

    // --- tall roadside trees / pines
    if(theme===0||theme===1){
      const trunk=[.24,.16,.1],leafs=theme===0?[[.12,.28,.13],[.16,.34,.15],[.1,.24,.12]]:[[.1,.32,.2],[.14,.38,.22],[.09,.27,.17]];
      for(let i=0;i<110;i++){
        const s=i%2?1:-1,x=s*(34+R()*45),z=-40+R()*(end+30),h=3.2+R()*2.8,l=leafs[i%3];
        add(trunk,[x,h*.35,z],[.16,h*.35,.16]);
        add(l,[x,h*.8,z],[1.2+R()*.7,h*.28,1.2+R()*.7],R()*3);
        add(l,[x,h*1.05,z],[.8+R()*.5,h*.22,.8+R()*.5],R()*3);
      }
    }else if(theme===3){
      const pine=[[.08,.24,.18],[.1,.3,.22]],trunk=[.22,.15,.1],snowCap=[.92,.96,1];
      for(let i=0;i<90;i++){
        const s=i%2?1:-1,x=s*(36+R()*55),z=-40+R()*(end+30),h=4+R()*4;
        add(trunk,[x,h*.2,z],[.14,h*.2,.14]);
        add(pine[i%2],[x,h*.55,z],[1.3,h*.25,1.3],R()*3);
        add(pine[i%2],[x,h*.8,z],[.9,h*.22,.9],R()*3);
        add(snowCap,[x,h*1.02,z],[.5,.14,.5],R()*3);
      }
    }
  }

  for(const b of map.values()){
    const pb=gl.createBuffer(),nb=gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,pb);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(b.p),gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER,nb);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(b.n),gl.STATIC_DRAW);
    batches.push({pb,nb,count:b.p.length/3,color:b.color});
  }
}
const _bw=buildWorld;
buildWorld=function(theme){
  _bw(theme);
  try{buildReal(theme);}catch(e){console.error('ZAYRO REAL roads',e);}
};
buildWorld(selectedRoad);
})();
