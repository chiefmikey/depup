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
    // packages/zone.js/lib/common/fetch.js
    function patchFetch(Zone2) {
        Zone2.__load_patch("fetch", function (global, Zone3, api) {
            var fetch = global["fetch"];
            if (typeof fetch !== "function") {
                return;
            }
            var originalFetch = global[api.symbol("fetch")];
            if (originalFetch) {
                fetch = originalFetch;
            }
            var ZoneAwarePromise = global.Promise;
            var symbolThenPatched = api.symbol("thenPatched");
            var fetchTaskScheduling = api.symbol("fetchTaskScheduling");
            var OriginalResponse = global.Response;
            var placeholder = function () {
            };
            var createFetchTask = function (source, data, originalImpl, self, args, ac) { return new Promise(function (resolve, reject) {
                var task = Zone3.current.scheduleMacroTask(source, placeholder, data, function () {
                    var implPromise;
                    var zone = Zone3.current;
                    try {
                        zone[fetchTaskScheduling] = true;
                        implPromise = originalImpl.apply(self, args);
                    }
                    catch (error) {
                        reject(error);
                        return;
                    }
                    finally {
                        zone[fetchTaskScheduling] = false;
                    }
                    if (!(implPromise instanceof ZoneAwarePromise)) {
                        var ctor = implPromise.constructor;
                        if (!ctor[symbolThenPatched]) {
                            api.patchThen(ctor);
                        }
                    }
                    implPromise.then(function (resource) {
                        if (task.state !== "notScheduled") {
                            task.invoke();
                        }
                        resolve(resource);
                    }, function (error) {
                        if (task.state !== "notScheduled") {
                            task.invoke();
                        }
                        reject(error);
                    });
                }, function () {
                    ac == null ? void 0 : ac.abort();
                });
            }); };
            global["fetch"] = function () {
                var args = Array.prototype.slice.call(arguments);
                var options = args.length > 1 ? args[1] : {};
                var signal = options == null ? void 0 : options.signal;
                var ac = new AbortController();
                var fetchSignal = ac.signal;
                options.signal = fetchSignal;
                args[1] = options;
                var onAbort;
                if (signal) {
                    var nativeAddEventListener = signal[Zone3.__symbol__("addEventListener")] || signal.addEventListener;
                    onAbort = function () { return ac.abort(); };
                    nativeAddEventListener.call(signal, "abort", onAbort, { once: true });
                }
                return createFetchTask("fetch", { fetchArgs: args }, fetch, this, args, ac).finally(function () {
                    signal == null ? void 0 : signal.removeEventListener("abort", onAbort);
                });
            };
            if (OriginalResponse == null ? void 0 : OriginalResponse.prototype) {
                ["arrayBuffer", "blob", "formData", "json", "text"].filter(function (method) { return typeof OriginalResponse.prototype[method] === "function"; }).forEach(function (method) {
                    api.patchMethod(OriginalResponse.prototype, method, function (delegate) { return function (self, args) { return createFetchTask("Response.".concat(method), void 0, delegate, self, args, void 0); }; });
                });
            }
        });
    }
    // packages/zone.js/lib/common/rollup-fetch.js
    patchFetch(Zone);
    if (__exports != exports)
        module.exports = exports;
    return module.exports;
}));
