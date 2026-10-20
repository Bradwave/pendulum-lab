// Pendulum Lab · util.js
// Small shared helpers: DOM shortcuts, constants, math and number formatting.
export const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
export const TAU=Math.PI*2,RB=0.05,DEG=180/Math.PI;
export const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const lerp=(a,b,t)=>a+(b-a)*t;
export const ease=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;

export const fmt=(v,d=2)=>Math.abs(v)>=100?v.toFixed(0):Math.abs(v)>=10?v.toFixed(1):v.toFixed(d);
export const mag=v=>Math.hypot(v[0],v[1]);
