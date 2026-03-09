'use strict';
/**
 * @license Angular
 * (c) 2010-2026 Google LLC. https://angular.dev/
 * License: MIT
 */

// packages/zone.js/lib/mocha/mocha.js
function patchMocha(Zone2) {
  Zone2.__load_patch("mocha", (global, Zone3) => {
    const Mocha = global.Mocha;
    if (typeof Mocha === "undefined") {
      return;
    }
    if (typeof Zone3 === "undefined") {
      throw new Error("Missing Zone.js");
    }
    const ProxyZoneSpec = Zone3["ProxyZoneSpec"];
    const SyncTestZoneSpec = Zone3["SyncTestZoneSpec"];
    if (!ProxyZoneSpec) {
      throw new Error("Missing ProxyZoneSpec");
    }
    if (Mocha["__zone_patch__"]) {
      throw new Error('"Mocha" has already been patched with "Zone".');
    }
    Mocha["__zone_patch__"] = true;
    const rootZone = Zone3.current;
    const syncZone = rootZone.fork(new SyncTestZoneSpec("Mocha.describe"));
    let testZone = null;
    const suiteZone = rootZone.fork(new ProxyZoneSpec());
    const mochaOriginal = {
      after: global.after,
      afterEach: global.afterEach,
      before: global.before,
      beforeEach: global.beforeEach,
      describe: global.describe,
      it: global.it
    };
    function modifyArguments(args, syncTest, asyncTest) {
      for (let i = 0; i < args.length; i++) {
        let arg = args[i];
        if (typeof arg === "function") {
          args[i] = arg.length === 0 ? syncTest(arg) : asyncTest(arg);
          args[i].toString = function() {
            return arg.toString();
          };
        }
      }
      return args;
    }
    function wrapDescribeInZone(args) {
      const syncTest = function(fn) {
        return function() {
          return syncZone.run(fn, this, arguments);
        };
      };
      return modifyArguments(args, syncTest);
    }
    function wrapTestInZone(args) {
      const asyncTest = function(fn) {
        return function(done) {
          return testZone.run(fn, this, [done]);
        };
      };
      const syncTest = function(fn) {
        return function() {
          return testZone.run(fn, this);
        };
      };
      return modifyArguments(args, syncTest, asyncTest);
    }
    function wrapSuiteInZone(args) {
      const asyncTest = function(fn) {
        return function(done) {
          return suiteZone.run(fn, this, [done]);
        };
      };
      const syncTest = function(fn) {
        return function() {
          return suiteZone.run(fn, this);
        };
      };
      return modifyArguments(args, syncTest, asyncTest);
    }
    global.describe = global.suite = function() {
      return mochaOriginal.describe.apply(this, wrapDescribeInZone(arguments));
    };
    global.xdescribe = global.suite.skip = global.describe.skip = function() {
      return mochaOriginal.describe.skip.apply(this, wrapDescribeInZone(arguments));
    };
    global.describe.only = global.suite.only = function() {
      return mochaOriginal.describe.only.apply(this, wrapDescribeInZone(arguments));
    };
    global.it = global.specify = global.test = function() {
      return mochaOriginal.it.apply(this, wrapTestInZone(arguments));
    };
    global.xit = global.xspecify = global.it.skip = function() {
      return mochaOriginal.it.skip.apply(this, wrapTestInZone(arguments));
    };
    global.it.only = global.test.only = function() {
      return mochaOriginal.it.only.apply(this, wrapTestInZone(arguments));
    };
    global.after = global.suiteTeardown = function() {
      return mochaOriginal.after.apply(this, wrapSuiteInZone(arguments));
    };
    global.afterEach = global.teardown = function() {
      return mochaOriginal.afterEach.apply(this, wrapTestInZone(arguments));
    };
    global.before = global.suiteSetup = function() {
      return mochaOriginal.before.apply(this, wrapSuiteInZone(arguments));
    };
    global.beforeEach = global.setup = function() {
      return mochaOriginal.beforeEach.apply(this, wrapTestInZone(arguments));
    };
    ((originalRunTest, originalRun) => {
      Mocha.Runner.prototype.runTest = function(fn) {
        Zone3.current.scheduleMicroTask("mocha.forceTask", () => {
          originalRunTest.call(this, fn);
        });
      };
      Mocha.Runner.prototype.run = function(fn) {
        this.on("test", (e) => {
          testZone = rootZone.fork(new ProxyZoneSpec());
        });
        this.on("fail", (test, err) => {
          const proxyZoneSpec = testZone && testZone.get("ProxyZoneSpec");
          if (proxyZoneSpec && err) {
            try {
              err.message += proxyZoneSpec.getAndClearPendingTasksInfo();
            } catch (error) {
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
