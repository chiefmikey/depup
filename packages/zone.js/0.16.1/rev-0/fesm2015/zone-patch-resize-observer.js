'use strict';
/**
 * @license Angular
 * (c) 2010-2026 Google LLC. https://angular.dev/
 * License: MIT
 */

// packages/zone.js/lib/browser/webapis-resize-observer.js
function patchResizeObserver(Zone2) {
  Zone2.__load_patch("ResizeObserver", (global, Zone3, api) => {
    const ResizeObserver = global["ResizeObserver"];
    if (!ResizeObserver) {
      return;
    }
    const resizeObserverSymbol = api.symbol("ResizeObserver");
    api.patchMethod(global, "ResizeObserver", (delegate) => (self, args) => {
      const callback = args.length > 0 ? args[0] : null;
      if (callback) {
        args[0] = function(entries, observer) {
          const zones = {};
          const currZone = Zone3.current;
          for (let entry of entries) {
            let zone = entry.target[resizeObserverSymbol];
            if (!zone) {
              zone = currZone;
            }
            let zoneEntriesInfo = zones[zone.name];
            if (!zoneEntriesInfo) {
              zones[zone.name] = zoneEntriesInfo = { entries: [], zone };
            }
            zoneEntriesInfo.entries.push(entry);
          }
          Object.keys(zones).forEach((zoneName) => {
            const zoneEntriesInfo = zones[zoneName];
            if (zoneEntriesInfo.zone !== Zone3.current) {
              zoneEntriesInfo.zone.run(callback, this, [zoneEntriesInfo.entries, observer], "ResizeObserver");
            } else {
              callback.call(this, zoneEntriesInfo.entries, observer);
            }
          });
        };
      }
      return args.length > 0 ? new ResizeObserver(args[0]) : new ResizeObserver();
    });
    api.patchMethod(ResizeObserver.prototype, "observe", (delegate) => (self, args) => {
      const target = args.length > 0 ? args[0] : null;
      if (!target) {
        return delegate.apply(self, args);
      }
      let targets = self[resizeObserverSymbol];
      if (!targets) {
        targets = self[resizeObserverSymbol] = [];
      }
      targets.push(target);
      target[resizeObserverSymbol] = Zone3.current;
      return delegate.apply(self, args);
    });
    api.patchMethod(ResizeObserver.prototype, "unobserve", (delegate) => (self, args) => {
      const target = args.length > 0 ? args[0] : null;
      if (!target) {
        return delegate.apply(self, args);
      }
      let targets = self[resizeObserverSymbol];
      if (targets) {
        for (let i = 0; i < targets.length; i++) {
          if (targets[i] === target) {
            targets.splice(i, 1);
            break;
          }
        }
      }
      target[resizeObserverSymbol] = void 0;
      return delegate.apply(self, args);
    });
    api.patchMethod(ResizeObserver.prototype, "disconnect", (delegate) => (self, args) => {
      const targets = self[resizeObserverSymbol];
      if (targets) {
        targets.forEach((target) => {
          target[resizeObserverSymbol] = void 0;
        });
        self[resizeObserverSymbol] = void 0;
      }
      return delegate.apply(self, args);
    });
  });
}

// packages/zone.js/lib/browser/rollup-webapis-resize-observer.js
patchResizeObserver(Zone);
