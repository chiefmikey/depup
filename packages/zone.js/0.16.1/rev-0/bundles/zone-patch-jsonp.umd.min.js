'use strict';
/**
 * @license Angular
 * (c) 2010-2026 Google LLC. https://angular.dev/
 * License: MIT
 */(function(g,f){if(typeof define=="function"&&define.amd){define(f)}else if(typeof exports=="object" && typeof module<"u"){module.exports=f()}else{var m=f();for(var i in m) g[i]=m[i]}}(typeof globalThis < "u" ? globalThis : typeof self < "u" ? self : this,function(){var exports={};var __exports=exports;var module={exports};
"use strict";(function(u,o){if(typeof define=="function"&&define.amd)define(o);else if(typeof exports=="object"&&typeof module<"u")module.exports=o();else{var f=o();for(var a in f)u[a]=f[a]}})(typeof globalThis<"u"?globalThis:typeof self<"u"?self:exports,function(){var u={},o=u,f={exports:u};function a(k){k.__load_patch("jsonp",function(e,p,t){var j=function(){};p[p.__symbol__("jsonp")]=function(s){if(!(!s||!s.jsonp||!s.sendFuncName)){var v=function(){};[s.successFuncName,s.failedFuncName].forEach(function(r){if(r){var l=e[r];l?t.patchMethod(e,r,function(n){return function(i,c){var y=e[t.symbol("jsonTask")];return y?(y.callback=n,y.invoke.apply(i,c)):n.apply(i,c)}}):Object.defineProperty(e,r,{configurable:!0,enumerable:!0,get:function(){return function(){var n=e[t.symbol("jsonpTask")],i=this?this:e,c=e[t.symbol("jsonp".concat(r,"callback"))];return n?(c&&(n.callback=c),e[t.symbol("jsonpTask")]=void 0,n.invoke.apply(this,arguments)):c?c.apply(this,arguments):null}},set:function(n){this[t.symbol("jsonp".concat(r,"callback"))]=n}})}}),t.patchMethod(s.jsonp,s.sendFuncName,function(r){return function(l,n){e[t.symbol("jsonpTask")]=p.current.scheduleMacroTask("jsonp",v,{},function(i){return r.apply(l,n)},v)}})}}})}return a(Zone),o!=u&&(f.exports=u),f.exports});

if(__exports != exports)module.exports = exports;return module.exports}));
