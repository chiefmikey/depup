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

// packages/zone.js/lib/zone-spec/task-tracking.js
var TaskTrackingZoneSpec = class {
  constructor() {
    __publicField(this, "name", "TaskTrackingZone");
    __publicField(this, "microTasks", []);
    __publicField(this, "macroTasks", []);
    __publicField(this, "eventTasks", []);
    __publicField(this, "properties", { "TaskTrackingZone": this });
  }
  static get() {
    return Zone.current.get("TaskTrackingZone");
  }
  getTasksFor(type) {
    switch (type) {
      case "microTask":
        return this.microTasks;
      case "macroTask":
        return this.macroTasks;
      case "eventTask":
        return this.eventTasks;
    }
    throw new Error("Unknown task format: " + type);
  }
  onScheduleTask(parentZoneDelegate, currentZone, targetZone, task) {
    task["creationLocation"] = new Error(`Task '${task.type}' from '${task.source}'.`);
    const tasks = this.getTasksFor(task.type);
    tasks.push(task);
    return parentZoneDelegate.scheduleTask(targetZone, task);
  }
  onCancelTask(parentZoneDelegate, currentZone, targetZone, task) {
    const tasks = this.getTasksFor(task.type);
    for (let i = 0; i < tasks.length; i++) {
      if (tasks[i] == task) {
        tasks.splice(i, 1);
        break;
      }
    }
    return parentZoneDelegate.cancelTask(targetZone, task);
  }
  onInvokeTask(parentZoneDelegate, currentZone, targetZone, task, applyThis, applyArgs) {
    var _a;
    if (task.type === "eventTask" || ((_a = task.data) == null ? void 0 : _a.isPeriodic))
      return parentZoneDelegate.invokeTask(targetZone, task, applyThis, applyArgs);
    const tasks = this.getTasksFor(task.type);
    for (let i = 0; i < tasks.length; i++) {
      if (tasks[i] == task) {
        tasks.splice(i, 1);
        break;
      }
    }
    return parentZoneDelegate.invokeTask(targetZone, task, applyThis, applyArgs);
  }
  clearEvents() {
    while (this.eventTasks.length) {
      Zone.current.cancelTask(this.eventTasks[0]);
    }
  }
};
function patchTaskTracking(Zone2) {
  Zone2["TaskTrackingZoneSpec"] = TaskTrackingZoneSpec;
}

// packages/zone.js/lib/zone-spec/rollup-task-tracking.js
patchTaskTracking(Zone);
