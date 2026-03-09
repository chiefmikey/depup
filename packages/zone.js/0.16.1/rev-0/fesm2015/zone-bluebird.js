'use strict';
/**
 * @license Angular
 * (c) 2010-2026 Google LLC. https://angular.dev/
 * License: MIT
 */

// packages/zone.js/lib/extra/bluebird.js
function patchBluebird(Zone2) {
  Zone2.__load_patch("bluebird", (global, Zone3, api) => {
    const BLUEBIRD = "bluebird";
    Zone3[Zone3.__symbol__(BLUEBIRD)] = function patchBluebird2(Bluebird) {
      const bluebirdApis = ["then", "spread", "finally"];
      bluebirdApis.forEach((bapi) => {
        api.patchMethod(Bluebird.prototype, bapi, (delegate) => (self, args) => {
          const zone = Zone3.current;
          for (let i = 0; i < args.length; i++) {
            const func = args[i];
            if (typeof func === "function") {
              args[i] = function() {
                const argSelf = this;
                const argArgs = arguments;
                return new Bluebird((res, rej) => {
                  zone.scheduleMicroTask("Promise.then", () => {
                    try {
                      res(func.apply(argSelf, argArgs));
                    } catch (error) {
                      rej(error);
                    }
                  });
                });
              };
            }
          }
          return delegate.apply(self, args);
        });
      });
      if (typeof window !== "undefined") {
        window.addEventListener("unhandledrejection", function(event) {
          const error = event.detail && event.detail.reason;
          if (error && error.isHandledByZone) {
            event.preventDefault();
            if (typeof event.stopImmediatePropagation === "function") {
              event.stopImmediatePropagation();
            }
          }
        });
      } else if (typeof process !== "undefined") {
        process.on("unhandledRejection", (reason, p) => {
          if (reason && reason.isHandledByZone) {
            const listeners = process.listeners("unhandledRejection");
            if (listeners) {
              process.removeAllListeners("unhandledRejection");
              process.nextTick(() => {
                listeners.forEach((listener) => process.on("unhandledRejection", listener));
              });
            }
          }
        });
      }
      Bluebird.onPossiblyUnhandledRejection(function(e, promise) {
        try {
          Zone3.current.runGuarded(() => {
            e.isHandledByZone = true;
            throw e;
          });
        } catch (err) {
          err.isHandledByZone = false;
          api.onUnhandledError(err);
        }
      });
      global.Promise = Bluebird;
    };
  });
}

// packages/zone.js/lib/extra/rollup-bluebird.js
patchBluebird(Zone);
