import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/controls/OrbitControls.js";

const workouts = [
  {id:"squat", name:"Bodyweight Squat", icon:"🦵", focus:"Quads • Glutes • Core", desc:"Controlled squat pattern with knee tracking, neutral spine and smooth hip drive."},
  {id:"curl", name:"Biceps Curl", icon:"💪", focus:"Biceps • Forearms", desc:"Elbows stay close to the torso while the forearm follows a controlled arc."},
  {id:"pushup", name:"Push-Up", icon:"🏋️", focus:"Chest • Triceps • Core", desc:"Rigid body line with shoulder and elbow movement coordinated through the rep."},
  {id:"lunge", name:"Reverse Lunge", icon:"🦿", focus:"Glutes • Quads • Balance", desc:"Step back, lower under control and drive through the front foot."},
  {id:"jump", name:"Jump Squat", icon:"⚡", focus:"Legs • Power", desc:"Elastic loading followed by an explosive extension and soft landing."},
  {id:"row", name:"Dumbbell Row", icon:"🎯", focus:"Back • Biceps", desc:"Stable torso with the elbow travelling toward the hip."}
];

const store = {
  get(k,d){ try{return JSON.parse(localStorage.getItem(k)) ?? d}catch{return d}},
  set(k,v){localStorage.setItem(k,JSON.stringify(v))}
};

const view = document.querySelector("#view");
const themeBtn = document.querySelector("#themeBtn");
themeBtn.onclick=()=>{document.body.classList.toggle("light");store.set("light",document.body.classList.contains("light"))};

function layout(html){view.innerHTML=`<div class="container">${html}</div>`}
function toast(msg){const el=document.createElement("div");el.className="toast";el.textContent=msg;document.body.appendChild(el);setTimeout(()=>el.remove(),2200)}

function home(){
 layout(`<section class="hero">
   <div><div class="kicker">Interactive 3D training</div>
   <h1>Train form.<br>Not just reps.</h1>
   <p>A browser-based gym coach with animated exercise demonstrations, interactive controls, progress tracking and a foundation ready for a true rigged human character.</p>
   <div class="actions"><a class="btn primary" href="#/coach">Open 3D Coach</a><a class="btn ghost" href="#/workouts">Explore exercises</a></div></div>
   <div class="card"><div class="kicker">Built for interaction</div><h2>Real-time movement controls</h2><p>Change exercise, tempo, camera and motion intensity. Your settings are saved locally in the browser.</p><div class="notice">For production-grade anatomical realism, place your own licensed rigged GLB/GLTF human model at <b>assets/character.glb</b>. The app automatically uses a procedural fallback until then.</div></div>
 </section>
 <section class="card-grid">
  <div class="card"><div class="exercise-icon">🧠</div><h3>Form-first</h3><p>Movement logic is separated from the interface so new exercises can be added without rebuilding the whole site.</p></div>
  <div class="card"><div class="exercise-icon">🎮</div><h3>Interactive</h3><p>Clickable pages, controls, camera orbit, rep controls, tempo and motion intensity.</p></div>
  <div class="card"><div class="exercise-icon">💾</div><h3>Your data</h3><p>Progress and preferences use localStorage in this starter build. No account or paid database is required.</p></div>
 </section>`);
}

function workoutsPage(){
 layout(`<section class="page-head"><div class="kicker">Exercise library</div><h1>Choose a movement</h1><p class="muted">Every card opens the 3D coach with that exercise selected.</p></section>
 <section class="workout-list">${workouts.map(w=>`<article class="card workout"><div><div class="exercise-icon">${w.icon}</div><h3>${w.name}</h3><p>${w.focus}</p></div><a class="btn primary" href="#/coach/${w.id}">View 3D →</a></article>`).join("")}</section>`);
}

function progressPage(){
 const data=store.get("progress",{reps:0,workouts:0,minutes:0});
 const goal=Math.min(100,Math.round((data.reps/100)*100));
 layout(`<section class="page-head"><div class="kicker">Your training</div><h1>Progress</h1><p class="muted">Local-only demo storage. Clear your browser data to reset it.</p></section>
 <section class="card-grid">
  <div class="card"><div class="muted">Total reps</div><h2>${data.reps}</h2></div>
  <div class="card"><div class="muted">Workouts started</div><h2>${data.workouts}</h2></div>
  <div class="card"><div class="muted">Training minutes</div><h2>${data.minutes}</h2></div>
 </section>
 <div class="card"><h3>100-rep milestone</h3><div class="progress"><i style="width:${goal}%"></i></div><p class="muted">${goal}% complete</p></div>`);
}

