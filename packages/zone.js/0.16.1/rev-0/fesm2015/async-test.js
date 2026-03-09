'use strict';
/**
 * @license Angular
 * (c) 2010-2026 Google LLC. https://angular.dev/
 * License: MIT
 */
var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};

// packages/zone.js/lib/zone-impl.js
var global = globalThis;
function __symbol__(name) {
  const symbolPrefix = global["__Zone_symbol_prefix"] || "__zone_symbol__";
  return symbolPrefix + name;
}

// packages/zone.js/lib/zone-spec/async-test.js
var __global = globalThis;
var AsyncTestZoneSpec = class _AsyncTestZoneSpec {
  constructor(finishCallback, failCallback, namePrefix) {
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
  // Needs to be a getter and not a plain property in order run this just-in-time. Otherwise
  // `__symbol__` would be evaluated during top-level execution prior to the Zone prefix being
  // changed for tests.
  static get symbolParentUnresolved() {
    return __symbol__("parentUnresolved");
  }
  isUnresolvedChainedPromisePending() {
    return this.unresolvedChainedPromiseCount > 0;
  }
  _finishCallbackIfDone() {
    if (this._existingFinishTimer !== null) {
      clearTimeout(this._existingFinishTimer);
      this._existingFinishTimer = null;
    }
    if (!(this._pendingMicroTasks || this._pendingMacroTasks || this.supportWaitUnresolvedChainedPromise && this.isUnresolvedChainedPromisePending())) {
      this.runZone.run(() => {
        this._existingFinishTimer = setTimeout(() => {
          if (!this._alreadyErrored && !(this._pendingMicroTasks || this._pendingMacroTasks)) {
            this.finishCallback();
          }
        }, 0);
      });
    }
  }
  patchPromiseForTest() {
    if (!this.supportWaitUnresolvedChainedPromise) {
      return;
    }
    const patchPromiseForTest = Promise[Zone.__symbol__("patchPromiseForTest")];
    if (patchPromiseForTest) {
      patchPromiseForTest();
    }
  }
  unPatchPromiseForTest() {
    if (!this.supportWaitUnresolvedChainedPromise) {
      return;
    }
    const unPatchPromiseForTest = Promise[Zone.__symbol__("unPatchPromiseForTest")];
    if (unPatchPromiseForTest) {
      unPatchPromiseForTest();
    }
  }
  onScheduleTask(delegate, current, target, task) {
    if (task.type !== "eventTask") {
      this._isSync = false;
    }
    if (task.type === "microTask" && task.data && task.data instanceof Promise) {
      if (task.data[_AsyncTestZoneSpec.symbolParentUnresolved] === true) {
        this.unresolvedChainedPromiseCount--;
      }
    }
    return delegate.scheduleTask(target, task);
  }
  onInvokeTask(delegate, current, target, task, applyThis, applyArgs) {
    if (task.type !== "eventTask") {
      this._isSync = false;
    }
    return delegate.invokeTask(target, task, applyThis, applyArgs);
  }
  onCancelTask(delegate, current, target, task) {
    if (task.type !== "eventTask") {
      this._isSync = false;
    }
    return delegate.cancelTask(target, task);
  }
  // Note - we need to use onInvoke at the moment to call finish when a test is
  // fully synchronous. TODO(juliemr): remove this when the logic for
  // onHasTask changes and it calls whenever the task queues are dirty.
  // updated by(JiaLiPassion), only call finish callback when no task
  // was scheduled/invoked/canceled.
  onInvoke(parentZoneDelegate, currentZone, targetZone, delegate, applyThis, applyArgs, source) {
    if (!this.entryFunction) {
      this.entryFunction = delegate;
    }
    try {
      this._isSync = true;
      return parentZoneDelegate.invoke(targetZone, delegate, applyThis, applyArgs, source);
    } finally {
      if (this._isSync && this.entryFunction === delegate) {
        this._finishCallbackIfDone();
      }
    }
  }
  onHandleError(parentZoneDelegate, currentZone, targetZone, error) {
    const result = parentZoneDelegate.handleError(targetZone, error);
    if (result) {
      this.failCallback(error);
      this._alreadyErrored = true;
    }
    return false;
  }
  onHasTask(delegate, current, target, hasTaskState) {
    delegate.hasTask(target, hasTaskState);
    if (current !== target) {
      return;
    }
    if (hasTaskState.change == "microTask") {
      this._pendingMicroTasks = hasTaskState.microTask;
      this._finishCallbackIfDone();
    } else if (hasTaskState.change == "macroTask") {
      this._pendingMacroTasks = hasTaskState.macroTask;
      this._finishCallbackIfDone();
    }
  }
};
function patchAsyncTest(Zone2) {
  Zone2["AsyncTestZoneSpec"] = AsyncTestZoneSpec;
  Zone2.__load_patch("asynctest", (global2, Zone3, api) => {
    Zone3[api.symbol("asyncTest")] = function asyncTest(fn) {
      if (global2.jasmine) {
        return function(done) {
          if (!done) {
            done = function() {
            };
            done.fail = function(e) {
              throw e;
            };
          }
          runInTestZone(fn, this, void 0, done, (err) => {
            if (typeof err === "string") {
              return done.fail(new Error(err));
            } else {
              done.fail(err);
            }
          });
        };
      }
      return function(...args) {
        return new Promise((finishCallback, failCallback) => {
          runInTestZone(fn, this, args, finishCallback, failCallback);
        });
      };
    };
    function runInTestZone(fn, context, applyArgs, finishCallback, failCallback) {
      const currentZone = Zone3.current;
      const AsyncTestZoneSpec2 = Zone3["AsyncTestZoneSpec"];
      if (AsyncTestZoneSpec2 === void 0) {
        throw new Error("AsyncTestZoneSpec is needed for the async() test helper but could not be found. Please make sure that your environment includes zone.js/plugins/async-test");
      }
      const ProxyZoneSpec = Zone3["ProxyZoneSpec"];
      if (!ProxyZoneSpec) {
        throw new Error("ProxyZoneSpec is needed for the async() test helper but could not be found. Please make sure that your environment includes zone.js/plugins/proxy");
      }
      const proxyZoneSpec = ProxyZoneSpec.get();
      ProxyZoneSpec.assertPresent();
      const proxyZone = Zone3.current.getZoneWith("ProxyZoneSpec");
      const previousDelegate = proxyZoneSpec.getDelegate();
      proxyZone.parent.run(() => {
        const testZoneSpec = new AsyncTestZoneSpec2(() => {
          if (proxyZoneSpec.getDelegate() == testZoneSpec) {
            proxyZoneSpec.setDelegate(previousDelegate);
          }
          testZoneSpec.unPatchPromiseForTest();
          currentZone.run(() => {
            finishCallback();
          });
        }, (error) => {
          if (proxyZoneSpec.getDelegate() == testZoneSpec) {
            proxyZoneSpec.setDelegate(previousDelegate);
          }
          testZoneSpec.unPatchPromiseForTest();
          currentZone.run(() => {
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
