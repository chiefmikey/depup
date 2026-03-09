'use strict';
/**
 * @license Angular
 * (c) 2010-2026 Google LLC. https://angular.dev/
 * License: MIT
 */
function r(i){i.__load_patch("promisefortest",(l,o,s)=>{let m=s.symbol("state"),c=null,P=s.symbol("parentUnresolved");Promise[s.symbol("patchPromiseForTest")]=function(){let e=Promise[o.__symbol__("ZonePromiseThen")];e||(e=Promise[o.__symbol__("ZonePromiseThen")]=Promise.prototype.then,Promise.prototype.then=function(){let t=e.apply(this,arguments);if(this[m]===c){let n=o.current.get("AsyncTestZoneSpec");n&&(n.unresolvedChainedPromiseCount++,t[P]=!0)}return t})},Promise[s.symbol("unPatchPromiseForTest")]=function(){let e=Promise[o.__symbol__("ZonePromiseThen")];e&&(Promise.prototype.then=e,Promise[o.__symbol__("ZonePromiseThen")]=void 0)}})}r(Zone);
