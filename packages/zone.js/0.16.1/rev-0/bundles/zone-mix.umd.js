'use strict';
/**
 * @license Angular
 * (c) 2010-2026 Google LLC. https://angular.dev/
 * License: MIT
 */ (function (g, f) { if (typeof define == "function" && define.amd) {
    define(["timers", "crypto", "events", "fs"], function (_d_0, _d_1, _d_2, _d_3) { var d = { "timers": _d_0, "crypto": _d_1, "events": _d_2, "fs": _d_3 }, r = function (m) { if (m in d)
        return d[m]; if (typeof require == "function")
        return require(m); throw new Error("Cannot find module '" + m + "'"); }; return f(r); });
}
else if (typeof exports == "object" && typeof module < "u") {
    module.exports = f(require);
}
else {
    var gN = { "timers": "timers", "crypto": "crypto", "events": "events", "fs": "fs" }, gReq = function (r) { var mod = r in gN ? g[gN[r]] : g[r]; return mod; };
    var m = f(gReq);
    for (var i in m)
        g[i] = m[i];
} }(typeof globalThis < "u" ? globalThis : typeof self < "u" ? self : this, function (require) {
    var exports = {};
    var __exports = exports;
    var module = { exports: exports };
    var __defProp = Object.defineProperty;
    var __defProps = Object.defineProperties;
    var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
    var __getOwnPropSymbols = Object.getOwnPropertySymbols;
    var __hasOwnProp = Object.prototype.hasOwnProperty;
    var __propIsEnum = Object.prototype.propertyIsEnumerable;
    var __defNormalProp = function (obj, key, value) { return key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value: value }) : obj[key] = value; };
    var __spreadValues = function (a, b) {
        for (var prop in b || (b = {}))
            if (__hasOwnProp.call(b, prop))
                __defNormalProp(a, prop, b[prop]);
        if (__getOwnPropSymbols)
            for (var _i = 0, _b = __getOwnPropSymbols(b); _i < _b.length; _i++) {
                var prop = _b[_i];
                if (__propIsEnum.call(b, prop))
                    __defNormalProp(a, prop, b[prop]);
            }
        return a;
    };
    var __spreadProps = function (a, b) { return __defProps(a, __getOwnPropDescs(b)); };
    var __publicField = function (obj, key, value) {
        __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
        return value;
    };
    // packages/zone.js/lib/zone-impl.js
    var global = globalThis;
    function __symbol__(name) {
        var symbolPrefix = global["__Zone_symbol_prefix"] || "__zone_symbol__";
        return symbolPrefix + name;
    }
    function initZone() {
        var performance = global["performance"];
        function mark(name) {
            performance && performance["mark"] && performance["mark"](name);
        }
        function performanceMeasure(name, label) {
            performance && performance["measure"] && performance["measure"](name, label);
        }
        mark("Zone");
        var _ZoneImpl = /** @class */ (function () {
            function _ZoneImpl(parent, zoneSpec) {
                __publicField(this, "_parent");
                __publicField(this, "_name");
                __publicField(this, "_properties");
                __publicField(this, "_zoneDelegate");
                this._parent = parent;
                this._name = zoneSpec ? zoneSpec.name || "unnamed" : "<root>";
                this._properties = zoneSpec && zoneSpec.properties || {};
                this._zoneDelegate = new _ZoneDelegate(this, this._parent && this._parent._zoneDelegate, zoneSpec);
            }
            _ZoneImpl.assertZonePatched = function () {
                if (global["Promise"] !== patches["ZoneAwarePromise"]) {
                    throw new Error("Zone.js has detected that ZoneAwarePromise `(window|global).Promise` has been overwritten.\nMost likely cause is that a Promise polyfill has been loaded after Zone.js (Polyfilling Promise api is not necessary when zone.js is loaded. If you must load one, do so before loading zone.js.)");
                }
            };
            Object.defineProperty(_ZoneImpl, "root", {
                get: function () {
                    var zone = _ZoneImpl.current;
                    while (zone.parent) {
                        zone = zone.parent;
                    }
                    return zone;
                },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(_ZoneImpl, "current", {
                get: function () {
                    return _currentZoneFrame.zone;
                },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(_ZoneImpl, "currentTask", {
                get: function () {
                    return _currentTask;
                },
                enumerable: false,
                configurable: true
            });
            _ZoneImpl.__load_patch = function (name, fn, ignoreDuplicate) {
                if (ignoreDuplicate === void 0) { ignoreDuplicate = false; }
                if (patches.hasOwnProperty(name)) {
                    var checkDuplicate = global[__symbol__("forceDuplicateZoneCheck")] === true;
                    if (!ignoreDuplicate && checkDuplicate) {
                        throw Error("Already loaded patch: " + name);
                    }
                }
                else if (!global["__Zone_disable_" + name]) {
                    var perfName = "Zone:" + name;
                    mark(perfName);
                    patches[name] = fn(global, _ZoneImpl, _api);
                    performanceMeasure(perfName, perfName);
                }
            };
            Object.defineProperty(_ZoneImpl.prototype, "parent", {
                get: function () {
                    return this._parent;
                },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(_ZoneImpl.prototype, "name", {
                get: function () {
                    return this._name;
                },
                enumerable: false,
                configurable: true
            });
            _ZoneImpl.prototype.get = function (key) {
                var zone = this.getZoneWith(key);
                if (zone)
                    return zone._properties[key];
            };
            _ZoneImpl.prototype.getZoneWith = function (key) {
                var current = this;
                while (current) {
                    if (current._properties.hasOwnProperty(key)) {
                        return current;
                    }
                    current = current._parent;
                }
                return null;
            };
            _ZoneImpl.prototype.fork = function (zoneSpec) {
                if (!zoneSpec)
                    throw new Error("ZoneSpec required!");
                return this._zoneDelegate.fork(this, zoneSpec);
            };
            _ZoneImpl.prototype.wrap = function (callback, source) {
                if (typeof callback !== "function") {
                    throw new Error("Expecting function got: " + callback);
                }
                var _callback = this._zoneDelegate.intercept(this, callback, source);
                var zone = this;
                return function () {
                    return zone.runGuarded(_callback, this, arguments, source);
                };
            };
            _ZoneImpl.prototype.run = function (callback, applyThis, applyArgs, source) {
                _currentZoneFrame = { parent: _currentZoneFrame, zone: this };
                try {
                    return this._zoneDelegate.invoke(this, callback, applyThis, applyArgs, source);
                }
                finally {
                    _currentZoneFrame = _currentZoneFrame.parent;
                }
            };
            _ZoneImpl.prototype.runGuarded = function (callback, applyThis, applyArgs, source) {
                if (applyThis === void 0) { applyThis = null; }
                _currentZoneFrame = { parent: _currentZoneFrame, zone: this };
                try {
                    try {
                        return this._zoneDelegate.invoke(this, callback, applyThis, applyArgs, source);
                    }
                    catch (error) {
                        if (this._zoneDelegate.handleError(this, error)) {
                            throw error;
                        }
                    }
                }
                finally {
                    _currentZoneFrame = _currentZoneFrame.parent;
                }
            };
            _ZoneImpl.prototype.runTask = function (task, applyThis, applyArgs) {
                if (task.zone != this) {
                    throw new Error("A task can only be run in the zone of creation! (Creation: " + (task.zone || NO_ZONE).name + "; Execution: " + this.name + ")");
                }
                var zoneTask = task;
                var type = task.type, _b = task.data, _c = _b === void 0 ? {} : _b, _d = _c.isPeriodic, isPeriodic = _d === void 0 ? false : _d, _e = _c.isRefreshable, isRefreshable = _e === void 0 ? false : _e;
                if (task.state === notScheduled && (type === eventTask || type === macroTask)) {
                    return;
                }
                var reEntryGuard = task.state != running;
                reEntryGuard && zoneTask._transitionTo(running, scheduled);
                var previousTask = _currentTask;
                _currentTask = zoneTask;
                _currentZoneFrame = { parent: _currentZoneFrame, zone: this };
                try {
                    if (type == macroTask && task.data && !isPeriodic && !isRefreshable) {
                        task.cancelFn = void 0;
                    }
                    try {
                        return this._zoneDelegate.invokeTask(this, zoneTask, applyThis, applyArgs);
                    }
                    catch (error) {
                        if (this._zoneDelegate.handleError(this, error)) {
                            throw error;
                        }
                    }
                }
                finally {
                    var state = task.state;
                    if (state !== notScheduled && state !== unknown) {
                        if (type == eventTask || isPeriodic || isRefreshable && state === scheduling) {
                            reEntryGuard && zoneTask._transitionTo(scheduled, running, scheduling);
                        }
                        else {
                            var zoneDelegates = zoneTask._zoneDelegates;
                            this._updateTaskCount(zoneTask, -1);
                            reEntryGuard && zoneTask._transitionTo(notScheduled, running, notScheduled);
                            if (isRefreshable) {
                                zoneTask._zoneDelegates = zoneDelegates;
                            }
                        }
                    }
                    _currentZoneFrame = _currentZoneFrame.parent;
                    _currentTask = previousTask;
                }
            };
            _ZoneImpl.prototype.scheduleTask = function (task) {
                if (task.zone && task.zone !== this) {
                    var newZone = this;
                    while (newZone) {
                        if (newZone === task.zone) {
                            throw Error("can not reschedule task to ".concat(this.name, " which is descendants of the original zone ").concat(task.zone.name));
                        }
                        newZone = newZone.parent;
                    }
                }
                task._transitionTo(scheduling, notScheduled);
                var zoneDelegates = [];
                task._zoneDelegates = zoneDelegates;
                task._zone = this;
                try {
                    task = this._zoneDelegate.scheduleTask(this, task);
                }
                catch (err) {
                    task._transitionTo(unknown, scheduling, notScheduled);
                    this._zoneDelegate.handleError(this, err);
                    throw err;
                }
                if (task._zoneDelegates === zoneDelegates) {
                    this._updateTaskCount(task, 1);
                }
                if (task.state == scheduling) {
                    task._transitionTo(scheduled, scheduling);
                }
                return task;
            };
            _ZoneImpl.prototype.scheduleMicroTask = function (source, callback, data, customSchedule) {
                return this.scheduleTask(new ZoneTask(microTask, source, callback, data, customSchedule, void 0));
            };
            _ZoneImpl.prototype.scheduleMacroTask = function (source, callback, data, customSchedule, customCancel) {
                return this.scheduleTask(new ZoneTask(macroTask, source, callback, data, customSchedule, customCancel));
            };
            _ZoneImpl.prototype.scheduleEventTask = function (source, callback, data, customSchedule, customCancel) {
                return this.scheduleTask(new ZoneTask(eventTask, source, callback, data, customSchedule, customCancel));
            };
            _ZoneImpl.prototype.cancelTask = function (task) {
                if (task.zone != this)
                    throw new Error("A task can only be cancelled in the zone of creation! (Creation: " + (task.zone || NO_ZONE).name + "; Execution: " + this.name + ")");
                if (task.state !== scheduled && task.state !== running) {
                    return;
                }
                task._transitionTo(canceling, scheduled, running);
                try {
                    this._zoneDelegate.cancelTask(this, task);
                }
                catch (err) {
                    task._transitionTo(unknown, canceling);
                    this._zoneDelegate.handleError(this, err);
                    throw err;
                }
                this._updateTaskCount(task, -1);
                task._transitionTo(notScheduled, canceling);
                task.runCount = -1;
                return task;
            };
            _ZoneImpl.prototype._updateTaskCount = function (task, count) {
                var zoneDelegates = task._zoneDelegates;
                if (count == -1) {
                    task._zoneDelegates = null;
                }
                for (var i = 0; i < zoneDelegates.length; i++) {
                    zoneDelegates[i]._updateTaskCount(task.type, count);
                }
            };
            return _ZoneImpl;
        }());
        __publicField(_ZoneImpl, "__symbol__", __symbol__);
        var ZoneImpl = _ZoneImpl;
        var DELEGATE_ZS = {
            name: "",
            onHasTask: function (delegate, _, target, hasTaskState) { return delegate.hasTask(target, hasTaskState); },
            onScheduleTask: function (delegate, _, target, task) { return delegate.scheduleTask(target, task); },
            onInvokeTask: function (delegate, _, target, task, applyThis, applyArgs) { return delegate.invokeTask(target, task, applyThis, applyArgs); },
            onCancelTask: function (delegate, _, target, task) { return delegate.cancelTask(target, task); }
        };
        var _ZoneDelegate = /** @class */ (function () {
            function _ZoneDelegate(zone, parentDelegate, zoneSpec) {
                __publicField(this, "_zone");
                __publicField(this, "_taskCounts", {
                    "microTask": 0,
                    "macroTask": 0,
                    "eventTask": 0
                });
                __publicField(this, "_parentDelegate");
                __publicField(this, "_forkDlgt");
                __publicField(this, "_forkZS");
                __publicField(this, "_forkCurrZone");
                __publicField(this, "_interceptDlgt");
                __publicField(this, "_interceptZS");
                __publicField(this, "_interceptCurrZone");
                __publicField(this, "_invokeDlgt");
                __publicField(this, "_invokeZS");
                __publicField(this, "_invokeCurrZone");
                __publicField(this, "_handleErrorDlgt");
                __publicField(this, "_handleErrorZS");
                __publicField(this, "_handleErrorCurrZone");
                __publicField(this, "_scheduleTaskDlgt");
                __publicField(this, "_scheduleTaskZS");
                __publicField(this, "_scheduleTaskCurrZone");
                __publicField(this, "_invokeTaskDlgt");
                __publicField(this, "_invokeTaskZS");
                __publicField(this, "_invokeTaskCurrZone");
                __publicField(this, "_cancelTaskDlgt");
                __publicField(this, "_cancelTaskZS");
                __publicField(this, "_cancelTaskCurrZone");
                __publicField(this, "_hasTaskDlgt");
                __publicField(this, "_hasTaskDlgtOwner");
                __publicField(this, "_hasTaskZS");
                __publicField(this, "_hasTaskCurrZone");
                this._zone = zone;
                this._parentDelegate = parentDelegate;
                this._forkZS = zoneSpec && (zoneSpec && zoneSpec.onFork ? zoneSpec : parentDelegate._forkZS);
                this._forkDlgt = zoneSpec && (zoneSpec.onFork ? parentDelegate : parentDelegate._forkDlgt);
                this._forkCurrZone = zoneSpec && (zoneSpec.onFork ? this._zone : parentDelegate._forkCurrZone);
                this._interceptZS = zoneSpec && (zoneSpec.onIntercept ? zoneSpec : parentDelegate._interceptZS);
                this._interceptDlgt = zoneSpec && (zoneSpec.onIntercept ? parentDelegate : parentDelegate._interceptDlgt);
                this._interceptCurrZone = zoneSpec && (zoneSpec.onIntercept ? this._zone : parentDelegate._interceptCurrZone);
                this._invokeZS = zoneSpec && (zoneSpec.onInvoke ? zoneSpec : parentDelegate._invokeZS);
                this._invokeDlgt = zoneSpec && (zoneSpec.onInvoke ? parentDelegate : parentDelegate._invokeDlgt);
                this._invokeCurrZone = zoneSpec && (zoneSpec.onInvoke ? this._zone : parentDelegate._invokeCurrZone);
                this._handleErrorZS = zoneSpec && (zoneSpec.onHandleError ? zoneSpec : parentDelegate._handleErrorZS);
                this._handleErrorDlgt = zoneSpec && (zoneSpec.onHandleError ? parentDelegate : parentDelegate._handleErrorDlgt);
                this._handleErrorCurrZone = zoneSpec && (zoneSpec.onHandleError ? this._zone : parentDelegate._handleErrorCurrZone);
                this._scheduleTaskZS = zoneSpec && (zoneSpec.onScheduleTask ? zoneSpec : parentDelegate._scheduleTaskZS);
                this._scheduleTaskDlgt = zoneSpec && (zoneSpec.onScheduleTask ? parentDelegate : parentDelegate._scheduleTaskDlgt);
                this._scheduleTaskCurrZone = zoneSpec && (zoneSpec.onScheduleTask ? this._zone : parentDelegate._scheduleTaskCurrZone);
                this._invokeTaskZS = zoneSpec && (zoneSpec.onInvokeTask ? zoneSpec : parentDelegate._invokeTaskZS);
                this._invokeTaskDlgt = zoneSpec && (zoneSpec.onInvokeTask ? parentDelegate : parentDelegate._invokeTaskDlgt);
                this._invokeTaskCurrZone = zoneSpec && (zoneSpec.onInvokeTask ? this._zone : parentDelegate._invokeTaskCurrZone);
                this._cancelTaskZS = zoneSpec && (zoneSpec.onCancelTask ? zoneSpec : parentDelegate._cancelTaskZS);
                this._cancelTaskDlgt = zoneSpec && (zoneSpec.onCancelTask ? parentDelegate : parentDelegate._cancelTaskDlgt);
                this._cancelTaskCurrZone = zoneSpec && (zoneSpec.onCancelTask ? this._zone : parentDelegate._cancelTaskCurrZone);
                this._hasTaskZS = null;
                this._hasTaskDlgt = null;
                this._hasTaskDlgtOwner = null;
                this._hasTaskCurrZone = null;
                var zoneSpecHasTask = zoneSpec && zoneSpec.onHasTask;
                var parentHasTask = parentDelegate && parentDelegate._hasTaskZS;
                if (zoneSpecHasTask || parentHasTask) {
                    this._hasTaskZS = zoneSpecHasTask ? zoneSpec : DELEGATE_ZS;
                    this._hasTaskDlgt = parentDelegate;
                    this._hasTaskDlgtOwner = this;
                    this._hasTaskCurrZone = this._zone;
                    if (!zoneSpec.onScheduleTask) {
                        this._scheduleTaskZS = DELEGATE_ZS;
                        this._scheduleTaskDlgt = parentDelegate;
                        this._scheduleTaskCurrZone = this._zone;
                    }
                    if (!zoneSpec.onInvokeTask) {
                        this._invokeTaskZS = DELEGATE_ZS;
                        this._invokeTaskDlgt = parentDelegate;
                        this._invokeTaskCurrZone = this._zone;
                    }
                    if (!zoneSpec.onCancelTask) {
                        this._cancelTaskZS = DELEGATE_ZS;
                        this._cancelTaskDlgt = parentDelegate;
                        this._cancelTaskCurrZone = this._zone;
                    }
                }
            }
            Object.defineProperty(_ZoneDelegate.prototype, "zone", {
                get: function () {
                    return this._zone;
                },
                enumerable: false,
                configurable: true
            });
            _ZoneDelegate.prototype.fork = function (targetZone, zoneSpec) {
                return this._forkZS ? this._forkZS.onFork(this._forkDlgt, this.zone, targetZone, zoneSpec) : new ZoneImpl(targetZone, zoneSpec);
            };
            _ZoneDelegate.prototype.intercept = function (targetZone, callback, source) {
                return this._interceptZS ? this._interceptZS.onIntercept(this._interceptDlgt, this._interceptCurrZone, targetZone, callback, source) : callback;
            };
            _ZoneDelegate.prototype.invoke = function (targetZone, callback, applyThis, applyArgs, source) {
                return this._invokeZS ? this._invokeZS.onInvoke(this._invokeDlgt, this._invokeCurrZone, targetZone, callback, applyThis, applyArgs, source) : callback.apply(applyThis, applyArgs);
            };
            _ZoneDelegate.prototype.handleError = function (targetZone, error) {
                return this._handleErrorZS ? this._handleErrorZS.onHandleError(this._handleErrorDlgt, this._handleErrorCurrZone, targetZone, error) : true;
            };
            _ZoneDelegate.prototype.scheduleTask = function (targetZone, task) {
                var returnTask = task;
                if (this._scheduleTaskZS) {
                    if (this._hasTaskZS) {
                        returnTask._zoneDelegates.push(this._hasTaskDlgtOwner);
                    }
                    returnTask = this._scheduleTaskZS.onScheduleTask(this._scheduleTaskDlgt, this._scheduleTaskCurrZone, targetZone, task);
                    if (!returnTask)
                        returnTask = task;
                }
                else {
                    if (task.scheduleFn) {
                        task.scheduleFn(task);
                    }
                    else if (task.type == microTask) {
                        scheduleMicroTask(task);
                    }
                    else {
                        throw new Error("Task is missing scheduleFn.");
                    }
                }
                return returnTask;
            };
            _ZoneDelegate.prototype.invokeTask = function (targetZone, task, applyThis, applyArgs) {
                return this._invokeTaskZS ? this._invokeTaskZS.onInvokeTask(this._invokeTaskDlgt, this._invokeTaskCurrZone, targetZone, task, applyThis, applyArgs) : task.callback.apply(applyThis, applyArgs);
            };
            _ZoneDelegate.prototype.cancelTask = function (targetZone, task) {
                var value;
                if (this._cancelTaskZS) {
                    value = this._cancelTaskZS.onCancelTask(this._cancelTaskDlgt, this._cancelTaskCurrZone, targetZone, task);
                }
                else {
                    if (!task.cancelFn) {
                        throw Error("Task is not cancelable");
                    }
                    value = task.cancelFn(task);
                }
                return value;
            };
            _ZoneDelegate.prototype.hasTask = function (targetZone, isEmpty) {
                try {
                    this._hasTaskZS && this._hasTaskZS.onHasTask(this._hasTaskDlgt, this._hasTaskCurrZone, targetZone, isEmpty);
                }
                catch (err) {
                    this.handleError(targetZone, err);
                }
            };
            _ZoneDelegate.prototype._updateTaskCount = function (type, count) {
                var counts = this._taskCounts;
                var prev = counts[type];
                var next = counts[type] = prev + count;
                if (next < 0) {
                    throw new Error("More tasks executed then were scheduled.");
                }
                if (prev == 0 || next == 0) {
                    var isEmpty = {
                        microTask: counts["microTask"] > 0,
                        macroTask: counts["macroTask"] > 0,
                        eventTask: counts["eventTask"] > 0,
                        change: type
                    };
                    this.hasTask(this._zone, isEmpty);
                }
            };
            return _ZoneDelegate;
        }());
        var ZoneTask = /** @class */ (function () {
            function ZoneTask(type, source, callback, options, scheduleFn, cancelFn) {
                __publicField(this, "type");
                __publicField(this, "source");
                __publicField(this, "invoke");
                __publicField(this, "callback");
                __publicField(this, "data");
                __publicField(this, "scheduleFn");
                __publicField(this, "cancelFn");
                __publicField(this, "_zone", null);
                __publicField(this, "runCount", 0);
                __publicField(this, "_zoneDelegates", null);
                __publicField(this, "_state", "notScheduled");
                this.type = type;
                this.source = source;
                this.data = options;
                this.scheduleFn = scheduleFn;
                this.cancelFn = cancelFn;
                if (!callback) {
                    throw new Error("callback is not defined");
                }
                this.callback = callback;
                var self2 = this;
                if (type === eventTask && options && options.useG) {
                    this.invoke = ZoneTask.invokeTask;
                }
                else {
                    this.invoke = function () {
                        return ZoneTask.invokeTask.call(global, self2, this, arguments);
                    };
                }
            }
            ZoneTask.invokeTask = function (task, target, args) {
                if (!task) {
                    task = this;
                }
                _numberOfNestedTaskFrames++;
                try {
                    task.runCount++;
                    return task.zone.runTask(task, target, args);
                }
                finally {
                    if (_numberOfNestedTaskFrames == 1) {
                        drainMicroTaskQueue();
                    }
                    _numberOfNestedTaskFrames--;
                }
            };
            Object.defineProperty(ZoneTask.prototype, "zone", {
                get: function () {
                    return this._zone;
                },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(ZoneTask.prototype, "state", {
                get: function () {
                    return this._state;
                },
                enumerable: false,
                configurable: true
            });
            ZoneTask.prototype.cancelScheduleRequest = function () {
                this._transitionTo(notScheduled, scheduling);
            };
            ZoneTask.prototype._transitionTo = function (toState, fromState1, fromState2) {
                if (this._state === fromState1 || this._state === fromState2) {
                    this._state = toState;
                    if (toState == notScheduled) {
                        this._zoneDelegates = null;
                    }
                }
                else {
                    throw new Error("".concat(this.type, " '").concat(this.source, "': can not transition to '").concat(toState, "', expecting state '").concat(fromState1, "'").concat(fromState2 ? " or '" + fromState2 + "'" : "", ", was '").concat(this._state, "'."));
                }
            };
            ZoneTask.prototype.toString = function () {
                if (this.data && typeof this.data.handleId !== "undefined") {
                    return this.data.handleId.toString();
                }
                else {
                    return Object.prototype.toString.call(this);
                }
            };
            // add toJSON method to prevent cyclic error when
            // call JSON.stringify(zoneTask)
            ZoneTask.prototype.toJSON = function () {
                return {
                    type: this.type,
                    state: this.state,
                    source: this.source,
                    zone: this.zone.name,
                    runCount: this.runCount
                };
            };
            return ZoneTask;
        }());
        var symbolSetTimeout = __symbol__("setTimeout");
        var symbolPromise = __symbol__("Promise");
        var symbolThen = __symbol__("then");
        var _microTaskQueue = [];
        var _isDrainingMicrotaskQueue = false;
        var nativeMicroTaskQueuePromise;
        function nativeScheduleMicroTask(func) {
            if (!nativeMicroTaskQueuePromise) {
                if (global[symbolPromise]) {
                    nativeMicroTaskQueuePromise = global[symbolPromise].resolve(0);
                }
            }
            if (nativeMicroTaskQueuePromise) {
                var nativeThen = nativeMicroTaskQueuePromise[symbolThen];
                if (!nativeThen) {
                    nativeThen = nativeMicroTaskQueuePromise["then"];
                }
                nativeThen.call(nativeMicroTaskQueuePromise, func);
            }
            else {
                global[symbolSetTimeout](func, 0);
            }
        }
        function scheduleMicroTask(task) {
            if (_numberOfNestedTaskFrames === 0 && _microTaskQueue.length === 0) {
                nativeScheduleMicroTask(drainMicroTaskQueue);
            }
            task && _microTaskQueue.push(task);
        }
        function drainMicroTaskQueue() {
            if (!_isDrainingMicrotaskQueue) {
                _isDrainingMicrotaskQueue = true;
                while (_microTaskQueue.length) {
                    var queue = _microTaskQueue;
                    _microTaskQueue = [];
                    for (var i = 0; i < queue.length; i++) {
                        var task = queue[i];
                        try {
                            task.zone.runTask(task, null, null);
                        }
                        catch (error) {
                            _api.onUnhandledError(error);
                        }
                    }
                }
                _api.microtaskDrainDone();
                _isDrainingMicrotaskQueue = false;
            }
        }
        var NO_ZONE = { name: "NO ZONE" };
        var notScheduled = "notScheduled", scheduling = "scheduling", scheduled = "scheduled", running = "running", canceling = "canceling", unknown = "unknown";
        var microTask = "microTask", macroTask = "macroTask", eventTask = "eventTask";
        var patches = {};
        var _api = {
            symbol: __symbol__,
            currentZoneFrame: function () { return _currentZoneFrame; },
            onUnhandledError: noop,
            microtaskDrainDone: noop,
            scheduleMicroTask: scheduleMicroTask,
            showUncaughtError: function () { return !ZoneImpl[__symbol__("ignoreConsoleErrorUncaughtError")]; },
            patchEventTarget: function () { return []; },
            patchOnProperties: noop,
            patchMethod: function () { return noop; },
            bindArguments: function () { return []; },
            patchThen: function () { return noop; },
            patchMacroTask: function () { return noop; },
            patchEventPrototype: function () { return noop; },
            getGlobalObjects: function () { return void 0; },
            ObjectDefineProperty: function () { return noop; },
            ObjectGetOwnPropertyDescriptor: function () { return void 0; },
            ObjectCreate: function () { return void 0; },
            ArraySlice: function () { return []; },
            patchClass: function () { return noop; },
            wrapWithCurrentZone: function () { return noop; },
            filterProperties: function () { return []; },
            attachOriginToPatched: function () { return noop; },
            _redefineProperty: function () { return noop; },
            patchCallbacks: function () { return noop; },
            nativeScheduleMicroTask: nativeScheduleMicroTask
        };
        var _currentZoneFrame = { parent: null, zone: new ZoneImpl(null, null) };
        var _currentTask = null;
        var _numberOfNestedTaskFrames = 0;
        function noop() {
        }
        performanceMeasure("Zone", "Zone");
        return ZoneImpl;
    }
    // packages/zone.js/lib/common/utils.js
    var ObjectGetOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
    var ObjectDefineProperty = Object.defineProperty;
    var ObjectGetPrototypeOf = Object.getPrototypeOf;
    var ObjectCreate = Object.create;
    var ArraySlice = Array.prototype.slice;
    var ADD_EVENT_LISTENER_STR = "addEventListener";
    var REMOVE_EVENT_LISTENER_STR = "removeEventListener";
    var ZONE_SYMBOL_ADD_EVENT_LISTENER = __symbol__(ADD_EVENT_LISTENER_STR);
    var ZONE_SYMBOL_REMOVE_EVENT_LISTENER = __symbol__(REMOVE_EVENT_LISTENER_STR);
    var TRUE_STR = "true";
    var FALSE_STR = "false";
    var ZONE_SYMBOL_PREFIX = __symbol__("");
    function wrapWithCurrentZone(callback, source) {
        return Zone.current.wrap(callback, source);
    }
    function scheduleMacroTaskWithCurrentZone(source, callback, data, customSchedule, customCancel) {
        return Zone.current.scheduleMacroTask(source, callback, data, customSchedule, customCancel);
    }
    var zoneSymbol = __symbol__;
    var isWindowExists = typeof window !== "undefined";
    var internalWindow = isWindowExists ? window : void 0;
    var _global = isWindowExists && internalWindow || globalThis;
    var REMOVE_ATTRIBUTE = "removeAttribute";
    function bindArguments(args, source) {
        for (var i = args.length - 1; i >= 0; i--) {
            if (typeof args[i] === "function") {
                args[i] = wrapWithCurrentZone(args[i], source + "_" + i);
            }
        }
        return args;
    }
    function patchPrototype(prototype, fnNames) {
        var source = prototype.constructor["name"];
        var _loop_1 = function (i) {
            var name_1 = fnNames[i];
            var delegate = prototype[name_1];
            if (delegate) {
                var prototypeDesc = ObjectGetOwnPropertyDescriptor(prototype, name_1);
                if (!isPropertyWritable(prototypeDesc)) {
                    return "continue";
                }
                prototype[name_1] = (function (delegate2) {
                    var patched = function () {
                        return delegate2.apply(this, bindArguments(arguments, source + "." + name_1));
                    };
                    attachOriginToPatched(patched, delegate2);
                    return patched;
                })(delegate);
            }
        };
        for (var i = 0; i < fnNames.length; i++) {
            _loop_1(i);
        }
    }
    function isPropertyWritable(propertyDesc) {
        if (!propertyDesc) {
            return true;
        }
        if (propertyDesc.writable === false) {
            return false;
        }
        return !(typeof propertyDesc.get === "function" && typeof propertyDesc.set === "undefined");
    }
    var isWebWorker = typeof WorkerGlobalScope !== "undefined" && self instanceof WorkerGlobalScope;
    var isNode = !("nw" in _global) && typeof _global.process !== "undefined" && _global.process.toString() === "[object process]";
    var isBrowser = !isNode && !isWebWorker && !!(isWindowExists && internalWindow["HTMLElement"]);
    var isMix = typeof _global.process !== "undefined" && _global.process.toString() === "[object process]" && !isWebWorker && !!(isWindowExists && internalWindow["HTMLElement"]);
    var zoneSymbolEventNames = {};
    var enableBeforeunloadSymbol = zoneSymbol("enable_beforeunload");
    var wrapFn = function (event) {
        event = event || _global.event;
        if (!event) {
            return;
        }
        var eventNameSymbol = zoneSymbolEventNames[event.type];
        if (!eventNameSymbol) {
            eventNameSymbol = zoneSymbolEventNames[event.type] = zoneSymbol("ON_PROPERTY" + event.type);
        }
        var target = this || event.target || _global;
        var listener = target[eventNameSymbol];
        var result;
        if (isBrowser && target === internalWindow && event.type === "error") {
            var errorEvent = event;
            result = listener && listener.call(this, errorEvent.message, errorEvent.filename, errorEvent.lineno, errorEvent.colno, errorEvent.error);
            if (result === true) {
                event.preventDefault();
            }
        }
        else {
            result = listener && listener.apply(this, arguments);
            if (
            // https://github.com/angular/angular/issues/47579
            // https://www.w3.org/TR/2011/WD-html5-20110525/history.html#beforeunloadevent
            // This is the only specific case we should check for. The spec defines that the
            // `returnValue` attribute represents the message to show the user. When the event
            // is created, this attribute must be set to the empty string.
            event.type === "beforeunload" && // To prevent any breaking changes resulting from this change, given that
                // it was already causing a significant number of failures in G3, we have hidden
                // that behavior behind a global configuration flag. Consumers can enable this
                // flag explicitly if they want the `beforeunload` event to be handled as defined
                // in the specification.
                _global[enableBeforeunloadSymbol] && // The IDL event definition is `attribute DOMString returnValue`, so we check whether
                // `typeof result` is a string.
                typeof result === "string") {
                event.returnValue = result;
            }
            else if (result != void 0 && !result) {
                event.preventDefault();
            }
        }
        return result;
    };
    function patchProperty(obj, prop, prototype) {
        var desc = ObjectGetOwnPropertyDescriptor(obj, prop);
        if (!desc && prototype) {
            var prototypeDesc = ObjectGetOwnPropertyDescriptor(prototype, prop);
            if (prototypeDesc) {
                desc = { enumerable: true, configurable: true };
            }
        }
        if (!desc || !desc.configurable) {
            return;
        }
        var onPropPatchedSymbol = zoneSymbol("on" + prop + "patched");
        if (obj.hasOwnProperty(onPropPatchedSymbol) && obj[onPropPatchedSymbol]) {
            return;
        }
        delete desc.writable;
        delete desc.value;
        var originalDescGet = desc.get;
        var originalDescSet = desc.set;
        var eventName = prop.slice(2);
        var eventNameSymbol = zoneSymbolEventNames[eventName];
        if (!eventNameSymbol) {
            eventNameSymbol = zoneSymbolEventNames[eventName] = zoneSymbol("ON_PROPERTY" + eventName);
        }
        desc.set = function (newValue) {
            var target = this;
            if (!target && obj === _global) {
                target = _global;
            }
            if (!target) {
                return;
            }
            var previousValue = target[eventNameSymbol];
            if (typeof previousValue === "function") {
                target.removeEventListener(eventName, wrapFn);
            }
            originalDescSet == null ? void 0 : originalDescSet.call(target, null);
            target[eventNameSymbol] = newValue;
            if (typeof newValue === "function") {
                target.addEventListener(eventName, wrapFn, false);
            }
        };
        desc.get = function () {
            var target = this;
            if (!target && obj === _global) {
                target = _global;
            }
            if (!target) {
                return null;
            }
            var listener = target[eventNameSymbol];
            if (listener) {
                return listener;
            }
            else if (originalDescGet) {
                var value = originalDescGet.call(this);
                if (value) {
                    desc.set.call(this, value);
                    if (typeof target[REMOVE_ATTRIBUTE] === "function") {
                        target.removeAttribute(prop);
                    }
                    return value;
                }
            }
            return null;
        };
        ObjectDefineProperty(obj, prop, desc);
        obj[onPropPatchedSymbol] = true;
    }
    function patchOnProperties(obj, properties, prototype) {
        if (properties) {
            for (var i = 0; i < properties.length; i++) {
                patchProperty(obj, "on" + properties[i], prototype);
            }
        }
        else {
            var onProperties = [];
            for (var prop in obj) {
                if (prop.slice(0, 2) == "on") {
                    onProperties.push(prop);
                }
            }
            for (var j = 0; j < onProperties.length; j++) {
                patchProperty(obj, onProperties[j], prototype);
            }
        }
    }
    var originalInstanceKey = zoneSymbol("originalInstance");
    function patchClass(className) {
        var OriginalClass = _global[className];
        if (!OriginalClass)
            return;
        _global[zoneSymbol(className)] = OriginalClass;
        _global[className] = function () {
            var a = bindArguments(arguments, className);
            switch (a.length) {
                case 0:
                    this[originalInstanceKey] = new OriginalClass();
                    break;
                case 1:
                    this[originalInstanceKey] = new OriginalClass(a[0]);
                    break;
                case 2:
                    this[originalInstanceKey] = new OriginalClass(a[0], a[1]);
                    break;
                case 3:
                    this[originalInstanceKey] = new OriginalClass(a[0], a[1], a[2]);
                    break;
                case 4:
                    this[originalInstanceKey] = new OriginalClass(a[0], a[1], a[2], a[3]);
                    break;
                default:
                    throw new Error("Arg list too long.");
            }
        };
        attachOriginToPatched(_global[className], OriginalClass);
        var instance = new OriginalClass(function () {
        });
        var prop;
        for (prop in instance) {
            if (className === "XMLHttpRequest" && prop === "responseBlob")
                continue;
            (function (prop2) {
                if (typeof instance[prop2] === "function") {
                    _global[className].prototype[prop2] = function () {
                        return this[originalInstanceKey][prop2].apply(this[originalInstanceKey], arguments);
                    };
                }
                else {
                    ObjectDefineProperty(_global[className].prototype, prop2, {
                        set: function (fn) {
                            if (typeof fn === "function") {
                                this[originalInstanceKey][prop2] = wrapWithCurrentZone(fn, className + "." + prop2);
                                attachOriginToPatched(this[originalInstanceKey][prop2], fn);
                            }
                            else {
                                this[originalInstanceKey][prop2] = fn;
                            }
                        },
                        get: function () {
                            return this[originalInstanceKey][prop2];
                        }
                    });
                }
            })(prop);
        }
        for (prop in OriginalClass) {
            if (prop !== "prototype" && OriginalClass.hasOwnProperty(prop)) {
                _global[className][prop] = OriginalClass[prop];
            }
        }
    }
    function copySymbolProperties(src, dest) {
        if (typeof Object.getOwnPropertySymbols !== "function") {
            return;
        }
        var symbols = Object.getOwnPropertySymbols(src);
        symbols.forEach(function (symbol) {
            var desc = Object.getOwnPropertyDescriptor(src, symbol);
            Object.defineProperty(dest, symbol, {
                get: function () {
                    return src[symbol];
                },
                set: function (value) {
                    if (desc && (!desc.writable || typeof desc.set !== "function")) {
                        return;
                    }
                    src[symbol] = value;
                },
                enumerable: desc ? desc.enumerable : true,
                configurable: desc ? desc.configurable : true
            });
        });
    }
    var shouldCopySymbolProperties = false;
    function setShouldCopySymbolProperties(flag) {
        shouldCopySymbolProperties = flag;
    }
    function patchMethod(target, name, patchFn) {
        var proto = target;
        while (proto && !proto.hasOwnProperty(name)) {
            proto = ObjectGetPrototypeOf(proto);
        }
        if (!proto && target[name]) {
            proto = target;
        }
        var delegateName = zoneSymbol(name);
        var delegate = null;
        if (proto && (!(delegate = proto[delegateName]) || !proto.hasOwnProperty(delegateName))) {
            delegate = proto[delegateName] = proto[name];
            var desc = proto && ObjectGetOwnPropertyDescriptor(proto, name);
            if (isPropertyWritable(desc)) {
                var patchDelegate_1 = patchFn(delegate, delegateName, name);
                proto[name] = function () {
                    return patchDelegate_1(this, arguments);
                };
                attachOriginToPatched(proto[name], delegate);
                if (shouldCopySymbolProperties) {
                    copySymbolProperties(delegate, proto[name]);
                }
            }
        }
        return delegate;
    }
    function patchMacroTask(obj, funcName, metaCreator) {
        var setNative = null;
        function scheduleTask(task) {
            var data = task.data;
            data.args[data.cbIdx] = function () {
                task.invoke.apply(this, arguments);
            };
            setNative.apply(data.target, data.args);
            return task;
        }
        setNative = patchMethod(obj, funcName, function (delegate) { return function (self2, args) {
            var meta = metaCreator(self2, args);
            if (meta.cbIdx >= 0 && typeof args[meta.cbIdx] === "function") {
                return scheduleMacroTaskWithCurrentZone(meta.name, args[meta.cbIdx], meta, scheduleTask);
            }
            else {
                return delegate.apply(self2, args);
            }
        }; });
    }
    function patchMicroTask(obj, funcName, metaCreator) {
        var setNative = null;
        function scheduleTask(task) {
            var data = task.data;
            data.args[data.cbIdx] = function () {
                task.invoke.apply(this, arguments);
            };
            setNative.apply(data.target, data.args);
            return task;
        }
        setNative = patchMethod(obj, funcName, function (delegate) { return function (self2, args) {
            var meta = metaCreator(self2, args);
            if (meta.cbIdx >= 0 && typeof args[meta.cbIdx] === "function") {
                return Zone.current.scheduleMicroTask(meta.name, args[meta.cbIdx], meta, scheduleTask);
            }
            else {
                return delegate.apply(self2, args);
            }
        }; });
    }
    function attachOriginToPatched(patched, original) {
        patched[zoneSymbol("OriginalDelegate")] = original;
    }
    function isFunction(value) {
        return typeof value === "function";
    }
    function isNumber(value) {
        return typeof value === "number";
    }
    // packages/zone.js/lib/common/events.js
    var OPTIMIZED_ZONE_EVENT_TASK_DATA = {
        useG: true
    };
    var zoneSymbolEventNames2 = {};
    var globalSources = {};
    var EVENT_NAME_SYMBOL_REGX = new RegExp("^" + ZONE_SYMBOL_PREFIX + "(\\w+)(true|false)$");
    var IMMEDIATE_PROPAGATION_SYMBOL = zoneSymbol("propagationStopped");
    function prepareEventNames(eventName, eventNameToString) {
        var falseEventName = (eventNameToString ? eventNameToString(eventName) : eventName) + FALSE_STR;
        var trueEventName = (eventNameToString ? eventNameToString(eventName) : eventName) + TRUE_STR;
        var symbol = ZONE_SYMBOL_PREFIX + falseEventName;
        var symbolCapture = ZONE_SYMBOL_PREFIX + trueEventName;
        zoneSymbolEventNames2[eventName] = {};
        zoneSymbolEventNames2[eventName][FALSE_STR] = symbol;
        zoneSymbolEventNames2[eventName][TRUE_STR] = symbolCapture;
    }
    function patchEventTarget(_global2, api, apis, patchOptions) {
        var ADD_EVENT_LISTENER = patchOptions && patchOptions.add || ADD_EVENT_LISTENER_STR;
        var REMOVE_EVENT_LISTENER = patchOptions && patchOptions.rm || REMOVE_EVENT_LISTENER_STR;
        var LISTENERS_EVENT_LISTENER = patchOptions && patchOptions.listeners || "eventListeners";
        var REMOVE_ALL_LISTENERS_EVENT_LISTENER = patchOptions && patchOptions.rmAll || "removeAllListeners";
        var zoneSymbolAddEventListener = zoneSymbol(ADD_EVENT_LISTENER);
        var ADD_EVENT_LISTENER_SOURCE = "." + ADD_EVENT_LISTENER + ":";
        var PREPEND_EVENT_LISTENER = "prependListener";
        var PREPEND_EVENT_LISTENER_SOURCE = "." + PREPEND_EVENT_LISTENER + ":";
        var invokeTask = function (task, target, event) {
            if (task.isRemoved) {
                return;
            }
            var delegate = task.callback;
            if (typeof delegate === "object" && delegate.handleEvent) {
                task.callback = function (event2) { return delegate.handleEvent(event2); };
                task.originalDelegate = delegate;
            }
            var error;
            try {
                task.invoke(task, target, [event]);
            }
            catch (err) {
                error = err;
            }
            var options = task.options;
            if (options && typeof options === "object" && options.once) {
                var delegate2 = task.originalDelegate ? task.originalDelegate : task.callback;
                target[REMOVE_EVENT_LISTENER].call(target, event.type, delegate2, options);
            }
            return error;
        };
        function globalCallback(context, event, isCapture) {
            event = event || _global2.event;
            if (!event) {
                return;
            }
            var target = context || event.target || _global2;
            var tasks = target[zoneSymbolEventNames2[event.type][isCapture ? TRUE_STR : FALSE_STR]];
            if (tasks) {
                var errors = [];
                if (tasks.length === 1) {
                    var err = invokeTask(tasks[0], target, event);
                    err && errors.push(err);
                }
                else {
                    var copyTasks = tasks.slice();
                    for (var i = 0; i < copyTasks.length; i++) {
                        if (event && event[IMMEDIATE_PROPAGATION_SYMBOL] === true) {
                            break;
                        }
                        var err = invokeTask(copyTasks[i], target, event);
                        err && errors.push(err);
                    }
                }
                if (errors.length === 1) {
                    throw errors[0];
                }
                else {
                    var _loop_2 = function (i) {
                        var err = errors[i];
                        api.nativeScheduleMicroTask(function () {
                            throw err;
                        });
                    };
                    for (var i = 0; i < errors.length; i++) {
                        _loop_2(i);
                    }
                }
            }
        }
        var globalZoneAwareCallback = function (event) {
            return globalCallback(this, event, false);
        };
        var globalZoneAwareCaptureCallback = function (event) {
            return globalCallback(this, event, true);
        };
        function patchEventTargetMethods(obj, patchOptions2) {
            if (!obj) {
                return false;
            }
            var useGlobalCallback = true;
            if (patchOptions2 && patchOptions2.useG !== void 0) {
                useGlobalCallback = patchOptions2.useG;
            }
            var validateHandler = patchOptions2 && patchOptions2.vh;
            var checkDuplicate = true;
            if (patchOptions2 && patchOptions2.chkDup !== void 0) {
                checkDuplicate = patchOptions2.chkDup;
            }
            var returnTarget = false;
            if (patchOptions2 && patchOptions2.rt !== void 0) {
                returnTarget = patchOptions2.rt;
            }
            var proto = obj;
            while (proto && !proto.hasOwnProperty(ADD_EVENT_LISTENER)) {
                proto = ObjectGetPrototypeOf(proto);
            }
            if (!proto && obj[ADD_EVENT_LISTENER]) {
                proto = obj;
            }
            if (!proto) {
                return false;
            }
            if (proto[zoneSymbolAddEventListener]) {
                return false;
            }
            var eventNameToString = patchOptions2 && patchOptions2.eventNameToString;
            var taskData = {};
            var nativeAddEventListener = proto[zoneSymbolAddEventListener] = proto[ADD_EVENT_LISTENER];
            var nativeRemoveEventListener = proto[zoneSymbol(REMOVE_EVENT_LISTENER)] = proto[REMOVE_EVENT_LISTENER];
            var nativeListeners = proto[zoneSymbol(LISTENERS_EVENT_LISTENER)] = proto[LISTENERS_EVENT_LISTENER];
            var nativeRemoveAllListeners = proto[zoneSymbol(REMOVE_ALL_LISTENERS_EVENT_LISTENER)] = proto[REMOVE_ALL_LISTENERS_EVENT_LISTENER];
            var nativePrependEventListener;
            if (patchOptions2 && patchOptions2.prepend) {
                nativePrependEventListener = proto[zoneSymbol(patchOptions2.prepend)] = proto[patchOptions2.prepend];
            }
            function buildEventListenerOptions(options, passive) {
                if (!passive) {
                    return options;
                }
                if (typeof options === "boolean") {
                    return { capture: options, passive: true };
                }
                if (!options) {
                    return { passive: true };
                }
                if (typeof options === "object" && options.passive !== false) {
                    return __spreadProps(__spreadValues({}, options), { passive: true });
                }
                return options;
            }
            var customScheduleGlobal = function (task) {
                if (taskData.isExisting) {
                    return;
                }
                return nativeAddEventListener.call(taskData.target, taskData.eventName, taskData.capture ? globalZoneAwareCaptureCallback : globalZoneAwareCallback, taskData.options);
            };
            var customCancelGlobal = function (task) {
                if (!task.isRemoved) {
                    var symbolEventNames = zoneSymbolEventNames2[task.eventName];
                    var symbolEventName = void 0;
                    if (symbolEventNames) {
                        symbolEventName = symbolEventNames[task.capture ? TRUE_STR : FALSE_STR];
                    }
                    var existingTasks = symbolEventName && task.target[symbolEventName];
                    if (existingTasks) {
                        for (var i = 0; i < existingTasks.length; i++) {
                            var existingTask = existingTasks[i];
                            if (existingTask === task) {
                                existingTasks.splice(i, 1);
                                task.isRemoved = true;
                                if (task.removeAbortListener) {
                                    task.removeAbortListener();
                                    task.removeAbortListener = null;
                                }
                                if (existingTasks.length === 0) {
                                    task.allRemoved = true;
                                    task.target[symbolEventName] = null;
                                }
                                break;
                            }
                        }
                    }
                }
                if (!task.allRemoved) {
                    return;
                }
                return nativeRemoveEventListener.call(task.target, task.eventName, task.capture ? globalZoneAwareCaptureCallback : globalZoneAwareCallback, task.options);
            };
            var customScheduleNonGlobal = function (task) {
                return nativeAddEventListener.call(taskData.target, taskData.eventName, task.invoke, taskData.options);
            };
            var customSchedulePrepend = function (task) {
                return nativePrependEventListener.call(taskData.target, taskData.eventName, task.invoke, taskData.options);
            };
            var customCancelNonGlobal = function (task) {
                return nativeRemoveEventListener.call(task.target, task.eventName, task.invoke, task.options);
            };
            var customSchedule = useGlobalCallback ? customScheduleGlobal : customScheduleNonGlobal;
            var customCancel = useGlobalCallback ? customCancelGlobal : customCancelNonGlobal;
            var compareTaskCallbackVsDelegate = function (task, delegate) {
                var typeOfDelegate = typeof delegate;
                return typeOfDelegate === "function" && task.callback === delegate || typeOfDelegate === "object" && task.originalDelegate === delegate;
            };
            var compare = (patchOptions2 == null ? void 0 : patchOptions2.diff) || compareTaskCallbackVsDelegate;
            var unpatchedEvents = Zone[zoneSymbol("UNPATCHED_EVENTS")];
            var passiveEvents = _global2[zoneSymbol("PASSIVE_EVENTS")];
            function copyEventListenerOptions(options) {
                if (typeof options === "object" && options !== null) {
                    var newOptions = __spreadValues({}, options);
                    if (options.signal) {
                        newOptions.signal = options.signal;
                    }
                    return newOptions;
                }
                return options;
            }
            var makeAddListener = function (nativeListener, addSource, customScheduleFn, customCancelFn, returnTarget2, prepend) {
                if (returnTarget2 === void 0) { returnTarget2 = false; }
                if (prepend === void 0) { prepend = false; }
                return function () {
                    var target = this || _global2;
                    var eventName = arguments[0];
                    if (patchOptions2 && patchOptions2.transferEventName) {
                        eventName = patchOptions2.transferEventName(eventName);
                    }
                    var delegate = arguments[1];
                    if (!delegate) {
                        return nativeListener.apply(this, arguments);
                    }
                    if (isNode && eventName === "uncaughtException") {
                        return nativeListener.apply(this, arguments);
                    }
                    var isEventListenerObject = false;
                    if (typeof delegate !== "function") {
                        if (!delegate.handleEvent) {
                            return nativeListener.apply(this, arguments);
                        }
                        isEventListenerObject = true;
                    }
                    if (validateHandler && !validateHandler(nativeListener, delegate, target, arguments)) {
                        return;
                    }
                    var passive = !!passiveEvents && passiveEvents.indexOf(eventName) !== -1;
                    var options = copyEventListenerOptions(buildEventListenerOptions(arguments[2], passive));
                    var signal = options == null ? void 0 : options.signal;
                    if (signal == null ? void 0 : signal.aborted) {
                        return;
                    }
                    if (unpatchedEvents) {
                        for (var i = 0; i < unpatchedEvents.length; i++) {
                            if (eventName === unpatchedEvents[i]) {
                                if (passive) {
                                    return nativeListener.call(target, eventName, delegate, options);
                                }
                                else {
                                    return nativeListener.apply(this, arguments);
                                }
                            }
                        }
                    }
                    var capture = !options ? false : typeof options === "boolean" ? true : options.capture;
                    var once = options && typeof options === "object" ? options.once : false;
                    var zone = Zone.current;
                    var symbolEventNames = zoneSymbolEventNames2[eventName];
                    if (!symbolEventNames) {
                        prepareEventNames(eventName, eventNameToString);
                        symbolEventNames = zoneSymbolEventNames2[eventName];
                    }
                    var symbolEventName = symbolEventNames[capture ? TRUE_STR : FALSE_STR];
                    var existingTasks = target[symbolEventName];
                    var isExisting = false;
                    if (existingTasks) {
                        isExisting = true;
                        if (checkDuplicate) {
                            for (var i = 0; i < existingTasks.length; i++) {
                                if (compare(existingTasks[i], delegate)) {
                                    return;
                                }
                            }
                        }
                    }
                    else {
                        existingTasks = target[symbolEventName] = [];
                    }
                    var source;
                    var constructorName = target.constructor["name"];
                    var targetSource = globalSources[constructorName];
                    if (targetSource) {
                        source = targetSource[eventName];
                    }
                    if (!source) {
                        source = constructorName + addSource + (eventNameToString ? eventNameToString(eventName) : eventName);
                    }
                    taskData.options = options;
                    if (once) {
                        taskData.options.once = false;
                    }
                    taskData.target = target;
                    taskData.capture = capture;
                    taskData.eventName = eventName;
                    taskData.isExisting = isExisting;
                    var data = useGlobalCallback ? OPTIMIZED_ZONE_EVENT_TASK_DATA : void 0;
                    if (data) {
                        data.taskData = taskData;
                    }
                    if (signal) {
                        taskData.options.signal = void 0;
                    }
                    var task = zone.scheduleEventTask(source, delegate, data, customScheduleFn, customCancelFn);
                    if (signal) {
                        taskData.options.signal = signal;
                        var onAbort_1 = function () { return task.zone.cancelTask(task); };
                        nativeListener.call(signal, "abort", onAbort_1, { once: true });
                        task.removeAbortListener = function () { return signal.removeEventListener("abort", onAbort_1); };
                    }
                    taskData.target = null;
                    if (data) {
                        data.taskData = null;
                    }
                    if (once) {
                        taskData.options.once = true;
                    }
                    if (typeof task.options !== "boolean") {
                        task.options = options;
                    }
                    task.target = target;
                    task.capture = capture;
                    task.eventName = eventName;
                    if (isEventListenerObject) {
                        task.originalDelegate = delegate;
                    }
                    if (!prepend) {
                        existingTasks.push(task);
                    }
                    else {
                        existingTasks.unshift(task);
                    }
                    if (returnTarget2) {
                        return target;
                    }
                };
            };
            proto[ADD_EVENT_LISTENER] = makeAddListener(nativeAddEventListener, ADD_EVENT_LISTENER_SOURCE, customSchedule, customCancel, returnTarget);
            if (nativePrependEventListener) {
                proto[PREPEND_EVENT_LISTENER] = makeAddListener(nativePrependEventListener, PREPEND_EVENT_LISTENER_SOURCE, customSchedulePrepend, customCancel, returnTarget, true);
            }
            proto[REMOVE_EVENT_LISTENER] = function () {
                var target = this || _global2;
                var eventName = arguments[0];
                if (patchOptions2 && patchOptions2.transferEventName) {
                    eventName = patchOptions2.transferEventName(eventName);
                }
                var options = arguments[2];
                var capture = !options ? false : typeof options === "boolean" ? true : options.capture;
                var delegate = arguments[1];
                if (!delegate) {
                    return nativeRemoveEventListener.apply(this, arguments);
                }
                if (validateHandler && !validateHandler(nativeRemoveEventListener, delegate, target, arguments)) {
                    return;
                }
                var symbolEventNames = zoneSymbolEventNames2[eventName];
                var symbolEventName;
                if (symbolEventNames) {
                    symbolEventName = symbolEventNames[capture ? TRUE_STR : FALSE_STR];
                }
                var existingTasks = symbolEventName && target[symbolEventName];
                if (existingTasks) {
                    for (var i = 0; i < existingTasks.length; i++) {
                        var existingTask = existingTasks[i];
                        if (compare(existingTask, delegate)) {
                            existingTasks.splice(i, 1);
                            existingTask.isRemoved = true;
                            if (existingTasks.length === 0) {
                                existingTask.allRemoved = true;
                                target[symbolEventName] = null;
                                if (!capture && typeof eventName === "string") {
                                    var onPropertySymbol = ZONE_SYMBOL_PREFIX + "ON_PROPERTY" + eventName;
                                    target[onPropertySymbol] = null;
                                }
                            }
                            existingTask.zone.cancelTask(existingTask);
                            if (returnTarget) {
                                return target;
                            }
                            return;
                        }
                    }
                }
                return nativeRemoveEventListener.apply(this, arguments);
            };
            proto[LISTENERS_EVENT_LISTENER] = function () {
                var target = this || _global2;
                var eventName = arguments[0];
                if (patchOptions2 && patchOptions2.transferEventName) {
                    eventName = patchOptions2.transferEventName(eventName);
                }
                var listeners = [];
                var tasks = findEventTasks(target, eventNameToString ? eventNameToString(eventName) : eventName);
                for (var i = 0; i < tasks.length; i++) {
                    var task = tasks[i];
                    var delegate = task.originalDelegate ? task.originalDelegate : task.callback;
                    listeners.push(delegate);
                }
                return listeners;
            };
            proto[REMOVE_ALL_LISTENERS_EVENT_LISTENER] = function () {
                var target = this || _global2;
                var eventName = arguments[0];
                if (!eventName) {
                    var keys = Object.keys(target);
                    for (var i = 0; i < keys.length; i++) {
                        var prop = keys[i];
                        var match = EVENT_NAME_SYMBOL_REGX.exec(prop);
                        var evtName = match && match[1];
                        if (evtName && evtName !== "removeListener") {
                            this[REMOVE_ALL_LISTENERS_EVENT_LISTENER].call(this, evtName);
                        }
                    }
                    this[REMOVE_ALL_LISTENERS_EVENT_LISTENER].call(this, "removeListener");
                }
                else {
                    if (patchOptions2 && patchOptions2.transferEventName) {
                        eventName = patchOptions2.transferEventName(eventName);
                    }
                    var symbolEventNames = zoneSymbolEventNames2[eventName];
                    if (symbolEventNames) {
                        var symbolEventName = symbolEventNames[FALSE_STR];
                        var symbolCaptureEventName = symbolEventNames[TRUE_STR];
                        var tasks = target[symbolEventName];
                        var captureTasks = target[symbolCaptureEventName];
                        if (tasks) {
                            var removeTasks = tasks.slice();
                            for (var i = 0; i < removeTasks.length; i++) {
                                var task = removeTasks[i];
                                var delegate = task.originalDelegate ? task.originalDelegate : task.callback;
                                this[REMOVE_EVENT_LISTENER].call(this, eventName, delegate, task.options);
                            }
                        }
                        if (captureTasks) {
                            var removeTasks = captureTasks.slice();
                            for (var i = 0; i < removeTasks.length; i++) {
                                var task = removeTasks[i];
                                var delegate = task.originalDelegate ? task.originalDelegate : task.callback;
                                this[REMOVE_EVENT_LISTENER].call(this, eventName, delegate, task.options);
                            }
                        }
                    }
                }
                if (returnTarget) {
                    return this;
                }
            };
            attachOriginToPatched(proto[ADD_EVENT_LISTENER], nativeAddEventListener);
            attachOriginToPatched(proto[REMOVE_EVENT_LISTENER], nativeRemoveEventListener);
            if (nativeRemoveAllListeners) {
                attachOriginToPatched(proto[REMOVE_ALL_LISTENERS_EVENT_LISTENER], nativeRemoveAllListeners);
            }
            if (nativeListeners) {
                attachOriginToPatched(proto[LISTENERS_EVENT_LISTENER], nativeListeners);
            }
            return true;
        }
        var results = [];
        for (var i = 0; i < apis.length; i++) {
            results[i] = patchEventTargetMethods(apis[i], patchOptions);
        }
        return results;
    }
    function findEventTasks(target, eventName) {
        if (!eventName) {
            var foundTasks = [];
            for (var prop in target) {
                var match = EVENT_NAME_SYMBOL_REGX.exec(prop);
                var evtName = match && match[1];
                if (evtName && (!eventName || evtName === eventName)) {
                    var tasks = target[prop];
                    if (tasks) {
                        for (var i = 0; i < tasks.length; i++) {
                            foundTasks.push(tasks[i]);
                        }
                    }
                }
            }
            return foundTasks;
        }
        var symbolEventName = zoneSymbolEventNames2[eventName];
        if (!symbolEventName) {
            prepareEventNames(eventName);
            symbolEventName = zoneSymbolEventNames2[eventName];
        }
        var captureFalseTasks = target[symbolEventName[FALSE_STR]];
        var captureTrueTasks = target[symbolEventName[TRUE_STR]];
        if (!captureFalseTasks) {
            return captureTrueTasks ? captureTrueTasks.slice() : [];
        }
        else {
            return captureTrueTasks ? captureFalseTasks.concat(captureTrueTasks) : captureFalseTasks.slice();
        }
    }
    function patchEventPrototype(global2, api) {
        var Event = global2["Event"];
        if (Event && Event.prototype) {
            api.patchMethod(Event.prototype, "stopImmediatePropagation", function (delegate) { return function (self2, args) {
                self2[IMMEDIATE_PROPAGATION_SYMBOL] = true;
                delegate && delegate.apply(self2, args);
            }; });
        }
    }
    // packages/zone.js/lib/common/queue-microtask.js
    function patchQueueMicrotask(global2, api) {
        api.patchMethod(global2, "queueMicrotask", function (delegate) {
            return function (self2, args) {
                Zone.current.scheduleMicroTask("queueMicrotask", args[0]);
            };
        });
    }
    // packages/zone.js/lib/common/timers.js
    var taskSymbol = zoneSymbol("zoneTask");
    function patchTimer(window2, setName, cancelName, nameSuffix) {
        var setNative = null;
        var clearNative = null;
        setName += nameSuffix;
        cancelName += nameSuffix;
        var tasksByHandleId = {};
        function scheduleTask(task) {
            var data = task.data;
            data.args[0] = function () {
                return task.invoke.apply(this, arguments);
            };
            var handleOrId = setNative.apply(window2, data.args);
            if (isNumber(handleOrId)) {
                data.handleId = handleOrId;
            }
            else {
                data.handle = handleOrId;
                data.isRefreshable = isFunction(handleOrId.refresh);
            }
            return task;
        }
        function clearTask(task) {
            var _b = task.data, handle = _b.handle, handleId = _b.handleId;
            return clearNative.call(window2, handle != null ? handle : handleId);
        }
        setNative = patchMethod(window2, setName, function (delegate) { return function (self2, args) {
            var _a;
            if (isFunction(args[0])) {
                var options_1 = {
                    isRefreshable: false,
                    isPeriodic: nameSuffix === "Interval",
                    delay: nameSuffix === "Timeout" || nameSuffix === "Interval" ? args[1] || 0 : void 0,
                    args: args
                };
                var callback_1 = args[0];
                args[0] = function timer() {
                    try {
                        return callback_1.apply(this, arguments);
                    }
                    finally {
                        var handle2 = options_1.handle, handleId2 = options_1.handleId, isPeriodic2 = options_1.isPeriodic, isRefreshable2 = options_1.isRefreshable;
                        if (!isPeriodic2 && !isRefreshable2) {
                            if (handleId2) {
                                delete tasksByHandleId[handleId2];
                            }
                            else if (handle2) {
                                handle2[taskSymbol] = null;
                            }
                        }
                    }
                };
                var task_1 = scheduleMacroTaskWithCurrentZone(setName, args[0], options_1, scheduleTask, clearTask);
                if (!task_1) {
                    return task_1;
                }
                var _b = task_1.data, handleId = _b.handleId, handle = _b.handle, isRefreshable = _b.isRefreshable, isPeriodic = _b.isPeriodic;
                if (handleId) {
                    tasksByHandleId[handleId] = task_1;
                }
                else if (handle) {
                    handle[taskSymbol] = task_1;
                    if (isRefreshable && !isPeriodic) {
                        var originalRefresh_1 = handle.refresh;
                        handle.refresh = function () {
                            var zone = task_1.zone, state = task_1.state;
                            if (state === "notScheduled") {
                                task_1._state = "scheduled";
                                zone._updateTaskCount(task_1, 1);
                            }
                            else if (state === "running") {
                                task_1._state = "scheduling";
                            }
                            return originalRefresh_1.call(this);
                        };
                    }
                }
                return (_a = handle != null ? handle : handleId) != null ? _a : task_1;
            }
            else {
                return delegate.apply(window2, args);
            }
        }; });
        clearNative = patchMethod(window2, cancelName, function (delegate) { return function (self2, args) {
            var id = args[0];
            var task;
            if (isNumber(id)) {
                task = tasksByHandleId[id];
                delete tasksByHandleId[id];
            }
            else {
                task = id == null ? void 0 : id[taskSymbol];
                if (task) {
                    id[taskSymbol] = null;
                }
                else {
                    task = id;
                }
            }
            if (task == null ? void 0 : task.type) {
                if (task.cancelFn) {
                    task.zone.cancelTask(task);
                }
            }
            else {
                delegate.apply(window2, args);
            }
        }; });
    }
    // packages/zone.js/lib/browser/custom-elements.js
    function patchCustomElements(_global2, api) {
        var _b = api.getGlobalObjects(), isBrowser2 = _b.isBrowser, isMix2 = _b.isMix;
        if (!isBrowser2 && !isMix2 || !_global2["customElements"] || !("customElements" in _global2)) {
            return;
        }
        var callbacks = [
            "connectedCallback",
            "disconnectedCallback",
            "adoptedCallback",
            "attributeChangedCallback",
            "formAssociatedCallback",
            "formDisabledCallback",
            "formResetCallback",
            "formStateRestoreCallback"
        ];
        api.patchCallbacks(api, _global2.customElements, "customElements", "define", callbacks);
    }
    // packages/zone.js/lib/browser/event-target.js
    function eventTargetPatch(_global2, api) {
        if (Zone[api.symbol("patchEventTarget")]) {
            return;
        }
        var _b = api.getGlobalObjects(), eventNames = _b.eventNames, zoneSymbolEventNames3 = _b.zoneSymbolEventNames, TRUE_STR2 = _b.TRUE_STR, FALSE_STR2 = _b.FALSE_STR, ZONE_SYMBOL_PREFIX2 = _b.ZONE_SYMBOL_PREFIX;
        for (var i = 0; i < eventNames.length; i++) {
            var eventName = eventNames[i];
            var falseEventName = eventName + FALSE_STR2;
            var trueEventName = eventName + TRUE_STR2;
            var symbol = ZONE_SYMBOL_PREFIX2 + falseEventName;
            var symbolCapture = ZONE_SYMBOL_PREFIX2 + trueEventName;
            zoneSymbolEventNames3[eventName] = {};
            zoneSymbolEventNames3[eventName][FALSE_STR2] = symbol;
            zoneSymbolEventNames3[eventName][TRUE_STR2] = symbolCapture;
        }
        var EVENT_TARGET = _global2["EventTarget"];
        if (!EVENT_TARGET || !EVENT_TARGET.prototype) {
            return;
        }
        api.patchEventTarget(_global2, api, [EVENT_TARGET && EVENT_TARGET.prototype]);
        return true;
    }
    function patchEvent(global2, api) {
        api.patchEventPrototype(global2, api);
    }
    // packages/zone.js/lib/browser/property-descriptor.js
    function filterProperties(target, onProperties, ignoreProperties) {
        if (!ignoreProperties || ignoreProperties.length === 0) {
            return onProperties;
        }
        var tip = ignoreProperties.filter(function (ip) { return ip.target === target; });
        if (tip.length === 0) {
            return onProperties;
        }
        var targetIgnoreProperties = tip[0].ignoreProperties;
        return onProperties.filter(function (op) { return targetIgnoreProperties.indexOf(op) === -1; });
    }
    function patchFilteredProperties(target, onProperties, ignoreProperties, prototype) {
        if (!target) {
            return;
        }
        var filteredProperties = filterProperties(target, onProperties, ignoreProperties);
        patchOnProperties(target, filteredProperties, prototype);
    }
    function getOnEventNames(target) {
        return Object.getOwnPropertyNames(target).filter(function (name) { return name.startsWith("on") && name.length > 2; }).map(function (name) { return name.substring(2); });
    }
    function propertyDescriptorPatch(api, _global2) {
        if (isNode && !isMix) {
            return;
        }
        if (Zone[api.symbol("patchEvents")]) {
            return;
        }
        var ignoreProperties = _global2["__Zone_ignore_on_properties"];
        var patchTargets = [];
        if (isBrowser) {
            var internalWindow2 = window;
            patchTargets = patchTargets.concat([
                "Document",
                "SVGElement",
                "Element",
                "HTMLElement",
                "HTMLBodyElement",
                "HTMLMediaElement",
                "HTMLFrameSetElement",
                "HTMLFrameElement",
                "HTMLIFrameElement",
                "HTMLMarqueeElement",
                "Worker"
            ]);
            patchFilteredProperties(internalWindow2, getOnEventNames(internalWindow2), ignoreProperties, ObjectGetPrototypeOf(internalWindow2));
        }
        patchTargets = patchTargets.concat([
            "XMLHttpRequest",
            "XMLHttpRequestEventTarget",
            "IDBIndex",
            "IDBRequest",
            "IDBOpenDBRequest",
            "IDBDatabase",
            "IDBTransaction",
            "IDBCursor",
            "WebSocket"
        ]);
        for (var i = 0; i < patchTargets.length; i++) {
            var target = _global2[patchTargets[i]];
            (target == null ? void 0 : target.prototype) && patchFilteredProperties(target.prototype, getOnEventNames(target.prototype), ignoreProperties);
        }
    }
    // packages/zone.js/lib/browser/browser.js
    function patchBrowser(Zone3) {
        Zone3.__load_patch("timers", function (global2) {
            var set2 = "set";
            var clear2 = "clear";
            patchTimer(global2, set2, clear2, "Timeout");
            patchTimer(global2, set2, clear2, "Interval");
            patchTimer(global2, set2, clear2, "Immediate");
        });
        Zone3.__load_patch("requestAnimationFrame", function (global2) {
            patchTimer(global2, "request", "cancel", "AnimationFrame");
            patchTimer(global2, "mozRequest", "mozCancel", "AnimationFrame");
            patchTimer(global2, "webkitRequest", "webkitCancel", "AnimationFrame");
        });
        Zone3.__load_patch("blocking", function (global2, Zone4) {
            var blockingMethods = ["alert", "prompt", "confirm"];
            for (var i = 0; i < blockingMethods.length; i++) {
                var name_2 = blockingMethods[i];
                patchMethod(global2, name_2, function (delegate, symbol, name2) {
                    return function (s, args) {
                        return Zone4.current.run(delegate, global2, args, name2);
                    };
                });
            }
        });
        Zone3.__load_patch("EventTarget", function (global2, Zone4, api) {
            patchEvent(global2, api);
            eventTargetPatch(global2, api);
            var XMLHttpRequestEventTarget = global2["XMLHttpRequestEventTarget"];
            if (XMLHttpRequestEventTarget && XMLHttpRequestEventTarget.prototype) {
                api.patchEventTarget(global2, api, [XMLHttpRequestEventTarget.prototype]);
            }
        });
        Zone3.__load_patch("MutationObserver", function (global2, Zone4, api) {
            patchClass("MutationObserver");
            patchClass("WebKitMutationObserver");
        });
        Zone3.__load_patch("IntersectionObserver", function (global2, Zone4, api) {
            patchClass("IntersectionObserver");
        });
        Zone3.__load_patch("FileReader", function (global2, Zone4, api) {
            patchClass("FileReader");
        });
        Zone3.__load_patch("on_property", function (global2, Zone4, api) {
            propertyDescriptorPatch(api, global2);
        });
        Zone3.__load_patch("customElements", function (global2, Zone4, api) {
            patchCustomElements(global2, api);
        });
        Zone3.__load_patch("XHR", function (global2, Zone4) {
            patchXHR(global2);
            var XHR_TASK = zoneSymbol("xhrTask");
            var XHR_SYNC = zoneSymbol("xhrSync");
            var XHR_LISTENER = zoneSymbol("xhrListener");
            var XHR_SCHEDULED = zoneSymbol("xhrScheduled");
            var XHR_URL = zoneSymbol("xhrURL");
            var XHR_ERROR_BEFORE_SCHEDULED = zoneSymbol("xhrErrorBeforeScheduled");
            function patchXHR(window2) {
                var XMLHttpRequest = window2["XMLHttpRequest"];
                if (!XMLHttpRequest) {
                    return;
                }
                var XMLHttpRequestPrototype = XMLHttpRequest.prototype;
                function findPendingTask(target) {
                    return target[XHR_TASK];
                }
                var oriAddListener = XMLHttpRequestPrototype[ZONE_SYMBOL_ADD_EVENT_LISTENER];
                var oriRemoveListener = XMLHttpRequestPrototype[ZONE_SYMBOL_REMOVE_EVENT_LISTENER];
                if (!oriAddListener) {
                    var XMLHttpRequestEventTarget_1 = window2["XMLHttpRequestEventTarget"];
                    if (XMLHttpRequestEventTarget_1) {
                        var XMLHttpRequestEventTargetPrototype = XMLHttpRequestEventTarget_1.prototype;
                        oriAddListener = XMLHttpRequestEventTargetPrototype[ZONE_SYMBOL_ADD_EVENT_LISTENER];
                        oriRemoveListener = XMLHttpRequestEventTargetPrototype[ZONE_SYMBOL_REMOVE_EVENT_LISTENER];
                    }
                }
                var READY_STATE_CHANGE = "readystatechange";
                var SCHEDULED = "scheduled";
                function scheduleTask(task) {
                    var data = task.data;
                    var target = data.target;
                    target[XHR_SCHEDULED] = false;
                    target[XHR_ERROR_BEFORE_SCHEDULED] = false;
                    var listener = target[XHR_LISTENER];
                    if (!oriAddListener) {
                        oriAddListener = target[ZONE_SYMBOL_ADD_EVENT_LISTENER];
                        oriRemoveListener = target[ZONE_SYMBOL_REMOVE_EVENT_LISTENER];
                    }
                    if (listener) {
                        oriRemoveListener.call(target, READY_STATE_CHANGE, listener);
                    }
                    var newListener = target[XHR_LISTENER] = function () {
                        if (target.readyState === target.DONE) {
                            if (!data.aborted && target[XHR_SCHEDULED] && task.state === SCHEDULED) {
                                var loadTasks = target[Zone4.__symbol__("loadfalse")];
                                if (target.status !== 0 && loadTasks && loadTasks.length > 0) {
                                    var oriInvoke_1 = task.invoke;
                                    task.invoke = function () {
                                        var loadTasks2 = target[Zone4.__symbol__("loadfalse")];
                                        for (var i = 0; i < loadTasks2.length; i++) {
                                            if (loadTasks2[i] === task) {
                                                loadTasks2.splice(i, 1);
                                            }
                                        }
                                        if (!data.aborted && task.state === SCHEDULED) {
                                            oriInvoke_1.call(task);
                                        }
                                    };
                                    loadTasks.push(task);
                                }
                                else {
                                    task.invoke();
                                }
                            }
                            else if (!data.aborted && target[XHR_SCHEDULED] === false) {
                                target[XHR_ERROR_BEFORE_SCHEDULED] = true;
                            }
                        }
                    };
                    oriAddListener.call(target, READY_STATE_CHANGE, newListener);
                    var storedTask = target[XHR_TASK];
                    if (!storedTask) {
                        target[XHR_TASK] = task;
                    }
                    sendNative.apply(target, data.args);
                    target[XHR_SCHEDULED] = true;
                    return task;
                }
                function placeholderCallback() {
                }
                function clearTask(task) {
                    var data = task.data;
                    data.aborted = true;
                    return abortNative.apply(data.target, data.args);
                }
                var openNative = patchMethod(XMLHttpRequestPrototype, "open", function () { return function (self2, args) {
                    self2[XHR_SYNC] = args[2] == false;
                    self2[XHR_URL] = args[1];
                    return openNative.apply(self2, args);
                }; });
                var XMLHTTPREQUEST_SOURCE = "XMLHttpRequest.send";
                var fetchTaskAborting = zoneSymbol("fetchTaskAborting");
                var fetchTaskScheduling = zoneSymbol("fetchTaskScheduling");
                var sendNative = patchMethod(XMLHttpRequestPrototype, "send", function () { return function (self2, args) {
                    if (Zone4.current[fetchTaskScheduling] === true) {
                        return sendNative.apply(self2, args);
                    }
                    if (self2[XHR_SYNC]) {
                        return sendNative.apply(self2, args);
                    }
                    else {
                        var options = {
                            target: self2,
                            url: self2[XHR_URL],
                            isPeriodic: false,
                            args: args,
                            aborted: false
                        };
                        var task = scheduleMacroTaskWithCurrentZone(XMLHTTPREQUEST_SOURCE, placeholderCallback, options, scheduleTask, clearTask);
                        if (self2 && self2[XHR_ERROR_BEFORE_SCHEDULED] === true && !options.aborted && task.state === SCHEDULED) {
                            task.invoke();
                        }
                    }
                }; });
                var abortNative = patchMethod(XMLHttpRequestPrototype, "abort", function () { return function (self2, args) {
                    var task = findPendingTask(self2);
                    if (task && typeof task.type == "string") {
                        if (task.cancelFn == null || task.data && task.data.aborted) {
                            return;
                        }
                        task.zone.cancelTask(task);
                    }
                    else if (Zone4.current[fetchTaskAborting] === true) {
                        return abortNative.apply(self2, args);
                    }
                }; });
            }
        });
        Zone3.__load_patch("geolocation", function (global2) {
            if (global2["navigator"] && global2["navigator"].geolocation) {
                patchPrototype(global2["navigator"].geolocation, ["getCurrentPosition", "watchPosition"]);
            }
        });
        Zone3.__load_patch("PromiseRejectionEvent", function (global2, Zone4) {
            function findPromiseRejectionHandler(evtName) {
                return function (e) {
                    var eventTasks = findEventTasks(global2, evtName);
                    eventTasks.forEach(function (eventTask) {
                        var PromiseRejectionEvent = global2["PromiseRejectionEvent"];
                        if (PromiseRejectionEvent) {
                            var evt = new PromiseRejectionEvent(evtName, {
                                promise: e.promise,
                                reason: e.rejection
                            });
                            eventTask.invoke(evt);
                        }
                    });
                };
            }
            if (global2["PromiseRejectionEvent"]) {
                Zone4[zoneSymbol("unhandledPromiseRejectionHandler")] = findPromiseRejectionHandler("unhandledrejection");
                Zone4[zoneSymbol("rejectionHandledHandler")] = findPromiseRejectionHandler("rejectionhandled");
            }
        });
        Zone3.__load_patch("queueMicrotask", function (global2, Zone4, api) {
            patchQueueMicrotask(global2, api);
        });
    }
    // packages/zone.js/lib/common/promise.js
    function patchPromise(Zone3) {
        Zone3.__load_patch("ZoneAwarePromise", function (global2, Zone4, api) {
            var ObjectGetOwnPropertyDescriptor2 = Object.getOwnPropertyDescriptor;
            var ObjectDefineProperty2 = Object.defineProperty;
            function readableObjectToString(obj) {
                if (obj && obj.toString === Object.prototype.toString) {
                    var className = obj.constructor && obj.constructor.name;
                    return (className ? className : "") + ": " + JSON.stringify(obj);
                }
                return obj ? obj.toString() : Object.prototype.toString.call(obj);
            }
            var __symbol__2 = api.symbol;
            var _uncaughtPromiseErrors = [];
            var isDisableWrappingUncaughtPromiseRejection = global2[__symbol__2("DISABLE_WRAPPING_UNCAUGHT_PROMISE_REJECTION")] !== false;
            var symbolPromise = __symbol__2("Promise");
            var symbolThen = __symbol__2("then");
            var creationTrace = "__creationTrace__";
            api.onUnhandledError = function (e) {
                if (api.showUncaughtError()) {
                    var rejection = e && e.rejection;
                    if (rejection) {
                        console.error("Unhandled Promise rejection:", rejection instanceof Error ? rejection.message : rejection, "; Zone:", e.zone.name, "; Task:", e.task && e.task.source, "; Value:", rejection, rejection instanceof Error ? rejection.stack : void 0);
                    }
                    else {
                        console.error(e);
                    }
                }
            };
            api.microtaskDrainDone = function () {
                var _loop_3 = function () {
                    var uncaughtPromiseError = _uncaughtPromiseErrors.shift();
                    try {
                        uncaughtPromiseError.zone.runGuarded(function () {
                            if (uncaughtPromiseError.throwOriginal) {
                                throw uncaughtPromiseError.rejection;
                            }
                            throw uncaughtPromiseError;
                        });
                    }
                    catch (error) {
                        handleUnhandledRejection(error);
                    }
                };
                while (_uncaughtPromiseErrors.length) {
                    _loop_3();
                }
            };
            var UNHANDLED_PROMISE_REJECTION_HANDLER_SYMBOL = __symbol__2("unhandledPromiseRejectionHandler");
            function handleUnhandledRejection(e) {
                api.onUnhandledError(e);
                try {
                    var handler = Zone4[UNHANDLED_PROMISE_REJECTION_HANDLER_SYMBOL];
                    if (typeof handler === "function") {
                        handler.call(this, e);
                    }
                }
                catch (err) {
                }
            }
            function isThenable(value) {
                return value && typeof value.then === "function";
            }
            function forwardResolution(value) {
                return value;
            }
            function forwardRejection(rejection) {
                return ZoneAwarePromise.reject(rejection);
            }
            var symbolState = __symbol__2("state");
            var symbolValue = __symbol__2("value");
            var symbolFinally = __symbol__2("finally");
            var symbolParentPromiseValue = __symbol__2("parentPromiseValue");
            var symbolParentPromiseState = __symbol__2("parentPromiseState");
            var source = "Promise.then";
            var UNRESOLVED = null;
            var RESOLVED = true;
            var REJECTED = false;
            var REJECTED_NO_CATCH = 0;
            function makeResolver(promise, state) {
                return function (v) {
                    try {
                        resolvePromise(promise, state, v);
                    }
                    catch (err) {
                        resolvePromise(promise, false, err);
                    }
                };
            }
            var once = function () {
                var wasCalled = false;
                return function wrapper(wrappedFunction) {
                    return function () {
                        if (wasCalled) {
                            return;
                        }
                        wasCalled = true;
                        wrappedFunction.apply(null, arguments);
                    };
                };
            };
            var TYPE_ERROR = "Promise resolved with itself";
            var CURRENT_TASK_TRACE_SYMBOL = __symbol__2("currentTaskTrace");
            function resolvePromise(promise, state, value) {
                var onceWrapper = once();
                if (promise === value) {
                    throw new TypeError(TYPE_ERROR);
                }
                if (promise[symbolState] === UNRESOLVED) {
                    var then = null;
                    try {
                        if (typeof value === "object" || typeof value === "function") {
                            then = value && value.then;
                        }
                    }
                    catch (err) {
                        onceWrapper(function () {
                            resolvePromise(promise, false, err);
                        })();
                        return promise;
                    }
                    if (state !== REJECTED && value instanceof ZoneAwarePromise && value.hasOwnProperty(symbolState) && value.hasOwnProperty(symbolValue) && value[symbolState] !== UNRESOLVED) {
                        clearRejectedNoCatch(value);
                        resolvePromise(promise, value[symbolState], value[symbolValue]);
                    }
                    else if (state !== REJECTED && typeof then === "function") {
                        try {
                            then.call(value, onceWrapper(makeResolver(promise, state)), onceWrapper(makeResolver(promise, false)));
                        }
                        catch (err) {
                            onceWrapper(function () {
                                resolvePromise(promise, false, err);
                            })();
                        }
                    }
                    else {
                        promise[symbolState] = state;
                        var queue = promise[symbolValue];
                        promise[symbolValue] = value;
                        if (promise[symbolFinally] === symbolFinally) {
                            if (state === RESOLVED) {
                                promise[symbolState] = promise[symbolParentPromiseState];
                                promise[symbolValue] = promise[symbolParentPromiseValue];
                            }
                        }
                        if (state === REJECTED && value instanceof Error) {
                            var trace = Zone4.currentTask && Zone4.currentTask.data && Zone4.currentTask.data[creationTrace];
                            if (trace) {
                                ObjectDefineProperty2(value, CURRENT_TASK_TRACE_SYMBOL, {
                                    configurable: true,
                                    enumerable: false,
                                    writable: true,
                                    value: trace
                                });
                            }
                        }
                        for (var i = 0; i < queue.length;) {
                            scheduleResolveOrReject(promise, queue[i++], queue[i++], queue[i++], queue[i++]);
                        }
                        if (queue.length == 0 && state == REJECTED) {
                            promise[symbolState] = REJECTED_NO_CATCH;
                            var uncaughtPromiseError = value;
                            try {
                                throw new Error("Uncaught (in promise): " + readableObjectToString(value) + (value && value.stack ? "\n" + value.stack : ""));
                            }
                            catch (err) {
                                uncaughtPromiseError = err;
                            }
                            if (isDisableWrappingUncaughtPromiseRejection) {
                                uncaughtPromiseError.throwOriginal = true;
                            }
                            uncaughtPromiseError.rejection = value;
                            uncaughtPromiseError.promise = promise;
                            uncaughtPromiseError.zone = Zone4.current;
                            uncaughtPromiseError.task = Zone4.currentTask;
                            _uncaughtPromiseErrors.push(uncaughtPromiseError);
                            api.scheduleMicroTask();
                        }
                    }
                }
                return promise;
            }
            var REJECTION_HANDLED_HANDLER = __symbol__2("rejectionHandledHandler");
            function clearRejectedNoCatch(promise) {
                if (promise[symbolState] === REJECTED_NO_CATCH) {
                    try {
                        var handler = Zone4[REJECTION_HANDLED_HANDLER];
                        if (handler && typeof handler === "function") {
                            handler.call(this, { rejection: promise[symbolValue], promise: promise });
                        }
                    }
                    catch (err) {
                    }
                    promise[symbolState] = REJECTED;
                    for (var i = 0; i < _uncaughtPromiseErrors.length; i++) {
                        if (promise === _uncaughtPromiseErrors[i].promise) {
                            _uncaughtPromiseErrors.splice(i, 1);
                        }
                    }
                }
            }
            function scheduleResolveOrReject(promise, zone, chainPromise, onFulfilled, onRejected) {
                clearRejectedNoCatch(promise);
                var promiseState = promise[symbolState];
                var delegate = promiseState ? typeof onFulfilled === "function" ? onFulfilled : forwardResolution : typeof onRejected === "function" ? onRejected : forwardRejection;
                zone.scheduleMicroTask(source, function () {
                    try {
                        var parentPromiseValue = promise[symbolValue];
                        var isFinallyPromise = !!chainPromise && symbolFinally === chainPromise[symbolFinally];
                        if (isFinallyPromise) {
                            chainPromise[symbolParentPromiseValue] = parentPromiseValue;
                            chainPromise[symbolParentPromiseState] = promiseState;
                        }
                        var value = zone.run(delegate, void 0, isFinallyPromise && delegate !== forwardRejection && delegate !== forwardResolution ? [] : [parentPromiseValue]);
                        resolvePromise(chainPromise, true, value);
                    }
                    catch (error) {
                        resolvePromise(chainPromise, false, error);
                    }
                }, chainPromise);
            }
            var ZONE_AWARE_PROMISE_TO_STRING = "function ZoneAwarePromise() { [native code] }";
            var noop = function () {
            };
            var AggregateError = global2.AggregateError;
            var ZoneAwarePromise = /** @class */ (function () {
                function ZoneAwarePromise(executor) {
                    var promise = this;
                    if (!(promise instanceof ZoneAwarePromise)) {
                        throw new Error("Must be an instanceof Promise.");
                    }
                    promise[symbolState] = UNRESOLVED;
                    promise[symbolValue] = [];
                    try {
                        var onceWrapper = once();
                        executor && executor(onceWrapper(makeResolver(promise, RESOLVED)), onceWrapper(makeResolver(promise, REJECTED)));
                    }
                    catch (error) {
                        resolvePromise(promise, false, error);
                    }
                }
                ZoneAwarePromise.toString = function () {
                    return ZONE_AWARE_PROMISE_TO_STRING;
                };
                ZoneAwarePromise.resolve = function (value) {
                    if (value instanceof ZoneAwarePromise) {
                        return value;
                    }
                    return resolvePromise(new this(null), RESOLVED, value);
                };
                ZoneAwarePromise.reject = function (error) {
                    return resolvePromise(new this(null), REJECTED, error);
                };
                ZoneAwarePromise.withResolvers = function () {
                    var result = {};
                    result.promise = new ZoneAwarePromise(function (res, rej) {
                        result.resolve = res;
                        result.reject = rej;
                    });
                    return result;
                };
                ZoneAwarePromise.any = function (values) {
                    if (!values || typeof values[Symbol.iterator] !== "function") {
                        return Promise.reject(new AggregateError([], "All promises were rejected"));
                    }
                    var promises = [];
                    var count = 0;
                    try {
                        for (var _i = 0, values_1 = values; _i < values_1.length; _i++) {
                            var v = values_1[_i];
                            count++;
                            promises.push(ZoneAwarePromise.resolve(v));
                        }
                    }
                    catch (err) {
                        return Promise.reject(new AggregateError([], "All promises were rejected"));
                    }
                    if (count === 0) {
                        return Promise.reject(new AggregateError([], "All promises were rejected"));
                    }
                    var finished = false;
                    var errors = [];
                    return new ZoneAwarePromise(function (resolve, reject) {
                        for (var i = 0; i < promises.length; i++) {
                            promises[i].then(function (v) {
                                if (finished) {
                                    return;
                                }
                                finished = true;
                                resolve(v);
                            }, function (err) {
                                errors.push(err);
                                count--;
                                if (count === 0) {
                                    finished = true;
                                    reject(new AggregateError(errors, "All promises were rejected"));
                                }
                            });
                        }
                    });
                };
                ZoneAwarePromise.race = function (values) {
                    var resolve;
                    var reject;
                    var promise = new this(function (res, rej) {
                        resolve = res;
                        reject = rej;
                    });
                    function onResolve(value) {
                        resolve(value);
                    }
                    function onReject(error) {
                        reject(error);
                    }
                    for (var _i = 0, values_2 = values; _i < values_2.length; _i++) {
                        var value = values_2[_i];
                        if (!isThenable(value)) {
                            value = this.resolve(value);
                        }
                        value.then(onResolve, onReject);
                    }
                    return promise;
                };
                ZoneAwarePromise.all = function (values) {
                    return ZoneAwarePromise.allWithCallback(values);
                };
                ZoneAwarePromise.allSettled = function (values) {
                    var P = this && this.prototype instanceof ZoneAwarePromise ? this : ZoneAwarePromise;
                    return P.allWithCallback(values, {
                        thenCallback: function (value) { return ({ status: "fulfilled", value: value }); },
                        errorCallback: function (err) { return ({ status: "rejected", reason: err }); }
                    });
                };
                ZoneAwarePromise.allWithCallback = function (values, callback) {
                    var resolve;
                    var reject;
                    var promise = new this(function (res, rej) {
                        resolve = res;
                        reject = rej;
                    });
                    var unresolvedCount = 2;
                    var valueIndex = 0;
                    var resolvedValues = [];
                    var _loop_4 = function (value) {
                        if (!isThenable(value)) {
                            value = this_1.resolve(value);
                        }
                        var curValueIndex = valueIndex;
                        try {
                            value.then(function (value2) {
                                resolvedValues[curValueIndex] = callback ? callback.thenCallback(value2) : value2;
                                unresolvedCount--;
                                if (unresolvedCount === 0) {
                                    resolve(resolvedValues);
                                }
                            }, function (err) {
                                if (!callback) {
                                    reject(err);
                                }
                                else {
                                    resolvedValues[curValueIndex] = callback.errorCallback(err);
                                    unresolvedCount--;
                                    if (unresolvedCount === 0) {
                                        resolve(resolvedValues);
                                    }
                                }
                            });
                        }
                        catch (thenErr) {
                            reject(thenErr);
                        }
                        unresolvedCount++;
                        valueIndex++;
                    };
                    var this_1 = this;
                    for (var _i = 0, values_3 = values; _i < values_3.length; _i++) {
                        var value = values_3[_i];
                        _loop_4(value);
                    }
                    unresolvedCount -= 2;
                    if (unresolvedCount === 0) {
                        resolve(resolvedValues);
                    }
                    return promise;
                };
                Object.defineProperty(ZoneAwarePromise.prototype, Symbol.toStringTag, {
                    get: function () {
                        return "Promise";
                    },
                    enumerable: false,
                    configurable: true
                });
                Object.defineProperty(ZoneAwarePromise.prototype, Symbol.species, {
                    get: function () {
                        return ZoneAwarePromise;
                    },
                    enumerable: false,
                    configurable: true
                });
                ZoneAwarePromise.prototype.then = function (onFulfilled, onRejected) {
                    var _a;
                    var C = (_a = this.constructor) == null ? void 0 : _a[Symbol.species];
                    if (!C || typeof C !== "function") {
                        C = this.constructor || ZoneAwarePromise;
                    }
                    var chainPromise = new C(noop);
                    var zone = Zone4.current;
                    if (this[symbolState] == UNRESOLVED) {
                        this[symbolValue].push(zone, chainPromise, onFulfilled, onRejected);
                    }
                    else {
                        scheduleResolveOrReject(this, zone, chainPromise, onFulfilled, onRejected);
                    }
                    return chainPromise;
                };
                ZoneAwarePromise.prototype.catch = function (onRejected) {
                    return this.then(null, onRejected);
                };
                ZoneAwarePromise.prototype.finally = function (onFinally) {
                    var _a;
                    var C = (_a = this.constructor) == null ? void 0 : _a[Symbol.species];
                    if (!C || typeof C !== "function") {
                        C = ZoneAwarePromise;
                    }
                    var chainPromise = new C(noop);
                    chainPromise[symbolFinally] = symbolFinally;
                    var zone = Zone4.current;
                    if (this[symbolState] == UNRESOLVED) {
                        this[symbolValue].push(zone, chainPromise, onFinally, onFinally);
                    }
                    else {
                        scheduleResolveOrReject(this, zone, chainPromise, onFinally, onFinally);
                    }
                    return chainPromise;
                };
                return ZoneAwarePromise;
            }());
            ZoneAwarePromise["resolve"] = ZoneAwarePromise.resolve;
            ZoneAwarePromise["reject"] = ZoneAwarePromise.reject;
            ZoneAwarePromise["race"] = ZoneAwarePromise.race;
            ZoneAwarePromise["all"] = ZoneAwarePromise.all;
            var NativePromise = global2[symbolPromise] = global2["Promise"];
            global2["Promise"] = ZoneAwarePromise;
            var symbolThenPatched = __symbol__2("thenPatched");
            function patchThen(Ctor) {
                var proto = Ctor.prototype;
                var prop = ObjectGetOwnPropertyDescriptor2(proto, "then");
                if (prop && (prop.writable === false || !prop.configurable)) {
                    return;
                }
                var originalThen = proto.then;
                proto[symbolThen] = originalThen;
                Ctor.prototype.then = function (onResolve, onReject) {
                    var _this = this;
                    var wrapped = new ZoneAwarePromise(function (resolve, reject) {
                        originalThen.call(_this, resolve, reject);
                    });
                    return wrapped.then(onResolve, onReject);
                };
                Ctor[symbolThenPatched] = true;
            }
            api.patchThen = patchThen;
            function zoneify(fn) {
                return function (self2, args) {
                    var resultPromise = fn.apply(self2, args);
                    if (resultPromise instanceof ZoneAwarePromise) {
                        return resultPromise;
                    }
                    var ctor = resultPromise.constructor;
                    if (!ctor[symbolThenPatched]) {
                        patchThen(ctor);
                    }
                    return resultPromise;
                };
            }
            if (NativePromise) {
                patchThen(NativePromise);
                var nativeTry = NativePromise["try"];
                if (nativeTry && typeof nativeTry === "function") {
                    ZoneAwarePromise["try"] = nativeTry;
                }
                patchMethod(global2, "fetch", function (delegate) { return zoneify(delegate); });
            }
            Promise[Zone4.__symbol__("uncaughtPromiseErrors")] = _uncaughtPromiseErrors;
            return ZoneAwarePromise;
        });
    }
    // packages/zone.js/lib/common/to-string.js
    function patchToString(Zone3) {
        Zone3.__load_patch("toString", function (global2) {
            var originalFunctionToString = Function.prototype.toString;
            var ORIGINAL_DELEGATE_SYMBOL = zoneSymbol("OriginalDelegate");
            var PROMISE_SYMBOL = zoneSymbol("Promise");
            var ERROR_SYMBOL = zoneSymbol("Error");
            var newFunctionToString = function toString() {
                if (typeof this === "function") {
                    var originalDelegate = this[ORIGINAL_DELEGATE_SYMBOL];
                    if (originalDelegate) {
                        if (typeof originalDelegate === "function") {
                            return originalFunctionToString.call(originalDelegate);
                        }
                        else {
                            return Object.prototype.toString.call(originalDelegate);
                        }
                    }
                    if (this === Promise) {
                        var nativePromise = global2[PROMISE_SYMBOL];
                        if (nativePromise) {
                            return originalFunctionToString.call(nativePromise);
                        }
                    }
                    if (this === Error) {
                        var nativeError = global2[ERROR_SYMBOL];
                        if (nativeError) {
                            return originalFunctionToString.call(nativeError);
                        }
                    }
                }
                return originalFunctionToString.call(this);
            };
            newFunctionToString[ORIGINAL_DELEGATE_SYMBOL] = originalFunctionToString;
            Function.prototype.toString = newFunctionToString;
            var originalObjectToString = Object.prototype.toString;
            var PROMISE_OBJECT_TO_STRING = "[object Promise]";
            Object.prototype.toString = function () {
                if (typeof Promise === "function" && this instanceof Promise) {
                    return PROMISE_OBJECT_TO_STRING;
                }
                return originalObjectToString.call(this);
            };
        });
    }
    // packages/zone.js/lib/browser/browser-util.js
    function patchCallbacks(api, target, targetName, method, callbacks) {
        var symbol = Zone.__symbol__(method);
        if (target[symbol]) {
            return;
        }
        var nativeDelegate = target[symbol] = target[method];
        target[method] = function (name, opts, options) {
            if (opts && opts.prototype) {
                callbacks.forEach(function (callback) {
                    var source = "".concat(targetName, ".").concat(method, "::") + callback;
                    var prototype = opts.prototype;
                    try {
                        if (prototype.hasOwnProperty(callback)) {
                            var descriptor = api.ObjectGetOwnPropertyDescriptor(prototype, callback);
                            if (descriptor && descriptor.value) {
                                descriptor.value = api.wrapWithCurrentZone(descriptor.value, source);
                                api._redefineProperty(opts.prototype, callback, descriptor);
                            }
                            else if (prototype[callback]) {
                                prototype[callback] = api.wrapWithCurrentZone(prototype[callback], source);
                            }
                        }
                        else if (prototype[callback]) {
                            prototype[callback] = api.wrapWithCurrentZone(prototype[callback], source);
                        }
                    }
                    catch (e) {
                    }
                });
            }
            return nativeDelegate.call(target, name, opts, options);
        };
        api.attachOriginToPatched(target[method], nativeDelegate);
    }
    // packages/zone.js/lib/browser/api-util.js
    function patchUtil(Zone3) {
        Zone3.__load_patch("util", function (global2, Zone4, api) {
            var eventNames = getOnEventNames(global2);
            api.patchOnProperties = patchOnProperties;
            api.patchMethod = patchMethod;
            api.bindArguments = bindArguments;
            api.patchMacroTask = patchMacroTask;
            var SYMBOL_BLACK_LISTED_EVENTS = Zone4.__symbol__("BLACK_LISTED_EVENTS");
            var SYMBOL_UNPATCHED_EVENTS = Zone4.__symbol__("UNPATCHED_EVENTS");
            if (global2[SYMBOL_UNPATCHED_EVENTS]) {
                global2[SYMBOL_BLACK_LISTED_EVENTS] = global2[SYMBOL_UNPATCHED_EVENTS];
            }
            if (global2[SYMBOL_BLACK_LISTED_EVENTS]) {
                Zone4[SYMBOL_BLACK_LISTED_EVENTS] = Zone4[SYMBOL_UNPATCHED_EVENTS] = global2[SYMBOL_BLACK_LISTED_EVENTS];
            }
            api.patchEventPrototype = patchEventPrototype;
            api.patchEventTarget = patchEventTarget;
            api.ObjectDefineProperty = ObjectDefineProperty;
            api.ObjectGetOwnPropertyDescriptor = ObjectGetOwnPropertyDescriptor;
            api.ObjectCreate = ObjectCreate;
            api.ArraySlice = ArraySlice;
            api.patchClass = patchClass;
            api.wrapWithCurrentZone = wrapWithCurrentZone;
            api.filterProperties = filterProperties;
            api.attachOriginToPatched = attachOriginToPatched;
            api._redefineProperty = Object.defineProperty;
            api.patchCallbacks = patchCallbacks;
            api.getGlobalObjects = function () { return ({
                globalSources: globalSources,
                zoneSymbolEventNames: zoneSymbolEventNames2,
                eventNames: eventNames,
                isBrowser: isBrowser,
                isMix: isMix,
                isNode: isNode,
                TRUE_STR: TRUE_STR,
                FALSE_STR: FALSE_STR,
                ZONE_SYMBOL_PREFIX: ZONE_SYMBOL_PREFIX,
                ADD_EVENT_LISTENER_STR: ADD_EVENT_LISTENER_STR,
                REMOVE_EVENT_LISTENER_STR: REMOVE_EVENT_LISTENER_STR
            }); };
        });
    }
    // packages/zone.js/lib/browser/rollup-common.js
    function patchCommon(Zone3) {
        patchPromise(Zone3);
        patchToString(Zone3);
        patchUtil(Zone3);
    }
    // packages/zone.js/lib/node/events.js
    function patchEvents(Zone3) {
        Zone3.__load_patch("EventEmitter", function (global2, Zone4, api) {
            var EE_ADD_LISTENER = "addListener";
            var EE_PREPEND_LISTENER = "prependListener";
            var EE_REMOVE_LISTENER = "removeListener";
            var EE_REMOVE_ALL_LISTENER = "removeAllListeners";
            var EE_LISTENERS = "listeners";
            var EE_ON = "on";
            var EE_OFF = "off";
            var compareTaskCallbackVsDelegate = function (task, delegate) {
                return task.callback === delegate || task.callback.listener === delegate;
            };
            var eventNameToString = function (eventName) {
                if (typeof eventName === "string") {
                    return eventName;
                }
                if (!eventName) {
                    return "";
                }
                return eventName.toString().replace("(", "_").replace(")", "_");
            };
            function patchEventEmitterMethods(obj) {
                var result = patchEventTarget(global2, api, [obj], {
                    useG: false,
                    add: EE_ADD_LISTENER,
                    rm: EE_REMOVE_LISTENER,
                    prepend: EE_PREPEND_LISTENER,
                    rmAll: EE_REMOVE_ALL_LISTENER,
                    listeners: EE_LISTENERS,
                    chkDup: false,
                    rt: true,
                    diff: compareTaskCallbackVsDelegate,
                    eventNameToString: eventNameToString
                });
                if (result && result[0]) {
                    obj[EE_ON] = obj[EE_ADD_LISTENER];
                    obj[EE_OFF] = obj[EE_REMOVE_LISTENER];
                }
            }
            var events;
            try {
                events = require("events");
            }
            catch (err) {
            }
            if (events && events.EventEmitter) {
                patchEventEmitterMethods(events.EventEmitter.prototype);
            }
        });
    }
    // packages/zone.js/lib/node/fs.js
    function patchFs(Zone3) {
        Zone3.__load_patch("fs", function (global2, Zone4, api) {
            var _a;
            var fs;
            try {
                fs = require("fs");
            }
            catch (err) {
            }
            if (!fs)
                return;
            var TO_PATCH_MACROTASK_METHODS = [
                "access",
                "appendFile",
                "chmod",
                "chown",
                "close",
                "exists",
                "fchmod",
                "fchown",
                "fdatasync",
                "fstat",
                "fsync",
                "ftruncate",
                "futimes",
                "lchmod",
                "lchown",
                "lutimes",
                "link",
                "lstat",
                "mkdir",
                "mkdtemp",
                "open",
                "opendir",
                "read",
                "readdir",
                "readFile",
                "readlink",
                "realpath",
                "rename",
                "rmdir",
                "stat",
                "symlink",
                "truncate",
                "unlink",
                "utimes",
                "write",
                "writeFile",
                "writev"
            ];
            TO_PATCH_MACROTASK_METHODS.filter(function (name) { return !!fs[name] && typeof fs[name] === "function"; }).forEach(function (name) {
                patchMacroTask(fs, name, function (self2, args) {
                    return {
                        name: "fs." + name,
                        args: args,
                        cbIdx: args.length > 0 ? args.length - 1 : -1,
                        target: self2
                    };
                });
            });
            var realpathOriginalDelegate = (_a = fs.realpath) == null ? void 0 : _a[api.symbol("OriginalDelegate")];
            if (realpathOriginalDelegate == null ? void 0 : realpathOriginalDelegate.native) {
                fs.realpath.native = realpathOriginalDelegate.native;
                patchMacroTask(fs.realpath, "native", function (self2, args) { return ({
                    args: args,
                    target: self2,
                    cbIdx: args.length > 0 ? args.length - 1 : -1,
                    name: "fs.realpath.native"
                }); });
            }
        });
    }
    // packages/zone.js/lib/node/node_util.js
    function patchNodeUtil(Zone3) {
        Zone3.__load_patch("node_util", function (global2, Zone4, api) {
            api.patchOnProperties = patchOnProperties;
            api.patchMethod = patchMethod;
            api.bindArguments = bindArguments;
            api.patchMacroTask = patchMacroTask;
            setShouldCopySymbolProperties(true);
        });
    }
    // packages/zone.js/lib/node/node.js
    var set = "set";
    var clear = "clear";
    function patchNode(Zone3) {
        patchNodeUtil(Zone3);
        patchEvents(Zone3);
        patchFs(Zone3);
        Zone3.__load_patch("node_timers", function (global2, Zone4) {
            var globalUseTimeoutFromTimer = false;
            try {
                var timers = require("timers");
                var globalEqualTimersTimeout = global2.setTimeout === timers.setTimeout;
                if (!globalEqualTimersTimeout && !isMix) {
                    var originSetTimeout_1 = timers.setTimeout;
                    timers.setTimeout = function () {
                        globalUseTimeoutFromTimer = true;
                        return originSetTimeout_1.apply(this, arguments);
                    };
                    var detectTimeout = global2.setTimeout(function () {
                    }, 100);
                    clearTimeout(detectTimeout);
                    timers.setTimeout = originSetTimeout_1;
                }
                patchTimer(timers, set, clear, "Timeout");
                patchTimer(timers, set, clear, "Interval");
                patchTimer(timers, set, clear, "Immediate");
            }
            catch (error) {
            }
            if (isMix) {
                return;
            }
            if (!globalUseTimeoutFromTimer) {
                patchTimer(global2, set, clear, "Timeout");
                patchTimer(global2, set, clear, "Interval");
                patchTimer(global2, set, clear, "Immediate");
            }
            else {
                global2[Zone4.__symbol__("setTimeout")] = global2.setTimeout;
                global2[Zone4.__symbol__("setInterval")] = global2.setInterval;
                global2[Zone4.__symbol__("setImmediate")] = global2.setImmediate;
            }
        });
        Zone3.__load_patch("nextTick", function () {
            patchMicroTask(process, "nextTick", function (self2, args) {
                return {
                    name: "process.nextTick",
                    args: args,
                    cbIdx: args.length > 0 && typeof args[0] === "function" ? 0 : -1,
                    target: process
                };
            });
        });
        Zone3.__load_patch("handleUnhandledPromiseRejection", function (global2, Zone4, api) {
            Zone4[api.symbol("unhandledPromiseRejectionHandler")] = findProcessPromiseRejectionHandler("unhandledRejection");
            Zone4[api.symbol("rejectionHandledHandler")] = findProcessPromiseRejectionHandler("rejectionHandled");
            function findProcessPromiseRejectionHandler(evtName) {
                return function (e) {
                    var eventTasks = findEventTasks(process, evtName);
                    eventTasks.forEach(function (eventTask) {
                        if (evtName === "unhandledRejection") {
                            eventTask.invoke(e.rejection, e.promise);
                        }
                        else if (evtName === "rejectionHandled") {
                            eventTask.invoke(e.promise);
                        }
                    });
                };
            }
        });
        Zone3.__load_patch("crypto", function () {
            var crypto;
            try {
                crypto = require("crypto");
            }
            catch (err) {
            }
            if (crypto) {
                var methodNames = ["randomBytes", "pbkdf2"];
                methodNames.forEach(function (name) {
                    patchMacroTask(crypto, name, function (self2, args) {
                        return {
                            name: "crypto." + name,
                            args: args,
                            cbIdx: args.length > 0 && typeof args[args.length - 1] === "function" ? args.length - 1 : -1,
                            target: crypto
                        };
                    });
                });
            }
        });
        Zone3.__load_patch("console", function (global2, Zone4) {
            var consoleMethods = [
                "dir",
                "log",
                "info",
                "error",
                "warn",
                "assert",
                "debug",
                "timeEnd",
                "trace"
            ];
            consoleMethods.forEach(function (m) {
                var originalMethod = console[Zone4.__symbol__(m)] = console[m];
                if (originalMethod) {
                    console[m] = function () {
                        var args = ArraySlice.call(arguments);
                        if (Zone4.current === Zone4.root) {
                            return originalMethod.apply(this, args);
                        }
                        else {
                            return Zone4.root.run(originalMethod, this, args);
                        }
                    };
                }
            });
        });
        Zone3.__load_patch("queueMicrotask", function (global2, Zone4, api) {
            patchQueueMicrotask(global2, api);
        });
    }
    // packages/zone.js/lib/zone.js
    function loadZone() {
        var _a;
        var global2 = globalThis;
        var checkDuplicate = global2[__symbol__("forceDuplicateZoneCheck")] === true;
        if (global2["Zone"] && (checkDuplicate || typeof global2["Zone"].__symbol__ !== "function")) {
            throw new Error("Zone already loaded.");
        }
        (_a = global2["Zone"]) != null ? _a : global2["Zone"] = initZone();
        return global2["Zone"];
    }
    // packages/zone.js/lib/mix/rollup-mix.js
    var Zone2 = loadZone();
    patchCommon(Zone2);
    patchBrowser(Zone2);
    patchNode(Zone2);
    if (__exports != exports)
        module.exports = exports;
    return module.exports;
}));
