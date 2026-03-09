'use strict';
/**
 * @license Angular
 * (c) 2010-2026 Google LLC. https://angular.dev/
 * License: MIT
 */
function i(k){k.__load_patch("jsonp",(s,o,c)=>{let l=function(){};o[o.__symbol__("jsonp")]=function(e){if(!e||!e.jsonp||!e.sendFuncName)return;let a=function(){};[e.successFuncName,e.failedFuncName].forEach(t=>{if(!t)return;s[t]?c.patchMethod(s,t,n=>(u,r)=>{let p=s[c.symbol("jsonTask")];return p?(p.callback=n,p.invoke.apply(u,r)):n.apply(u,r)}):Object.defineProperty(s,t,{configurable:!0,enumerable:!0,get:function(){return function(){let n=s[c.symbol("jsonpTask")],u=this?this:s,r=s[c.symbol(`jsonp${t}callback`)];return n?(r&&(n.callback=r),s[c.symbol("jsonpTask")]=void 0,n.invoke.apply(this,arguments)):r?r.apply(this,arguments):null}},set:function(n){this[c.symbol(`jsonp${t}callback`)]=n}})}),c.patchMethod(e.jsonp,e.sendFuncName,t=>(f,n)=>{s[c.symbol("jsonpTask")]=o.current.scheduleMacroTask("jsonp",a,{},u=>t.apply(f,n),a)})}})}i(Zone);
