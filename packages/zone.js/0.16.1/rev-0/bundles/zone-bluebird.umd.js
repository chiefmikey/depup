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
    // packages/zone.js/lib/extra/bluebird.js
    function patchBluebird(Zone2) {
        Zone2.__load_patch("bluebird", function (global, Zone3, api) {
            var BLUEBIRD = "bluebird";
            Zone3[Zone3.__symbol__(BLUEBIRD)] = function patchBluebird2(Bluebird) {
                var bluebirdApis = ["then", "spread", "finally"];
                bluebirdApis.forEach(function (bapi) {
                    api.patchMethod(Bluebird.prototype, bapi, function (delegate) { return function (self, args) {
                        var zone = Zone3.current;
                        var _loop_1 = function (i) {
                            var func = args[i];
                            if (typeof func === "function") {
                                args[i] = function () {
                                    var argSelf = this;
                                    var argArgs = arguments;
                                    return new Bluebird(function (res, rej) {
                                        zone.scheduleMicroTask("Promise.then", function () {
                                            try {
                                                res(func.apply(argSelf, argArgs));
                                            }
                                            catch (error) {
                                                rej(error);
                                            }
                                        });
                                    });
                                };
                            }
                        };
                        for (var i = 0; i < args.length; i++) {
                            _loop_1(i);
                        }
                        return delegate.apply(self, args);
                    }; });
                });
                if (typeof window !== "undefined") {
                    window.addEventListener("unhandledrejection", function (event) {
                        var error = event.detail && event.detail.reason;
                        if (error && error.isHandledByZone) {
                            event.preventDefault();
                            if (typeof event.stopImmediatePropagation === "function") {
                                event.stopImmediatePropagation();
                            }
                        }
                    });
                }
                else if (typeof process !== "undefined") {
                    process.on("unhandledRejection", function (reason, p) {
                        if (reason && reason.isHandledByZone) {
                            var listeners_1 = process.listeners("unhandledRejection");
                            if (listeners_1) {
                                process.removeAllListeners("unhandledRejection");
                                process.nextTick(function () {
                                    listeners_1.forEach(function (listener) { return process.on("unhandledRejection", listener); });
                                });
                            }
                        }
                    });
                }
                Bluebird.onPossiblyUnhandledRejection(function (e, promise) {
                    try {
                        Zone3.current.runGuarded(function () {
                            e.isHandledByZone = true;
                            throw e;
                        });
                    }
                    catch (err) {
                        err.isHandledByZone = false;
                        api.onUnhandledError(err);
                    }
                });
                global.Promise = Bluebird;
            };
        });
    }
    // packages/zone.js/lib/extra/rollup-bluebird.js
    patchBluebird(Zone);
    if (__exports != exports)
        module.exports = exports;
    return module.exports;
}));
