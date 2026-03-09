'use strict';
/**
 * @license Angular
 * (c) 2010-2026 Google LLC. https://angular.dev/
 * License: MIT
 */
function i(r){r.__load_patch("notification",(n,c,e)=>{let t=n.Notification;if(!t||!t.prototype)return;let o=Object.getOwnPropertyDescriptor(t.prototype,"onerror");!o||!o.configurable||e.patchOnProperties(t.prototype,null)})}i(Zone);
