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
    // packages/zone.js/lib/browser/webapis-media-query.js
    function patchMediaQuery(Zone2) {
        Zone2.__load_patch("mediaQuery", function (global, Zone3, api) {
            function patchAddListener(proto) {
                api.patchMethod(proto, "addListener", function (delegate) { return function (self, args) {
                    var callback = args.length > 0 ? args[0] : null;
                    if (typeof callback === "function") {
                        var wrapperedCallback = Zone3.current.wrap(callback, "MediaQuery");
                        callback[api.symbol("mediaQueryCallback")] = wrapperedCallback;
                        return delegate.call(self, wrapperedCallback);
                    }
                    else {
                        return delegate.apply(self, args);
                    }
                }; });
            }
            function patchRemoveListener(proto) {
                api.patchMethod(proto, "removeListener", function (delegate) { return function (self, args) {
                    var callback = args.length > 0 ? args[0] : null;
                    if (typeof callback === "function") {
                        var wrapperedCallback = callback[api.symbol("mediaQueryCallback")];
                        if (wrapperedCallback) {
                            return delegate.call(self, wrapperedCallback);
                        }
                        else {
                            return delegate.apply(self, args);
                        }
                    }
                    else {
                        return delegate.apply(self, args);
                    }
                }; });
            }
            if (global["MediaQueryList"]) {
                var proto = global["MediaQueryList"].prototype;
                patchAddListener(proto);
                patchRemoveListener(proto);
            }
            else if (global["matchMedia"]) {
                api.patchMethod(global, "matchMedia", function (delegate) { return function (self, args) {
                    var mql = delegate.apply(self, args);
                    if (mql) {
                        var proto = Object.getPrototypeOf(mql);
                        if (proto && proto["addListener"]) {
                            patchAddListener(proto);
                            patchRemoveListener(proto);
                            patchAddListener(mql);
                            patchRemoveListener(mql);
                        }
                        else if (mql["addListener"]) {
                            patchAddListener(mql);
                            patchRemoveListener(mql);
                        }
                    }
                    return mql;
                }; });
            }
        });
    }
    // packages/zone.js/lib/browser/rollup-webapis-media-query.js
    patchMediaQuery(Zone);
    if (__exports != exports)
        module.exports = exports;
    return module.exports;
}));
