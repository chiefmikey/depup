'use strict';
/**
 * @license Angular
 * (c) 2010-2026 Google LLC. https://angular.dev/
 * License: MIT
 */(function(g,f){if(typeof define=="function"&&define.amd){define(f)}else if(typeof exports=="object" && typeof module<"u"){module.exports=f()}else{var m=f();for(var i in m) g[i]=m[i]}}(typeof globalThis < "u" ? globalThis : typeof self < "u" ? self : this,function(){var exports={};var __exports=exports;var module={exports};
"use strict";(function(e,t){if(typeof define=="function"&&define.amd)define(t);else if(typeof exports=="object"&&typeof module<"u")module.exports=t();else{var r=t();for(var a in r)e[a]=r[a]}})(typeof globalThis<"u"?globalThis:typeof self<"u"?self:exports,function(){var e={},t=e,r={exports:e};function a(s){s.__load_patch("getUserMedia",function(f,g,p){function u(i,o){return function(){var l=Array.prototype.slice.call(arguments),d=p.bindArguments(l,o||i.name);return i.apply(this,d)}}var n=f.navigator;n&&n.getUserMedia&&(n.getUserMedia=u(n.getUserMedia))})}return a(Zone),t!=e&&(r.exports=e),r.exports});

if(__exports != exports)module.exports = exports;return module.exports}));
