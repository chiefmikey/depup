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
    // packages/zone.js/lib/browser/shadydom.js
    function patchShadyDom(Zone2) {
        Zone2.__load_patch("shadydom", function (global, Zone3, api) {
            var HTMLSlotElement = global.HTMLSlotElement;
            var prototypes = [
                Object.getPrototypeOf(window),
                Node.prototype,
                Text.prototype,
                Element.prototype,
                HTMLElement.prototype,
                HTMLSlotElement && HTMLSlotElement.prototype,
                DocumentFragment.prototype,
                Document.prototype
            ];
            prototypes.forEach(function (proto) {
                if (proto && proto.hasOwnProperty("addEventListener")) {
                    proto[Zone3.__symbol__("addEventListener")] = null;
                    proto[Zone3.__symbol__("removeEventListener")] = null;
                    api.patchEventTarget(global, api, [proto]);
                }
            });
        });
    }
    // packages/zone.js/lib/browser/rollup-shadydom.js
    patchShadyDom(Zone);
    if (__exports != exports)
        module.exports = exports;
    return module.exports;
}));
