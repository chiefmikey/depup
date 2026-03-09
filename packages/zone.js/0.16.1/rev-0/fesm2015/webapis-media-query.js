'use strict';
/**
 * @license Angular
 * (c) 2010-2026 Google LLC. https://angular.dev/
 * License: MIT
 */

// packages/zone.js/lib/browser/webapis-media-query.js
function patchMediaQuery(Zone2) {
  Zone2.__load_patch("mediaQuery", (global, Zone3, api) => {
    function patchAddListener(proto) {
      api.patchMethod(proto, "addListener", (delegate) => (self, args) => {
        const callback = args.length > 0 ? args[0] : null;
        if (typeof callback === "function") {
          const wrapperedCallback = Zone3.current.wrap(callback, "MediaQuery");
          callback[api.symbol("mediaQueryCallback")] = wrapperedCallback;
          return delegate.call(self, wrapperedCallback);
        } else {
          return delegate.apply(self, args);
        }
      });
    }
    function patchRemoveListener(proto) {
      api.patchMethod(proto, "removeListener", (delegate) => (self, args) => {
        const callback = args.length > 0 ? args[0] : null;
        if (typeof callback === "function") {
          const wrapperedCallback = callback[api.symbol("mediaQueryCallback")];
          if (wrapperedCallback) {
            return delegate.call(self, wrapperedCallback);
          } else {
            return delegate.apply(self, args);
          }
        } else {
          return delegate.apply(self, args);
        }
      });
    }
    if (global["MediaQueryList"]) {
      const proto = global["MediaQueryList"].prototype;
      patchAddListener(proto);
      patchRemoveListener(proto);
    } else if (global["matchMedia"]) {
      api.patchMethod(global, "matchMedia", (delegate) => (self, args) => {
        const mql = delegate.apply(self, args);
        if (mql) {
          const proto = Object.getPrototypeOf(mql);
          if (proto && proto["addListener"]) {
            patchAddListener(proto);
            patchRemoveListener(proto);
            patchAddListener(mql);
            patchRemoveListener(mql);
          } else if (mql["addListener"]) {
            patchAddListener(mql);
            patchRemoveListener(mql);
          }
        }
        return mql;
      });
    }
  });
}

// packages/zone.js/lib/browser/rollup-webapis-media-query.js
patchMediaQuery(Zone);
