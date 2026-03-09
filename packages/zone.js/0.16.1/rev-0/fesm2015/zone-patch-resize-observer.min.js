'use strict';
/**
 * @license Angular
 * (c) 2010-2026 Google LLC. https://angular.dev/
 * License: MIT
 */
function y(a){a.__load_patch("ResizeObserver",(b,f,u)=>{let p=b.ResizeObserver;if(!p)return;let i=u.symbol("ResizeObserver");u.patchMethod(b,"ResizeObserver",c=>(n,e)=>{let t=e.length>0?e[0]:null;return t&&(e[0]=function(r,s){let h={},d=f.current;for(let l of r){let o=l.target[i];o||(o=d);let z=h[o.name];z||(h[o.name]=z={entries:[],zone:o}),z.entries.push(l)}Object.keys(h).forEach(l=>{let o=h[l];o.zone!==f.current?o.zone.run(t,this,[o.entries,s],"ResizeObserver"):t.call(this,o.entries,s)})}),e.length>0?new p(e[0]):new p}),u.patchMethod(p.prototype,"observe",c=>(n,e)=>{let t=e.length>0?e[0]:null;if(!t)return c.apply(n,e);let r=n[i];return r||(r=n[i]=[]),r.push(t),t[i]=f.current,c.apply(n,e)}),u.patchMethod(p.prototype,"unobserve",c=>(n,e)=>{let t=e.length>0?e[0]:null;if(!t)return c.apply(n,e);let r=n[i];if(r){for(let s=0;s<r.length;s++)if(r[s]===t){r.splice(s,1);break}}return t[i]=void 0,c.apply(n,e)}),u.patchMethod(p.prototype,"disconnect",c=>(n,e)=>{let t=n[i];return t&&(t.forEach(r=>{r[i]=void 0}),n[i]=void 0),c.apply(n,e)})})}y(Zone);
