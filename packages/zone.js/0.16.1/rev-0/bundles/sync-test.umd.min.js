'use strict';
/**
 * @license Angular
 * (c) 2010-2026 Google LLC. https://angular.dev/
 * License: MIT
 */(function(g,f){if(typeof define=="function"&&define.amd){define(f)}else if(typeof exports=="object" && typeof module<"u"){module.exports=f()}else{var m=f();for(var i in m) g[i]=m[i]}}(typeof globalThis < "u" ? globalThis : typeof self < "u" ? self : this,function(){var exports={};var __exports=exports;var module={exports};
"use strict";(function(r,o){if(typeof define=="function"&&define.amd)define(o);else if(typeof exports=="object"&&typeof module<"u")module.exports=o();else{var c=o();for(var i in c)r[i]=c[i]}})(typeof globalThis<"u"?globalThis:typeof self<"u"?self:exports,function(){var r={},o=r,c={exports:r},i=Object.defineProperty,f=function(n,e,t){return e in n?i(n,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):n[e]=t},u=function(n,e,t){return f(n,typeof e!="symbol"?e+"":e,t),t};function p(n){var e=function(){function t(a){u(this,"runZone",n.current),u(this,"name"),this.name="syncTestZone for "+a}return t.prototype.onScheduleTask=function(a,h,l,s){switch(s.type){case"microTask":case"macroTask":throw new Error("Cannot call ".concat(s.source," from within a sync test (").concat(this.name,")."));case"eventTask":s=a.scheduleTask(l,s);break}return s},t}();n.SyncTestZoneSpec=e}return p(Zone),o!=r&&(c.exports=r),c.exports});

if(__exports != exports)module.exports = exports;return module.exports}));
