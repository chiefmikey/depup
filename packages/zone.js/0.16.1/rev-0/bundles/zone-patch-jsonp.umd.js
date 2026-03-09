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
    // packages/zone.js/lib/extra/jsonp.js
    function patchJsonp(Zone2) {
        Zone2.__load_patch("jsonp", function (global, Zone3, api) {
            var noop = function () {
            };
            Zone3[Zone3.__symbol__("jsonp")] = function patchJsonp2(options) {
                if (!options || !options.jsonp || !options.sendFuncName) {
                    return;
                }
                var noop2 = function () {
                };
                [options.successFuncName, options.failedFuncName].forEach(function (methodName) {
                    if (!methodName) {
                        return;
                    }
                    var oriFunc = global[methodName];
                    if (oriFunc) {
                        api.patchMethod(global, methodName, function (delegate) { return function (self, args) {
                            var task = global[api.symbol("jsonTask")];
                            if (task) {
                                task.callback = delegate;
                                return task.invoke.apply(self, args);
                            }
                            else {
                                return delegate.apply(self, args);
                            }
                        }; });
                    }
                    else {
                        Object.defineProperty(global, methodName, {
                            configurable: true,
                            enumerable: true,
                            get: function () {
                                return function () {
                                    var task = global[api.symbol("jsonpTask")];
                                    var target = this ? this : global;
                                    var delegate = global[api.symbol("jsonp".concat(methodName, "callback"))];
                                    if (task) {
                                        if (delegate) {
                                            task.callback = delegate;
                                        }
                                        global[api.symbol("jsonpTask")] = void 0;
                                        return task.invoke.apply(this, arguments);
                                    }
                                    else {
                                        if (delegate) {
                                            return delegate.apply(this, arguments);
                                        }
                                    }
                                    return null;
                                };
                            },
                            set: function (callback) {
                                this[api.symbol("jsonp".concat(methodName, "callback"))] = callback;
                            }
                        });
                    }
                });
                api.patchMethod(options.jsonp, options.sendFuncName, function (delegate) { return function (self, args) {
                    global[api.symbol("jsonpTask")] = Zone3.current.scheduleMacroTask("jsonp", noop2, {}, function (task) {
                        return delegate.apply(self, args);
                    }, noop2);
                }; });
            };
        });
    }
    // packages/zone.js/lib/extra/rollup-jsonp.js
    patchJsonp(Zone);
    if (__exports != exports)
        module.exports = exports;
    return module.exports;
}));
