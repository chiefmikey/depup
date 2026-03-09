'use strict';
/**
 * @license Angular
 * (c) 2010-2026 Google LLC. https://angular.dev/
 * License: MIT
 */
function o(t){t.__load_patch("MessagePort",(s,a,r)=>{let e=s.MessagePort;typeof e!="undefined"&&e.prototype&&r.patchOnProperties(e.prototype,["message","messageerror"])})}o(Zone);
