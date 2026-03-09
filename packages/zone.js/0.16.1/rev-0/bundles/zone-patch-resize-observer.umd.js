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
    // packages/zone.js/lib/browser/webapis-resize-observer.js
    function patchResizeObserver(Zone2) {
        Zone2.__load_patch("ResizeObserver", function (global, Zone3, api) {
            var ResizeObserver = global["ResizeObserver"];
            if (!ResizeObserver) {
                return;
            }
            var resizeObserverSymbol = api.symbol("ResizeObserver");
            api.patchMethod(global, "ResizeObserver", function (delegate) { return function (self, args) {
                var callback = args.length > 0 ? args[0] : null;
                if (callback) {
                    args[0] = function (entries, observer) {
                        var _this = this;
                        var zones = {};
                        var currZone = Zone3.current;
                        for (var _i = 0, entries_1 = entries; _i < entries_1.length; _i++) {
                            var entry = entries_1[_i];
                            var zone = entry.target[resizeObserverSymbol];
                            if (!zone) {
                                zone = currZone;
                            }
                            var zoneEntriesInfo = zones[zone.name];
                            if (!zoneEntriesInfo) {
                                zones[zone.name] = zoneEntriesInfo = { entries: [], zone: zone };
                            }
                            zoneEntriesInfo.entries.push(entry);
                        }
                        Object.keys(zones).forEach(function (zoneName) {
                            var zoneEntriesInfo = zones[zoneName];
                            if (zoneEntriesInfo.zone !== Zone3.current) {
                                zoneEntriesInfo.zone.run(callback, _this, [zoneEntriesInfo.entries, observer], "ResizeObserver");
                            }
                            else {
                                callback.call(_this, zoneEntriesInfo.entries, observer);
                            }
                        });
                    };
                }
                return args.length > 0 ? new ResizeObserver(args[0]) : new ResizeObserver();
            }; });
            api.patchMethod(ResizeObserver.prototype, "observe", function (delegate) { return function (self, args) {
                var target = args.length > 0 ? args[0] : null;
                if (!target) {
                    return delegate.apply(self, args);
                }
                var targets = self[resizeObserverSymbol];
                if (!targets) {
                    targets = self[resizeObserverSymbol] = [];
                }
                targets.push(target);
                target[resizeObserverSymbol] = Zone3.current;
                return delegate.apply(self, args);
            }; });
            api.patchMethod(ResizeObserver.prototype, "unobserve", function (delegate) { return function (self, args) {
                var target = args.length > 0 ? args[0] : null;
                if (!target) {
                    return delegate.apply(self, args);
                }
                var targets = self[resizeObserverSymbol];
                if (targets) {
                    for (var i = 0; i < targets.length; i++) {
                        if (targets[i] === target) {
                            targets.splice(i, 1);
                            break;
                        }
                    }
                }
                target[resizeObserverSymbol] = void 0;
                return delegate.apply(self, args);
            }; });
            api.patchMethod(ResizeObserver.prototype, "disconnect", function (delegate) { return function (self, args) {
                var targets = self[resizeObserverSymbol];
                if (targets) {
                    targets.forEach(function (target) {
                        target[resizeObserverSymbol] = void 0;
                    });
                    self[resizeObserverSymbol] = void 0;
                }
                return delegate.apply(self, args);
            }; });
        });
    }
    // packages/zone.js/lib/browser/rollup-webapis-resize-observer.js
    patchResizeObserver(Zone);
    if (__exports != exports)
        module.exports = exports;
    return module.exports;
}));
