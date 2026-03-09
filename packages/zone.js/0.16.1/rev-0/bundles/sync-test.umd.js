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
    var __defProp = Object.defineProperty;
    var __defNormalProp = function (obj, key, value) { return key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value: value }) : obj[key] = value; };
    var __publicField = function (obj, key, value) {
        __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
        return value;
    };
    // packages/zone.js/lib/zone-spec/sync-test.js
    function patchSyncTest(Zone2) {
        var SyncTestZoneSpec = /** @class */ (function () {
            function SyncTestZoneSpec(namePrefix) {
                __publicField(this, "runZone", Zone2.current);
                // ZoneSpec implementation below.
                __publicField(this, "name");
                this.name = "syncTestZone for " + namePrefix;
            }
            SyncTestZoneSpec.prototype.onScheduleTask = function (delegate, current, target, task) {
                switch (task.type) {
                    case "microTask":
                    case "macroTask":
                        throw new Error("Cannot call ".concat(task.source, " from within a sync test (").concat(this.name, ")."));
                    case "eventTask":
                        task = delegate.scheduleTask(target, task);
                        break;
                }
                return task;
            };
            return SyncTestZoneSpec;
        }());
        Zone2["SyncTestZoneSpec"] = SyncTestZoneSpec;
    }
    // packages/zone.js/lib/zone-spec/rollup-sync-test.js
    patchSyncTest(Zone);
    if (__exports != exports)
        module.exports = exports;
    return module.exports;
}));
