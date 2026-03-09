'use strict';
/**
 * @license Angular
 * (c) 2010-2026 Google LLC. https://angular.dev/
 * License: MIT
 */
function c(r){r.__load_patch("socketio",(p,e,o)=>{e[e.__symbol__("socketio")]=function(t){o.patchEventTarget(p,o,[t.Socket.prototype],{useG:!1,chkDup:!1,rt:!0,diff:(k,n)=>k.callback===n}),t.Socket.prototype.on=t.Socket.prototype.addEventListener,t.Socket.prototype.off=t.Socket.prototype.removeListener=t.Socket.prototype.removeAllListeners=t.Socket.prototype.removeEventListener}})}c(Zone);
