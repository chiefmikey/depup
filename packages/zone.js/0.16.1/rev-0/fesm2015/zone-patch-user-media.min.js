'use strict';
/**
 * @license Angular
 * (c) 2010-2026 Google LLC. https://angular.dev/
 * License: MIT
 */
function a(n){n.__load_patch("getUserMedia",(i,c,o)=>{function s(t,r){return function(){let p=Array.prototype.slice.call(arguments),g=o.bindArguments(p,r||t.name);return t.apply(this,g)}}let e=i.navigator;e&&e.getUserMedia&&(e.getUserMedia=s(e.getUserMedia))})}a(Zone);
