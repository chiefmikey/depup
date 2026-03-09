'use strict';
/**
 * @license Angular
 * (c) 2010-2026 Google LLC. https://angular.dev/
 * License: MIT
 */
var __defProp = Object.defineProperty;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};

// packages/zone.js/lib/zone-spec/long-stack-trace.js
function patchLongStackTrace(Zone2) {
  const NEWLINE = "\n";
  const IGNORE_FRAMES = {};
  const creationTrace = "__creationTrace__";
  const ERROR_TAG = "STACKTRACE TRACKING";
  const SEP_TAG = "__SEP_TAG__";
  let sepTemplate = SEP_TAG + "@[native]";
  class LongStackTrace {
    constructor() {
      __publicField(this, "error", getStacktrace());
      __publicField(this, "timestamp", /* @__PURE__ */ new Date());
    }
  }
  function getStacktraceWithUncaughtError() {
    return new Error(ERROR_TAG);
  }
  function getStacktraceWithCaughtError() {
    try {
      throw getStacktraceWithUncaughtError();
    } catch (err) {
      return err;
    }
  }
  const error = getStacktraceWithUncaughtError();
  const caughtError = getStacktraceWithCaughtError();
  const getStacktrace = error.stack ? getStacktraceWithUncaughtError : caughtError.stack ? getStacktraceWithCaughtError : getStacktraceWithUncaughtError;
  function getFrames(error2) {
    return error2.stack ? error2.stack.split(NEWLINE) : [];
  }
  function addErrorStack(lines, error2) {
    let trace = getFrames(error2);
    for (let i = 0; i < trace.length; i++) {
      const frame = trace[i];
      if (!IGNORE_FRAMES.hasOwnProperty(frame)) {
        lines.push(trace[i]);
      }
    }
  }
  function renderLongStackTrace(frames, stack) {
    const longTrace = [stack ? stack.trim() : ""];
    if (frames) {
      let timestamp = (/* @__PURE__ */ new Date()).getTime();
      for (let i = 0; i < frames.length; i++) {
        const traceFrames = frames[i];
        const lastTime = traceFrames.timestamp;
        let separator = `____________________Elapsed ${timestamp - lastTime.getTime()} ms; At: ${lastTime}`;
        separator = separator.replace(/[^\w\d]/g, "_");
        longTrace.push(sepTemplate.replace(SEP_TAG, separator));
        addErrorStack(longTrace, traceFrames.error);
        timestamp = lastTime.getTime();
      }
    }
    return longTrace.join(NEWLINE);
  }
  function stackTracesEnabled() {
    return Error.stackTraceLimit > 0;
  }
  Zone2["longStackTraceZoneSpec"] = {
    name: "long-stack-trace",
    longStackTraceLimit: 10,
    // Max number of task to keep the stack trace for.
    // add a getLongStackTrace method in spec to
    // handle handled reject promise error.
    getLongStackTrace: function(error2) {
      if (!error2) {
        return void 0;
      }
      const trace = error2[Zone2.__symbol__("currentTaskTrace")];
      if (!trace) {
        return error2.stack;
      }
      return renderLongStackTrace(trace, error2.stack);
    },
    onScheduleTask: function(parentZoneDelegate, currentZone, targetZone, task) {
      if (stackTracesEnabled()) {
        const currentTask = Zone2.currentTask;
        let trace = currentTask && currentTask.data && currentTask.data[creationTrace] || [];
        trace = [new LongStackTrace()].concat(trace);
        if (trace.length > this.longStackTraceLimit) {
          trace.length = this.longStackTraceLimit;
        }
        if (!task.data)
          task.data = {};
        if (task.type === "eventTask") {
          task.data = __spreadValues({}, task.data);
        }
        task.data[creationTrace] = trace;
      }
      return parentZoneDelegate.scheduleTask(targetZone, task);
    },
    onHandleError: function(parentZoneDelegate, currentZone, targetZone, error2) {
      if (stackTracesEnabled()) {
        const parentTask = Zone2.currentTask || error2.task;
        if (error2 instanceof Error && parentTask) {
          const longStack = renderLongStackTrace(parentTask.data && parentTask.data[creationTrace], error2.stack);
          try {
            error2.stack = error2.longStack = longStack;
          } catch (err) {
          }
        }
      }
      return parentZoneDelegate.handleError(targetZone, error2);
    }
  };
  function captureStackTraces(stackTraces, count) {
    if (count > 0) {
      stackTraces.push(getFrames(new LongStackTrace().error));
      captureStackTraces(stackTraces, count - 1);
    }
  }
  function computeIgnoreFrames() {
    if (!stackTracesEnabled()) {
      return;
    }
    const frames = [];
    captureStackTraces(frames, 2);
    const frames1 = frames[0];
    const frames2 = frames[1];
    for (let i = 0; i < frames1.length; i++) {
      const frame1 = frames1[i];
      if (frame1.indexOf(ERROR_TAG) == -1) {
        let match = frame1.match(/^\s*at\s+/);
        if (match) {
          sepTemplate = match[0] + SEP_TAG + " (http://localhost)";
          break;
        }
      }
    }
    for (let i = 0; i < frames1.length; i++) {
      const frame1 = frames1[i];
      const frame2 = frames2[i];
      if (frame1 === frame2) {
        IGNORE_FRAMES[frame1] = true;
      } else {
        break;
      }
    }
  }
  computeIgnoreFrames();
}

// packages/zone.js/lib/zone-spec/rollup-long-stack-trace.js
patchLongStackTrace(Zone);
