'use strict';
/**
 * @license Angular
 * (c) 2010-2026 Google LLC. https://angular.dev/
 * License: MIT
 */
var l=Object.defineProperty;var g=(r,e,n)=>e in r?l(r,e,{enumerable:!0,configurable:!0,writable:!0,value:n}):r[e]=n;var c=(r,e,n)=>(g(r,typeof e!="symbol"?e+"":e,n),n);var T=class{constructor(){c(this,"name","TaskTrackingZone");c(this,"microTasks",[]);c(this,"macroTasks",[]);c(this,"eventTasks",[]);c(this,"properties",{TaskTrackingZone:this})}static get(){return Zone.current.get("TaskTrackingZone")}getTasksFor(e){switch(e){case"microTask":return this.microTasks;case"macroTask":return this.macroTasks;case"eventTask":return this.eventTasks}throw new Error("Unknown task format: "+e)}onScheduleTask(e,n,o,s){return s.creationLocation=new Error(`Task '${s.type}' from '${s.source}'.`),this.getTasksFor(s.type).push(s),e.scheduleTask(o,s)}onCancelTask(e,n,o,s){let t=this.getTasksFor(s.type);for(let a=0;a<t.length;a++)if(t[a]==s){t.splice(a,1);break}return e.cancelTask(o,s)}onInvokeTask(e,n,o,s,t,a){var h;if(s.type==="eventTask"||(h=s.data)!=null&&h.isPeriodic)return e.invokeTask(o,s,t,a);let k=this.getTasksFor(s.type);for(let i=0;i<k.length;i++)if(k[i]==s){k.splice(i,1);break}return e.invokeTask(o,s,t,a)}clearEvents(){for(;this.eventTasks.length;)Zone.current.cancelTask(this.eventTasks[0])}};function u(r){r.TaskTrackingZoneSpec=T}u(Zone);
