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
    // packages/zone.js/lib/browser/webapis-user-media.js
    function patchUserMedia(Zone2) {
        Zone2.__load_patch("getUserMedia", function (global, Zone3, api) {
            function wrapFunctionArgs(func, source) {
                return function () {
                    var args = Array.prototype.slice.call(arguments);
                    var wrappedArgs = api.bindArguments(args, source ? source : func.name);
                    return func.apply(this, wrappedArgs);
                };
            }
            var navigator = global["navigator"];
            if (navigator && navigator.getUserMedia) {
                navigator.getUserMedia = wrapFunctionArgs(navigator.getUserMedia);
            }
        });
    }
    // packages/zone.js/lib/browser/rollup-webapis-user-media.js
    patchUserMedia(Zone);
    if (__exports != exports)
        module.exports = exports;
    return module.exports;
}));
