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
    // packages/zone.js/lib/extra/cordova.js
    function patchCordova(Zone2) {
        Zone2.__load_patch("cordova", function (global, Zone3, api) {
            if (global.cordova) {
                var SUCCESS_SOURCE_1 = "cordova.exec.success";
                var ERROR_SOURCE_1 = "cordova.exec.error";
                var FUNCTION_1 = "function";
                var nativeExec_1 = api.patchMethod(global.cordova, "exec", function () { return function (self, args) {
                    if (args.length > 0 && typeof args[0] === FUNCTION_1) {
                        args[0] = Zone3.current.wrap(args[0], SUCCESS_SOURCE_1);
                    }
                    if (args.length > 1 && typeof args[1] === FUNCTION_1) {
                        args[1] = Zone3.current.wrap(args[1], ERROR_SOURCE_1);
                    }
                    return nativeExec_1.apply(self, args);
                }; });
            }
        });
        Zone2.__load_patch("cordova.FileReader", function (global, Zone3) {
            if (global.cordova && typeof global["FileReader"] !== "undefined") {
                document.addEventListener("deviceReady", function () {
                    var FileReader = global["FileReader"];
                    ["abort", "error", "load", "loadstart", "loadend", "progress"].forEach(function (prop) {
                        var eventNameSymbol = Zone3.__symbol__("ON_PROPERTY" + prop);
                        Object.defineProperty(FileReader.prototype, eventNameSymbol, {
                            configurable: true,
                            get: function () {
                                return this._realReader && this._realReader[eventNameSymbol];
                            }
                        });
                    });
                });
            }
        });
    }
    // packages/zone.js/lib/extra/rollup-cordova.js
    patchCordova(Zone);
    if (__exports != exports)
        module.exports = exports;
    return module.exports;
}));
