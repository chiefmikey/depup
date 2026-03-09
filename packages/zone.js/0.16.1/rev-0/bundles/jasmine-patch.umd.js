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
    // packages/zone.js/lib/jasmine/jasmine.js
    function patchJasmine(Zone2) {
        Zone2.__load_patch("jasmine", function (global, Zone3, api) {
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
            var ProxyZoneSpec = Zone3["ProxyZoneSpec"];
            if (!SyncTestZoneSpec)
                throw new Error("Missing: SyncTestZoneSpec");
            if (!ProxyZoneSpec)
                throw new Error("Missing: ProxyZoneSpec");
            var ambientZone = Zone3.current;
            var symbol = Zone3.__symbol__;
            var disablePatchingJasmineClock = global[symbol("fakeAsyncDisablePatchingClock")] === true;
            var enableAutoFakeAsyncWhenClockPatched = !disablePatchingJasmineClock && (global[symbol("fakeAsyncPatchLock")] === true || global[symbol("fakeAsyncAutoFakeAsyncWhenClockPatched")] === true);
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
                                    var FakeAsyncTestZoneSpec = Zone3["FakeAsyncTestZoneSpec"];
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
                    var nativeSetTimeout = global[Zone3.__symbol__("setTimeout")];
                    var nativeClearTimeout = global[Zone3.__symbol__("clearTimeout")];
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
                    this.testProxyZoneSpec = new ProxyZoneSpec();
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
    // packages/zone.js/lib/jasmine/rollup-jasmine.js
    patchJasmine(Zone);
    if (__exports != exports)
        module.exports = exports;
    return module.exports;
}));
