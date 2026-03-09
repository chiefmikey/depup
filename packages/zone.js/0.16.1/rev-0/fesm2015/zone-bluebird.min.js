'use strict';
/**
 * @license Angular
 * (c) 2010-2026 Google LLC. https://angular.dev/
 * License: MIT
 */
function a(l){l.__load_patch("bluebird",(p,r,c)=>{let f="bluebird";r[r.__symbol__(f)]=function(i){["then","spread","finally"].forEach(e=>{c.patchMethod(i.prototype,e,o=>(n,t)=>{let u=r.current;for(let s=0;s<t.length;s++){let d=t[s];typeof d=="function"&&(t[s]=function(){let h=this,y=arguments;return new i((m,b)=>{u.scheduleMicroTask("Promise.then",()=>{try{m(d.apply(h,y))}catch(_){b(_)}})})})}return o.apply(n,t)})}),typeof window!="undefined"?window.addEventListener("unhandledrejection",function(e){let o=e.detail&&e.detail.reason;o&&o.isHandledByZone&&(e.preventDefault(),typeof e.stopImmediatePropagation=="function"&&e.stopImmediatePropagation())}):typeof process!="undefined"&&process.on("unhandledRejection",(e,o)=>{if(e&&e.isHandledByZone){let n=process.listeners("unhandledRejection");n&&(process.removeAllListeners("unhandledRejection"),process.nextTick(()=>{n.forEach(t=>process.on("unhandledRejection",t))}))}}),i.onPossiblyUnhandledRejection(function(e,o){try{r.current.runGuarded(()=>{throw e.isHandledByZone=!0,e})}catch(n){n.isHandledByZone=!1,c.onUnhandledError(n)}}),p.Promise=i}})}a(Zone);
