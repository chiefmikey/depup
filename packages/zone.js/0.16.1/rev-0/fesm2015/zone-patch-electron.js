'use strict';
/**
 * @license Angular
 * (c) 2010-2026 Google LLC. https://angular.dev/
 * License: MIT
 */
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined")
    return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});

// packages/zone.js/lib/extra/electron.js
function patchElectron(Zone2) {
  Zone2.__load_patch("electron", (global, Zone3, api) => {
    function patchArguments(target, name, source) {
      return api.patchMethod(target, name, (delegate) => (self, args) => {
        return delegate && delegate.apply(self, api.bindArguments(args, source));
      });
    }
    let { desktopCapturer, shell, CallbacksRegistry, ipcRenderer } = __require("electron");
    if (!CallbacksRegistry) {
      try {
        CallbacksRegistry = __require("@electron/remote/dist/src/renderer/callbacks-registry").CallbacksRegistry;
      } catch (err) {
      }
    }
    if (desktopCapturer) {
      patchArguments(desktopCapturer, "getSources", "electron.desktopCapturer.getSources");
    }
    if (shell) {
      patchArguments(shell, "openExternal", "electron.shell.openExternal");
    }
    if (!CallbacksRegistry) {
      if (ipcRenderer) {
        patchArguments(ipcRenderer, "on", "ipcRenderer.on");
      }
      return;
    }
    patchArguments(CallbacksRegistry.prototype, "add", "CallbackRegistry.add");
  });
}

// packages/zone.js/lib/extra/rollup-electron.js
patchElectron(Zone);
