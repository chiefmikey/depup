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
    // packages/zone.js/lib/zone-impl.js
    var global = globalThis;
    function __symbol__(name) {
        var symbolPrefix = global["__Zone_symbol_prefix"] || "__zone_symbol__";
        return symbolPrefix + name;
    }
    // packages/zone.js/lib/zone-spec/async-test.js
    var __global = globalThis;
    var AsyncTestZoneSpec = /** @class */ (function () {
        function _AsyncTestZoneSpec(finishCallback, failCallback, namePrefix) {
            __publicField(this, "finishCallback");
            __publicField(this, "failCallback");
            __publicField(this, "_pendingMicroTasks", false);
            __publicField(this, "_pendingMacroTasks", false);
            __publicField(this, "_alreadyErrored", false);
            __publicField(this, "_isSync", false);
            __publicField(this, "_existingFinishTimer", null);
            __publicField(this, "entryFunction", null);
            __publicField(this, "runZone", Zone.current);
            __publicField(this, "unresolvedChainedPromiseCount", 0);
            __publicField(this, "supportWaitUnresolvedChainedPromise", false);
            // ZoneSpec implementation below.
            __publicField(this, "name");
            __publicField(this, "properties");
            this.finishCallback = finishCallback;
            this.failCallback = failCallback;
            this.name = "asyncTestZone for " + namePrefix;
            this.properties = { "AsyncTestZoneSpec": this };
            this.supportWaitUnresolvedChainedPromise = __global[__symbol__("supportWaitUnResolvedChainedPromise")] === true;
        }
        Object.defineProperty(_AsyncTestZoneSpec, "symbolParentUnresolved", {
            // Needs to be a getter and not a plain property in order run this just-in-time. Otherwise
            // `__symbol__` would be evaluated during top-level execution prior to the Zone prefix being
            // changed for tests.
            get: function () {
                return __symbol__("parentUnresolved");
            },
            enumerable: false,
            configurable: true
        });
        _AsyncTestZoneSpec.prototype.isUnresolvedChainedPromisePending = function () {
            return this.unresolvedChainedPromiseCount > 0;
        };
        _AsyncTestZoneSpec.prototype._finishCallbackIfDone = function () {
            var _this = this;
            if (this._existingFinishTimer !== null) {
                clearTimeout(this._existingFinishTimer);
                this._existingFinishTimer = null;
            }
            if (!(this._pendingMicroTasks || this._pendingMacroTasks || this.supportWaitUnresolvedChainedPromise && this.isUnresolvedChainedPromisePending())) {
                this.runZone.run(function () {
                    _this._existingFinishTimer = setTimeout(function () {
                        if (!_this._alreadyErrored && !(_this._pendingMicroTasks || _this._pendingMacroTasks)) {
                            _this.finishCallback();
                        }
                    }, 0);
                });
            }
        };
        _AsyncTestZoneSpec.prototype.patchPromiseForTest = function () {
            if (!this.supportWaitUnresolvedChainedPromise) {
                return;
            }
            var patchPromiseForTest = Promise[Zone.__symbol__("patchPromiseForTest")];
            if (patchPromiseForTest) {
                patchPromiseForTest();
            }
        };
        _AsyncTestZoneSpec.prototype.unPatchPromiseForTest = function () {
            if (!this.supportWaitUnresolvedChainedPromise) {
                return;
            }
            var unPatchPromiseForTest = Promise[Zone.__symbol__("unPatchPromiseForTest")];
            if (unPatchPromiseForTest) {
                unPatchPromiseForTest();
            }
        };
        _AsyncTestZoneSpec.prototype.onScheduleTask = function (delegate, current, target, task) {
            if (task.type !== "eventTask") {
                this._isSync = false;
            }
            if (task.type === "microTask" && task.data && task.data instanceof Promise) {
                if (task.data[_AsyncTestZoneSpec.symbolParentUnresolved] === true) {
                    this.unresolvedChainedPromiseCount--;
                }
            }
            return delegate.scheduleTask(target, task);
        };
        _AsyncTestZoneSpec.prototype.onInvokeTask = function (delegate, current, target, task, applyThis, applyArgs) {
            if (task.type !== "eventTask") {
                this._isSync = false;
            }
            return delegate.invokeTask(target, task, applyThis, applyArgs);
        };
        _AsyncTestZoneSpec.prototype.onCancelTask = function (delegate, current, target, task) {
            if (task.type !== "eventTask") {
                this._isSync = false;
            }
            return delegate.cancelTask(target, task);
        };
        // Note - we need to use onInvoke at the moment to call finish when a test is
        // fully synchronous. TODO(juliemr): remove this when the logic for
        // onHasTask changes and it calls whenever the task queues are dirty.
        // updated by(JiaLiPassion), only call finish callback when no task
        // was scheduled/invoked/canceled.
        _AsyncTestZoneSpec.prototype.onInvoke = function (parentZoneDelegate, currentZone, targetZone, delegate, applyThis, applyArgs, source) {
            if (!this.entryFunction) {
                this.entryFunction = delegate;
            }
            try {
                this._isSync = true;
                return parentZoneDelegate.invoke(targetZone, delegate, applyThis, applyArgs, source);
            }
            finally {
                if (this._isSync && this.entryFunction === delegate) {
                    this._finishCallbackIfDone();
                }
            }
        };
        _AsyncTestZoneSpec.prototype.onHandleError = function (parentZoneDelegate, currentZone, targetZone, error) {
            var result = parentZoneDelegate.handleError(targetZone, error);
            if (result) {
                this.failCallback(error);
                this._alreadyErrored = true;
            }
            return false;
        };
        _AsyncTestZoneSpec.prototype.onHasTask = function (delegate, current, target, hasTaskState) {
            delegate.hasTask(target, hasTaskState);
            if (current !== target) {
                return;
            }
            if (hasTaskState.change == "microTask") {
                this._pendingMicroTasks = hasTaskState.microTask;
                this._finishCallbackIfDone();
            }
            else if (hasTaskState.change == "macroTask") {
                this._pendingMacroTasks = hasTaskState.macroTask;
                this._finishCallbackIfDone();
            }
        };
        return _AsyncTestZoneSpec;
    }());
    function patchAsyncTest(Zone2) {
        Zone2["AsyncTestZoneSpec"] = AsyncTestZoneSpec;
        Zone2.__load_patch("asynctest", function (global2, Zone3, api) {
            Zone3[api.symbol("asyncTest")] = function asyncTest(fn) {
                if (global2.jasmine) {
                    return function (done) {
                        if (!done) {
                            done = function () {
                            };
                            done.fail = function (e) {
                                throw e;
                            };
                        }
                        runInTestZone(fn, this, void 0, done, function (err) {
                            if (typeof err === "string") {
                                return done.fail(new Error(err));
                            }
                            else {
                                done.fail(err);
                            }
                        });
                    };
                }
                return function () {
                    var _this = this;
                    var args = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        args[_i] = arguments[_i];
                    }
                    return new Promise(function (finishCallback, failCallback) {
                        runInTestZone(fn, _this, args, finishCallback, failCallback);
                    });
                };
            };
            function runInTestZone(fn, context, applyArgs, finishCallback, failCallback) {
                var currentZone = Zone3.current;
                var AsyncTestZoneSpec2 = Zone3["AsyncTestZoneSpec"];
                if (AsyncTestZoneSpec2 === void 0) {
                    throw new Error("AsyncTestZoneSpec is needed for the async() test helper but could not be found. Please make sure that your environment includes zone.js/plugins/async-test");
                }
                var ProxyZoneSpec = Zone3["ProxyZoneSpec"];
                if (!ProxyZoneSpec) {
                    throw new Error("ProxyZoneSpec is needed for the async() test helper but could not be found. Please make sure that your environment includes zone.js/plugins/proxy");
                }
                var proxyZoneSpec = ProxyZoneSpec.get();
                ProxyZoneSpec.assertPresent();
                var proxyZone = Zone3.current.getZoneWith("ProxyZoneSpec");
                var previousDelegate = proxyZoneSpec.getDelegate();
                proxyZone.parent.run(function () {
                    var testZoneSpec = new AsyncTestZoneSpec2(function () {
                        if (proxyZoneSpec.getDelegate() == testZoneSpec) {
                            proxyZoneSpec.setDelegate(previousDelegate);
                        }
                        testZoneSpec.unPatchPromiseForTest();
                        currentZone.run(function () {
                            finishCallback();
                        });
                    }, function (error) {
                        if (proxyZoneSpec.getDelegate() == testZoneSpec) {
                            proxyZoneSpec.setDelegate(previousDelegate);
                        }
                        testZoneSpec.unPatchPromiseForTest();
                        currentZone.run(function () {
                            failCallback(error);
                        });
                    }, "test");
                    proxyZoneSpec.setDelegate(testZoneSpec);
                    testZoneSpec.patchPromiseForTest();
                });
                return Zone3.current.runGuarded(fn, context, applyArgs);
            }
        });
    }
    // packages/zone.js/lib/testing/async-testing.js
    patchAsyncTest(Zone);
    if (__exports != exports)
        module.exports = exports;
    return module.exports;
}));
