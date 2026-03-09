'use strict';
/**
 * @license Angular
 * (c) 2010-2026 Google LLC. https://angular.dev/
 * License: MIT
 */
function a(o){o.__load_patch("canvas",(e,c,n)=>{let t=e.HTMLCanvasElement;typeof t!="undefined"&&t.prototype&&t.prototype.toBlob&&n.patchMacroTask(t.prototype,"toBlob",(p,r)=>({name:"HTMLCanvasElement.toBlob",target:p,cbIdx:0,args:r}))})}a(Zone);
