'use strict';
/**
 * @license Angular
 * (c) 2010-2026 Google LLC. https://angular.dev/
 * License: MIT
 */

// packages/zone.js/lib/browser/canvas.js
function patchCanvas(Zone2) {
  Zone2.__load_patch("canvas", (global, Zone3, api) => {
    const HTMLCanvasElement = global["HTMLCanvasElement"];
    if (typeof HTMLCanvasElement !== "undefined" && HTMLCanvasElement.prototype && HTMLCanvasElement.prototype.toBlob) {
      api.patchMacroTask(HTMLCanvasElement.prototype, "toBlob", (self, args) => {
        return { name: "HTMLCanvasElement.toBlob", target: self, cbIdx: 0, args };
      });
    }
  });
}

// packages/zone.js/lib/browser/rollup-canvas.js
patchCanvas(Zone);
