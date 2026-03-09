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
    // packages/zone.js/lib/extra/socket-io.js
    function patchSocketIo(Zone2) {
        Zone2.__load_patch("socketio", function (global, Zone3, api) {
            Zone3[Zone3.__symbol__("socketio")] = function patchSocketIO(io) {
                api.patchEventTarget(global, api, [io.Socket.prototype], {
                    useG: false,
                    chkDup: false,
                    rt: true,
                    diff: function (task, delegate) {
                        return task.callback === delegate;
                    }
                });
                io.Socket.prototype.on = io.Socket.prototype.addEventListener;
                io.Socket.prototype.off = io.Socket.prototype.removeListener = io.Socket.prototype.removeAllListeners = io.Socket.prototype.removeEventListener;
            };
        });
    }
    // packages/zone.js/lib/extra/rollup-socket-io.js
    patchSocketIo(Zone);
    if (__exports != exports)
        module.exports = exports;
    return module.exports;
}));
