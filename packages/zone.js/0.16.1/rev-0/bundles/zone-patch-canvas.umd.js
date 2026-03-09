'use strict';
/**
 * @license Angular
 * (c) 2010-2026 Google LLC. https://angular.dev/
 * License: MIT
 */ (function (g, f) { if (typeof define == "function" && define.amd) {
    define(f);
}
else if (typeof exports == "object" && typeof module < "u") {
    module.exports = f();
}
else {
    var m = f();
    for (var i in m)
        g[i] = m[i];
} }(typeof globalThis < "u" ? globalThis : typeof self < "u" ? self : this, function () {
    var exports = {};
    var __exports = exports;
    var module = { exports: exports };
    // packages/zone.js/lib/browser/canvas.js
    function patchCanvas(Zone2) {
        Zone2.__load_patch("canvas", function (global, Zone3, api) {
            var HTMLCanvasElement = global["HTMLCanvasElement"];
            if (typeof HTMLCanvasElement !== "undefined" && HTMLCanvasElement.prototype && HTMLCanvasElement.prototype.toBlob) {
                api.patchMacroTask(HTMLCanvasElement.prototype, "toBlob", function (self, args) {
                    return { name: "HTMLCanvasElement.toBlob", target: self, cbIdx: 0, args: args };
                });
            }
        });
    }
    // packages/zone.js/lib/browser/rollup-canvas.js
    patchCanvas(Zone);
    if (__exports != exports)
        module.exports = exports;
    return module.exports;
}));
