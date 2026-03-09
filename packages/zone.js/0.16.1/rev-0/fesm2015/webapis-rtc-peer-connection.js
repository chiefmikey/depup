'use strict';
/**
 * @license Angular
 * (c) 2010-2026 Google LLC. https://angular.dev/
 * License: MIT
 */

// packages/zone.js/lib/browser/webapis-rtc-peer-connection.js
function patchRtcPeerConnection(Zone2) {
  Zone2.__load_patch("RTCPeerConnection", (global, Zone3, api) => {
    const RTCPeerConnection = global["RTCPeerConnection"];
    if (!RTCPeerConnection) {
      return;
    }
    const addSymbol = api.symbol("addEventListener");
    const removeSymbol = api.symbol("removeEventListener");
    RTCPeerConnection.prototype.addEventListener = RTCPeerConnection.prototype[addSymbol];
    RTCPeerConnection.prototype.removeEventListener = RTCPeerConnection.prototype[removeSymbol];
    RTCPeerConnection.prototype[addSymbol] = null;
    RTCPeerConnection.prototype[removeSymbol] = null;
    api.patchEventTarget(global, api, [RTCPeerConnection.prototype], { useG: false });
  });
}

// packages/zone.js/lib/browser/rollup-webapis-rtc-peer-connection.js
patchRtcPeerConnection(Zone);
