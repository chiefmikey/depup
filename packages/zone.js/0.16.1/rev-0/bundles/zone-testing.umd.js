'use strict';
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
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
            for (var _i = 0, _c = __getOwnPropSymbols(b); _i < _c.length; _i++) {
                var prop = _c[_i];
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
    var __async = function (__this, __arguments, generator) {
        return new Promise(function (resolve, reject) {
            var fulfilled = function (value) {
                try {
                    step(generator.next(value));
                }
                catch (e) {
                    reject(e);
                }
            };
            var rejected = function (value) {
                try {
                    step(generator.throw(value));
                }
                catch (e) {
                    reject(e);
                }
            };
            var step = function (x) { return x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected); };
            step((generator = generator.apply(__this, __arguments)).next());
        });
    };
    // packages/zone.js/lib/jasmine/jasmine.js
    function patchJasmine(Zone2) {
        Zone2.__load_patch("jasmine", function (global3, Zone3, api) {
            var _a;
            var __extends = function (d, b) {
                for (var p in b)
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
            var SyncTestZoneSpec = Zone3["SyncTestZoneSpec"];
            var ProxyZoneSpec2 = Zone3["ProxyZoneSpec"];
            if (!SyncTestZoneSpec)
                throw new Error("Missing: SyncTestZoneSpec");
            if (!ProxyZoneSpec2)
                throw new Error("Missing: ProxyZoneSpec");
            var ambientZone = Zone3.current;
            var symbol = Zone3.__symbol__;
            var disablePatchingJasmineClock = global3[symbol("fakeAsyncDisablePatchingClock")] === true;
            var enableAutoFakeAsyncWhenClockPatched = !disablePatchingJasmineClock && (global3[symbol("fakeAsyncPatchLock")] === true || global3[symbol("fakeAsyncAutoFakeAsyncWhenClockPatched")] === true);
            var jasmineEnv = jasmine.getEnv();
            ["describe", "xdescribe", "fdescribe"].forEach(function (methodName) {
                var originalJasmineFn = jasmineEnv[methodName];
                jasmineEnv[methodName] = function (description, specDefinitions) {
                    return originalJasmineFn.call(this, description, wrapDescribeInZone(description, specDefinitions));
                };
            });
            ["it", "xit", "fit"].forEach(function (methodName) {
                var originalJasmineFn = jasmineEnv[methodName];
                jasmineEnv[symbol(methodName)] = originalJasmineFn;
                jasmineEnv[methodName] = function (description, specDefinitions, timeout) {
                    arguments[1] = wrapTestInZone(specDefinitions);
                    return originalJasmineFn.apply(this, arguments);
                };
            });
            ["beforeEach", "afterEach", "beforeAll", "afterAll"].forEach(function (methodName) {
                var originalJasmineFn = jasmineEnv[methodName];
                jasmineEnv[symbol(methodName)] = originalJasmineFn;
                jasmineEnv[methodName] = function (specDefinitions, timeout) {
                    arguments[0] = wrapTestInZone(specDefinitions);
                    return originalJasmineFn.apply(this, arguments);
                };
            });
            if (!disablePatchingJasmineClock) {
                var originalClockFn_1 = jasmine[symbol("clock")] = jasmine["clock"];
                jasmine["clock"] = function () {
                    var clock = originalClockFn_1.apply(this, arguments);
                    if (!clock[symbol("patched")]) {
                        clock[symbol("patched")] = symbol("patched");
                        var originalTick_1 = clock[symbol("tick")] = clock.tick;
                        clock.tick = function () {
                            var fakeAsyncZoneSpec = Zone3.current.get("FakeAsyncTestZoneSpec");
                            if (fakeAsyncZoneSpec) {
                                return fakeAsyncZoneSpec.tick.apply(fakeAsyncZoneSpec, arguments);
                            }
                            return originalTick_1.apply(this, arguments);
                        };
                        var originalMockDate_1 = clock[symbol("mockDate")] = clock.mockDate;
                        clock.mockDate = function () {
                            var fakeAsyncZoneSpec = Zone3.current.get("FakeAsyncTestZoneSpec");
                            if (fakeAsyncZoneSpec) {
                                var dateTime = arguments.length > 0 ? arguments[0] : /* @__PURE__ */ new Date();
                                return fakeAsyncZoneSpec.setFakeBaseSystemTime.apply(fakeAsyncZoneSpec, dateTime && typeof dateTime.getTime === "function" ? [dateTime.getTime()] : arguments);
                            }
                            return originalMockDate_1.apply(this, arguments);
                        };
                        if (enableAutoFakeAsyncWhenClockPatched) {
                            ["install", "uninstall"].forEach(function (methodName) {
                                var originalClockFn2 = clock[symbol(methodName)] = clock[methodName];
                                clock[methodName] = function () {
                                    var FakeAsyncTestZoneSpec2 = Zone3["FakeAsyncTestZoneSpec"];
                                    if (FakeAsyncTestZoneSpec2) {
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
                var originalCreateSpyObj_1 = jasmine.createSpyObj;
                jasmine[Zone3.__symbol__("createSpyObj")] = originalCreateSpyObj_1;
                jasmine.createSpyObj = function () {
                    var args = Array.prototype.slice.call(arguments);
                    var propertyNames = args.length >= 3 ? args[2] : null;
                    var spyObj;
                    if (propertyNames) {
                        var defineProperty_1 = Object.defineProperty;
                        Object.defineProperty = function (obj, p, attributes) {
                            return defineProperty_1.call(this, obj, p, __spreadProps(__spreadValues({}, attributes), {
                                configurable: true,
                                enumerable: true
                            }));
                        };
                        try {
                            spyObj = originalCreateSpyObj_1.apply(this, args);
                        }
                        finally {
                            Object.defineProperty = defineProperty_1;
                        }
                    }
                    else {
                        spyObj = originalCreateSpyObj_1.apply(this, args);
                    }
                    return spyObj;
                };
            }
            function wrapDescribeInZone(description, describeBody) {
                return function () {
                    var syncZone = ambientZone.fork(new SyncTestZoneSpec("jasmine.describe#".concat(description)));
                    return syncZone.run(describeBody, this, arguments);
                };
            }
            function runInTestZone(testBody, applyThis, queueRunner, done) {
                var isClockInstalled = !!jasmine[symbol("clockInstalled")];
                var testProxyZoneSpec = queueRunner.testProxyZoneSpec;
                var testProxyZone = queueRunner.testProxyZone;
                var lastDelegate;
                if (isClockInstalled && enableAutoFakeAsyncWhenClockPatched) {
                    var fakeAsyncModule = Zone3[Zone3.__symbol__("fakeAsyncTest")];
                    if (fakeAsyncModule && typeof fakeAsyncModule.fakeAsync === "function") {
                        testBody = fakeAsyncModule.fakeAsync(testBody);
                    }
                }
                if (done) {
                    return testProxyZone.run(testBody, applyThis, [done]);
                }
                else {
                    return testProxyZone.run(testBody, applyThis);
                }
            }
            function wrapTestInZone(testBody) {
                return testBody && (testBody.length ? function (done) {
                    return runInTestZone(testBody, this, this.queueRunner, done);
                } : function () {
                    return runInTestZone(testBody, this, this.queueRunner);
                });
            }
            var j$ = jasmine;
            var privateApis = ((_a = j$ == null ? void 0 : j$.private) == null ? void 0 : _a.QueueRunner) ? j$ == null ? void 0 : j$.private : j$;
            var QueueRunner = privateApis.QueueRunner;
            privateApis.QueueRunner = function (_super) {
                __extends(ZoneQueueRunner, _super);
                function ZoneQueueRunner(attrs) {
                    var _this = this;
                    if (attrs.onComplete) {
                        attrs.onComplete = /* @__PURE__ */ (function (fn) { return function () {
                            _this.testProxyZone = null;
                            _this.testProxyZoneSpec = null;
                            ambientZone.scheduleMicroTask("jasmine.onComplete", fn);
                        }; })(attrs.onComplete);
                    }
                    var nativeSetTimeout = global3[Zone3.__symbol__("setTimeout")];
                    var nativeClearTimeout = global3[Zone3.__symbol__("clearTimeout")];
                    if (nativeSetTimeout) {
                        attrs.timeout = {
                            setTimeout: nativeSetTimeout ? nativeSetTimeout : global3.setTimeout,
                            clearTimeout: nativeClearTimeout ? nativeClearTimeout : global3.clearTimeout
                        };
                    }
                    if (privateApis.UserContext) {
                        if (!attrs.userContext) {
                            attrs.userContext = new privateApis.UserContext();
                        }
                        attrs.userContext.queueRunner = this;
                    }
                    else {
                        if (!attrs.userContext) {
                            attrs.userContext = {};
                        }
                        attrs.userContext.queueRunner = this;
                    }
                    var onException = attrs.onException;
                    attrs.onException = function (error) {
                        if (error && error.message === "Timeout - Async callback was not invoked within timeout specified by jasmine.DEFAULT_TIMEOUT_INTERVAL.") {
                            var proxyZoneSpec = this && this.testProxyZoneSpec;
                            if (proxyZoneSpec) {
                                var pendingTasksInfo = proxyZoneSpec.getAndClearPendingTasksInfo();
                                try {
                                    error.message += pendingTasksInfo;
                                }
                                catch (err) {
                                }
                            }
                        }
                        if (onException) {
                            onException.call(this, error);
                        }
                    };
                    _super.call(this, attrs);
                }
                ZoneQueueRunner.prototype.execute = function () {
                    var _this = this;
                    var zone = Zone3.current;
                    var isChildOfAmbientZone = false;
                    while (zone) {
                        if (zone === ambientZone) {
                            isChildOfAmbientZone = true;
                            break;
                        }
                        zone = zone.parent;
                    }
                    if (!isChildOfAmbientZone)
                        throw new Error("Unexpected Zone: " + Zone3.current.name);
                    this.testProxyZoneSpec = new ProxyZoneSpec2();
                    this.testProxyZone = ambientZone.fork(this.testProxyZoneSpec);
                    if (!Zone3.currentTask) {
                        Zone3.current.scheduleMicroTask("jasmine.execute().forceTask", function () { return QueueRunner.prototype.execute.call(_this); });
                    }
                    else {
                        _super.prototype.execute.call(this);
                    }
                };
                return ZoneQueueRunner;
            }(QueueRunner);
        });
    }
    // packages/zone.js/lib/jest/jest.js
    function patchJest(Zone2) {
        Zone2.__load_patch("jest", function (context, Zone3, api) {
            if (typeof jest === "undefined" || jest["__zone_patch__"]) {
                return;
            }
            Zone3[api.symbol("ignoreConsoleErrorUncaughtError")] = true;
            jest["__zone_patch__"] = true;
            var ProxyZoneSpec2 = Zone3["ProxyZoneSpec"];
            var SyncTestZoneSpec = Zone3["SyncTestZoneSpec"];
            if (!ProxyZoneSpec2) {
                throw new Error("Missing ProxyZoneSpec");
            }
            var rootZone = Zone3.current;
            var syncZone = rootZone.fork(new SyncTestZoneSpec("jest.describe"));
            var proxyZoneSpec = new ProxyZoneSpec2();
            var proxyZone = rootZone.fork(proxyZoneSpec);
            function wrapDescribeFactoryInZone(originalJestFn) {
                return function () {
                    var tableArgs = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        tableArgs[_i] = arguments[_i];
                    }
                    var originalDescribeFn = originalJestFn.apply(this, tableArgs);
                    return function () {
                        var args = [];
                        for (var _i = 0; _i < arguments.length; _i++) {
                            args[_i] = arguments[_i];
                        }
                        args[1] = wrapDescribeInZone(args[1]);
                        return originalDescribeFn.apply(this, args);
                    };
                };
            }
            function wrapTestFactoryInZone(originalJestFn) {
                return function () {
                    var tableArgs = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        tableArgs[_i] = arguments[_i];
                    }
                    return function () {
                        var args = [];
                        for (var _i = 0; _i < arguments.length; _i++) {
                            args[_i] = arguments[_i];
                        }
                        args[1] = wrapTestInZone(args[1]);
                        return originalJestFn.apply(this, tableArgs).apply(this, args);
                    };
                };
            }
            function wrapDescribeInZone(describeBody) {
                return function () {
                    var args = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        args[_i] = arguments[_i];
                    }
                    return syncZone.run(describeBody, this, args);
                };
            }
            function wrapTestInZone(testBody, isTestFunc) {
                if (isTestFunc === void 0) { isTestFunc = false; }
                if (typeof testBody !== "function") {
                    return testBody;
                }
                var wrappedFunc = function () {
                    if (Zone3[api.symbol("useFakeTimersCalled")] === true && testBody && !testBody.isFakeAsync) {
                        var fakeAsyncModule = Zone3[Zone3.__symbol__("fakeAsyncTest")];
                        if (fakeAsyncModule && typeof fakeAsyncModule.fakeAsync === "function") {
                            testBody = fakeAsyncModule.fakeAsync(testBody);
                        }
                    }
                    proxyZoneSpec.isTestFunc = isTestFunc;
                    return proxyZone.run(testBody, null, arguments);
                };
                Object.defineProperty(wrappedFunc, "length", {
                    configurable: true,
                    writable: true,
                    enumerable: false
                });
                wrappedFunc.length = testBody.length;
                return wrappedFunc;
            }
            ["describe", "xdescribe", "fdescribe"].forEach(function (methodName) {
                var originalJestFn = context[methodName];
                if (context[Zone3.__symbol__(methodName)]) {
                    return;
                }
                context[Zone3.__symbol__(methodName)] = originalJestFn;
                context[methodName] = function () {
                    var args = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        args[_i] = arguments[_i];
                    }
                    args[1] = wrapDescribeInZone(args[1]);
                    return originalJestFn.apply(this, args);
                };
                context[methodName].each = wrapDescribeFactoryInZone(originalJestFn.each);
            });
            context.describe.only = context.fdescribe;
            context.describe.skip = context.xdescribe;
            ["it", "xit", "fit", "test", "xtest"].forEach(function (methodName) {
                var originalJestFn = context[methodName];
                if (context[Zone3.__symbol__(methodName)]) {
                    return;
                }
                context[Zone3.__symbol__(methodName)] = originalJestFn;
                context[methodName] = function () {
                    var args = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        args[_i] = arguments[_i];
                    }
                    args[1] = wrapTestInZone(args[1], true);
                    return originalJestFn.apply(this, args);
                };
                context[methodName].each = wrapTestFactoryInZone(originalJestFn.each);
                context[methodName].todo = originalJestFn.todo;
                context[methodName].failing = originalJestFn.failing;
            });
            context.it.only = context.fit;
            context.it.skip = context.xit;
            context.test.only = context.fit;
            context.test.skip = context.xit;
            ["beforeEach", "afterEach", "beforeAll", "afterAll"].forEach(function (methodName) {
                var originalJestFn = context[methodName];
                if (context[Zone3.__symbol__(methodName)]) {
                    return;
                }
                context[Zone3.__symbol__(methodName)] = originalJestFn;
                context[methodName] = function () {
                    var args = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        args[_i] = arguments[_i];
                    }
                    args[0] = wrapTestInZone(args[0]);
                    return originalJestFn.apply(this, args);
                };
            });
            Zone3.patchJestObject = function patchJestObject(Timer, isModern) {
                if (isModern === void 0) { isModern = false; }
                function isPatchingFakeTimer() {
                    var fakeAsyncZoneSpec = Zone3.current.get("FakeAsyncTestZoneSpec");
                    return !!fakeAsyncZoneSpec;
                }
                function isInTestFunc() {
                    var proxyZoneSpec2 = Zone3.current.get("ProxyZoneSpec");
                    return proxyZoneSpec2 && proxyZoneSpec2.isTestFunc;
                }
                if (Timer[api.symbol("fakeTimers")]) {
                    return;
                }
                Timer[api.symbol("fakeTimers")] = true;
                api.patchMethod(Timer, "_checkFakeTimers", function (delegate) {
                    return function (self2, args) {
                        if (isPatchingFakeTimer()) {
                            return true;
                        }
                        else {
                            return delegate.apply(self2, args);
                        }
                    };
                });
                api.patchMethod(Timer, "useFakeTimers", function (delegate) {
                    return function (self2, args) {
                        Zone3[api.symbol("useFakeTimersCalled")] = true;
                        if (isModern || isInTestFunc()) {
                            return delegate.apply(self2, args);
                        }
                        return self2;
                    };
                });
                api.patchMethod(Timer, "useRealTimers", function (delegate) {
                    return function (self2, args) {
                        Zone3[api.symbol("useFakeTimersCalled")] = false;
                        if (isModern || isInTestFunc()) {
                            return delegate.apply(self2, args);
                        }
                        return self2;
                    };
                });
                api.patchMethod(Timer, "setSystemTime", function (delegate) {
                    return function (self2, args) {
                        var fakeAsyncZoneSpec = Zone3.current.get("FakeAsyncTestZoneSpec");
                        if (fakeAsyncZoneSpec && isPatchingFakeTimer()) {
                            fakeAsyncZoneSpec.setFakeBaseSystemTime(args[0]);
                        }
                        else {
                            return delegate.apply(self2, args);
                        }
                    };
                });
                api.patchMethod(Timer, "getRealSystemTime", function (delegate) {
                    return function (self2, args) {
                        var fakeAsyncZoneSpec = Zone3.current.get("FakeAsyncTestZoneSpec");
                        if (fakeAsyncZoneSpec && isPatchingFakeTimer()) {
                            return fakeAsyncZoneSpec.getRealSystemTime();
                        }
                        else {
                            return delegate.apply(self2, args);
                        }
                    };
                });
                api.patchMethod(Timer, "runAllTicks", function (delegate) {
                    return function (self2, args) {
                        var fakeAsyncZoneSpec = Zone3.current.get("FakeAsyncTestZoneSpec");
                        if (fakeAsyncZoneSpec) {
                            fakeAsyncZoneSpec.flushMicrotasks();
                        }
                        else {
                            return delegate.apply(self2, args);
                        }
                    };
                });
                api.patchMethod(Timer, "runAllTimers", function (delegate) {
                    return function (self2, args) {
                        var fakeAsyncZoneSpec = Zone3.current.get("FakeAsyncTestZoneSpec");
                        if (fakeAsyncZoneSpec) {
                            fakeAsyncZoneSpec.flush(100, true);
                        }
                        else {
                            return delegate.apply(self2, args);
                        }
                    };
                });
                api.patchMethod(Timer, "advanceTimersByTime", function (delegate) {
                    return function (self2, args) {
                        var fakeAsyncZoneSpec = Zone3.current.get("FakeAsyncTestZoneSpec");
                        if (fakeAsyncZoneSpec) {
                            fakeAsyncZoneSpec.tick(args[0]);
                        }
                        else {
                            return delegate.apply(self2, args);
                        }
                    };
                });
                api.patchMethod(Timer, "runOnlyPendingTimers", function (delegate) {
                    return function (self2, args) {
                        var fakeAsyncZoneSpec = Zone3.current.get("FakeAsyncTestZoneSpec");
                        if (fakeAsyncZoneSpec) {
                            fakeAsyncZoneSpec.flushOnlyPendingTimers();
                        }
                        else {
                            return delegate.apply(self2, args);
                        }
                    };
                });
                api.patchMethod(Timer, "advanceTimersToNextTimer", function (delegate) {
                    return function (self2, args) {
                        var fakeAsyncZoneSpec = Zone3.current.get("FakeAsyncTestZoneSpec");
                        if (fakeAsyncZoneSpec) {
                            fakeAsyncZoneSpec.tickToNext(args[0]);
                        }
                        else {
                            return delegate.apply(self2, args);
                        }
                    };
                });
                api.patchMethod(Timer, "clearAllTimers", function (delegate) {
                    return function (self2, args) {
                        var fakeAsyncZoneSpec = Zone3.current.get("FakeAsyncTestZoneSpec");
                        if (fakeAsyncZoneSpec) {
                            fakeAsyncZoneSpec.removeAllTimers();
                        }
                        else {
                            return delegate.apply(self2, args);
                        }
                    };
                });
                api.patchMethod(Timer, "getTimerCount", function (delegate) {
                    return function (self2, args) {
                        var fakeAsyncZoneSpec = Zone3.current.get("FakeAsyncTestZoneSpec");
                        if (fakeAsyncZoneSpec) {
                            return fakeAsyncZoneSpec.getTimerCount();
                        }
                        else {
                            return delegate.apply(self2, args);
                        }
                    };
                });
            };
        });
    }
    // packages/zone.js/lib/mocha/mocha.js
    function patchMocha(Zone2) {
        Zone2.__load_patch("mocha", function (global3, Zone3) {
            var Mocha = global3.Mocha;
            if (typeof Mocha === "undefined") {
                return;
            }
            if (typeof Zone3 === "undefined") {
                throw new Error("Missing Zone.js");
            }
            var ProxyZoneSpec2 = Zone3["ProxyZoneSpec"];
            var SyncTestZoneSpec = Zone3["SyncTestZoneSpec"];
            if (!ProxyZoneSpec2) {
                throw new Error("Missing ProxyZoneSpec");
            }
            if (Mocha["__zone_patch__"]) {
                throw new Error('"Mocha" has already been patched with "Zone".');
            }
            Mocha["__zone_patch__"] = true;
            var rootZone = Zone3.current;
            var syncZone = rootZone.fork(new SyncTestZoneSpec("Mocha.describe"));
            var testZone = null;
            var suiteZone = rootZone.fork(new ProxyZoneSpec2());
            var mochaOriginal = {
                after: global3.after,
                afterEach: global3.afterEach,
                before: global3.before,
                beforeEach: global3.beforeEach,
                describe: global3.describe,
                it: global3.it
            };
            function modifyArguments(args, syncTest, asyncTest) {
                var _loop_1 = function (i) {
                    var arg = args[i];
                    if (typeof arg === "function") {
                        args[i] = arg.length === 0 ? syncTest(arg) : asyncTest(arg);
                        args[i].toString = function () {
                            return arg.toString();
                        };
                    }
                };
                for (var i = 0; i < args.length; i++) {
                    _loop_1(i);
                }
                return args;
            }
            function wrapDescribeInZone(args) {
                var syncTest = function (fn) {
                    return function () {
                        return syncZone.run(fn, this, arguments);
                    };
                };
                return modifyArguments(args, syncTest);
            }
            function wrapTestInZone(args) {
                var asyncTest = function (fn) {
                    return function (done) {
                        return testZone.run(fn, this, [done]);
                    };
                };
                var syncTest = function (fn) {
                    return function () {
                        return testZone.run(fn, this);
                    };
                };
                return modifyArguments(args, syncTest, asyncTest);
            }
            function wrapSuiteInZone(args) {
                var asyncTest = function (fn) {
                    return function (done) {
                        return suiteZone.run(fn, this, [done]);
                    };
                };
                var syncTest = function (fn) {
                    return function () {
                        return suiteZone.run(fn, this);
                    };
                };
                return modifyArguments(args, syncTest, asyncTest);
            }
            global3.describe = global3.suite = function () {
                return mochaOriginal.describe.apply(this, wrapDescribeInZone(arguments));
            };
            global3.xdescribe = global3.suite.skip = global3.describe.skip = function () {
                return mochaOriginal.describe.skip.apply(this, wrapDescribeInZone(arguments));
            };
            global3.describe.only = global3.suite.only = function () {
                return mochaOriginal.describe.only.apply(this, wrapDescribeInZone(arguments));
            };
            global3.it = global3.specify = global3.test = function () {
                return mochaOriginal.it.apply(this, wrapTestInZone(arguments));
            };
            global3.xit = global3.xspecify = global3.it.skip = function () {
                return mochaOriginal.it.skip.apply(this, wrapTestInZone(arguments));
            };
            global3.it.only = global3.test.only = function () {
                return mochaOriginal.it.only.apply(this, wrapTestInZone(arguments));
            };
            global3.after = global3.suiteTeardown = function () {
                return mochaOriginal.after.apply(this, wrapSuiteInZone(arguments));
            };
            global3.afterEach = global3.teardown = function () {
                return mochaOriginal.afterEach.apply(this, wrapTestInZone(arguments));
            };
            global3.before = global3.suiteSetup = function () {
                return mochaOriginal.before.apply(this, wrapSuiteInZone(arguments));
            };
            global3.beforeEach = global3.setup = function () {
                return mochaOriginal.beforeEach.apply(this, wrapTestInZone(arguments));
            };
            (function (originalRunTest, originalRun) {
                Mocha.Runner.prototype.runTest = function (fn) {
                    var _this = this;
                    Zone3.current.scheduleMicroTask("mocha.forceTask", function () {
                        originalRunTest.call(_this, fn);
                    });
                };
                Mocha.Runner.prototype.run = function (fn) {
                    this.on("test", function (e) {
                        testZone = rootZone.fork(new ProxyZoneSpec2());
                    });
                    this.on("fail", function (test, err) {
                        var proxyZoneSpec = testZone && testZone.get("ProxyZoneSpec");
                        if (proxyZoneSpec && err) {
                            try {
                                err.message += proxyZoneSpec.getAndClearPendingTasksInfo();
                            }
                            catch (error) {
                            }
                        }
                    });
                    return originalRun.call(this, fn);
                };
            })(Mocha.Runner.prototype.runTest, Mocha.Runner.prototype.run);
        });
    }
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
        Zone2.__load_patch("asynctest", function (global3, Zone3, api) {
            Zone3[api.symbol("asyncTest")] = function asyncTest(fn) {
                if (global3.jasmine) {
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
                var ProxyZoneSpec2 = Zone3["ProxyZoneSpec"];
                if (!ProxyZoneSpec2) {
                    throw new Error("ProxyZoneSpec is needed for the async() test helper but could not be found. Please make sure that your environment includes zone.js/plugins/proxy");
                }
                var proxyZoneSpec = ProxyZoneSpec2.get();
                ProxyZoneSpec2.assertPresent();
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
    // packages/zone.js/lib/zone-spec/proxy.js
    function throwProxyZoneError() {
        var jestPatched = typeof jest !== "undefined" && jest["__zone_patch__"];
        if (jestPatched) {
            throw new Error("Only globals are patched with zone-testing. If you import `it`, `describe`, etc. directly, you cannot use `fakeAsync` or `waitForAsync`.");
        }
        else {
            throw new Error("ProxyZoneSpec is needed for the fakeAsync and waitForAsync test helpers but could not be found. Make sure that your environment includes zone-testing.js");
        }
    }
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
    // packages/zone.js/lib/zone-spec/fake-async-test.js
    var global2 = typeof window === "object" && window || typeof self === "object" && self || globalThis.global;
    var originalSetImmediate = global2.setImmediate;
    var originalTimeout = global2.setTimeout;
    var OriginalDate = global2.Date;
    function FakeDate() {
        if (arguments.length === 0) {
            var d = new OriginalDate();
            d.setTime(FakeDate.now());
            return d;
        }
        else {
            var args = Array.prototype.slice.call(arguments);
            return new (OriginalDate.bind.apply(OriginalDate, __spreadArray([void 0], args, false)))();
        }
    }
    FakeDate.now = function () {
        var fakeAsyncTestZoneSpec = Zone.current.get("FakeAsyncTestZoneSpec");
        if (fakeAsyncTestZoneSpec) {
            return fakeAsyncTestZoneSpec.getFakeSystemTime();
        }
        return OriginalDate.now.apply(this, arguments);
    };
    FakeDate.UTC = OriginalDate.UTC;
    FakeDate.parse = OriginalDate.parse;
    var patchedTimers;
    var timeoutCallback = function () {
    };
    var _Scheduler = /** @class */ (function () {
        function _Scheduler() {
            // Scheduler queue with the tuple of end time and callback function - sorted by end time.
            __publicField(this, "_schedulerQueue", []);
            // Current simulated time in millis.
            __publicField(this, "_currentTickTime", 0);
            // Current fake system base time in millis.
            __publicField(this, "_currentFakeBaseSystemTime", OriginalDate.now());
            // track requeuePeriodicTimer
            __publicField(this, "_currentTickRequeuePeriodicEntries", []);
        }
        _Scheduler.getNextId = function () {
            var id = patchedTimers.nativeSetTimeout.call(global2, timeoutCallback, 0);
            patchedTimers.nativeClearTimeout.call(global2, id);
            if (typeof id === "number") {
                return id;
            }
            return _Scheduler.nextNodeJSId++;
        };
        _Scheduler.prototype.getCurrentTickTime = function () {
            return this._currentTickTime;
        };
        _Scheduler.prototype.getFakeSystemTime = function () {
            return this._currentFakeBaseSystemTime + this._currentTickTime;
        };
        _Scheduler.prototype.setFakeBaseSystemTime = function (fakeBaseSystemTime) {
            this._currentFakeBaseSystemTime = fakeBaseSystemTime;
        };
        _Scheduler.prototype.getRealSystemTime = function () {
            return OriginalDate.now();
        };
        _Scheduler.prototype.scheduleFunction = function (cb, delay, options) {
            options = __spreadValues(__spreadValues({}, {
                args: [],
                isPeriodic: false,
                isRequestAnimationFrame: false,
                id: -1,
                isRequeuePeriodic: false
            }), options);
            var currentId = options.id < 0 ? _Scheduler.nextId : options.id;
            _Scheduler.nextId = _Scheduler.getNextId();
            var endTime = this._currentTickTime + delay;
            var newEntry = {
                endTime: endTime,
                id: currentId,
                func: cb,
                args: options.args,
                delay: delay,
                isPeriodic: options.isPeriodic,
                isRequestAnimationFrame: options.isRequestAnimationFrame
            };
            if (options.isRequeuePeriodic) {
                this._currentTickRequeuePeriodicEntries.push(newEntry);
            }
            var i = 0;
            for (; i < this._schedulerQueue.length; i++) {
                var currentEntry = this._schedulerQueue[i];
                if (newEntry.endTime < currentEntry.endTime) {
                    break;
                }
            }
            this._schedulerQueue.splice(i, 0, newEntry);
            return currentId;
        };
        _Scheduler.prototype.removeScheduledFunctionWithId = function (id) {
            for (var i = 0; i < this._schedulerQueue.length; i++) {
                if (this._schedulerQueue[i].id == id) {
                    this._schedulerQueue.splice(i, 1);
                    break;
                }
            }
        };
        _Scheduler.prototype.removeAll = function () {
            this._schedulerQueue = [];
        };
        _Scheduler.prototype.getTimerCount = function () {
            return this._schedulerQueue.length;
        };
        _Scheduler.prototype.tickToNext = function (step, doTick, tickOptions) {
            if (step === void 0) { step = 1; }
            if (this._schedulerQueue.length < step) {
                return;
            }
            var startTime = this._currentTickTime;
            var targetTask = this._schedulerQueue[step - 1];
            this.tick(targetTask.endTime - startTime, doTick, tickOptions);
        };
        _Scheduler.prototype.tick = function (millis, doTick, tickOptions) {
            if (millis === void 0) { millis = 0; }
            var finalTime = this._currentTickTime + millis;
            var lastCurrentTime = 0;
            tickOptions = Object.assign({ processNewMacroTasksSynchronously: true }, tickOptions);
            var schedulerQueue = tickOptions.processNewMacroTasksSynchronously ? this._schedulerQueue : this._schedulerQueue.slice();
            if (schedulerQueue.length === 0 && doTick) {
                doTick(millis);
                return;
            }
            while (schedulerQueue.length > 0) {
                this._currentTickRequeuePeriodicEntries = [];
                var current = schedulerQueue[0];
                if (finalTime < current.endTime) {
                    break;
                }
                else {
                    var current2 = schedulerQueue.shift();
                    if (!tickOptions.processNewMacroTasksSynchronously) {
                        var idx = this._schedulerQueue.indexOf(current2);
                        if (idx >= 0) {
                            this._schedulerQueue.splice(idx, 1);
                        }
                    }
                    lastCurrentTime = this._currentTickTime;
                    this._currentTickTime = current2.endTime;
                    if (doTick) {
                        doTick(this._currentTickTime - lastCurrentTime);
                    }
                    var retval = current2.func.apply(global2, current2.isRequestAnimationFrame ? [this._currentTickTime] : current2.args);
                    if (!retval) {
                        break;
                    }
                    if (!tickOptions.processNewMacroTasksSynchronously) {
                        this._currentTickRequeuePeriodicEntries.forEach(function (newEntry) {
                            var i = 0;
                            for (; i < schedulerQueue.length; i++) {
                                var currentEntry = schedulerQueue[i];
                                if (newEntry.endTime < currentEntry.endTime) {
                                    break;
                                }
                            }
                            schedulerQueue.splice(i, 0, newEntry);
                        });
                    }
                }
            }
            lastCurrentTime = this._currentTickTime;
            this._currentTickTime = finalTime;
            if (doTick) {
                doTick(this._currentTickTime - lastCurrentTime);
            }
        };
        _Scheduler.prototype.executeNextTask = function (doTick) {
            var current = this._schedulerQueue.shift();
            if (current === void 0) {
                return;
            }
            doTick == null ? void 0 : doTick(current.endTime - this._currentTickTime);
            this._currentTickTime = current.endTime;
            current.func.apply(global2, current.isRequestAnimationFrame ? [this._currentTickTime] : current.args);
        };
        _Scheduler.prototype.flushOnlyPendingTimers = function (doTick) {
            if (this._schedulerQueue.length === 0) {
                return 0;
            }
            var startTime = this._currentTickTime;
            var lastTask = this._schedulerQueue[this._schedulerQueue.length - 1];
            this.tick(lastTask.endTime - startTime, doTick, { processNewMacroTasksSynchronously: false });
            return this._currentTickTime - startTime;
        };
        _Scheduler.prototype.flush = function (limit, flushPeriodic, doTick) {
            if (limit === void 0) { limit = 20; }
            if (flushPeriodic === void 0) { flushPeriodic = false; }
            if (flushPeriodic) {
                return this.flushPeriodic(doTick);
            }
            else {
                return this.flushNonPeriodic(limit, doTick);
            }
        };
        _Scheduler.prototype.flushPeriodic = function (doTick) {
            if (this._schedulerQueue.length === 0) {
                return 0;
            }
            var startTime = this._currentTickTime;
            var lastTask = this._schedulerQueue[this._schedulerQueue.length - 1];
            this.tick(lastTask.endTime - startTime, doTick);
            return this._currentTickTime - startTime;
        };
        _Scheduler.prototype.flushNonPeriodic = function (limit, doTick) {
            var startTime = this._currentTickTime;
            var lastCurrentTime = 0;
            var count = 0;
            while (this._schedulerQueue.length > 0) {
                count++;
                if (count > limit) {
                    throw new Error("flush failed after reaching the limit of " + limit + " tasks. Does your code use a polling timeout?");
                }
                if (this._schedulerQueue.filter(function (task) { return !task.isPeriodic && !task.isRequestAnimationFrame; }).length === 0) {
                    break;
                }
                var current = this._schedulerQueue.shift();
                lastCurrentTime = this._currentTickTime;
                this._currentTickTime = current.endTime;
                if (doTick) {
                    doTick(this._currentTickTime - lastCurrentTime);
                }
                var retval = current.func.apply(global2, current.args);
                if (!retval) {
                    break;
                }
            }
            return this._currentTickTime - startTime;
        };
        return _Scheduler;
    }());
    // Next scheduler id.
    __publicField(_Scheduler, "nextNodeJSId", 1);
    __publicField(_Scheduler, "nextId", -1);
    var Scheduler = _Scheduler;
    var FakeAsyncTestZoneSpec = /** @class */ (function () {
        function _FakeAsyncTestZoneSpec(namePrefix, trackPendingRequestAnimationFrame, macroTaskOptions) {
            if (trackPendingRequestAnimationFrame === void 0) { trackPendingRequestAnimationFrame = false; }
            __publicField(this, "trackPendingRequestAnimationFrame");
            __publicField(this, "macroTaskOptions");
            __publicField(this, "_scheduler", new Scheduler());
            __publicField(this, "_microtasks", []);
            __publicField(this, "_lastError", null);
            __publicField(this, "_uncaughtPromiseErrors", Promise[Zone.__symbol__("uncaughtPromiseErrors")]);
            __publicField(this, "pendingPeriodicTimers", []);
            __publicField(this, "pendingTimers", []);
            __publicField(this, "patchDateLocked", false);
            __publicField(this, "tickMode", {
                counter: 0,
                mode: "manual"
            });
            // ZoneSpec implementation below.
            __publicField(this, "name");
            __publicField(this, "properties", { "FakeAsyncTestZoneSpec": this });
            this.trackPendingRequestAnimationFrame = trackPendingRequestAnimationFrame;
            this.macroTaskOptions = macroTaskOptions;
            this.name = "fakeAsyncTestZone for " + namePrefix;
            if (!this.macroTaskOptions) {
                this.macroTaskOptions = global2[Zone.__symbol__("FakeAsyncTestMacroTask")];
            }
        }
        _FakeAsyncTestZoneSpec.assertInZone = function () {
            if (Zone.current.get("FakeAsyncTestZoneSpec") == null) {
                throw new Error("The code should be running in the fakeAsync zone to call this function");
            }
        };
        _FakeAsyncTestZoneSpec.prototype._fnAndFlush = function (fn, completers) {
            var _this = this;
            return function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                fn.apply(global2, args);
                if (_this._lastError === null) {
                    if (completers.onSuccess != null) {
                        completers.onSuccess.apply(global2);
                    }
                    _this.flushMicrotasks();
                }
                else {
                    if (completers.onError != null) {
                        completers.onError.apply(global2);
                    }
                }
                return _this._lastError === null;
            };
        };
        _FakeAsyncTestZoneSpec._removeTimer = function (timers, id) {
            var index = timers.indexOf(id);
            if (index > -1) {
                timers.splice(index, 1);
            }
        };
        _FakeAsyncTestZoneSpec.prototype._dequeueTimer = function (id) {
            var _this = this;
            return function () {
                _FakeAsyncTestZoneSpec._removeTimer(_this.pendingTimers, id);
            };
        };
        _FakeAsyncTestZoneSpec.prototype._requeuePeriodicTimer = function (fn, interval, args, id) {
            var _this = this;
            return function () {
                if (_this.pendingPeriodicTimers.indexOf(id) !== -1) {
                    _this._scheduler.scheduleFunction(fn, interval, {
                        args: args,
                        isPeriodic: true,
                        id: id,
                        isRequeuePeriodic: true
                    });
                }
            };
        };
        _FakeAsyncTestZoneSpec.prototype._dequeuePeriodicTimer = function (id) {
            var _this = this;
            return function () {
                _FakeAsyncTestZoneSpec._removeTimer(_this.pendingPeriodicTimers, id);
            };
        };
        _FakeAsyncTestZoneSpec.prototype._setTimeout = function (fn, delay, args, isTimer) {
            if (isTimer === void 0) { isTimer = true; }
            var removeTimerFn = this._dequeueTimer(Scheduler.nextId);
            var cb = this._fnAndFlush(fn, { onSuccess: removeTimerFn, onError: removeTimerFn });
            var id = this._scheduler.scheduleFunction(cb, delay, { args: args, isRequestAnimationFrame: !isTimer });
            if (isTimer) {
                this.pendingTimers.push(id);
            }
            return id;
        };
        _FakeAsyncTestZoneSpec.prototype._clearTimeout = function (id) {
            _FakeAsyncTestZoneSpec._removeTimer(this.pendingTimers, id);
            this._scheduler.removeScheduledFunctionWithId(id);
        };
        _FakeAsyncTestZoneSpec.prototype._setInterval = function (fn, interval, args) {
            var id = Scheduler.nextId;
            var completers = { onSuccess: null, onError: this._dequeuePeriodicTimer(id) };
            var cb = this._fnAndFlush(fn, completers);
            completers.onSuccess = this._requeuePeriodicTimer(cb, interval, args, id);
            this._scheduler.scheduleFunction(cb, interval, { args: args, isPeriodic: true });
            this.pendingPeriodicTimers.push(id);
            return id;
        };
        _FakeAsyncTestZoneSpec.prototype._clearInterval = function (id) {
            _FakeAsyncTestZoneSpec._removeTimer(this.pendingPeriodicTimers, id);
            this._scheduler.removeScheduledFunctionWithId(id);
        };
        _FakeAsyncTestZoneSpec.prototype._resetLastErrorAndThrow = function () {
            var error = this._lastError || this._uncaughtPromiseErrors[0];
            this._uncaughtPromiseErrors.length = 0;
            this._lastError = null;
            throw error;
        };
        _FakeAsyncTestZoneSpec.prototype.getCurrentTickTime = function () {
            return this._scheduler.getCurrentTickTime();
        };
        _FakeAsyncTestZoneSpec.prototype.getFakeSystemTime = function () {
            return this._scheduler.getFakeSystemTime();
        };
        _FakeAsyncTestZoneSpec.prototype.setFakeBaseSystemTime = function (realTime) {
            this._scheduler.setFakeBaseSystemTime(realTime);
        };
        _FakeAsyncTestZoneSpec.prototype.getRealSystemTime = function () {
            return this._scheduler.getRealSystemTime();
        };
        _FakeAsyncTestZoneSpec.patchDate = function () {
            if (!!global2[Zone.__symbol__("disableDatePatching")]) {
                return;
            }
            if (global2["Date"] === FakeDate) {
                return;
            }
            global2["Date"] = FakeDate;
            FakeDate.prototype = OriginalDate.prototype;
            _FakeAsyncTestZoneSpec.checkTimerPatch();
        };
        _FakeAsyncTestZoneSpec.resetDate = function () {
            if (global2["Date"] === FakeDate) {
                global2["Date"] = OriginalDate;
            }
        };
        _FakeAsyncTestZoneSpec.checkTimerPatch = function () {
            if (!patchedTimers) {
                throw new Error("Expected timers to have been patched.");
            }
            if (global2.setTimeout !== patchedTimers.setTimeout) {
                global2.setTimeout = patchedTimers.setTimeout;
                global2.clearTimeout = patchedTimers.clearTimeout;
            }
            if (global2.setInterval !== patchedTimers.setInterval) {
                global2.setInterval = patchedTimers.setInterval;
                global2.clearInterval = patchedTimers.clearInterval;
            }
        };
        _FakeAsyncTestZoneSpec.prototype.lockDatePatch = function () {
            this.patchDateLocked = true;
            _FakeAsyncTestZoneSpec.patchDate();
        };
        _FakeAsyncTestZoneSpec.prototype.unlockDatePatch = function () {
            this.patchDateLocked = false;
            _FakeAsyncTestZoneSpec.resetDate();
        };
        /** @experimental */
        _FakeAsyncTestZoneSpec.prototype.setTickMode = function (mode, doTick) {
            if (mode === this.tickMode.mode) {
                return;
            }
            this.tickMode.counter++;
            this.tickMode.mode = mode;
            if (mode === "automatic") {
                this.advanceUntilModeChanges(doTick);
            }
        };
        _FakeAsyncTestZoneSpec.prototype.advanceUntilModeChanges = function (doTick) {
            var _this = this;
            _FakeAsyncTestZoneSpec.assertInZone();
            var specZone = Zone.current;
            var counter = this.tickMode.counter;
            Zone.root.run(function () { return __async(_this, null, function () {
                var _this = this;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0: return [4 /*yield*/, safeAsync(function () { return __async(_this, null, function () {
                                var _this = this;
                                return __generator(this, function (_c) {
                                    switch (_c.label) {
                                        case 0: return [4 /*yield*/, void 0];
                                        case 1:
                                            _c.sent();
                                            specZone.run(function () {
                                                _this.flushMicrotasks();
                                            });
                                            return [2 /*return*/];
                                    }
                                });
                            }); })];
                        case 1:
                            _c.sent();
                            if (this.tickMode.counter !== counter) {
                                return [2 /*return*/];
                            }
                            _c.label = 2;
                        case 2:
                            if (!true) return [3 /*break*/, 5];
                            return [4 /*yield*/, safeAsync(function () { return _this.newMacrotask(specZone); })];
                        case 3:
                            _c.sent();
                            if (this.tickMode.counter !== counter) {
                                return [2 /*return*/];
                            }
                            return [4 /*yield*/, safeAsync(function () { return specZone.run(function () {
                                    _this._scheduler.executeNextTask(doTick);
                                }); })];
                        case 4:
                            _c.sent();
                            return [3 /*break*/, 2];
                        case 5: return [2 /*return*/];
                    }
                });
            }); });
        };
        // Waits until a new macro task.
        //
        // Used with autoTick(), which is meant to act when the test is waiting, we
        // need to insert ourselves in the macro task queue.
        //
        // @return {!Promise<undefined>}
        _FakeAsyncTestZoneSpec.prototype.newMacrotask = function (specZone) {
            return __async(this, null, function () {
                var channel_1;
                var _this = this;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            if (!originalSetImmediate) return [3 /*break*/, 2];
                            return [4 /*yield*/, new Promise(function (resolve) {
                                    originalSetImmediate(resolve);
                                })];
                        case 1:
                            _c.sent();
                            return [3 /*break*/, 5];
                        case 2:
                            channel_1 = new MessageChannel();
                            return [4 /*yield*/, new Promise(function (resolve) {
                                    channel_1.port1.onmessage = resolve;
                                    channel_1.port2.postMessage(void 0);
                                })];
                        case 3:
                            _c.sent();
                            channel_1.port1.close();
                            channel_1.port2.close();
                            return [4 /*yield*/, new Promise(function (resolve) {
                                    originalTimeout(resolve);
                                })];
                        case 4:
                            _c.sent();
                            _c.label = 5;
                        case 5:
                            specZone.run(function () {
                                _this.flushMicrotasks();
                            });
                            return [2 /*return*/];
                    }
                });
            });
        };
        _FakeAsyncTestZoneSpec.prototype.tickToNext = function (steps, doTick, tickOptions) {
            if (steps === void 0) { steps = 1; }
            if (tickOptions === void 0) { tickOptions = { processNewMacroTasksSynchronously: true }; }
            if (steps <= 0) {
                return;
            }
            _FakeAsyncTestZoneSpec.assertInZone();
            this.flushMicrotasks();
            this._scheduler.tickToNext(steps, doTick, tickOptions);
            if (this._lastError !== null) {
                this._resetLastErrorAndThrow();
            }
        };
        _FakeAsyncTestZoneSpec.prototype.tick = function (millis, doTick, tickOptions) {
            if (millis === void 0) { millis = 0; }
            if (tickOptions === void 0) { tickOptions = { processNewMacroTasksSynchronously: true }; }
            _FakeAsyncTestZoneSpec.assertInZone();
            this.flushMicrotasks();
            this._scheduler.tick(millis, doTick, tickOptions);
            if (this._lastError !== null) {
                this._resetLastErrorAndThrow();
            }
        };
        _FakeAsyncTestZoneSpec.prototype.flushMicrotasks = function () {
            var _this = this;
            _FakeAsyncTestZoneSpec.assertInZone();
            var flushErrors = function () {
                if (_this._lastError !== null || _this._uncaughtPromiseErrors.length) {
                    _this._resetLastErrorAndThrow();
                }
            };
            while (this._microtasks.length > 0) {
                var microtask = this._microtasks.shift();
                microtask.func.apply(microtask.target, microtask.args);
            }
            flushErrors();
        };
        _FakeAsyncTestZoneSpec.prototype.flush = function (limit, flushPeriodic, doTick) {
            _FakeAsyncTestZoneSpec.assertInZone();
            this.flushMicrotasks();
            var elapsed = this._scheduler.flush(limit, flushPeriodic, doTick);
            if (this._lastError !== null) {
                this._resetLastErrorAndThrow();
            }
            return elapsed;
        };
        _FakeAsyncTestZoneSpec.prototype.flushOnlyPendingTimers = function (doTick) {
            _FakeAsyncTestZoneSpec.assertInZone();
            this.flushMicrotasks();
            var elapsed = this._scheduler.flushOnlyPendingTimers(doTick);
            if (this._lastError !== null) {
                this._resetLastErrorAndThrow();
            }
            return elapsed;
        };
        _FakeAsyncTestZoneSpec.prototype.removeAllTimers = function () {
            _FakeAsyncTestZoneSpec.assertInZone();
            this._scheduler.removeAll();
            this.pendingPeriodicTimers = [];
            this.pendingTimers = [];
        };
        _FakeAsyncTestZoneSpec.prototype.getTimerCount = function () {
            return this._scheduler.getTimerCount() + this._microtasks.length;
        };
        _FakeAsyncTestZoneSpec.prototype.onScheduleTask = function (delegate, current, target, task) {
            switch (task.type) {
                case "microTask":
                    var args = task.data && task.data.args;
                    var additionalArgs = void 0;
                    if (args) {
                        var callbackIndex = task.data.cbIdx;
                        if (typeof args.length === "number" && args.length > callbackIndex + 1) {
                            additionalArgs = Array.prototype.slice.call(args, callbackIndex + 1);
                        }
                    }
                    this._microtasks.push({
                        func: task.invoke,
                        args: additionalArgs,
                        target: task.data && task.data.target
                    });
                    break;
                case "macroTask":
                    switch (task.source) {
                        case "setTimeout":
                            task.data["handleId"] = this._setTimeout(task.invoke, task.data["delay"], Array.prototype.slice.call(task.data["args"], 2));
                            break;
                        case "setImmediate":
                            task.data["handleId"] = this._setTimeout(task.invoke, 0, Array.prototype.slice.call(task.data["args"], 1));
                            break;
                        case "setInterval":
                            task.data["handleId"] = this._setInterval(task.invoke, task.data["delay"], Array.prototype.slice.call(task.data["args"], 2));
                            break;
                        case "XMLHttpRequest.send":
                            if (this.tickMode.mode === "manual") {
                                throw new Error("Cannot make XHRs from within a fake async test. Request URL: " + task.data["url"]);
                            }
                            task = delegate.scheduleTask(target, task);
                            break;
                        case "requestAnimationFrame":
                        case "webkitRequestAnimationFrame":
                        case "mozRequestAnimationFrame":
                            task.data["handleId"] = this._setTimeout(task.invoke, 16, task.data["args"], this.trackPendingRequestAnimationFrame);
                            break;
                        default:
                            var macroTaskOption = this.findMacroTaskOption(task);
                            if (macroTaskOption) {
                                var args2 = task.data && task.data["args"];
                                var delay = args2 && args2.length > 1 ? args2[1] : 0;
                                var callbackArgs = macroTaskOption.callbackArgs ? macroTaskOption.callbackArgs : args2;
                                if (!!macroTaskOption.isPeriodic) {
                                    task.data["handleId"] = this._setInterval(task.invoke, delay, callbackArgs);
                                    task.data.isPeriodic = true;
                                }
                                else {
                                    task.data["handleId"] = this._setTimeout(task.invoke, delay, callbackArgs);
                                }
                                break;
                            }
                            throw new Error("Unknown macroTask scheduled in fake async test: " + task.source);
                    }
                    break;
                case "eventTask":
                    task = delegate.scheduleTask(target, task);
                    break;
            }
            return task;
        };
        _FakeAsyncTestZoneSpec.prototype.onCancelTask = function (delegate, current, target, task) {
            switch (task.source) {
                case "setTimeout":
                case "requestAnimationFrame":
                case "webkitRequestAnimationFrame":
                case "mozRequestAnimationFrame":
                    return this._clearTimeout(task.data["handleId"]);
                case "setInterval":
                    return this._clearInterval(task.data["handleId"]);
                default:
                    var macroTaskOption = this.findMacroTaskOption(task);
                    if (macroTaskOption) {
                        var handleId = task.data["handleId"];
                        return macroTaskOption.isPeriodic ? this._clearInterval(handleId) : this._clearTimeout(handleId);
                    }
                    return delegate.cancelTask(target, task);
            }
        };
        _FakeAsyncTestZoneSpec.prototype.onInvoke = function (delegate, current, target, callback, applyThis, applyArgs, source) {
            try {
                _FakeAsyncTestZoneSpec.patchDate();
                return delegate.invoke(target, callback, applyThis, applyArgs, source);
            }
            finally {
                if (!this.patchDateLocked) {
                    _FakeAsyncTestZoneSpec.resetDate();
                }
            }
        };
        _FakeAsyncTestZoneSpec.prototype.findMacroTaskOption = function (task) {
            if (!this.macroTaskOptions) {
                return null;
            }
            for (var i = 0; i < this.macroTaskOptions.length; i++) {
                var macroTaskOption = this.macroTaskOptions[i];
                if (macroTaskOption.source === task.source) {
                    return macroTaskOption;
                }
            }
            return null;
        };
        _FakeAsyncTestZoneSpec.prototype.onHandleError = function (parentZoneDelegate, currentZone, targetZone, error) {
            this._lastError = error;
            return false;
        };
        return _FakeAsyncTestZoneSpec;
    }());
    var _fakeAsyncTestZoneSpec = null;
    function getProxyZoneSpec() {
        return Zone && Zone["ProxyZoneSpec"];
    }
    var _sharedProxyZoneSpec = null;
    var _sharedProxyZone = null;
    function resetFakeAsyncZone() {
        var _a, _b;
        if (_fakeAsyncTestZoneSpec) {
            _fakeAsyncTestZoneSpec.unlockDatePatch();
        }
        _fakeAsyncTestZoneSpec = null;
        (_b = (_a = getProxyZoneSpec()) == null ? void 0 : _a.get()) == null ? void 0 : _b.resetDelegate();
        _sharedProxyZoneSpec == null ? void 0 : _sharedProxyZoneSpec.resetDelegate();
    }
    function fakeAsync(fn, options) {
        if (options === void 0) { options = {}; }
        var _c = options.flush, flush2 = _c === void 0 ? true : _c;
        var fakeAsyncFn = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            var ProxyZoneSpec2 = getProxyZoneSpec();
            if (!ProxyZoneSpec2) {
                throwProxyZoneError();
            }
            var proxyZoneSpec = ProxyZoneSpec2.assertPresent();
            if (Zone.current.get("FakeAsyncTestZoneSpec")) {
                throw new Error("fakeAsync() calls can not be nested");
            }
            try {
                if (!_fakeAsyncTestZoneSpec) {
                    var FakeAsyncTestZoneSpec2 = Zone && Zone["FakeAsyncTestZoneSpec"];
                    if (proxyZoneSpec.getDelegate() instanceof FakeAsyncTestZoneSpec2) {
                        throw new Error("fakeAsync() calls can not be nested");
                    }
                    _fakeAsyncTestZoneSpec = new FakeAsyncTestZoneSpec2();
                }
                var res = void 0;
                var lastProxyZoneSpec = proxyZoneSpec.getDelegate();
                proxyZoneSpec.setDelegate(_fakeAsyncTestZoneSpec);
                _fakeAsyncTestZoneSpec.lockDatePatch();
                try {
                    res = fn.apply(this, args);
                    if (flush2) {
                        _fakeAsyncTestZoneSpec.flush(20, true);
                    }
                    else {
                        flushMicrotasks();
                    }
                }
                finally {
                    proxyZoneSpec.setDelegate(lastProxyZoneSpec);
                }
                if (!flush2) {
                    if (_fakeAsyncTestZoneSpec.pendingPeriodicTimers.length > 0) {
                        throw new Error("".concat(_fakeAsyncTestZoneSpec.pendingPeriodicTimers.length, " periodic timer(s) still in the queue."));
                    }
                    if (_fakeAsyncTestZoneSpec.pendingTimers.length > 0) {
                        throw new Error("".concat(_fakeAsyncTestZoneSpec.pendingTimers.length, " timer(s) still in the queue."));
                    }
                }
                return res;
            }
            finally {
                resetFakeAsyncZone();
            }
        };
        fakeAsyncFn.isFakeAsync = true;
        return fakeAsyncFn;
    }
    function _getFakeAsyncZoneSpec() {
        if (_fakeAsyncTestZoneSpec == null) {
            _fakeAsyncTestZoneSpec = Zone.current.get("FakeAsyncTestZoneSpec");
            if (_fakeAsyncTestZoneSpec == null) {
                throw new Error("The code should be running in the fakeAsync zone to call this function");
            }
        }
        return _fakeAsyncTestZoneSpec;
    }
    function tick(millis, ignoreNestedTimeout) {
        if (millis === void 0) { millis = 0; }
        if (ignoreNestedTimeout === void 0) { ignoreNestedTimeout = false; }
        _getFakeAsyncZoneSpec().tick(millis, null, ignoreNestedTimeout);
    }
    function flush(maxTurns) {
        return _getFakeAsyncZoneSpec().flush(maxTurns);
    }
    function discardPeriodicTasks() {
        var zoneSpec = _getFakeAsyncZoneSpec();
        var pendingTimers = zoneSpec.pendingPeriodicTimers;
        zoneSpec.pendingPeriodicTimers.length = 0;
    }
    function withProxyZone(fn) {
        var autoProxyFn = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            var proxyZoneSpec = getProxyZoneSpec();
            if (proxyZoneSpec === void 0) {
                throw new Error("ProxyZoneSpec is needed for the withProxyZone() test helper but could not be found. Make sure that your environment includes zone-testing.js");
            }
            var proxyZone = proxyZoneSpec.get() !== void 0 ? Zone.current : getOrCreateRootProxy();
            return proxyZone.run(fn, this, args);
        };
        return autoProxyFn;
    }
    function getOrCreateRootProxy() {
        var ProxyZoneSpec2 = getProxyZoneSpec();
        if (ProxyZoneSpec2 === void 0) {
            throw new Error("ProxyZoneSpec is needed for withProxyZone but could not be found. Make sure that your environment includes zone-testing.js");
        }
        if (_sharedProxyZoneSpec === null) {
            _sharedProxyZoneSpec = new ProxyZoneSpec2();
        }
        _sharedProxyZone = Zone.root.fork(_sharedProxyZoneSpec);
        return _sharedProxyZone;
    }
    function flushMicrotasks() {
        _getFakeAsyncZoneSpec().flushMicrotasks();
    }
    function patchFakeAsyncTest(Zone2) {
        Zone2["FakeAsyncTestZoneSpec"] = FakeAsyncTestZoneSpec;
        Zone2.__load_patch("fakeasync", function (global3, Zone3, api) {
            Zone3[api.symbol("fakeAsyncTest")] = {
                resetFakeAsyncZone: resetFakeAsyncZone,
                flushMicrotasks: flushMicrotasks,
                discardPeriodicTasks: discardPeriodicTasks,
                tick: tick,
                flush: flush,
                fakeAsync: fakeAsync,
                withProxyZone: withProxyZone
            };
        }, true);
        patchedTimers = {
            setTimeout: global2.setTimeout,
            setInterval: global2.setInterval,
            clearTimeout: global2.clearTimeout,
            clearInterval: global2.clearInterval,
            nativeSetTimeout: global2[Zone2.__symbol__("setTimeout")],
            nativeClearTimeout: global2[Zone2.__symbol__("clearTimeout")]
        };
        Scheduler.nextId = Scheduler.getNextId();
    }
    function safeAsync(fn) {
        return __async(this, null, function () {
            var e_1;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, fn()];
                    case 1: return [2 /*return*/, _c.sent()];
                    case 2:
                        e_1 = _c.sent();
                        hostReportError(e_1);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    }
    function hostReportError(e) {
        Zone.root.run(function () {
            originalTimeout(function () {
                throw e;
            });
        });
    }
    // packages/zone.js/lib/zone-spec/long-stack-trace.js
    function patchLongStackTrace(Zone2) {
        var NEWLINE = "\n";
        var IGNORE_FRAMES = {};
        var creationTrace = "__creationTrace__";
        var ERROR_TAG = "STACKTRACE TRACKING";
        var SEP_TAG = "__SEP_TAG__";
        var sepTemplate = SEP_TAG + "@[native]";
        var LongStackTrace = /** @class */ (function () {
            function LongStackTrace() {
                __publicField(this, "error", getStacktrace());
                __publicField(this, "timestamp", /* @__PURE__ */ new Date());
            }
            return LongStackTrace;
        }());
        function getStacktraceWithUncaughtError() {
            return new Error(ERROR_TAG);
        }
        function getStacktraceWithCaughtError() {
            try {
                throw getStacktraceWithUncaughtError();
            }
            catch (err) {
                return err;
            }
        }
        var error = getStacktraceWithUncaughtError();
        var caughtError = getStacktraceWithCaughtError();
        var getStacktrace = error.stack ? getStacktraceWithUncaughtError : caughtError.stack ? getStacktraceWithCaughtError : getStacktraceWithUncaughtError;
        function getFrames(error2) {
            return error2.stack ? error2.stack.split(NEWLINE) : [];
        }
        function addErrorStack(lines, error2) {
            var trace = getFrames(error2);
            for (var i = 0; i < trace.length; i++) {
                var frame = trace[i];
                if (!IGNORE_FRAMES.hasOwnProperty(frame)) {
                    lines.push(trace[i]);
                }
            }
        }
        function renderLongStackTrace(frames, stack) {
            var longTrace = [stack ? stack.trim() : ""];
            if (frames) {
                var timestamp = ( /* @__PURE__ */new Date()).getTime();
                for (var i = 0; i < frames.length; i++) {
                    var traceFrames = frames[i];
                    var lastTime = traceFrames.timestamp;
                    var separator = "____________________Elapsed ".concat(timestamp - lastTime.getTime(), " ms; At: ").concat(lastTime);
                    separator = separator.replace(/[^\w\d]/g, "_");
                    longTrace.push(sepTemplate.replace(SEP_TAG, separator));
                    addErrorStack(longTrace, traceFrames.error);
                    timestamp = lastTime.getTime();
                }
            }
            return longTrace.join(NEWLINE);
        }
        function stackTracesEnabled() {
            return Error.stackTraceLimit > 0;
        }
        Zone2["longStackTraceZoneSpec"] = {
            name: "long-stack-trace",
            longStackTraceLimit: 10,
            // Max number of task to keep the stack trace for.
            // add a getLongStackTrace method in spec to
            // handle handled reject promise error.
            getLongStackTrace: function (error2) {
                if (!error2) {
                    return void 0;
                }
                var trace = error2[Zone2.__symbol__("currentTaskTrace")];
                if (!trace) {
                    return error2.stack;
                }
                return renderLongStackTrace(trace, error2.stack);
            },
            onScheduleTask: function (parentZoneDelegate, currentZone, targetZone, task) {
                if (stackTracesEnabled()) {
                    var currentTask = Zone2.currentTask;
                    var trace = currentTask && currentTask.data && currentTask.data[creationTrace] || [];
                    trace = [new LongStackTrace()].concat(trace);
                    if (trace.length > this.longStackTraceLimit) {
                        trace.length = this.longStackTraceLimit;
                    }
                    if (!task.data)
                        task.data = {};
                    if (task.type === "eventTask") {
                        task.data = __spreadValues({}, task.data);
                    }
                    task.data[creationTrace] = trace;
                }
                return parentZoneDelegate.scheduleTask(targetZone, task);
            },
            onHandleError: function (parentZoneDelegate, currentZone, targetZone, error2) {
                if (stackTracesEnabled()) {
                    var parentTask = Zone2.currentTask || error2.task;
                    if (error2 instanceof Error && parentTask) {
                        var longStack = renderLongStackTrace(parentTask.data && parentTask.data[creationTrace], error2.stack);
                        try {
                            error2.stack = error2.longStack = longStack;
                        }
                        catch (err) {
                        }
                    }
                }
                return parentZoneDelegate.handleError(targetZone, error2);
            }
        };
        function captureStackTraces(stackTraces, count) {
            if (count > 0) {
                stackTraces.push(getFrames(new LongStackTrace().error));
                captureStackTraces(stackTraces, count - 1);
            }
        }
        function computeIgnoreFrames() {
            if (!stackTracesEnabled()) {
                return;
            }
            var frames = [];
            captureStackTraces(frames, 2);
            var frames1 = frames[0];
            var frames2 = frames[1];
            for (var i = 0; i < frames1.length; i++) {
                var frame1 = frames1[i];
                if (frame1.indexOf(ERROR_TAG) == -1) {
                    var match = frame1.match(/^\s*at\s+/);
                    if (match) {
                        sepTemplate = match[0] + SEP_TAG + " (http://localhost)";
                        break;
                    }
                }
            }
            for (var i = 0; i < frames1.length; i++) {
                var frame1 = frames1[i];
                var frame2 = frames2[i];
                if (frame1 === frame2) {
                    IGNORE_FRAMES[frame1] = true;
                }
                else {
                    break;
                }
            }
        }
        computeIgnoreFrames();
    }
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
    // packages/zone.js/lib/testing/promise-testing.js
    function patchPromiseTesting(Zone2) {
        Zone2.__load_patch("promisefortest", function (global3, Zone3, api) {
            var symbolState = api.symbol("state");
            var UNRESOLVED = null;
            var symbolParentUnresolved = api.symbol("parentUnresolved");
            Promise[api.symbol("patchPromiseForTest")] = function patchPromiseForTest() {
                var oriThen = Promise[Zone3.__symbol__("ZonePromiseThen")];
                if (oriThen) {
                    return;
                }
                oriThen = Promise[Zone3.__symbol__("ZonePromiseThen")] = Promise.prototype.then;
                Promise.prototype.then = function () {
                    var chained = oriThen.apply(this, arguments);
                    if (this[symbolState] === UNRESOLVED) {
                        var asyncTestZoneSpec = Zone3.current.get("AsyncTestZoneSpec");
                        if (asyncTestZoneSpec) {
                            asyncTestZoneSpec.unresolvedChainedPromiseCount++;
                            chained[symbolParentUnresolved] = true;
                        }
                    }
                    return chained;
                };
            };
            Promise[api.symbol("unPatchPromiseForTest")] = function unpatchPromiseForTest() {
                var oriThen = Promise[Zone3.__symbol__("ZonePromiseThen")];
                if (oriThen) {
                    Promise.prototype.then = oriThen;
                    Promise[Zone3.__symbol__("ZonePromiseThen")] = void 0;
                }
            };
        });
    }
    // packages/zone.js/lib/testing/zone-testing.js
    function rollupTesting(Zone2) {
        patchLongStackTrace(Zone2);
        patchProxyZoneSpec(Zone2);
        patchSyncTest(Zone2);
        patchJasmine(Zone2);
        patchJest(Zone2);
        patchMocha(Zone2);
        patchAsyncTest(Zone2);
        patchFakeAsyncTest(Zone2);
        patchPromiseTesting(Zone2);
    }
    // packages/zone.js/lib/testing/rollup-zone-testing.js
    rollupTesting(Zone);
    if (__exports != exports)
        module.exports = exports;
    return module.exports;
}));
