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
    // packages/zone.js/lib/browser/webapis-notification.js
    function patchNotifications(Zone2) {
        Zone2.__load_patch("notification", function (global, Zone3, api) {
            var Notification = global["Notification"];
            if (!Notification || !Notification.prototype) {
                return;
            }
            var desc = Object.getOwnPropertyDescriptor(Notification.prototype, "onerror");
            if (!desc || !desc.configurable) {
                return;
            }
            api.patchOnProperties(Notification.prototype, null);
        });
    }
    // packages/zone.js/lib/browser/rollup-webapis-notification.js
    patchNotifications(Zone);
    if (__exports != exports)
        module.exports = exports;
    return module.exports;
}));
