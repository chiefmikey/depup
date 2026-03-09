'use strict';
/**
 * @license Angular
 * (c) 2010-2026 Google LLC. https://angular.dev/
 * License: MIT
 */(function(g,f){if(typeof define=="function"&&define.amd){define(f)}else if(typeof exports=="object" && typeof module<"u"){module.exports=f()}else{var m=f();for(var i in m) g[i]=m[i]}}(typeof globalThis < "u" ? globalThis : typeof self < "u" ? self : this,function(){var exports={};var __exports=exports;var module={exports};
"use strict";(function(o,t){if(typeof define=="function"&&define.amd)define(t);else if(typeof exports=="object"&&typeof module<"u")module.exports=t();else{var n=t();for(var a in n)o[a]=n[a]}})(typeof globalThis<"u"?globalThis:typeof self<"u"?self:exports,function(){var o={},t=o,n={exports:o};function a(u){u.__load_patch("cordova",function(r,c,f){if(r.cordova)var d="cordova.exec.success",i="cordova.exec.error",p="function",v=f.patchMethod(r.cordova,"exec",function(){return function(l,e){return e.length>0&&typeof e[0]===p&&(e[0]=c.current.wrap(e[0],d)),e.length>1&&typeof e[1]===p&&(e[1]=c.current.wrap(e[1],i)),v.apply(l,e)}})}),u.__load_patch("cordova.FileReader",function(r,c){r.cordova&&typeof r.FileReader!="undefined"&&document.addEventListener("deviceReady",function(){var f=r.FileReader;["abort","error","load","loadstart","loadend","progress"].forEach(function(d){var i=c.__symbol__("ON_PROPERTY"+d);Object.defineProperty(f.prototype,i,{configurable:!0,get:function(){return this._realReader&&this._realReader[i]}})})})})}return a(Zone),t!=o&&(n.exports=o),n.exports});

if(__exports != exports)module.exports = exports;return module.exports}));
