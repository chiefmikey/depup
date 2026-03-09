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
    // packages/zone.js/lib/zone-spec/wtf.js
    var _global = typeof window === "object" && window || typeof self === "object" && self || global;
    function patchWtf(Zone2) {
        var wtfTrace = null;
        var wtfEvents = null;
        var wtfEnabled = function () {
            var wtf = _global["wtf"];
            if (wtf) {
                wtfTrace = wtf.trace;
                if (wtfTrace) {
                    wtfEvents = wtfTrace.events;
                    return true;
                }
            }
            return false;
        }();
        var _WtfZoneSpec = /** @class */ (function () {
            function _WtfZoneSpec() {
                __publicField(this, "name", "WTF");
            }
            _WtfZoneSpec.prototype.onFork = function (parentZoneDelegate, currentZone, targetZone, zoneSpec) {
                var retValue = parentZoneDelegate.fork(targetZone, zoneSpec);
                _WtfZoneSpec.forkInstance(zonePathName(targetZone), retValue.name);
                return retValue;
            };
            _WtfZoneSpec.prototype.onInvoke = function (parentZoneDelegate, currentZone, targetZone, delegate, applyThis, applyArgs, source) {
                var src = source || "unknown";
                var scope = _WtfZoneSpec.invokeScope[src];
                if (!scope) {
                    scope = _WtfZoneSpec.invokeScope[src] = wtfEvents.createScope("Zone:invoke:".concat(source, "(ascii zone)"));
                }
                return wtfTrace.leaveScope(scope(zonePathName(targetZone)), parentZoneDelegate.invoke(targetZone, delegate, applyThis, applyArgs, source));
            };
            _WtfZoneSpec.prototype.onHandleError = function (parentZoneDelegate, currentZone, targetZone, error) {
                return parentZoneDelegate.handleError(targetZone, error);
            };
            _WtfZoneSpec.prototype.onScheduleTask = function (parentZoneDelegate, currentZone, targetZone, task) {
                var key = task.type + ":" + task.source;
                var instance = _WtfZoneSpec.scheduleInstance[key];
                if (!instance) {
                    instance = _WtfZoneSpec.scheduleInstance[key] = wtfEvents.createInstance("Zone:schedule:".concat(key, "(ascii zone, any data)"));
                }
                var retValue = parentZoneDelegate.scheduleTask(targetZone, task);
                instance(zonePathName(targetZone), shallowObj(task.data, 2));
                return retValue;
            };
            _WtfZoneSpec.prototype.onInvokeTask = function (parentZoneDelegate, currentZone, targetZone, task, applyThis, applyArgs) {
                var source = task.source;
                var scope = _WtfZoneSpec.invokeTaskScope[source];
                if (!scope) {
                    scope = _WtfZoneSpec.invokeTaskScope[source] = wtfEvents.createScope("Zone:invokeTask:".concat(source, "(ascii zone)"));
                }
                return wtfTrace.leaveScope(scope(zonePathName(targetZone)), parentZoneDelegate.invokeTask(targetZone, task, applyThis, applyArgs));
            };
            _WtfZoneSpec.prototype.onCancelTask = function (parentZoneDelegate, currentZone, targetZone, task) {
                var key = task.source;
                var instance = _WtfZoneSpec.cancelInstance[key];
                if (!instance) {
                    instance = _WtfZoneSpec.cancelInstance[key] = wtfEvents.createInstance("Zone:cancel:".concat(key, "(ascii zone, any options)"));
                }
                var retValue = parentZoneDelegate.cancelTask(targetZone, task);
                instance(zonePathName(targetZone), shallowObj(task.data, 2));
                return retValue;
            };
            return _WtfZoneSpec;
        }());
        __publicField(_WtfZoneSpec, "forkInstance", wtfEnabled ? wtfEvents.createInstance("Zone:fork(ascii zone, ascii newZone)") : null);
        __publicField(_WtfZoneSpec, "scheduleInstance", {});
        __publicField(_WtfZoneSpec, "cancelInstance", {});
        __publicField(_WtfZoneSpec, "invokeScope", {});
        __publicField(_WtfZoneSpec, "invokeTaskScope", {});
        var WtfZoneSpec = _WtfZoneSpec;
        function shallowObj(obj, depth) {
            if (!obj || !depth)
                return null;
            var out = {};
            for (var key in obj) {
                if (obj.hasOwnProperty(key)) {
                    var value = obj[key];
                    switch (typeof value) {
                        case "object":
                            var name_1 = value && value.constructor && value.constructor.name;
                            value = name_1 == Object.name ? shallowObj(value, depth - 1) : name_1;
                            break;
                        case "function":
                            value = value.name || void 0;
                            break;
                    }
                    out[key] = value;
                }
            }
            return out;
        }
        function zonePathName(zone) {
            var name = zone.name;
            var localZone = zone.parent;
            while (localZone != null) {
                name = localZone.name + "::" + name;
                localZone = localZone.parent;
            }
            return name;
        }
        Zone2["wtfZoneSpec"] = !wtfEnabled ? null : new WtfZoneSpec();
    }
    // packages/zone.js/lib/zone-spec/rollup-wtf.js
    patchWtf(Zone);
    if (__exports != exports)
        module.exports = exports;
    return module.exports;
}));
