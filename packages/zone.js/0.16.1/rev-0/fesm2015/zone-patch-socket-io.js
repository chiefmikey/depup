'use strict';
/**
 * @license Angular
 * (c) 2010-2026 Google LLC. https://angular.dev/
 * License: MIT
 */

// packages/zone.js/lib/extra/socket-io.js
function patchSocketIo(Zone2) {
  Zone2.__load_patch("socketio", (global, Zone3, api) => {
    Zone3[Zone3.__symbol__("socketio")] = function patchSocketIO(io) {
      api.patchEventTarget(global, api, [io.Socket.prototype], {
        useG: false,
        chkDup: false,
        rt: true,
        diff: (task, delegate) => {
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
