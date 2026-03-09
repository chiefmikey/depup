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
    // packages/zone.js/lib/browser/message-port.js
    function patchMessagePort(Zone2) {
        Zone2.__load_patch("MessagePort", function (global, Zone3, api) {
            var MessagePort = global["MessagePort"];
            if (typeof MessagePort !== "undefined" && MessagePort.prototype) {
                api.patchOnProperties(MessagePort.prototype, ["message", "messageerror"]);
            }
        });
    }
    // packages/zone.js/lib/browser/rollup-message-port.js
    patchMessagePort(Zone);
    if (__exports != exports)
        module.exports = exports;
    return module.exports;
}));
