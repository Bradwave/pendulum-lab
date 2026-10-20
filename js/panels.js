// Pendulum Lab · panels.js
// Readout box, graphs (versus time and phase plot), period table, CSV export.
import { DATA, VARS, gSel, phone, vAv } from './data.js';
import { LY, P, PEN, S, coupled } from './state.js';
import { $, DEG, TAU, fmt, mag } from './util.js';
import { C, dpr, gctx, gcv } from './view.js';

// ---------- readouts ----------
export function updateReadout(A){
  const el=$('#readout');el.hidden=!LY.readout;if(!LY.readout)return;
  const o=A[0],ball=S.view==='ball';
  const tStr=o.slack&&o.T===0?'<b>slack</b>':o.T<0?`<b>${fmt(-o.T)} N push</b>`:`<b>${fmt(o.T)} N</b>`;
  let h=`<span>t</span><b>${S.t.toFixed(2)} s</b><span>θ</span><b>${(o.th*DEG).toFixed(1)}°</b>`;
  if(!ball)h+=`<span>|v|</span><b>${o.sp.toFixed(2)} m/s</b>`;
  h+=`<span>${ball?'a frame':'|a|'}</span><b>${mag(o.a).toFixed(2)} m/s²</b><span>T</span>${tStr}`;
  if(ball){const ge=mag(o.geff);h+=`<span class="wide">g − a</span><b class="wide">${ge.toFixed(2)} m/s²</b><span>felt</span><b>${P.g>0?(ge/P.g).toFixed(2)+' g':'—'}</b>`;}
  if(P.model==='elastic')h+=`<span>r</span><b>${o.r.toFixed(3)} m</b>`;
  if(LY.phone){const f=phone(o);h+=`<span>phone</span><b>x ${f[0].toFixed(2)} y ${f[1].toFixed(2)}</b>`;}
  if(A[1])h+=`<span>θ B</span><b>${(A[1].th*DEG).toFixed(1)}°</b>`;
  if(ball)h+=`<span class="full">W+T+D${coupled()?'+Fs':''}−ma = 0</span>`;
  if(S.held>=0)h+=`<span class="full">held: let go to release</span>`;
  else if(!S.playing)h+=`<span class="full">paused</span>`;
  el.innerHTML=h;
}