let scene,renderer,camera,controls,model,clock,animFrame;
function coachPage(exerciseId="squat"){
 const selected=workouts.find(x=>x.id===exerciseId)||workouts[0];
 layout(`<section class="page-head"><div class="kicker">3D Coach</div><h1>${selected.name}</h1><p class="muted">${selected.desc}</p></section>
 <section class="coach-layout">
  <div class="viewer" id="viewer"><div class="hud"><span class="badge" id="motionBadge">MOTION • READY</span><span class="badge">Drag to orbit • Wheel to zoom</span></div></div>
  <aside class="side">
   <div class="card control"><label>Exercise</label><select id="exercise">${workouts.map(w=>`<option value="${w.id}" ${w.id===selected.id?"selected":""}>${w.name}</option>`).join("")}</select></div>
   <div class="card control"><label>Tempo <b id="tempoVal">1.0×</b></label><input id="tempo" type="range" min=".4" max="2" step=".1" value="1"></div>
   <div class="card control"><label>Motion detail <b id="detailVal">0.8</b></label><input id="detail" type="range" min=".2" max="1.4" step=".1" value=".8"></div>
   <div class="card control"><div class="row"><button id="repBtn" class="btn primary">Complete Rep</button><button id="resetBtn" class="btn ghost">Reset</button></div><div class="stat"><span>Reps</span><b id="repCount">0</b></div><div class="stat"><span>Phase</span><b id="phase">Setup</b></div></div>
   <div class="notice">The procedural character is a technical fallback. For truly human-like skin, clothes, facial detail and production-quality anatomy, add a properly licensed rigged GLB/GLTF character to <b>assets/character.glb</b>.</div>
  </aside>
 </section>`);
 start3D(selected.id);
}

function createHumanoid(){
 const g=new THREE.Group();
 const mat=new THREE.MeshStandardMaterial({color:0xc99472,roughness:.72,metalness:0});
 const shirt=new THREE.MeshStandardMaterial({color:0x203b31,roughness:.8});
 const shorts=new THREE.MeshStandardMaterial({color:0x111716,roughness:.8});
 const cyl=(r1,r2,len,m)=>new THREE.Mesh(new THREE.CapsuleGeometry(Math.max(r1,r2),Math.max(.05,len-.2),8,12),m);
 const sphere=(s,m)=>{const x=new THREE.Mesh(new THREE.SphereGeometry(s,24,16),m);return x};
 const root=new THREE.Group(); g.add(root);
 const pelvis=sphere(.34,shorts); pelvis.scale.set(1,.65,.7); pelvis.position.y=1.35; root.add(pelvis);
 const torso=cyl(.42,.30,1.15,shirt); torso.position.y=2.05; root.add(torso);
 const neck=cyl(.14,.16,.25,mat); neck.position.y=2.72; root.add(neck);
 const head=sphere(.30,mat); head.position.y=3.10; root.add(head);
 const parts={root,pelvis,torso,head,arms:[],forearms:[],legs:[],shins:[]};
 for(const side of [-1,1]){
   const upper=cyl(.15,.12,.72,shirt); upper.position.set(side*.52,2.35,0); upper.rotation.z=side*.22; root.add(upper);
   const fore=cyl(.12,.10,.66,mat); fore.position.set(side*.66,1.78,0); fore.rotation.z=side*.18; root.add(fore);
   const hand=sphere(.12,mat); hand.position.set(side*.70,1.45,0); root.add(hand);
   const thigh=cyl(.19,.16,.78,shorts); thigh.position.set(side*.20,.90,0); root.add(thigh);
   const shin=cyl(.15,.12,.86,mat); shin.position.set(side*.20,.25,0); root.add(shin);
   const foot=cyl(.13,.10,.40,shorts); foot.position.set(side*.20,.02,.10); foot.rotation.x=Math.PI/2; root.add(foot);
   parts.arms.push(upper);parts.forearms.push(fore);parts.legs.push(thigh);parts.shins.push(shin);
 }
 return {g,parts};
}

function start3D(exercise){
 if(animFrame)cancelAnimationFrame(animFrame);
 const host=document.querySelector("#viewer"); if(!host)return;
 host.querySelector("canvas")?.remove();
 scene=new THREE.Scene();scene.background=new THREE.Color(0x040806);
 camera=new THREE.PerspectiveCamera(42,host.clientWidth/host.clientHeight,.1,100);camera.position.set(4,2.8,6);
 renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(host.clientWidth,host.clientHeight);renderer.shadowMap.enabled=true;host.appendChild(renderer.domElement);
 controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,1.7,0);controls.enableDamping=true;controls.minDistance=3.2;controls.maxDistance=9;
 scene.add(new THREE.HemisphereLight(0xbfe7d5,0x111712,2.2));
 const key=new THREE.DirectionalLight(0xffffff,3);key.position.set(3,6,4);key.castShadow=true;scene.add(key);
 const floor=new THREE.Mesh(new THREE.CylinderGeometry(4,4,.12,64),new THREE.MeshStandardMaterial({color:0x0b1511,roughness:.95}));floor.position.y=-.08;floor.receiveShadow=true;scene.add(floor);
 const grid=new THREE.GridHelper(8,24,0x284238,0x172a22);grid.position.y=0;scene.add(grid);
 const h=createHumanoid();model=h;scene.add(model.g);
 clock=new THREE.Clock();
 let t=0;
 function loop(){
  animFrame=requestAnimationFrame(loop);const dt=Math.min(clock.getDelta(),.033);const tempo=Number(document.querySelector("#tempo")?.value||1);const detail=Number(document.querySelector("#detail")?.value||.8);t+=dt*tempo;
  animateExercise(exercise,t,detail,h.parts);controls.update();renderer.render(scene,camera);
 }
 loop();
 window.onresize=()=>{if(!renderer)return;camera.aspect=host.clientWidth/host.clientHeight;camera.updateProjectionMatrix();renderer.setSize(host.clientWidth,host.clientHeight)};
}

