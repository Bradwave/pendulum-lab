// Pendulum Lab · data.js
// Recorded quantities for the graphs, period detection, phone-sensor readings.
import { LY, P, PEN, S, coupled } from './state.js';
import { DEG } from './util.js';

// ---------- data for graphs ----------
export const VARS=[
  {k:'th',l:'θ angle',u:'°',c:'ink',f:A=>A[0].th*DEG},
  {k:'om',l:'ω',u:'rad/s',c:'vel',f:A=>A[0].om},
  {k:'vt',l:'v along path',u:'m/s',c:'vel',f:A=>A[0].vt},
  {k:'sp',l:'|v| speed',u:'m/s',c:'vel',f:A=>A[0].sp},
  {k:'at',l:'a⊥ tangential',u:'m/s²',c:'acc',f:A=>A[0].at},
  {k:'ac',l:'a∥ centripetal',u:'m/s²',c:'acc',f:A=>A[0].ac},
  {k:'am',l:'|a|',u:'m/s²',c:'acc',f:A=>Math.hypot(A[0].a[0],A[0].a[1])},
  {k:'T',l:'T rope force',u:'N',c:'ten',f:A=>A[0].T},
  {k:'x',l:'x',u:'m',c:'ink',f:A=>A[0].x},
  {k:'h',l:'height',u:'m',c:'wt',f:A=>A[0].y+P.L},
  {k:'r',l:'rope length',u:'m',c:'ten',f:A=>A[0].r,av:()=>P.model==='elastic'},
  {k:'xp',l:'support x',u:'m',c:'ink',f:A=>A[0].pv[0],av:()=>LY.drive&&P.dDir==='h'},
  {k:'yp',l:'support y',u:'m',c:'ink',f:A=>A[0].pv[1],av:()=>LY.drive&&P.dDir==='v'},
  {k:'phx',l:'phone aₓ',u:'m/s²',c:'acc',f:A=>phone(A[0])[0],av:()=>LY.phone},
  {k:'phy',l:'phone aᵧ',u:'m/s²',c:'acc',f:A=>phone(A[0])[1],av:()=>LY.phone},
  {k:'phm',l:'phone |a|',u:'m/s²',c:'acc',f:A=>Math.hypot(...phone(A[0])),av:()=>LY.phone},
  {k:'gyr',l:'gyroscope ω_z',u:'rad/s',c:'vel',f:A=>A[0].om,av:()=>LY.phone},
  {k:'thB',l:'θ B',u:'°',c:'ball2',f:A=>A[1]?A[1].th*DEG:0,av:()=>LY.two},
  {k:'vtB',l:'v B',u:'m/s',c:'ball2',f:A=>A[1]?A[1].vt:0,av:()=>LY.two},
  {k:'TB',l:'T B',u:'N',c:'ball2',f:A=>A[1]?A[1].T:0,av:()=>LY.two},
  {k:'EA',l:'E of A (K+U)',u:'J',c:'ink',f:A=>A[0].K+A[0].U+A[0].Ue,av:()=>LY.two},
  {k:'EB',l:'E of B (K+U)',u:'J',c:'ball2',f:A=>A[1]?A[1].K+A[1].U+A[1].Ue:0,av:()=>LY.two},
  {k:'K',l:'K kinetic',u:'J',c:'vel',f:A=>A.K},
  {k:'U',l:'U grav.',u:'J',c:'wt',f:A=>A.U},
  {k:'Ue',l:'U elastic',u:'J',c:'ten',f:A=>A.Ue,av:()=>P.model==='elastic'},
  {k:'Us',l:'U spring',u:'J',c:'spr',f:A=>A.Us,av:()=>coupled()},
  {k:'Q',l:'Q dissipated',u:'J',c:'drag',f:()=>S.Ed},
  {k:'Wd',l:'W by the drive',u:'J',c:'ink',f:()=>S.Wd,av:()=>LY.drive},
  {k:'E',l:'E total',u:'J',c:'ink',f:A=>A.E}
];
export const vAv=v=>!v.av||v.av();
export function phone(o){const f=LY.phoneG?[o.a[0],o.a[1]+P.g]:o.a;return[f[0]*o.px+f[1]*o.py,-(f[0]*o.ux+f[1]*o.uy)];}
export const gSel=new Set(['th','vt','T']);
export const DATA={t:[]};VARS.forEach(v=>DATA[v.k]=[]);
export function clearData(){for(const k in DATA)DATA[k].length=0;for(const p of PEN){p.cross=[];p.amp=0;p.trail.length=0;}}
export function sample(A){DATA.t.push(S.t);for(const v of VARS)DATA[v.k].push(v.f(A));if(DATA.t.length>2600)for(const k in DATA)DATA[k].splice(0,400);}
export function periodTrack(o,h){
  const p=o.p,phi=o.th,prev=p.lastPhi;p.amp=Math.max(p.amp,Math.abs(phi));
  if(prev<0&&phi>=0&&Math.abs(prev)<1.5){const tc=S.t-h*phi/(phi-prev||1e-9);p.cross.push({t:tc,amp:p.amp});p.amp=0;if(p.cross.length>12)p.cross.shift();}
  p.lastPhi=phi;
}
