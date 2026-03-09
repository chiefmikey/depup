'use strict';
/**
 * @license Angular
 * (c) 2010-2026 Google LLC. https://angular.dev/
 * License: MIT
 */
var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};

// packages/zone.js/lib/zone-spec/wtf.js
var _global = typeof window === "object" && window || typeof self === "object" && self || global;
function patchWtf(Zone2) {
  let wtfTrace = null;
  let wtfEvents = null;
  const wtfEnabled = function() {
    const wtf = _global["wtf"];
    if (wtf) {
      wtfTrace = wtf.trace;
      if (wtfTrace) {
        wtfEvents = wtfTrace.events;
        return true;
      }
    }
    return false;
  }();
  const _WtfZoneSpec = class _WtfZoneSpec {
    constructor() {
      __publicField(this, "name", "WTF");
    }
    onFork(parentZoneDelegate, currentZone, targetZone, zoneSpec) {
      const retValue = parentZoneDelegate.fork(targetZone, zoneSpec);
      _WtfZoneSpec.forkInstance(zonePathName(targetZone), retValue.name);
      return retValue;
    }
    onInvoke(parentZoneDelegate, currentZone, targetZone, delegate, applyThis, applyArgs, source) {
      const src = source || "unknown";
      let scope = _WtfZoneSpec.invokeScope[src];
      if (!scope) {
        scope = _WtfZoneSpec.invokeScope[src] = wtfEvents.createScope(`Zone:invoke:${source}(ascii zone)`);
      }
      return wtfTrace.leaveScope(scope(zonePathName(targetZone)), parentZoneDelegate.invoke(targetZone, delegate, applyThis, applyArgs, source));
    }
    onHandleError(parentZoneDelegate, currentZone, targetZone, error) {
      return parentZoneDelegate.handleError(targetZone, error);
    }
    onScheduleTask(parentZoneDelegate, currentZone, targetZone, task) {
      const key = task.type + ":" + task.source;
      let instance = _WtfZoneSpec.scheduleInstance[key];
      if (!instance) {
        instance = _WtfZoneSpec.scheduleInstance[key] = wtfEvents.createInstance(`Zone:schedule:${key}(ascii zone, any data)`);
      }
      const retValue = parentZoneDelegate.scheduleTask(targetZone, task);
      instance(zonePathName(targetZone), shallowObj(task.data, 2));
      return retValue;
    }
    onInvokeTask(parentZoneDelegate, currentZone, targetZone, task, applyThis, applyArgs) {
      const source = task.source;
      let scope = _WtfZoneSpec.invokeTaskScope[source];
      if (!scope) {
        scope = _WtfZoneSpec.invokeTaskScope[source] = wtfEvents.createScope(`Zone:invokeTask:${source}(ascii zone)`);
      }
      return wtfTrace.leaveScope(scope(zonePathName(targetZone)), parentZoneDelegate.invokeTask(targetZone, task, applyThis, applyArgs));
    }
    onCancelTask(parentZoneDelegate, currentZone, targetZone, task) {
      const key = task.source;
      let instance = _WtfZoneSpec.cancelInstance[key];
      if (!instance) {
        instance = _WtfZoneSpec.cancelInstance[key] = wtfEvents.createInstance(`Zone:cancel:${key}(ascii zone, any options)`);
      }
      const retValue = parentZoneDelegate.cancelTask(targetZone, task);
      instance(zonePathName(targetZone), shallowObj(task.data, 2));
      return retValue;
    }
  };
  __publicField(_WtfZoneSpec, "forkInstance", wtfEnabled ? wtfEvents.createInstance("Zone:fork(ascii zone, ascii newZone)") : null);
  __publicField(_WtfZoneSpec, "scheduleInstance", {});
  __publicField(_WtfZoneSpec, "cancelInstance", {});
  __publicField(_WtfZoneSpec, "invokeScope", {});
  __publicField(_WtfZoneSpec, "invokeTaskScope", {});
  let WtfZoneSpec = _WtfZoneSpec;
  function shallowObj(obj, depth) {
    if (!obj || !depth)
      return null;
    const out = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        let value = obj[key];
        switch (typeof value) {
          case "object":
            const name = value && value.constructor && value.constructor.name;
            value = name == Object.name ? shallowObj(value, depth - 1) : name;
            break;
          case "function":
            value = value.name || void 0;
            break;
        }
        out[key] = value;
      }
    }
    return out;
  }
  function zonePathName(zone) {
    let name = zone.name;
    let localZone = zone.parent;
    while (localZone != null) {
      name = localZone.name + "::" + name;
      localZone = localZone.parent;
    }
    return name;
  }
  Zone2["wtfZoneSpec"] = !wtfEnabled ? null : new WtfZoneSpec();
}

// packages/zone.js/lib/zone-spec/rollup-wtf.js
patchWtf(Zone);
