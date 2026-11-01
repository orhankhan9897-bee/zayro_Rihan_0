'use strict';
/* ZAYRO ULTRA v9.0 — loads after zayro_cars.js. Base game code is untouched.
   ROADS : tyre-wear tracks, cat's-eye reflectors, edge reflectors, delineator posts, km markers,
           concrete overpasses with pillars (race mode), roadside scrub/rocks/snow banks per road theme,
           glowing neon barrier rail on Neon Night.
   CARS  : visible crash damage on the new smooth car bodies (scrapes, cracked glass, hanging bumper,
           popped hood, lost mirror).
   POWER : launch boost, drift-boost (drifting refills nitro), high-speed downforce stability,
           turbo whistle, blow-off valve on throttle lift, sub-bass engine layer. */
(function(){
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

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
const LANES=[-14,-8.4,-2.8,2.8,8.4,14];

function buildExtras(theme){
  const map=new Map(),add=makeAdder(map);
  let seed=7919+theme*1301;
  const R=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  const end=roadEnd-100,glow=K.signLight;
  const worn=[.092,.1,.105];

  // ---- tyre-wear tracks: two darker polished strips per lane ----
  const segs=[];
  if(freeRoam){
    let start=-80;
    for(let z0=110;z0<roadEnd-70;z0+=180){segs.push([start,z0-11]);start=z0+11;}
    segs.push([start,end]);
  }else segs.push([-80,end]);
  for(const [a,b] of segs){
    if(b-a<4)continue;
    for(const lane of LANES)for(const off of [-.9,.9])
      add(worn,[lane+off,.02,(a+b)/2],[.26,.004,(b-a)/2]);
  }

  // ---- cat's-eye reflectors in the lane-dash gaps and along the edge lines ----
  const lineX=freeRoam?[-8.5,8.5]:[-11.33,-5.66,0,5.66,11.33];
  for(let z=-83.5;z<end;z+=29)for(const x of lineX)add(glow,[x,.045,z],[.06,.025,.06]);
  for(let z=-90;z<end;z+=12)for(const side of [-1,1])add(glow,[side*15.55,.05,z],[.05,.02,.07]);

  if(!freeRoam){
    // ---- delineator posts behind the barrier, km markers ----
    const post=[.72,.74,.72];
    for(let z=-60;z<end;z+=40)for(const side of [-1,1]){
      add(post,[side*19.1,.55,z],[.05,.55,.05]);
      add(glow,[side*19.1,1.14,z],[.06,.07,.02]);
    }
    for(let z=100,k=0;z<end;z+=200,k++)for(const side of [-1,1]){
      add(post,[side*20.5,.95,z],[.06,.95,.06]);
      add(K.sign,[side*20.5,1.95,z],[.55,.32,.03]);
      add(glow,[side*20.5,1.95,z-.04],[.42,.2,.01]);
    }

    // ---- concrete overpasses with pillars (clear of lamps and gantries) ----
    const concrete=[.52,.53,.5],concreteDark=[.33,.34,.33],rail=[.62,.63,.6];
    for(const z of [480,1100,1740,2400,3100]){
      add(concrete,[0,9.55,z],[28,.5,5.2]);
      add(concreteDark,[0,9.0,z],[28,.18,4.4]);
      for(const s of [-1,1]){
        add(rail,[0,10.3,z+s*4.9],[28,.45,.2]);
        add(concreteDark,[s*21.6,4.6,z],[.8,4.6,1.5]);
        add(concreteDark,[s*21.6,9.05,z],[1.2,.3,4.6]);
        add(concrete,[s*27.6,5.2,z],[2.2,5.2,5.2]); // abutment
      }
    }

    // ---- roadside dressing per theme ----
    if(theme===0||theme===1){
      const leaf=theme===0?[.13,.27,.14]:[.12,.34,.2];
      for(let i=0;i<200;i++){const s=i%2?1:-1,z=-40+R()*(end+30),x=s*(22+R()*9),h=.4+R()*.7;
        add(leaf,[x,h*.5,z],[.5+R()*.7,h*.5,.5+R()*.7],R()*3);}
    }else if(theme===2){
      const scrub=[.5,.4,.22],rock=[.5,.37,.26],cactus=[.2,.42,.2];
      for(let i=0;i<150;i++){const s=i%2?1:-1,z=-40+R()*(end+30),x=s*(21.5+R()*14);
        if(i%3===0){const h=.5+R()*.9;add(rock,[x,h*.5,z],[.7+R()*.9,h*.5,.6+R()*.8],R()*3);}
        else if(i%3===1)add(scrub,[x,.25,z],[.5+R()*.5,.25,.5+R()*.5],R()*3);
        else{const h=1.2+R()*1.3;add(cactus,[x,h*.5,z],[.18,h*.5,.18]);add(cactus,[x+.3,h*.62,z],[.28,.09,.09]);add(cactus,[x+.52,h*.78,z],[.09,.34,.09]);}}
    }else if(theme===3){
      const snow=[.9,.95,.99],pine=[.1,.27,.2];
      for(let i=0;i<170;i++){const s=i%2?1:-1,z=-40+R()*(end+30),x=s*(19.8+R()*9),h=.3+R()*.8;
        add(snow,[x,h*.5,z],[.7+R()*1.1,h*.5,1+R()*2],R()*.4);}
      for(let i=0;i<60;i++){const s=i%2?1:-1,z=R()*end,x=s*(27+R()*14),h=3+R()*3;
        add(pine,[x,h*.5+.5,z],[.9,h*.5,.9]);add(pine,[x,h+1,z],[.55,.9,.55]);}
    }else if(theme===4){
      for(const s of [-1,1]){add(glow,[s*18.45,1.62,(end-80)/2],[.045,.045,(end+80)/2]);}
      for(let z=-60;z<end;z+=55)for(const s of [-1,1])add(glow,[s*19.3,2.2,z],[.07,2.2,.07]);
    }
  }

  for(const b of map.values()){
    const pb=gl.createBuffer(),nb=gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,pb);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(b.p),gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER,nb);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(b.n),gl.STATIC_DRAW);
    batches.push({pb,nb,count:b.p.length/3,color:b.color});
  }
}
const _buildWorld=buildWorld;
buildWorld=function(theme){
  _buildWorld(theme);
  try{buildExtras(theme);}catch(e){console.error('ZAYRO ULTRA roads',e);}
};
buildWorld(selectedRoad);

