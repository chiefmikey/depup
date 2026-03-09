'use strict';
/**
 * @license Angular
 * (c) 2010-2026 Google LLC. https://angular.dev/
 * License: MIT
 */(function(g,f){if(typeof define=="function"&&define.amd){define(f)}else if(typeof exports=="object" && typeof module<"u"){module.exports=f()}else{var m=f();for(var i in m) g[i]=m[i]}}(typeof globalThis < "u" ? globalThis : typeof self < "u" ? self : this,function(){var exports={};var __exports=exports;var module={exports};
"use strict";(function(t,o){if(typeof define=="function"&&define.amd)define(o);else if(typeof exports=="object"&&typeof module<"u")module.exports=o();else{var n=o();for(var r in n)t[r]=n[r]}})(typeof globalThis<"u"?globalThis:typeof self<"u"?self:exports,function(){var t={},o=t,n={exports:t};function r(l){l.__load_patch("RTCPeerConnection",function(s,a,p){var e=s.RTCPeerConnection;if(e){var i=p.symbol("addEventListener"),f=p.symbol("removeEventListener");e.prototype.addEventListener=e.prototype[i],e.prototype.removeEventListener=e.prototype[f],e.prototype[i]=null,e.prototype[f]=null,p.patchEventTarget(s,p,[e.prototype],{useG:!1})}})}return r(Zone),o!=t&&(n.exports=t),n.exports});

if(__exports != exports)module.exports = exports;return module.exports}));
