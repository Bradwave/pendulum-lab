// Pendulum Lab · ui.js
// Buttons, tabs, sliders and toggles wiring.
import { DATA, VARS, gSel, sample, vAv } from './data.js';
import { FL, fluidStep, liquidAdvance } from './fluid.js';
import { releaseAngle, rescaleE, resetToRelease, setAngle } from './interaction.js';
import { G, csv, updateReadout } from './panels.js';
import { cur, enterPolar, step, syncCart } from './physics.js';
import { LY, Lp, P, PEN, S } from './state.js';
import { $, $$, TAU, clamp } from './util.js';
import { cam, cv, resize } from './view.js';

// ---------- UI wiring ----------
export let toastT=0;
export function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('show');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('show'),1800);}
export function setPlaying(p){S.playing=p;$('#playIcon').textContent=p?'pause':'play_arrow';$('#playLbl').textContent=p?'Pause':'Play';$('#playBtn').setAttribute('aria-label',p?'Pause':'Play');}
export function segBind(id,fn){$$(id+' button').forEach(b=>b.onclick=()=>{$$(id+' button').forEach(x=>x.classList.toggle('on',x===b));fn(b.dataset.v,b);});}
export function segSet(id,v){$$(id+' button').forEach(x=>x.classList.toggle('on',x.dataset.v===String(v)));}
export function setView(v){S.view=v;segSet('#viewSeg',v);cv.classList.toggle('locked',v!=='lab');updateHint();syncLayers();}
export function updateHint(){$('#hint').textContent=S.view==='lab'?'Drag a ball to place it · swipe to throw it':'Riding on ball A: the camera is a non-inertial frame';}

export const SHOW=[
  ['Motion',[['vel','Velocity v','vel','Tangent to the path'],['speed','Speed |v| as a number','vel'],['acc','Acceleration a','acc'],['accComp','Split a: tangential + centripetal','acc','aₜ changes the speed, a꜀ = v²/L turns it'],['trail','Trail','muted']]],
  ['Forces on the ball',[['W','Weight W','wt','Earth pulls the ball'],['R','Rope force T','ten','Rope pulls the ball (a rod can also push, and with pivot friction it also brakes)'],['D','Drag and friction D','drag','Air pushes against the motion'],['S','Spring force','spr','With two coupled pendulums'],['net','Net force ΣF = m·a','ink','Lab view'],['decomp','Split along the rope ∥ and ⊥','ink','Components of W, ΣF and −ma'],['polygon','Force polygon','ink','Forces tip to tail: in the ball view they close'],['values','Values on arrows','ink']]],
  ["Newton's third law",[['ropeEnds','Forces on the rope','ten','Ball pulls it down, support pulls it up'],['support','Force on the support','ten','Rope pulls the support'],['earth','Ball pulls the Earth','wt','Lab view'],['pairs','Number the pairs','ink','Same number, same size, opposite direction']]],
  ['Ball view (non-inertial)',[['app','Apparent force −m·a','app'],['appComp','Split −m·a: centrifugal + tangential','app'],['frameAcc','Acceleration of the frame','acc'],['geff','Effective gravity g − a','liquid','What the liquid feels'],['rotate','Turn with the rope','ink','The rope always points up']]],
  ['Sensors',[['phone','Phone on the ball','acc','Accelerometer and gyroscope, axes as in phyphox: y toward the support, x along the swing'],['phoneG','Include gravity','acc','On: like phyphox "with g" (reads +g at rest). Off: "without g"']]],
  ['Display',[['fluid','Liquid inside the ball','liquid'],['readout','Readouts','ink'],['energy','Energy bars','vel'],['ropeColor','Colour the rope by tension','ten'],['grid','Background grid','muted']]]
];
export const DOT=new Set(['trail','values','pairs','rotate','fluid','readout','energy','ropeColor','grid','speed','polygon','phone','phoneG']);
export const QUICK=[['vel','Velocity','vel'],['acc','Accel.','acc'],['W,R,D,S','Forces','ten'],['decomp','Split ∥ ⊥','ink'],['polygon','Polygon','ink'],['ropeEnds,support,earth','3rd law','wt'],['app','−m·a','app'],['fluid','Liquid','liquid'],['phone','Phone','acc'],['energy','Energy','vel'],['trail','Trail','muted']];
export function afterLayer(k,on){
  if(k==='two'){if(on){const p=PEN[1];setAngle(p,0,0);p.trail.length=0;p.cross=[];}cam.labS=null;rescaleE();syncSetup();}
  if(k==='drive'){if(on){S.tOff=-S.t;}rescaleE();syncSetup();}
  if(k==='fluid'&&on)FL.ok=false;
  if(k==='phone'||k==='two'||k==='drive')syncG();
}
export function syncLayers(){
  $$('[data-ly]').forEach(b=>{const on=b.dataset.ly.split(',').every(k=>LY[k]);b.setAttribute('aria-pressed',on);b.classList.toggle('on',on);});
  $('#ebars').hidden=!LY.energy;updateReadout(cur());
}