/* ======================================================================= CARS */
const DIM=[[.97,1.95],[1.08,2.4],[1.02,2.3],[1.08,2.22],[1.12,2.5]];
const _drawCar=drawCar;
drawCar=function(vp,car,color,style=0,boost=false){
  _drawCar(vp,car,color,style,boost);
  if(car!==player||crashCount<=0||(typeof cameraMode!=='undefined'&&cameraMode===1))return;
  const d=DIM[((style%5)+5)%5],W=d[0],H=d[1],dark=[.05,.055,.06],scratch=[.6,.62,.62],glass=[.7,.78,.8];
  for(const s of [-1,1]){
    drawPart(vp,car,[s*W*.965,.5,H*.08],[.006,.03,H*(.14+.04*crashCount)],dark,s*.02);
    drawPart(vp,car,[s*W*.97,.56,-H*.2],[.005,.012,H*.1],scratch,-s*.03);
  }
  if(crashCount>=2){
    drawPart(vp,car,[W*.18,.29,H-.1],[W*.42,.05,.06],dark,.22);                 // hanging splitter
    drawPart(vp,car,[-.08,1.0,H*.12],[.012,.01,.2],glass,-.3);                  // cracked windscreen
    drawPart(vp,car,[.06,1.0,H*.14],[.01,.01,.16],glass,.34);
    drawPart(vp,car,[0,.83,H*.52],[W*.34,.012,.22],dark,.1);                    // crumpled hood
  }
  if(crashCount>=3){
    drawPart(vp,car,[0,.95,H*.52],[W*.44,.02,.34],color.map(v=>v*.7),-.38);     // popped hood
    for(const s of [-1,1])drawPart(vp,car,[s*W*.66,.9,H*.18],[.14,.05,.1],dark);  // damaged mirror stubs
  }
};

