'use strict';
/**
 * @license Angular
 * (c) 2010-2026 Google LLC. https://angular.dev/
 * License: MIT
 */

// packages/zone.js/lib/testing/promise-testing.js
function patchPromiseTesting(Zone2) {
  Zone2.__load_patch("promisefortest", (global, Zone3, api) => {
    const symbolState = api.symbol("state");
    const UNRESOLVED = null;
    const symbolParentUnresolved = api.symbol("parentUnresolved");
    Promise[api.symbol("patchPromiseForTest")] = function patchPromiseForTest() {
      let oriThen = Promise[Zone3.__symbol__("ZonePromiseThen")];
      if (oriThen) {
        return;
      }
      oriThen = Promise[Zone3.__symbol__("ZonePromiseThen")] = Promise.prototype.then;
      Promise.prototype.then = function() {
        const chained = oriThen.apply(this, arguments);
        if (this[symbolState] === UNRESOLVED) {
          const asyncTestZoneSpec = Zone3.current.get("AsyncTestZoneSpec");
          if (asyncTestZoneSpec) {
            asyncTestZoneSpec.unresolvedChainedPromiseCount++;
            chained[symbolParentUnresolved] = true;
          }
        }
        return chained;
      };
    };
    Promise[api.symbol("unPatchPromiseForTest")] = function unpatchPromiseForTest() {
      const oriThen = Promise[Zone3.__symbol__("ZonePromiseThen")];
      if (oriThen) {
        Promise.prototype.then = oriThen;
        Promise[Zone3.__symbol__("ZonePromiseThen")] = void 0;
      }
    };
  });
}

// packages/zone.js/lib/testing/rollup-promise-testing.js
patchPromiseTesting(Zone);
