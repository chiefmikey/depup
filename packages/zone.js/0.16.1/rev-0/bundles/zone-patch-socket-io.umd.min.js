'use strict';
/**
 * @license Angular
 * (c) 2010-2026 Google LLC. https://angular.dev/
 * License: MIT
 */(function(g,f){if(typeof define=="function"&&define.amd){define(f)}else if(typeof exports=="object" && typeof module<"u"){module.exports=f()}else{var m=f();for(var i in m) g[i]=m[i]}}(typeof globalThis < "u" ? globalThis : typeof self < "u" ? self : this,function(){var exports={};var __exports=exports;var module={exports};
"use strict";(function(t,o){if(typeof define=="function"&&define.amd)define(o);else if(typeof exports=="object"&&typeof module<"u")module.exports=o();else{var r=o();for(var n in r)t[n]=r[n]}})(typeof globalThis<"u"?globalThis:typeof self<"u"?self:exports,function(){var t={},o=t,r={exports:t};function n(f){f.__load_patch("socketio",function(s,p,c){p[p.__symbol__("socketio")]=function(e){c.patchEventTarget(s,c,[e.Socket.prototype],{useG:!1,chkDup:!1,rt:!0,diff:function(a,i){return a.callback===i}}),e.Socket.prototype.on=e.Socket.prototype.addEventListener,e.Socket.prototype.off=e.Socket.prototype.removeListener=e.Socket.prototype.removeAllListeners=e.Socket.prototype.removeEventListener}})}return n(Zone),o!=t&&(r.exports=t),r.exports});

if(__exports != exports)module.exports = exports;return module.exports}));