// ---------- graphs ----------
export const G={mode:'time',win:10,phR:{a:1,b:1}};
export function drawGraph(){
  if($('#pane-graphs').hidden)return;
  const w=gcv.clientWidth,h=gcv.clientHeight;if(w<20)return;
  const g=gctx;g.setTransform(dpr,0,0,dpr,0,0);g.fillStyle=C.surface;g.fillRect(0,0,w,h);g.font='10px "Space Mono",monospace';
  const T=DATA.t;
  if(!T.length){g.fillStyle=C.muted;g.textAlign='center';g.fillText('Release the ball to start recording',w/2,h/2);g.textAlign='left';return;}
  const tEnd=T[T.length-1],tStart=Math.max(0,tEnd-G.win);
  let i0;{let lo=0,hi=T.length-1;while(lo<hi){const m=(lo+hi)>>1;if(T[m]<tStart)lo=m+1;else hi=m;}i0=lo;}
  if(G.mode==='phase'){drawPhase(g,w,h,i0);return;}
  const sel=VARS.filter(v=>gSel.has(v.k)&&vAv(v));
  if(!sel.length){g.fillStyle=C.muted;g.textAlign='center';g.fillText('Pick a quantity above',w/2,h/2);g.textAlign='left';return;}
  const padL=8,padR=44,axisH=16,sh=(h-axisH)/sel.length,t0=Math.max(0,tEnd-G.win),t1=tEnd<G.win?G.win:tEnd;
  const X=t=>padL+(t-t0)/(t1-t0)*(w-padL-padR);
  sel.forEach((v,si)=>{
    const arr=DATA[v.k],y0=si*sh,yb=y0+sh;
    let mn=Infinity,mx=-Infinity;for(let i=i0;i<arr.length;i++){if(arr[i]<mn)mn=arr[i];if(arr[i]>mx)mx=arr[i];}
    if(mn>0)mn=0;if(mx<0)mx=0;if(mx-mn<1e-6){mx+=1;}
    const pad=(mx-mn)*.12;mx+=pad;if(mn<0)mn-=pad;
    const Y=val=>yb-6-(val-mn)/(mx-mn)*(sh-20);
    g.strokeStyle=C.gridline;g.lineWidth=1;g.beginPath();g.moveTo(padL,Y(0)+.5);g.lineTo(w-padR,Y(0)+.5);g.stroke();
    if(si>0){g.strokeStyle=C.ink;g.beginPath();g.moveTo(0,y0+.5);g.lineTo(w,y0+.5);g.stroke();}
    const col=C[v.c]||C.ink;g.strokeStyle=col;g.lineWidth=2;g.beginPath();
    for(let i=i0;i<arr.length;i++){const x=X(T[i]),y=Y(arr[i]);i===i0?g.moveTo(x,y):g.lineTo(x,y);}g.stroke();
    const last=arr[arr.length-1];g.fillStyle=col;g.beginPath();g.arc(X(T[T.length-1]),Y(last),3.5,0,TAU);g.fill();
    g.font='700 11px "Space Mono",monospace';g.fillText(`${v.l}  ${fmt(last)} ${v.u}`,padL+2,y0+13);
    g.font='9px "Space Mono",monospace';g.fillStyle=C.muted;g.fillText(fmt(mx-pad,1),w-padR+4,Y(mx-pad)+3);if(mn<0)g.fillText(fmt(mn+pad,1),w-padR+4,Y(mn+pad)+3);g.fillText('0',w-padR+4,Y(0)+3);
  });
  g.strokeStyle=C.ink;g.lineWidth=1.5;g.beginPath();g.moveTo(padL,h-axisH+.5);g.lineTo(w-padR,h-axisH+.5);g.stroke();
  g.fillStyle=C.muted;g.font='9px "Space Mono",monospace';g.textAlign='center';
  const stepT=G.win<=5?1:G.win<=10?2:5;for(let t=Math.ceil(t0/stepT)*stepT;t<=t1;t+=stepT){const x=X(t);g.fillRect(x,h-axisH,1,4);g.fillText(t+' s',x,h-3);}
  g.textAlign='left';
}
export function drawPhase(g,w,h,i0){
  const sets=[[DATA.th,DATA.om,C.acc]];if(LY.two)sets.push([DATA.thB,DATA.om,C.ball2]);
  const A=DATA.th,B=DATA.om;let ma=0,mb=0;for(let i=i0;i<A.length;i++){ma=Math.max(ma,Math.abs(A[i]));mb=Math.max(mb,Math.abs(B[i]));}
  G.phR.a=Math.max(G.phR.a*.995,ma*1.15,5);G.phR.b=Math.max(G.phR.b*.995,mb*1.15,.2);
  const cx=w/2,cy=h/2,X=v=>cx+v/G.phR.a*(w/2-14),Y=v=>cy-v/G.phR.b*(h/2-14);
  g.strokeStyle=C.gridline;g.lineWidth=1;g.beginPath();g.moveTo(8,cy);g.lineTo(w-8,cy);g.moveTo(cx,8);g.lineTo(cx,h-8);g.stroke();
  g.fillStyle=C.muted;g.font='10px "Space Mono",monospace';g.fillText('θ (°) →',w-62,cy-6);g.fillText('ω (rad/s), pendulum A',cx+6,14);
  g.fillText(`±${fmt(G.phR.a,0)}°`,w-50,cy+14);g.fillText(`±${fmt(G.phR.b)}`,cx+6,h-8);
  g.lineWidth=2;
  for(let i=i0+1;i<A.length;i++){if(Math.abs(A[i]-A[i-1])>180)continue;g.globalAlpha=.25+.75*(i-i0)/(A.length-i0);g.strokeStyle=C.acc;g.beginPath();g.moveTo(X(A[i-1]),Y(B[i-1]));g.lineTo(X(A[i]),Y(B[i]));g.stroke();}
  g.globalAlpha=1;const n=A.length-1;g.fillStyle=C.ink;g.beginPath();g.arc(X(A[n]),Y(B[n]),4,0,TAU);g.fill();
}
export function agm(a,b){for(let i=0;i<30;i++){const an=(a+b)/2;b=Math.sqrt(a*b);a=an;}return a;}
export function updatePeriod(){
  const el=$('#ptable');let h='';
  if(P.model==='elastic'){el.innerHTML=`<tr><td>Period<small>With an elastic rope the swing and the bounce mix, so there is no single period.</small></td><td>—</td></tr>`;return;}
  const per=p=>p.cross.length>1?p.cross[p.cross.length-1].t-p.cross[p.cross.length-2].t:null;
  const pa=PEN[0],last=per(pa),amp=pa.cross.length?pa.cross[pa.cross.length-1].amp:0;
  const T0=P.g>0?TAU*Math.sqrt(P.L/P.g):Infinity,Tex=amp>0&&amp<Math.PI-.01?T0/agm(1,Math.cos(amp/2)):null;
  h+=`<tr><td>Measured period${LY.two?' A':''}<small>between two crossings of the vertical in the same direction</small></td><td>${last?last.toFixed(3)+' s':'—'}</td></tr>
  <tr><td>Amplitude of last swing</td><td>${amp?(amp*DEG).toFixed(1)+'°':'—'}</td></tr>
  <tr><td>Small-angle 2π√(L/g)</td><td>${isFinite(T0)?T0.toFixed(3)+' s':'—'}</td></tr>
  <tr><td>Exact for this amplitude<small>alone, no drag, friction or drive</small></td><td>${Tex?Tex.toFixed(3)+' s':'—'}</td></tr>`;
  if(LY.two){const lb=per(PEN[1]),T0B=P.g>0?TAU*Math.sqrt(P.LB/P.g):Infinity;
    h+=`<tr><td>Measured period B</td><td>${lb?lb.toFixed(3)+' s':'—'}</td></tr><tr><td>Small-angle B 2π√(L<sub>B</sub>/g)</td><td>${isFinite(T0B)?T0B.toFixed(3)+' s':'—'}</td></tr>`;
    if(coupled()&&Math.abs(P.L-P.LB)<1e-9&&Math.abs(P.m-P.mB)<1e-9&&P.g>0){
      const w1=Math.sqrt(P.g/P.L),w2=Math.sqrt(P.g/P.L+2*P.kap/P.m);
      h+=`<tr><td>Normal modes<small>in phase √(g/L), opposite phase √(g/L + 2κ/m); small angles</small></td><td>${(TAU/w1).toFixed(3)} s · ${(TAU/w2).toFixed(3)} s</td></tr>
      <tr><td>Energy transfer A→B→A<small>beat period 2π/(ω₂ − ω₁)</small></td><td>${w2>w1?(TAU/(w2-w1)).toFixed(2)+' s':'—'}</td></tr>`;}
  }
  if(LY.drive){const f0=P.g>0?Math.sqrt(P.g/P.L)/TAU:0;h+=`<tr><td>Drive<small>natural frequency f₀ = ${f0.toFixed(3)} Hz</small></td><td>${P.dF.toFixed(2)} Hz · ${f0?(P.dF/f0).toFixed(2):'—'} f₀</td></tr>`;}
  el.innerHTML=h;
}
export function csv(){
  const vs=VARS.filter(vAv),head=['t (s)',...vs.map(v=>`${v.l} (${v.u})`)].map(s=>`"${s}"`).join(',');
  const rows=DATA.t.map((t,i)=>[t.toFixed(3),...vs.map(v=>+DATA[v.k][i].toPrecision(6))].join(','));
  return head+'\n'+rows.join('\n');
}
