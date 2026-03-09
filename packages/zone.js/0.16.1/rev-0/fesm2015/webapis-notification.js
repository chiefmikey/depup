'use strict';
/**
 * @license Angular
 * (c) 2010-2026 Google LLC. https://angular.dev/
 * License: MIT
 */

// packages/zone.js/lib/browser/webapis-notification.js
function patchNotifications(Zone2) {
  Zone2.__load_patch("notification", (global, Zone3, api) => {
    const Notification = global["Notification"];
    if (!Notification || !Notification.prototype) {
      return;
    }
    const desc = Object.getOwnPropertyDescriptor(Notification.prototype, "onerror");
    if (!desc || !desc.configurable) {
      return;
    }
    api.patchOnProperties(Notification.prototype, null);
  });
}

// packages/zone.js/lib/browser/rollup-webapis-notification.js
patchNotifications(Zone);
