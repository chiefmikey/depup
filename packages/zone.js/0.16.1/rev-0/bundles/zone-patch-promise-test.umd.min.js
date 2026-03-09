'use strict';
/**
 * @license Angular
 * (c) 2010-2026 Google LLC. https://angular.dev/
 * License: MIT
 */(function(g,f){if(typeof define=="function"&&define.amd){define(f)}else if(typeof exports=="object" && typeof module<"u"){module.exports=f()}else{var m=f();for(var i in m) g[i]=m[i]}}(typeof globalThis < "u" ? globalThis : typeof self < "u" ? self : this,function(){var exports={};var __exports=exports;var module={exports};
"use strict";(function(e,r){if(typeof define=="function"&&define.amd)define(r);else if(typeof exports=="object"&&typeof module<"u")module.exports=r();else{var t=r();for(var i in t)e[i]=t[i]}})(typeof globalThis<"u"?globalThis:typeof self<"u"?self:exports,function(){var e={},r=e,t={exports:e};function i(a){a.__load_patch("promisefortest",function(P,s,n){var f=n.symbol("state"),u=null,h=n.symbol("parentUnresolved");Promise[n.symbol("patchPromiseForTest")]=function(){var o=Promise[s.__symbol__("ZonePromiseThen")];o||(o=Promise[s.__symbol__("ZonePromiseThen")]=Promise.prototype.then,Promise.prototype.then=function(){var m=o.apply(this,arguments);if(this[f]===u){var l=s.current.get("AsyncTestZoneSpec");l&&(l.unresolvedChainedPromiseCount++,m[h]=!0)}return m})},Promise[n.symbol("unPatchPromiseForTest")]=function(){var o=Promise[s.__symbol__("ZonePromiseThen")];o&&(Promise.prototype.then=o,Promise[s.__symbol__("ZonePromiseThen")]=void 0)}})}return i(Zone),r!=e&&(t.exports=e),t.exports});

if(__exports != exports)module.exports = exports;return module.exports}));