/* ======================================================================= POWER */
let aNodes=null,noise=null;
function ensureAudio(){
  if(!audio)return false;
  if(aNodes)return true;
  const g=audio.createGain();g.gain.value=.0001;g.connect(audio.destination);
  const whistle=audio.createOscillator();whistle.type='sine';whistle.frequency.value=1200;
  const wf=audio.createBiquadFilter();wf.type='bandpass';wf.frequency.value=1800;wf.Q.value=3;
  whistle.connect(wf);wf.connect(g);whistle.start();
  const g2=audio.createGain();g2.gain.value=.0001;g2.connect(audio.destination);
  const sub=audio.createOscillator();sub.type='sine';sub.frequency.value=36;sub.connect(g2);sub.start();
  noise=audio.createBuffer(1,Math.floor(audio.sampleRate*.5),audio.sampleRate);
  const d=noise.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
  aNodes={g,whistle,g2,sub};return true;
}
function bov(vol){
  if(!ensureAudio()||!musicOn&&false)return;
  const now=audio.currentTime,s=audio.createBufferSource();s.buffer=noise;
  const f=audio.createBiquadFilter();f.type='bandpass';f.frequency.setValueAtTime(3200,now);f.frequency.exponentialRampToValueAtTime(1100,now+.35);f.Q.value=.9;
  const g=audio.createGain();g.gain.setValueAtTime(vol,now);g.gain.exponentialRampToValueAtTime(.0001,now+.4);
  s.connect(f);f.connect(g);g.connect(audio.destination);s.start(now);s.stop(now+.45);
}

let last=performance.now(),gasHeld=0,wasGas=false,driftCool=0,wasRunning=false;
function step(rdt){
  const dt=Math.min(.05,rdt),active=running&&!paused&&!finished;
  if(running&&!wasRunning){gasHeld=0;wasGas=false;}
  wasRunning=running;
  const gas=active&&(keys.has('w')||keys.has('arrowup')||(typeof touch!=='undefined'&&touch.accelerate));
  const sp=Math.abs(player.speed);

  if(active){
    // Launch boost: a strong, grippy getaway from standstill.
    if(gas&&time<3&&player.speed>0&&player.speed<28)player.speed+=dt*4.5;
    // Drift boost: sliding with speed refills nitro.
    const drifting=Math.abs(player.slip)>.3&&sp>22;
    driftCool=Math.max(0,driftCool-dt);
    if(drifting&&!boosting&&nitro<100){
      nitro=Math.min(100,nitro+dt*11);
      if(driftCool<=0&&nitro<99){driftCool=4;pop('DRIFT BOOST · NITRO CHARGING');}
    }
    // Downforce: the car sticks to the road at very high speed.
    if(sp>45&&!freeRoam)player.slip*=1-Math.min(.5,dt*.5*(sp-45)/45);
  }

  // Throttle history for turbo / blow-off valve
  gasHeld=gas?gasHeld+dt:0;
  if(wasGas&&!gas&&active&&sp>30&&time>0){bov(clamp(.05+sp/900,.05,.14));}
  wasGas=gas;

  if(audio&&ensureAudio()){
    const now=audio.currentTime;
    const spool=clamp(gasHeld/1.4,0,1)*clamp(sp/60,0,1);
    aNodes.whistle.frequency.setTargetAtTime(1100+spool*2600,now,.06);
    aNodes.g.gain.setTargetAtTime(active&&gas?.012*spool:.0001,now,.08);
    aNodes.sub.frequency.setTargetAtTime(30+(typeof engineRPM!=='undefined'?engineRPM/90:10),now,.08);
    aNodes.g2.gain.setTargetAtTime(active?.045*(gas?1:.4):.0001,now,.1);
  }
}
function loop(now){
  requestAnimationFrame(loop);
  const rdt=Math.min(.1,Math.max(0,(now-last)/1000));last=now;
  try{step(rdt);}catch(e){if(!loop.err){loop.err=1;console.error('ZAYRO ULTRA',e);}}
}
requestAnimationFrame(loop);
})();
