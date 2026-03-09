'use strict';
/**
 * @license Angular
 * (c) 2010-2026 Google LLC. https://angular.dev/
 * License: MIT
 */
function p(c){c.__load_patch("RTCPeerConnection",(o,s,t)=>{let e=o.RTCPeerConnection;if(!e)return;let n=t.symbol("addEventListener"),r=t.symbol("removeEventListener");e.prototype.addEventListener=e.prototype[n],e.prototype.removeEventListener=e.prototype[r],e.prototype[n]=null,e.prototype[r]=null,t.patchEventTarget(o,t,[e.prototype],{useG:!1})})}p(Zone);