export function syncG(){$$('[data-g]').forEach(b=>{const v=VARS.find(q=>q.k===b.dataset.g);b.hidden=!vAv(v);b.classList.toggle('on',gSel.has(b.dataset.g));});$('#gchips').classList.toggle('dim',G.mode==='phase');}

export const kFromR=v=>5*Math.pow(400,v/100),rFromK=k=>100*Math.log(k/5)/Math.log(400);
export const fFromR=v=>.05*Math.pow(800,v/100),rFromF=f=>100*Math.log(f/.05)/Math.log(800);
export const binds=[];
export function bindR(id,lab,get,set,show){const r=$(id);const upd=()=>{$(lab).textContent=show();};const pull=()=>{r.value=get();upd();};r.oninput=()=>{set(+r.value);upd();};pull();binds.push(pull);}
export const syncBinds=()=>binds.forEach(f=>f());
export const NOTES={rod:'A massless rigid rod. It keeps the length fixed and can pull or push.',string:'A massless string. It can only pull: if the tension would turn negative it goes slack.',elastic:'A rope that stretches like a spring, T = k(r − L). Slack when shorter than L.'};
export function setModel(m){
  P.model=m;segSet('#modelSeg',m);
  for(const p of PEN){const r=Math.hypot(p.x,p.y);
    if(m==='rod')enterPolar(p);else if(m==='string'){if(!p.polar&&r>=Lp(p.i))enterPolar(p);}else p.polar=false;}
  cam.labS=null;rescaleE();syncSetup();syncG();
}
export function syncSetup(){
  $('#modelNote').textContent=NOTES[P.model];$('#kCtl').hidden=P.model!=='elastic';
  $('#betaCtl').classList.toggle('dim',P.model!=='rod');
  $('#driveBox').classList.toggle('dim',!LY.drive);
  $('#twoBox').classList.toggle('dim',!LY.two);$('#kapCtl').hidden=!P.coupled;$('#thBWrap').hidden=!LY.two;
  $('#zCtl').querySelector('label').firstChild.textContent=P.liquid==='simple'?'Sloshing damping ':'Viscosity ';
}
export const f0=()=>P.g>0?Math.sqrt(P.g/P.L)/TAU:.5;

