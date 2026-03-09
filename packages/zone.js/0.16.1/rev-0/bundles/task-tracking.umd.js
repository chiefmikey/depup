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
    var __defProp = Object.defineProperty;
    var __defNormalProp = function (obj, key, value) { return key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value: value }) : obj[key] = value; };
    var __publicField = function (obj, key, value) {
        __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
        return value;
    };
    // packages/zone.js/lib/zone-spec/task-tracking.js
    var TaskTrackingZoneSpec = /** @class */ (function () {
        function TaskTrackingZoneSpec() {
            __publicField(this, "name", "TaskTrackingZone");
            __publicField(this, "microTasks", []);
            __publicField(this, "macroTasks", []);
            __publicField(this, "eventTasks", []);
            __publicField(this, "properties", { "TaskTrackingZone": this });
        }
        TaskTrackingZoneSpec.get = function () {
            return Zone.current.get("TaskTrackingZone");
        };
        TaskTrackingZoneSpec.prototype.getTasksFor = function (type) {
            switch (type) {
                case "microTask":
                    return this.microTasks;
                case "macroTask":
                    return this.macroTasks;
                case "eventTask":
                    return this.eventTasks;
            }
            throw new Error("Unknown task format: " + type);
        };
        TaskTrackingZoneSpec.prototype.onScheduleTask = function (parentZoneDelegate, currentZone, targetZone, task) {
            task["creationLocation"] = new Error("Task '".concat(task.type, "' from '").concat(task.source, "'."));
            var tasks = this.getTasksFor(task.type);
            tasks.push(task);
            return parentZoneDelegate.scheduleTask(targetZone, task);
        };
        TaskTrackingZoneSpec.prototype.onCancelTask = function (parentZoneDelegate, currentZone, targetZone, task) {
            var tasks = this.getTasksFor(task.type);
            for (var i = 0; i < tasks.length; i++) {
                if (tasks[i] == task) {
                    tasks.splice(i, 1);
                    break;
                }
            }
            return parentZoneDelegate.cancelTask(targetZone, task);
        };
        TaskTrackingZoneSpec.prototype.onInvokeTask = function (parentZoneDelegate, currentZone, targetZone, task, applyThis, applyArgs) {
            var _a;
            if (task.type === "eventTask" || ((_a = task.data) == null ? void 0 : _a.isPeriodic))
                return parentZoneDelegate.invokeTask(targetZone, task, applyThis, applyArgs);
            var tasks = this.getTasksFor(task.type);
            for (var i = 0; i < tasks.length; i++) {
                if (tasks[i] == task) {
                    tasks.splice(i, 1);
                    break;
                }
            }
            return parentZoneDelegate.invokeTask(targetZone, task, applyThis, applyArgs);
        };
        TaskTrackingZoneSpec.prototype.clearEvents = function () {
            while (this.eventTasks.length) {
                Zone.current.cancelTask(this.eventTasks[0]);
            }
        };
        return TaskTrackingZoneSpec;
    }());
    function patchTaskTracking(Zone2) {
        Zone2["TaskTrackingZoneSpec"] = TaskTrackingZoneSpec;
    }
    // packages/zone.js/lib/zone-spec/rollup-task-tracking.js
    patchTaskTracking(Zone);
    if (__exports != exports)
        module.exports = exports;
    return module.exports;
}));
