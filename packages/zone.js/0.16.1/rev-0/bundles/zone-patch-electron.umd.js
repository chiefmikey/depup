'use strict';
/**
 * @license Angular
 * (c) 2010-2026 Google LLC. https://angular.dev/
 * License: MIT
 */ (function (g, f) { if (typeof define == "function" && define.amd) {
    define(["electron", "@electron/remote/dist/src/renderer/callbacks-registry"], function (_d_0, _d_1) { var d = { "electron": _d_0, "@electron/remote/dist/src/renderer/callbacks-registry": _d_1 }, r = function (m) { if (m in d)
        return d[m]; if (typeof require == "function")
        return require(m); throw new Error("Cannot find module '" + m + "'"); }; return f(r); });
}
else if (typeof exports == "object" && typeof module < "u") {
    module.exports = f(require);
}
else {
    var gN = { "electron": "electron", "@electron/remote/dist/src/renderer/callbacks-registry": "@electron/remote/dist/src/renderer/callbacks-registry" }, gReq = function (r) { var mod = r in gN ? g[gN[r]] : g[r]; return mod; };
    var m = f(gReq);
    for (var i in m)
        g[i] = m[i];
} }(typeof globalThis < "u" ? globalThis : typeof self < "u" ? self : this, function (require) {
    var exports = {};
    var __exports = exports;
    var module = { exports: exports };
    // packages/zone.js/lib/extra/electron.js
    function patchElectron(Zone2) {
        Zone2.__load_patch("electron", function (global, Zone3, api) {
            function patchArguments(target, name, source) {
                return api.patchMethod(target, name, function (delegate) { return function (self, args) {
                    return delegate && delegate.apply(self, api.bindArguments(args, source));
                }; });
            }
            var _a = require("electron"), desktopCapturer = _a.desktopCapturer, shell = _a.shell, CallbacksRegistry = _a.CallbacksRegistry, ipcRenderer = _a.ipcRenderer;
            if (!CallbacksRegistry) {
                try {
                    CallbacksRegistry = require("@electron/remote/dist/src/renderer/callbacks-registry").CallbacksRegistry;
                }
                catch (err) {
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
    if (__exports != exports)
        module.exports = exports;
    return module.exports;
}));
