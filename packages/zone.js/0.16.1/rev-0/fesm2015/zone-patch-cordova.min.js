'use strict';
/**
 * @license Angular
 * (c) 2010-2026 Google LLC. https://angular.dev/
 * License: MIT
 */
function i(n){n.__load_patch("cordova",(o,t,c)=>{if(o.cordova){let d="cordova.exec.success",r="cordova.exec.error",a="function",p=c.patchMethod(o.cordova,"exec",()=>function(f,e){return e.length>0&&typeof e[0]===a&&(e[0]=t.current.wrap(e[0],d)),e.length>1&&typeof e[1]===a&&(e[1]=t.current.wrap(e[1],r)),p.apply(f,e)})}}),n.__load_patch("cordova.FileReader",(o,t)=>{o.cordova&&typeof o.FileReader!="undefined"&&document.addEventListener("deviceReady",()=>{let c=o.FileReader;["abort","error","load","loadstart","loadend","progress"].forEach(d=>{let r=t.__symbol__("ON_PROPERTY"+d);Object.defineProperty(c.prototype,r,{configurable:!0,get:function(){return this._realReader&&this._realReader[r]}})})})})}i(Zone);
