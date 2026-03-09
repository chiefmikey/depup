'use strict';
/**
 * @license Angular
 * (c) 2010-2026 Google LLC. https://angular.dev/
 * License: MIT
 */
var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));

// packages/zone.js/lib/jasmine/jasmine.js
function patchJasmine(Zone2) {
  Zone2.__load_patch("jasmine", (global, Zone3, api) => {
    var _a;
    const __extends = function(d, b) {
      for (const p in b)
        if (b.hasOwnProperty(p))
          d[p] = b[p];
      function __() {
        this.constructor = d;
      }
      d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
    if (!Zone3)
      throw new Error("Missing: zone.js");
    if (typeof jest !== "undefined") {
      return;
    }
    if (typeof jasmine == "undefined" || jasmine["__zone_patch__"]) {
      return;
    }
    jasmine["__zone_patch__"] = true;
    const SyncTestZoneSpec = Zone3["SyncTestZoneSpec"];
    const ProxyZoneSpec = Zone3["ProxyZoneSpec"];
    if (!SyncTestZoneSpec)
      throw new Error("Missing: SyncTestZoneSpec");
    if (!ProxyZoneSpec)
      throw new Error("Missing: ProxyZoneSpec");
    const ambientZone = Zone3.current;
    const symbol = Zone3.__symbol__;
    const disablePatchingJasmineClock = global[symbol("fakeAsyncDisablePatchingClock")] === true;
    const enableAutoFakeAsyncWhenClockPatched = !disablePatchingJasmineClock && (global[symbol("fakeAsyncPatchLock")] === true || global[symbol("fakeAsyncAutoFakeAsyncWhenClockPatched")] === true);
    const jasmineEnv = jasmine.getEnv();
    ["describe", "xdescribe", "fdescribe"].forEach((methodName) => {
      let originalJasmineFn = jasmineEnv[methodName];
      jasmineEnv[methodName] = function(description, specDefinitions) {
        return originalJasmineFn.call(this, description, wrapDescribeInZone(description, specDefinitions));
      };
    });
    ["it", "xit", "fit"].forEach((methodName) => {
      let originalJasmineFn = jasmineEnv[methodName];
      jasmineEnv[symbol(methodName)] = originalJasmineFn;
      jasmineEnv[methodName] = function(description, specDefinitions, timeout) {
        arguments[1] = wrapTestInZone(specDefinitions);
        return originalJasmineFn.apply(this, arguments);
      };
    });
    ["beforeEach", "afterEach", "beforeAll", "afterAll"].forEach((methodName) => {
      let originalJasmineFn = jasmineEnv[methodName];
      jasmineEnv[symbol(methodName)] = originalJasmineFn;
      jasmineEnv[methodName] = function(specDefinitions, timeout) {
        arguments[0] = wrapTestInZone(specDefinitions);
        return originalJasmineFn.apply(this, arguments);
      };
    });
    if (!disablePatchingJasmineClock) {
      const originalClockFn = jasmine[symbol("clock")] = jasmine["clock"];
      jasmine["clock"] = function() {
        const clock = originalClockFn.apply(this, arguments);
        if (!clock[symbol("patched")]) {
          clock[symbol("patched")] = symbol("patched");
          const originalTick = clock[symbol("tick")] = clock.tick;
          clock.tick = function() {
            const fakeAsyncZoneSpec = Zone3.current.get("FakeAsyncTestZoneSpec");
            if (fakeAsyncZoneSpec) {
              return fakeAsyncZoneSpec.tick.apply(fakeAsyncZoneSpec, arguments);
            }
            return originalTick.apply(this, arguments);
          };
          const originalMockDate = clock[symbol("mockDate")] = clock.mockDate;
          clock.mockDate = function() {
            const fakeAsyncZoneSpec = Zone3.current.get("FakeAsyncTestZoneSpec");
            if (fakeAsyncZoneSpec) {
              const dateTime = arguments.length > 0 ? arguments[0] : /* @__PURE__ */ new Date();
              return fakeAsyncZoneSpec.setFakeBaseSystemTime.apply(fakeAsyncZoneSpec, dateTime && typeof dateTime.getTime === "function" ? [dateTime.getTime()] : arguments);
            }
            return originalMockDate.apply(this, arguments);
          };
          if (enableAutoFakeAsyncWhenClockPatched) {
            ["install", "uninstall"].forEach((methodName) => {
              const originalClockFn2 = clock[symbol(methodName)] = clock[methodName];
              clock[methodName] = function() {
                const FakeAsyncTestZoneSpec = Zone3["FakeAsyncTestZoneSpec"];
                if (FakeAsyncTestZoneSpec) {
                  jasmine[symbol("clockInstalled")] = "install" === methodName;
                  return;
                }
                return originalClockFn2.apply(this, arguments);
              };
            });
          }
        }
        return clock;
      };
    }
    if (!jasmine[Zone3.__symbol__("createSpyObj")]) {
      const originalCreateSpyObj = jasmine.createSpyObj;
      jasmine[Zone3.__symbol__("createSpyObj")] = originalCreateSpyObj;
      jasmine.createSpyObj = function() {
        const args = Array.prototype.slice.call(arguments);
        const propertyNames = args.length >= 3 ? args[2] : null;
        let spyObj;
        if (propertyNames) {
          const defineProperty = Object.defineProperty;
          Object.defineProperty = function(obj, p, attributes) {
            return defineProperty.call(this, obj, p, __spreadProps(__spreadValues({}, attributes), {
              configurable: true,
              enumerable: true
            }));
          };
          try {
            spyObj = originalCreateSpyObj.apply(this, args);
          } finally {
            Object.defineProperty = defineProperty;
          }
        } else {
          spyObj = originalCreateSpyObj.apply(this, args);
        }
        return spyObj;
      };
    }
    function wrapDescribeInZone(description, describeBody) {
      return function() {
        const syncZone = ambientZone.fork(new SyncTestZoneSpec(`jasmine.describe#${description}`));
        return syncZone.run(describeBody, this, arguments);
      };
    }
    function runInTestZone(testBody, applyThis, queueRunner, done) {
      const isClockInstalled = !!jasmine[symbol("clockInstalled")];
      const testProxyZoneSpec = queueRunner.testProxyZoneSpec;
      const testProxyZone = queueRunner.testProxyZone;
      let lastDelegate;
      if (isClockInstalled && enableAutoFakeAsyncWhenClockPatched) {
        const fakeAsyncModule = Zone3[Zone3.__symbol__("fakeAsyncTest")];
        if (fakeAsyncModule && typeof fakeAsyncModule.fakeAsync === "function") {
          testBody = fakeAsyncModule.fakeAsync(testBody);
        }
      }
      if (done) {
        return testProxyZone.run(testBody, applyThis, [done]);
      } else {
        return testProxyZone.run(testBody, applyThis);
      }
    }
    function wrapTestInZone(testBody) {
      return testBody && (testBody.length ? function(done) {
        return runInTestZone(testBody, this, this.queueRunner, done);
      } : function() {
        return runInTestZone(testBody, this, this.queueRunner);
      });
    }
    const j$ = jasmine;
    const privateApis = ((_a = j$ == null ? void 0 : j$.private) == null ? void 0 : _a.QueueRunner) ? j$ == null ? void 0 : j$.private : j$;
    const QueueRunner = privateApis.QueueRunner;
    privateApis.QueueRunner = function(_super) {
      __extends(ZoneQueueRunner, _super);
      function ZoneQueueRunner(attrs) {
        if (attrs.onComplete) {
          attrs.onComplete = /* @__PURE__ */ ((fn) => () => {
            this.testProxyZone = null;
            this.testProxyZoneSpec = null;
            ambientZone.scheduleMicroTask("jasmine.onComplete", fn);
          })(attrs.onComplete);
        }
        const nativeSetTimeout = global[Zone3.__symbol__("setTimeout")];
        const nativeClearTimeout = global[Zone3.__symbol__("clearTimeout")];
        if (nativeSetTimeout) {
          attrs.timeout = {
            setTimeout: nativeSetTimeout ? nativeSetTimeout : global.setTimeout,
            clearTimeout: nativeClearTimeout ? nativeClearTimeout : global.clearTimeout
          };
        }
        if (privateApis.UserContext) {
          if (!attrs.userContext) {
            attrs.userContext = new privateApis.UserContext();
          }
          attrs.userContext.queueRunner = this;
        } else {
          if (!attrs.userContext) {
            attrs.userContext = {};
          }
          attrs.userContext.queueRunner = this;
        }
        const onException = attrs.onException;
        attrs.onException = function(error) {
          if (error && error.message === "Timeout - Async callback was not invoked within timeout specified by jasmine.DEFAULT_TIMEOUT_INTERVAL.") {
            const proxyZoneSpec = this && this.testProxyZoneSpec;
            if (proxyZoneSpec) {
              const pendingTasksInfo = proxyZoneSpec.getAndClearPendingTasksInfo();
              try {
                error.message += pendingTasksInfo;
              } catch (err) {
              }
            }
          }
          if (onException) {
            onException.call(this, error);
          }
        };
        _super.call(this, attrs);
      }
      ZoneQueueRunner.prototype.execute = function() {
        let zone = Zone3.current;
        let isChildOfAmbientZone = false;
        while (zone) {
          if (zone === ambientZone) {
            isChildOfAmbientZone = true;
            break;
          }
          zone = zone.parent;
        }
        if (!isChildOfAmbientZone)
          throw new Error("Unexpected Zone: " + Zone3.current.name);
        this.testProxyZoneSpec = new ProxyZoneSpec();
        this.testProxyZone = ambientZone.fork(this.testProxyZoneSpec);
        if (!Zone3.currentTask) {
          Zone3.current.scheduleMicroTask("jasmine.execute().forceTask", () => QueueRunner.prototype.execute.call(this));
        } else {
          _super.prototype.execute.call(this);
        }
      };
      return ZoneQueueRunner;
    }(QueueRunner);
  });
}

// packages/zone.js/lib/jasmine/rollup-jasmine.js
patchJasmine(Zone);
