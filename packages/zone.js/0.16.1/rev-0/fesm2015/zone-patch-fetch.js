'use strict';
/**
 * @license Angular
 * (c) 2010-2026 Google LLC. https://angular.dev/
 * License: MIT
 */

// packages/zone.js/lib/common/fetch.js
function patchFetch(Zone2) {
  Zone2.__load_patch("fetch", (global, Zone3, api) => {
    let fetch = global["fetch"];
    if (typeof fetch !== "function") {
      return;
    }
    const originalFetch = global[api.symbol("fetch")];
    if (originalFetch) {
      fetch = originalFetch;
    }
    const ZoneAwarePromise = global.Promise;
    const symbolThenPatched = api.symbol("thenPatched");
    const fetchTaskScheduling = api.symbol("fetchTaskScheduling");
    const OriginalResponse = global.Response;
    const placeholder = function() {
    };
    const createFetchTask = (source, data, originalImpl, self, args, ac) => new Promise((resolve, reject) => {
      const task = Zone3.current.scheduleMacroTask(source, placeholder, data, () => {
        let implPromise;
        let zone = Zone3.current;
        try {
          zone[fetchTaskScheduling] = true;
          implPromise = originalImpl.apply(self, args);
        } catch (error) {
          reject(error);
          return;
        } finally {
          zone[fetchTaskScheduling] = false;
        }
        if (!(implPromise instanceof ZoneAwarePromise)) {
          let ctor = implPromise.constructor;
          if (!ctor[symbolThenPatched]) {
            api.patchThen(ctor);
          }
        }
        implPromise.then((resource) => {
          if (task.state !== "notScheduled") {
            task.invoke();
          }
          resolve(resource);
        }, (error) => {
          if (task.state !== "notScheduled") {
            task.invoke();
          }
          reject(error);
        });
      }, () => {
        ac == null ? void 0 : ac.abort();
      });
    });
    global["fetch"] = function() {
      const args = Array.prototype.slice.call(arguments);
      const options = args.length > 1 ? args[1] : {};
      const signal = options == null ? void 0 : options.signal;
      const ac = new AbortController();
      const fetchSignal = ac.signal;
      options.signal = fetchSignal;
      args[1] = options;
      let onAbort;
      if (signal) {
        const nativeAddEventListener = signal[Zone3.__symbol__("addEventListener")] || signal.addEventListener;
        onAbort = () => ac.abort();
        nativeAddEventListener.call(signal, "abort", onAbort, { once: true });
      }
      return createFetchTask("fetch", { fetchArgs: args }, fetch, this, args, ac).finally(() => {
        signal == null ? void 0 : signal.removeEventListener("abort", onAbort);
      });
    };
    if (OriginalResponse == null ? void 0 : OriginalResponse.prototype) {
      ["arrayBuffer", "blob", "formData", "json", "text"].filter((method) => typeof OriginalResponse.prototype[method] === "function").forEach((method) => {
        api.patchMethod(OriginalResponse.prototype, method, (delegate) => (self, args) => createFetchTask(`Response.${method}`, void 0, delegate, self, args, void 0));
      });
    }
  });
}

// packages/zone.js/lib/common/rollup-fetch.js
patchFetch(Zone);