export function initUI(){
$('#playBtn').onclick=()=>setPlaying(!S.playing);
$('#stepBtn').onclick=()=>{setPlaying(false);const n=40,h=.02/n;let A;for(let i=0;i<n;i++){A=step(h);if(P.liquid==='simple')fluidStep(h,A[0].geff);S.samp+=h;if(S.samp>=.01){S.samp=0;sample(A);}}if(P.liquid==='particles')liquidAdvance(.02,A[0].geff);};
$('#resetBtn').onclick=()=>{resetToRelease();toast('Back to the last release');};
segBind('#speedSeg',v=>{S.speed=+v;});
segBind('#viewSeg',v=>setView(v));
// layers: show list + quick chips
$('#showList').innerHTML=SHOW.map(([g,items])=>`<h3 class="grp">${g}</h3>`+items.map(([k,l,c,s])=>
  `<button class="tg" data-ly="${k}"><span class="sw${DOT.has(k)?' dot':''}" style="${DOT.has(k)?`background:var(--${c})`:`color:var(--${c})`}"></span><span class="txt">${l}${s?`<small>${s}</small>`:''}</span><span class="box"></span></button>`).join('')).join('');
$('#quick').innerHTML=QUICK.map(([k,l,c])=>`<button class="lg" data-ly="${k}" style="color:var(--${c})"><span class="vs"></span><span style="color:var(--ink)">${l}</span></button>`).join('');
document.addEventListener('click',e=>{const b=e.target.closest('[data-ly]');if(!b)return;const ks=b.dataset.ly.split(','),on=!ks.every(k=>LY[k]);ks.forEach(k=>LY[k]=on);ks.forEach(k=>afterLayer(k,on));syncLayers();});
// tabs
$$('.tab').forEach(t=>t.onclick=()=>{$$('.tab').forEach(x=>x.classList.toggle('on',x===t));$$('.tabpane').forEach(p=>p.hidden=p.id!=='pane-'+t.dataset.tab);resize();});
// graphs controls
$('#gchips').innerHTML=VARS.map(v=>`<button class="lg" data-g="${v.k}"><i style="background:var(--${v.c})"></i>${v.l}</button>`).join('');
$$('[data-g]').forEach(b=>b.onclick=()=>{const k=b.dataset.g;if(gSel.has(k))gSel.delete(k);else{const n=VARS.filter(v=>gSel.has(v.k)&&vAv(v)).length;if(n>=5){toast('Up to 5 graphs at once');return;}gSel.add(k);}syncG();});
segBind('#G.mode',v=>{G.mode=v;syncG();});segBind('#G.win',v=>{G.win=+v;});
$('#csvBtn').onclick=async()=>{
  const txt=csv(),ta=$('#csvOut');
  try{await navigator.clipboard.writeText(txt);toast(`Copied ${DATA.t.length} rows`);ta.hidden=true;}
  catch{ta.hidden=false;ta.value=txt;ta.focus();ta.select();toast('Copy blocked: the data is selected below');}
};
// setup controls
bindR('#LR','#LL',()=>P.L,v=>{P.L=v;const p=PEN[0];if(p.polar)syncCart(p);else if(P.model==='string'&&Math.hypot(p.x,p.y)>=P.L)enterPolar(p);cam.labS=null;rescaleE();},()=>P.L.toFixed(2)+' m');
bindR('#mR','#mL',()=>P.m,v=>{P.m=v;rescaleE();},()=>P.m.toFixed(2)+' kg');
bindR('#gR','#gL',()=>P.g,v=>{P.g=v;segSet('#gSeg','');rescaleE();},()=>P.g.toFixed(2)+' m/s²');
bindR('#cR','#cL',()=>P.c,v=>{P.c=v;},()=>P.c===0?'off':P.c.toFixed(3)+' kg/m');
bindR('#bR','#bL',()=>P.b,v=>{P.b=v;},()=>P.b===0?'off':P.b.toFixed(2)+' kg/s');
bindR('#betaR','#betaL',()=>P.beta,v=>{P.beta=v;},()=>P.beta===0?'off':P.beta.toFixed(3)+' N·m·s');
bindR('#kR','#kL',()=>rFromK(P.k),v=>{P.k=kFromR(v);rescaleE();},()=>P.k.toFixed(0)+' N/m');
bindR('#fillR','#fillL',()=>P.fill,v=>{P.fill=v;FL.ok=false;},()=>Math.round(P.fill*100)+'%');
bindR('#zR','#zL',()=>P.zeta,v=>{P.zeta=v;},()=>P.zeta<.1?'low':P.zeta<.35?'medium':'high');
bindR('#arrowR','#arrowL',()=>P.arrow,v=>{P.arrow=v;},()=>P.arrow.toFixed(2)+'×');
bindR('#dAR','#dAL',()=>P.dA,v=>{P.dA=v;},()=>(P.dA*100).toFixed(1)+' cm');
bindR('#dFR','#dFL',()=>rFromF(P.dF),v=>{P.dF=fFromR(v);},()=>{const f0=P.g>0?Math.sqrt(P.g/P.L)/TAU:0;return P.dF.toFixed(2)+' Hz'+(f0?` (${(P.dF/f0).toFixed(2)} f₀)`:'');});
bindR('#LBR','#LBL',()=>P.LB,v=>{P.LB=v;const p=PEN[1];if(p.polar)syncCart(p);cam.labS=null;rescaleE();},()=>P.LB.toFixed(2)+' m');
bindR('#mBR','#mBL',()=>P.mB,v=>{P.mB=v;rescaleE();},()=>P.mB.toFixed(2)+' kg');
bindR('#dR','#dL',()=>P.d,v=>{P.d=v;cam.labS=null;rescaleE();},()=>P.d.toFixed(2)+' m');
bindR('#kapR','#kapL',()=>P.kap,v=>{P.kap=v;rescaleE();},()=>P.kap.toFixed(1)+' N/m');
segSet('#gSeg','9.81');
segBind('#gSeg',v=>{P.g=+v;syncBinds();rescaleE();});
segBind('#dSeg',v=>{P.dDir=v;cam.labS=null;syncG();});
segBind('#lqSeg',v=>{P.liquid=v;FL.ok=false;S.psid=0;syncSetup();if(!LY.fluid){LY.fluid=true;syncLayers();}});
segBind('#cpSeg',v=>{P.coupled=v==='spring';syncSetup();syncG();rescaleE();});
segBind('#modelSeg',v=>setModel(v));
$('#relBtn').onclick=()=>{const th=parseFloat($('#th0').value)||0,v=parseFloat($('#v0').value)||0,tb=parseFloat($('#thB').value)||0;if(S.view!=='lab')setView('lab');releaseAngle(clamp(th,-180,180),clamp(v,-30,30),clamp(tb,-180,180));};
$('#dMatch').onclick=()=>{P.dF=f0();syncBinds();toast(`Drive set to f₀ = ${P.dF.toFixed(3)} Hz`);};
$('#dRes').onclick=()=>{if(!LY.drive){LY.drive=true;afterLayer('drive',true);}P.dDir='h';segSet('#dSeg','h');P.dA=.01;P.dF=f0();P.c=0;P.b=0;P.beta=0;syncBinds();syncLayers();syncG();releaseAngle(0,0,0);toast('Resonance: watch the amplitude grow');};
$('#dKap').onclick=()=>{if(!LY.drive){LY.drive=true;afterLayer('drive',true);}setModel('rod');P.dDir='v';segSet('#dSeg','v');P.dA=.05;P.dF=30;P.beta=0;syncBinds();syncLayers();syncG();releaseAngle(165,0,0);toast('Kapitza: fast vertical shaking keeps it upside down');};
// help + keys
const help=$('#help');[$('#helpBtn'),$('#helpBtn2'),$('#helpBtn3')].forEach(b=>b&&(b.onclick=()=>help.showModal()));$('#helpClose').onclick=()=>help.close();
document.addEventListener('keydown',e=>{if(e.target.matches('input,select,textarea')||help.open)return;
  if(e.code==='Space'){e.preventDefault();setPlaying(!S.playing);}else if(e.key==='r'||e.key==='R')resetToRelease();else if(e.key==='v'||e.key==='V')setView(S.view==='lab'?'ball':'lab');});
}
