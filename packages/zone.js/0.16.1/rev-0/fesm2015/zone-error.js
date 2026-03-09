'use strict';
/**
 * @license Angular
 * (c) 2010-2026 Google LLC. https://angular.dev/
 * License: MIT
 */

// packages/zone.js/lib/common/error-rewrite.js
function patchError(Zone2) {
  Zone2.__load_patch("Error", (global, Zone3, api) => {
    const zoneJsInternalStackFramesSymbol = api.symbol("zoneJsInternalStackFrames");
    const NativeError = global[api.symbol("Error")] = global["Error"];
    const zoneJsInternalStackFrames = {};
    let zoneAwareFrame1;
    let zoneAwareFrame2;
    let zoneAwareFrame1WithoutNew;
    let zoneAwareFrame2WithoutNew;
    let zoneAwareFrame3WithoutNew;
    global["Error"] = ZoneAwareError;
    const stackRewrite = "stackRewrite";
    const zoneJsInternalStackFramesPolicy = global["__Zone_Error_BlacklistedStackFrames_policy"] || global["__Zone_Error_ZoneJsInternalStackFrames_policy"] || "default";
    function buildZoneFrameNames(zoneFrame) {
      let zoneFrameName = { zoneName: zoneFrame.zone.name };
      let result = zoneFrameName;
      while (zoneFrame.parent) {
        zoneFrame = zoneFrame.parent;
        const parentZoneFrameName = { zoneName: zoneFrame.zone.name };
        zoneFrameName.parent = parentZoneFrameName;
        zoneFrameName = parentZoneFrameName;
      }
      return result;
    }
    function buildZoneAwareStackFrames(originalStack, zoneFrame, isZoneFrame = true) {
      let frames = originalStack.split("\n");
      let i = 0;
      while (!(frames[i] === zoneAwareFrame1 || frames[i] === zoneAwareFrame2 || frames[i] === zoneAwareFrame1WithoutNew || frames[i] === zoneAwareFrame2WithoutNew || frames[i] === zoneAwareFrame3WithoutNew) && i < frames.length) {
        i++;
      }
      for (; i < frames.length && zoneFrame; i++) {
        let frame = frames[i];
        if (frame.trim()) {
          switch (zoneJsInternalStackFrames[frame]) {
            case 0:
              frames.splice(i, 1);
              i--;
              break;
            case 1:
              if (zoneFrame.parent) {
                zoneFrame = zoneFrame.parent;
              } else {
                zoneFrame = null;
              }
              frames.splice(i, 1);
              i--;
              break;
            default:
              frames[i] += isZoneFrame ? ` [${zoneFrame.zone.name}]` : ` [${zoneFrame.zoneName}]`;
          }
        }
      }
      return frames.join("\n");
    }
    function ZoneAwareError() {
      let error = NativeError.apply(this, arguments);
      const originalStack = error["originalStack"] = error.stack;
      if (ZoneAwareError[stackRewrite] && originalStack) {
        let zoneFrame = api.currentZoneFrame();
        if (zoneJsInternalStackFramesPolicy === "lazy") {
          error[api.symbol("zoneFrameNames")] = buildZoneFrameNames(zoneFrame);
        } else if (zoneJsInternalStackFramesPolicy === "default") {
          try {
            error.stack = error.zoneAwareStack = buildZoneAwareStackFrames(originalStack, zoneFrame);
          } catch (e) {
          }
        }
      }
      if (this instanceof NativeError && this.constructor != NativeError) {
        Object.keys(error).concat("stack", "message", "cause").forEach((key) => {
          const value = error[key];
          if (value !== void 0) {
            try {
              this[key] = value;
            } catch (e) {
            }
          }
        });
        return this;
      }
      return error;
    }
    ZoneAwareError.prototype = NativeError.prototype;
    ZoneAwareError[zoneJsInternalStackFramesSymbol] = zoneJsInternalStackFrames;
    ZoneAwareError[stackRewrite] = false;
    const zoneAwareStackSymbol = api.symbol("zoneAwareStack");
    if (zoneJsInternalStackFramesPolicy === "lazy") {
      Object.defineProperty(ZoneAwareError.prototype, "zoneAwareStack", {
        configurable: true,
        enumerable: true,
        get: function() {
          if (!this[zoneAwareStackSymbol]) {
            this[zoneAwareStackSymbol] = buildZoneAwareStackFrames(this.originalStack, this[api.symbol("zoneFrameNames")], false);
          }
          return this[zoneAwareStackSymbol];
        },
        set: function(newStack) {
          this.originalStack = newStack;
          this[zoneAwareStackSymbol] = buildZoneAwareStackFrames(this.originalStack, this[api.symbol("zoneFrameNames")], false);
        }
      });
    }
    const specialPropertyNames = ["stackTraceLimit", "captureStackTrace", "prepareStackTrace"];
    const nativeErrorProperties = Object.keys(NativeError);
    if (nativeErrorProperties) {
      nativeErrorProperties.forEach((prop) => {
        if (specialPropertyNames.filter((sp) => sp === prop).length === 0) {
          Object.defineProperty(ZoneAwareError, prop, {
            get: function() {
              return NativeError[prop];
            },
            set: function(value) {
              NativeError[prop] = value;
            }
          });
        }
      });
    }
    if (NativeError.hasOwnProperty("stackTraceLimit")) {
      NativeError.stackTraceLimit = Math.max(NativeError.stackTraceLimit, 15);
      Object.defineProperty(ZoneAwareError, "stackTraceLimit", {
        get: function() {
          return NativeError.stackTraceLimit;
        },
        set: function(value) {
          return NativeError.stackTraceLimit = value;
        }
      });
    }
    if (NativeError.hasOwnProperty("captureStackTrace")) {
      Object.defineProperty(ZoneAwareError, "captureStackTrace", {
        // add named function here because we need to remove this
        // stack frame when prepareStackTrace below
        value: function zoneCaptureStackTrace(targetObject, constructorOpt) {
          NativeError.captureStackTrace(targetObject, constructorOpt);
        }
      });
    }
    const ZONE_CAPTURESTACKTRACE = "zoneCaptureStackTrace";
    Object.defineProperty(ZoneAwareError, "prepareStackTrace", {
      get: function() {
        return NativeError.prepareStackTrace;
      },
      set: function(value) {
        if (!value || typeof value !== "function") {
          return NativeError.prepareStackTrace = value;
        }
        return NativeError.prepareStackTrace = function(error, structuredStackTrace) {
          if (structuredStackTrace) {
            for (let i = 0; i < structuredStackTrace.length; i++) {
              const st = structuredStackTrace[i];
              if (st.getFunctionName() === ZONE_CAPTURESTACKTRACE) {
                structuredStackTrace.splice(i, 1);
                break;
              }
            }
          }
          return value.call(this, error, structuredStackTrace);
        };
      }
    });
    if (zoneJsInternalStackFramesPolicy === "disable") {
      return;
    }
    let detectZone = Zone3.current.fork({
      name: "detect",
      onHandleError: function(parentZD, current, target, error) {
        if (error.originalStack && Error === ZoneAwareError) {
          let frames = error.originalStack.split(/\n/);
          let runFrame = false, runGuardedFrame = false, runTaskFrame = false;
          while (frames.length) {
            let frame = frames.shift();
            if (/:\d+:\d+/.test(frame) || frame === "ZoneAwareError") {
              let fnName = frame.split("(")[0].split("@")[0];
              let frameType = 1;
              if (fnName.indexOf("ZoneAwareError") !== -1) {
                if (fnName.indexOf("new ZoneAwareError") !== -1) {
                  zoneAwareFrame1 = frame;
                  zoneAwareFrame2 = frame.replace("new ZoneAwareError", "new Error.ZoneAwareError");
                } else {
                  zoneAwareFrame1WithoutNew = frame;
                  zoneAwareFrame2WithoutNew = frame.replace("Error.", "");
                  if (frame.indexOf("Error.ZoneAwareError") === -1) {
                    zoneAwareFrame3WithoutNew = frame.replace("ZoneAwareError", "Error.ZoneAwareError");
                  }
                }
                zoneJsInternalStackFrames[zoneAwareFrame2] = 0;
              }
              if (fnName.indexOf("runGuarded") !== -1) {
                runGuardedFrame = true;
              } else if (fnName.indexOf("runTask") !== -1) {
                runTaskFrame = true;
              } else if (fnName.indexOf("run") !== -1) {
                runFrame = true;
              } else {
                frameType = 0;
              }
              zoneJsInternalStackFrames[frame] = frameType;
              if (runFrame && runGuardedFrame && runTaskFrame) {
                ZoneAwareError[stackRewrite] = true;
                break;
              }
            }
          }
        }
        return false;
      }
    });
    const childDetectZone = detectZone.fork({
      name: "child",
      onScheduleTask: function(delegate, curr, target, task) {
        return delegate.scheduleTask(target, task);
      },
      onInvokeTask: function(delegate, curr, target, task, applyThis, applyArgs) {
        return delegate.invokeTask(target, task, applyThis, applyArgs);
      },
      onCancelTask: function(delegate, curr, target, task) {
        return delegate.cancelTask(target, task);
      },
      onInvoke: function(delegate, curr, target, callback, applyThis, applyArgs, source) {
        return delegate.invoke(target, callback, applyThis, applyArgs, source);
      }
    });
    const originalStackTraceLimit = Error.stackTraceLimit;
    Error.stackTraceLimit = 100;
    childDetectZone.run(() => {
      childDetectZone.runGuarded(() => {
        const fakeTransitionTo = () => {
        };
        childDetectZone.scheduleEventTask(zoneJsInternalStackFramesSymbol, () => {
          childDetectZone.scheduleMacroTask(zoneJsInternalStackFramesSymbol, () => {
            childDetectZone.scheduleMicroTask(zoneJsInternalStackFramesSymbol, () => {
              throw new Error();
            }, void 0, (t) => {
              t._transitionTo = fakeTransitionTo;
              t.invoke();
            });
            childDetectZone.scheduleMicroTask(zoneJsInternalStackFramesSymbol, () => {
              throw Error();
            }, void 0, (t) => {
              t._transitionTo = fakeTransitionTo;
              t.invoke();
            });
          }, void 0, (t) => {
            t._transitionTo = fakeTransitionTo;
            t.invoke();
          }, () => {
          });
        }, void 0, (t) => {
          t._transitionTo = fakeTransitionTo;
          t.invoke();
        }, () => {
        });
      });
    });
    Error.stackTraceLimit = originalStackTraceLimit;
  });
}

// packages/zone.js/lib/common/rollup-error-rewrite.js
patchError(Zone);
