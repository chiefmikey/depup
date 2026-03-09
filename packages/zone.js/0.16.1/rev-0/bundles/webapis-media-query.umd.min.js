'use strict';
/**
 * @license Angular
 * (c) 2010-2026 Google LLC. https://angular.dev/
 * License: MIT
 */(function(g,f){if(typeof define=="function"&&define.amd){define(f)}else if(typeof exports=="object" && typeof module<"u"){module.exports=f()}else{var m=f();for(var i in m) g[i]=m[i]}}(typeof globalThis < "u" ? globalThis : typeof self < "u" ? self : this,function(){var exports={};var __exports=exports;var module={exports};
"use strict";(function(r,u){if(typeof define=="function"&&define.amd)define(u);else if(typeof exports=="object"&&typeof module<"u")module.exports=u();else{var f=u();for(var l in f)r[l]=f[l]}})(typeof globalThis<"u"?globalThis:typeof self<"u"?self:exports,function(){var r={},u=r,f={exports:r};function l(h){h.__load_patch("mediaQuery",function(y,v,c){function d(o){c.patchMethod(o,"addListener",function(n){return function(i,e){var t=e.length>0?e[0]:null;if(typeof t=="function"){var a=v.current.wrap(t,"MediaQuery");return t[c.symbol("mediaQueryCallback")]=a,n.call(i,a)}else return n.apply(i,e)}})}function s(o){c.patchMethod(o,"removeListener",function(n){return function(i,e){var t=e.length>0?e[0]:null;if(typeof t=="function"){var a=t[c.symbol("mediaQueryCallback")];return a?n.call(i,a):n.apply(i,e)}else return n.apply(i,e)}})}if(y.MediaQueryList){var p=y.MediaQueryList.prototype;d(p),s(p)}else y.matchMedia&&c.patchMethod(y,"matchMedia",function(o){return function(n,i){var e=o.apply(n,i);if(e){var t=Object.getPrototypeOf(e);t&&t.addListener?(d(t),s(t),d(e),s(e)):e.addListener&&(d(e),s(e))}return e}})})}return l(Zone),u!=r&&(f.exports=r),f.exports});

if(__exports != exports)module.exports = exports;return module.exports}));
