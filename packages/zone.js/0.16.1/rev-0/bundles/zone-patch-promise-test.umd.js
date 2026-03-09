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
    // packages/zone.js/lib/testing/promise-testing.js
    function patchPromiseTesting(Zone2) {
        Zone2.__load_patch("promisefortest", function (global, Zone3, api) {
            var symbolState = api.symbol("state");
            var UNRESOLVED = null;
            var symbolParentUnresolved = api.symbol("parentUnresolved");
            Promise[api.symbol("patchPromiseForTest")] = function patchPromiseForTest() {
                var oriThen = Promise[Zone3.__symbol__("ZonePromiseThen")];
                if (oriThen) {
                    return;
                }
                oriThen = Promise[Zone3.__symbol__("ZonePromiseThen")] = Promise.prototype.then;
                Promise.prototype.then = function () {
                    var chained = oriThen.apply(this, arguments);
                    if (this[symbolState] === UNRESOLVED) {
                        var asyncTestZoneSpec = Zone3.current.get("AsyncTestZoneSpec");
                        if (asyncTestZoneSpec) {
                            asyncTestZoneSpec.unresolvedChainedPromiseCount++;
                            chained[symbolParentUnresolved] = true;
                        }
                    }
                    return chained;
                };
            };
            Promise[api.symbol("unPatchPromiseForTest")] = function unpatchPromiseForTest() {
                var oriThen = Promise[Zone3.__symbol__("ZonePromiseThen")];
                if (oriThen) {
                    Promise.prototype.then = oriThen;
                    Promise[Zone3.__symbol__("ZonePromiseThen")] = void 0;
                }
            };
        });
    }
    // packages/zone.js/lib/testing/rollup-promise-testing.js
    patchPromiseTesting(Zone);
    if (__exports != exports)
        module.exports = exports;
    return module.exports;
}));
