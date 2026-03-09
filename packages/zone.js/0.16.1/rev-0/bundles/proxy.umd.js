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
    // packages/zone.js/lib/zone-spec/proxy.js
    var ProxyZoneSpec = /** @class */ (function () {
        function _ProxyZoneSpec(defaultSpecDelegate) {
            if (defaultSpecDelegate === void 0) { defaultSpecDelegate = null; }
            __publicField(this, "defaultSpecDelegate");
            __publicField(this, "name", "ProxyZone");
            __publicField(this, "_delegateSpec", null);
            __publicField(this, "properties", { "ProxyZoneSpec": this });
            __publicField(this, "propertyKeys", null);
            __publicField(this, "lastTaskState", null);
            __publicField(this, "isNeedToTriggerHasTask", false);
            __publicField(this, "tasks", []);
            this.defaultSpecDelegate = defaultSpecDelegate;
            this.setDelegate(defaultSpecDelegate);
        }
        _ProxyZoneSpec.get = function () {
            return Zone.current.get("ProxyZoneSpec");
        };
        _ProxyZoneSpec.isLoaded = function () {
            return _ProxyZoneSpec.get() instanceof _ProxyZoneSpec;
        };
        _ProxyZoneSpec.assertPresent = function () {
            var spec = _ProxyZoneSpec.get();
            if (spec === void 0) {
                throw new Error("Expected to be running in 'ProxyZone', but it was not found.");
            }
            return spec;
        };
        _ProxyZoneSpec.prototype.setDelegate = function (delegateSpec) {
            var _this = this;
            var isNewDelegate = this._delegateSpec !== delegateSpec;
            this._delegateSpec = delegateSpec;
            this.propertyKeys && this.propertyKeys.forEach(function (key) { return delete _this.properties[key]; });
            this.propertyKeys = null;
            if (delegateSpec && delegateSpec.properties) {
                this.propertyKeys = Object.keys(delegateSpec.properties);
                this.propertyKeys.forEach(function (k) { return _this.properties[k] = delegateSpec.properties[k]; });
            }
            if (isNewDelegate && this.lastTaskState && (this.lastTaskState.macroTask || this.lastTaskState.microTask)) {
                this.isNeedToTriggerHasTask = true;
            }
        };
        _ProxyZoneSpec.prototype.getDelegate = function () {
            return this._delegateSpec;
        };
        _ProxyZoneSpec.prototype.resetDelegate = function () {
            var delegateSpec = this.getDelegate();
            this.setDelegate(this.defaultSpecDelegate);
        };
        _ProxyZoneSpec.prototype.tryTriggerHasTask = function (parentZoneDelegate, currentZone, targetZone) {
            if (this.isNeedToTriggerHasTask && this.lastTaskState) {
                this.isNeedToTriggerHasTask = false;
                this.onHasTask(parentZoneDelegate, currentZone, targetZone, this.lastTaskState);
            }
        };
        _ProxyZoneSpec.prototype.removeFromTasks = function (task) {
            if (!this.tasks) {
                return;
            }
            for (var i = 0; i < this.tasks.length; i++) {
                if (this.tasks[i] === task) {
                    this.tasks.splice(i, 1);
                    return;
                }
            }
        };
        _ProxyZoneSpec.prototype.getAndClearPendingTasksInfo = function () {
            if (this.tasks.length === 0) {
                return "";
            }
            var taskInfo = this.tasks.map(function (task) {
                var dataInfo = task.data && Object.keys(task.data).map(function (key) {
                    return key + ":" + task.data[key];
                }).join(",");
                return "type: ".concat(task.type, ", source: ").concat(task.source, ", args: {").concat(dataInfo, "}");
            });
            var pendingTasksInfo = "--Pending async tasks are: [" + taskInfo + "]";
            this.tasks = [];
            return pendingTasksInfo;
        };
        _ProxyZoneSpec.prototype.onFork = function (parentZoneDelegate, currentZone, targetZone, zoneSpec) {
            if (this._delegateSpec && this._delegateSpec.onFork) {
                return this._delegateSpec.onFork(parentZoneDelegate, currentZone, targetZone, zoneSpec);
            }
            else {
                return parentZoneDelegate.fork(targetZone, zoneSpec);
            }
        };
        _ProxyZoneSpec.prototype.onIntercept = function (parentZoneDelegate, currentZone, targetZone, delegate, source) {
            if (this._delegateSpec && this._delegateSpec.onIntercept) {
                return this._delegateSpec.onIntercept(parentZoneDelegate, currentZone, targetZone, delegate, source);
            }
            else {
                return parentZoneDelegate.intercept(targetZone, delegate, source);
            }
        };
        _ProxyZoneSpec.prototype.onInvoke = function (parentZoneDelegate, currentZone, targetZone, delegate, applyThis, applyArgs, source) {
            this.tryTriggerHasTask(parentZoneDelegate, currentZone, targetZone);
            if (this._delegateSpec && this._delegateSpec.onInvoke) {
                return this._delegateSpec.onInvoke(parentZoneDelegate, currentZone, targetZone, delegate, applyThis, applyArgs, source);
            }
            else {
                return parentZoneDelegate.invoke(targetZone, delegate, applyThis, applyArgs, source);
            }
        };
        _ProxyZoneSpec.prototype.onHandleError = function (parentZoneDelegate, currentZone, targetZone, error) {
            if (this._delegateSpec && this._delegateSpec.onHandleError) {
                return this._delegateSpec.onHandleError(parentZoneDelegate, currentZone, targetZone, error);
            }
            else {
                return parentZoneDelegate.handleError(targetZone, error);
            }
        };
        _ProxyZoneSpec.prototype.onScheduleTask = function (parentZoneDelegate, currentZone, targetZone, task) {
            if (task.type !== "eventTask") {
                this.tasks.push(task);
            }
            if (this._delegateSpec && this._delegateSpec.onScheduleTask) {
                return this._delegateSpec.onScheduleTask(parentZoneDelegate, currentZone, targetZone, task);
            }
            else {
                return parentZoneDelegate.scheduleTask(targetZone, task);
            }
        };
        _ProxyZoneSpec.prototype.onInvokeTask = function (parentZoneDelegate, currentZone, targetZone, task, applyThis, applyArgs) {
            if (task.type !== "eventTask") {
                this.removeFromTasks(task);
            }
            this.tryTriggerHasTask(parentZoneDelegate, currentZone, targetZone);
            if (this._delegateSpec && this._delegateSpec.onInvokeTask) {
                return this._delegateSpec.onInvokeTask(parentZoneDelegate, currentZone, targetZone, task, applyThis, applyArgs);
            }
            else {
                return parentZoneDelegate.invokeTask(targetZone, task, applyThis, applyArgs);
            }
        };
        _ProxyZoneSpec.prototype.onCancelTask = function (parentZoneDelegate, currentZone, targetZone, task) {
            if (task.type !== "eventTask") {
                this.removeFromTasks(task);
            }
            this.tryTriggerHasTask(parentZoneDelegate, currentZone, targetZone);
            if (this._delegateSpec && this._delegateSpec.onCancelTask) {
                return this._delegateSpec.onCancelTask(parentZoneDelegate, currentZone, targetZone, task);
            }
            else {
                return parentZoneDelegate.cancelTask(targetZone, task);
            }
        };
        _ProxyZoneSpec.prototype.onHasTask = function (delegate, current, target, hasTaskState) {
            this.lastTaskState = hasTaskState;
            if (this._delegateSpec && this._delegateSpec.onHasTask) {
                this._delegateSpec.onHasTask(delegate, current, target, hasTaskState);
            }
            else {
                delegate.hasTask(target, hasTaskState);
            }
        };
        return _ProxyZoneSpec;
    }());
    function patchProxyZoneSpec(Zone2) {
        Zone2["ProxyZoneSpec"] = ProxyZoneSpec;
    }
    // packages/zone.js/lib/zone-spec/rollup-proxy.js
    patchProxyZoneSpec(Zone);
    if (__exports != exports)
        module.exports = exports;
    return module.exports;
}));