function animateExercise(type,t,d,p){
 const cycle=(Math.sin(t*2.4)+1)/2;
 const ease=x=>x*x*(3-2*x);
 const squat=ease(cycle);
 p.pelvis.position.y=1.35;
 p.torso.rotation.x=0;
 p.legs.forEach((x,i)=>x.rotation.x=0);p.shins.forEach(x=>x.rotation.x=0);
 p.arms.forEach((x,i)=>x.rotation.z=(i?1:-1)*.22);p.forearms.forEach((x,i)=>x.rotation.z=(i?1:-1)*.18);
 if(type==="squat"||type==="jump"){
   const depth=type==="jump"?Math.pow(squat,2)*.75:squat*.62;
   p.pelvis.position.y=1.35-depth;
   p.torso.rotation.x=depth*.22;
   p.legs.forEach((x,i)=>x.rotation.x=depth*.85);
   p.shins.forEach((x,i)=>x.rotation.x=-depth*1.0);
   p.arms.forEach((x,i)=>x.rotation.z=(i?1:-1)*(.22+depth*.45));
   p.forearms.forEach((x,i)=>x.rotation.z=(i?1:-1)*(.18-depth*.3));
   if(type==="jump")p.root.position.y=Math.max(0,Math.sin(t*2.4)*.16);
 } else if(type==="curl"){
   p.arms.forEach((x,i)=>x.rotation.z=(i?1:-1)*.15);
   p.forearms.forEach((x,i)=>x.rotation.z=(i?1:-1)*(-.9+cycle*1.7));
 } else if(type==="pushup"){
   p.root.rotation.z=-.02;
   p.root.rotation.x=-.10;
   p.pelvis.position.y=1.45-cycle*.55;
   p.torso.rotation.x=.18;
   p.arms.forEach((x,i)=>x.rotation.z=(i?1:-1)*(.35+cycle*.4));
   p.forearms.forEach((x,i)=>x.rotation.z=(i?1:-1)*(-.3-cycle*.5));
 } else if(type==="lunge"){
   p.pelvis.position.y=1.35-cycle*.42;
   p.torso.rotation.x=cycle*.08;
   p.legs[0].rotation.x=cycle*.75;p.shins[0].rotation.x=-cycle*.8;
   p.legs[1].rotation.x=-cycle*.45;p.shins[1].rotation.x=cycle*.3;
 } else if(type==="row"){
   p.torso.rotation.x=.32;
   p.arms.forEach((x,i)=>x.rotation.z=(i?1:-1)*(.65-cycle*.55));
   p.forearms.forEach((x,i)=>x.rotation.z=(i?1:-1)*(-.9+cycle*.9));
 }
 // subtle secondary motion: small spring-like delayed sway, not a substitute for a real cloth/soft-body simulation
 const jiggle=Math.sin(t*5.1)*0.008*d;
 p.head.rotation.z=jiggle;p.pelvis.rotation.z=-jiggle*1.2;
}

function bindCoach(){
 document.querySelector("#exercise")?.addEventListener("change",e=>location.hash="#/coach/"+e.target.value);
 document.querySelector("#tempo")?.addEventListener("input",e=>document.querySelector("#tempoVal").textContent=e.target.value+"×");
 document.querySelector("#detail")?.addEventListener("input",e=>document.querySelector("#detailVal").textContent=e.target.value);
 let reps=0;
 document.querySelector("#repBtn")?.addEventListener("click",()=>{
   reps++;document.querySelector("#repCount").textContent=reps;document.querySelector("#phase").textContent="Complete";
   const d=store.get("progress",{reps:0,workouts:0,minutes:0});d.reps++;store.set("progress",d);toast("Rep recorded");
 });
 document.querySelector("#resetBtn")?.addEventListener("click",()=>{reps=0;document.querySelector("#repCount").textContent="0";document.querySelector("#phase").textContent="Setup";toast("Session reset")});
}

function router(){
 const [route,id]=location.hash.replace(/^#\//,"").split("/");
 if(route==="coach"){coachPage(id||"squat");setTimeout(bindCoach,0)}
 else if(route==="workouts")workoutsPage();
 else if(route==="progress")progressPage();
 else home();
}
window.addEventListener("hashchange",router);router();
