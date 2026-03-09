'use strict';
/**
 * @license Angular
 * (c) 2010-2026 Google LLC. https://angular.dev/
 * License: MIT
 */
var u=(e=>typeof require!="undefined"?require:typeof Proxy!="undefined"?new Proxy(e,{get:(n,o)=>(typeof require!="undefined"?require:n)[o]}):e)(function(e){if(typeof require!="undefined")return require.apply(this,arguments);throw Error('Dynamic require of "'+e+'" is not supported')});function d(e){e.__load_patch("electron",(n,o,c)=>{function r(i,h,f){return c.patchMethod(i,h,s=>(g,y)=>s&&s.apply(g,c.bindArguments(y,f)))}let{desktopCapturer:l,shell:a,CallbacksRegistry:t,ipcRenderer:p}=u("electron");if(!t)try{t=u("@electron/remote/dist/src/renderer/callbacks-registry").CallbacksRegistry}catch(i){}if(l&&r(l,"getSources","electron.desktopCapturer.getSources"),a&&r(a,"openExternal","electron.shell.openExternal"),!t){p&&r(p,"on","ipcRenderer.on");return}r(t.prototype,"add","CallbackRegistry.add")})}d(Zone);
