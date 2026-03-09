'use strict';
/**
 * @license Angular
 * (c) 2010-2026 Google LLC. https://angular.dev/
 * License: MIT
 */

// packages/zone.js/lib/browser/shadydom.js
function patchShadyDom(Zone2) {
  Zone2.__load_patch("shadydom", (global, Zone3, api) => {
    const HTMLSlotElement = global.HTMLSlotElement;
    const prototypes = [
      Object.getPrototypeOf(window),
      Node.prototype,
      Text.prototype,
      Element.prototype,
      HTMLElement.prototype,
      HTMLSlotElement && HTMLSlotElement.prototype,
      DocumentFragment.prototype,
      Document.prototype
    ];
    prototypes.forEach(function(proto) {
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
