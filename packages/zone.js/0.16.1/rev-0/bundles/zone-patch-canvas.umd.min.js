'use strict';
/**
 * @license Angular
 * (c) 2010-2026 Google LLC. https://angular.dev/
 * License: MIT
 */(function(g,f){if(typeof define=="function"&&define.amd){define(f)}else if(typeof exports=="object" && typeof module<"u"){module.exports=f()}else{var m=f();for(var i in m) g[i]=m[i]}}(typeof globalThis < "u" ? globalThis : typeof self < "u" ? self : this,function(){var exports={};var __exports=exports;var module={exports};
"use strict";(function(e,t){if(typeof define=="function"&&define.amd)define(t);else if(typeof exports=="object"&&typeof module<"u")module.exports=t();else{var o=t();for(var n in o)e[n]=o[n]}})(typeof globalThis<"u"?globalThis:typeof self<"u"?self:exports,function(){var e={},t=e,o={exports:e};function n(r){r.__load_patch("canvas",function(f,l,s){var a=f.HTMLCanvasElement;typeof a!="undefined"&&a.prototype&&a.prototype.toBlob&&s.patchMacroTask(a.prototype,"toBlob",function(p,i){return{name:"HTMLCanvasElement.toBlob",target:p,cbIdx:0,args:i}})})}return n(Zone),t!=e&&(o.exports=e),o.exports});

if(__exports != exports)module.exports = exports;return module.exports}));
