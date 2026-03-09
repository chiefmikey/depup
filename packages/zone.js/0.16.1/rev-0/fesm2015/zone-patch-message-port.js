'use strict';
/**
 * @license Angular
 * (c) 2010-2026 Google LLC. https://angular.dev/
 * License: MIT
 */

// packages/zone.js/lib/browser/message-port.js
function patchMessagePort(Zone2) {
  Zone2.__load_patch("MessagePort", (global, Zone3, api) => {
    const MessagePort = global["MessagePort"];
    if (typeof MessagePort !== "undefined" && MessagePort.prototype) {
      api.patchOnProperties(MessagePort.prototype, ["message", "messageerror"]);
    }
  });
}

// packages/zone.js/lib/browser/rollup-message-port.js
patchMessagePort(Zone);
