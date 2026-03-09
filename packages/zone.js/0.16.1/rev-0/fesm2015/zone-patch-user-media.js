'use strict';
/**
 * @license Angular
 * (c) 2010-2026 Google LLC. https://angular.dev/
 * License: MIT
 */

// packages/zone.js/lib/browser/webapis-user-media.js
function patchUserMedia(Zone2) {
  Zone2.__load_patch("getUserMedia", (global, Zone3, api) => {
    function wrapFunctionArgs(func, source) {
      return function() {
        const args = Array.prototype.slice.call(arguments);
        const wrappedArgs = api.bindArguments(args, source ? source : func.name);
        return func.apply(this, wrappedArgs);
      };
    }
    let navigator = global["navigator"];
    if (navigator && navigator.getUserMedia) {
      navigator.getUserMedia = wrapFunctionArgs(navigator.getUserMedia);
    }
  });
}

// packages/zone.js/lib/browser/rollup-webapis-user-media.js
patchUserMedia(Zone);
