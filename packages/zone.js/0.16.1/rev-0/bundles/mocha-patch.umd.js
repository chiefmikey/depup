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
    // packages/zone.js/lib/mocha/mocha.js
    function patchMocha(Zone2) {
        Zone2.__load_patch("mocha", function (global, Zone3) {
            var Mocha = global.Mocha;
            if (typeof Mocha === "undefined") {
                return;
            }
            if (typeof Zone3 === "undefined") {
                throw new Error("Missing Zone.js");
            }
            var ProxyZoneSpec = Zone3["ProxyZoneSpec"];
            var SyncTestZoneSpec = Zone3["SyncTestZoneSpec"];
            if (!ProxyZoneSpec) {
                throw new Error("Missing ProxyZoneSpec");
            }
            if (Mocha["__zone_patch__"]) {
                throw new Error('"Mocha" has already been patched with "Zone".');
            }
            Mocha["__zone_patch__"] = true;
            var rootZone = Zone3.current;
            var syncZone = rootZone.fork(new SyncTestZoneSpec("Mocha.describe"));
            var testZone = null;
            var suiteZone = rootZone.fork(new ProxyZoneSpec());
            var mochaOriginal = {
                after: global.after,
                afterEach: global.afterEach,
                before: global.before,
                beforeEach: global.beforeEach,
                describe: global.describe,
                it: global.it
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
            global.describe = global.suite = function () {
                return mochaOriginal.describe.apply(this, wrapDescribeInZone(arguments));
            };
            global.xdescribe = global.suite.skip = global.describe.skip = function () {
                return mochaOriginal.describe.skip.apply(this, wrapDescribeInZone(arguments));
            };
            global.describe.only = global.suite.only = function () {
                return mochaOriginal.describe.only.apply(this, wrapDescribeInZone(arguments));
            };
            global.it = global.specify = global.test = function () {
                return mochaOriginal.it.apply(this, wrapTestInZone(arguments));
            };
            global.xit = global.xspecify = global.it.skip = function () {
                return mochaOriginal.it.skip.apply(this, wrapTestInZone(arguments));
            };
            global.it.only = global.test.only = function () {
                return mochaOriginal.it.only.apply(this, wrapTestInZone(arguments));
            };
            global.after = global.suiteTeardown = function () {
                return mochaOriginal.after.apply(this, wrapSuiteInZone(arguments));
            };
            global.afterEach = global.teardown = function () {
                return mochaOriginal.afterEach.apply(this, wrapTestInZone(arguments));
            };
            global.before = global.suiteSetup = function () {
                return mochaOriginal.before.apply(this, wrapSuiteInZone(arguments));
            };
            global.beforeEach = global.setup = function () {
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
                        testZone = rootZone.fork(new ProxyZoneSpec());
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
    // packages/zone.js/lib/mocha/rollup-mocha.js
    patchMocha(Zone);
    if (__exports != exports)
        module.exports = exports;
    return module.exports;
}));
