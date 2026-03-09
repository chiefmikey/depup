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
var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};

// packages/zone.js/lib/zone-spec/proxy.js
function throwProxyZoneError() {
  const jestPatched = typeof jest !== "undefined" && jest["__zone_patch__"];
  if (jestPatched) {
    throw new Error("Only globals are patched with zone-testing. If you import `it`, `describe`, etc. directly, you cannot use `fakeAsync` or `waitForAsync`.");
  } else {
    throw new Error("ProxyZoneSpec is needed for the fakeAsync and waitForAsync test helpers but could not be found. Make sure that your environment includes zone-testing.js");
  }
}

// packages/zone.js/lib/zone-spec/fake-async-test.js
var global = typeof window === "object" && window || typeof self === "object" && self || globalThis.global;
var originalSetImmediate = global.setImmediate;
var originalTimeout = global.setTimeout;
var OriginalDate = global.Date;
function FakeDate() {
  if (arguments.length === 0) {
    const d = new OriginalDate();
    d.setTime(FakeDate.now());
    return d;
  } else {
    const args = Array.prototype.slice.call(arguments);
    return new OriginalDate(...args);
  }
}
FakeDate.now = function() {
  const fakeAsyncTestZoneSpec = Zone.current.get("FakeAsyncTestZoneSpec");
  if (fakeAsyncTestZoneSpec) {
    return fakeAsyncTestZoneSpec.getFakeSystemTime();
  }
  return OriginalDate.now.apply(this, arguments);
};
FakeDate.UTC = OriginalDate.UTC;
FakeDate.parse = OriginalDate.parse;
var patchedTimers;
var timeoutCallback = function() {
};
var _Scheduler = class _Scheduler {
  constructor() {
    // Scheduler queue with the tuple of end time and callback function - sorted by end time.
    __publicField(this, "_schedulerQueue", []);
    // Current simulated time in millis.
    __publicField(this, "_currentTickTime", 0);
    // Current fake system base time in millis.
    __publicField(this, "_currentFakeBaseSystemTime", OriginalDate.now());
    // track requeuePeriodicTimer
    __publicField(this, "_currentTickRequeuePeriodicEntries", []);
  }
  static getNextId() {
    const id = patchedTimers.nativeSetTimeout.call(global, timeoutCallback, 0);
    patchedTimers.nativeClearTimeout.call(global, id);
    if (typeof id === "number") {
      return id;
    }
    return _Scheduler.nextNodeJSId++;
  }
  getCurrentTickTime() {
    return this._currentTickTime;
  }
  getFakeSystemTime() {
    return this._currentFakeBaseSystemTime + this._currentTickTime;
  }
  setFakeBaseSystemTime(fakeBaseSystemTime) {
    this._currentFakeBaseSystemTime = fakeBaseSystemTime;
  }
  getRealSystemTime() {
    return OriginalDate.now();
  }
  scheduleFunction(cb, delay, options) {
    options = __spreadValues(__spreadValues({}, {
      args: [],
      isPeriodic: false,
      isRequestAnimationFrame: false,
      id: -1,
      isRequeuePeriodic: false
    }), options);
    let currentId = options.id < 0 ? _Scheduler.nextId : options.id;
    _Scheduler.nextId = _Scheduler.getNextId();
    let endTime = this._currentTickTime + delay;
    let newEntry = {
      endTime,
      id: currentId,
      func: cb,
      args: options.args,
      delay,
      isPeriodic: options.isPeriodic,
      isRequestAnimationFrame: options.isRequestAnimationFrame
    };
    if (options.isRequeuePeriodic) {
      this._currentTickRequeuePeriodicEntries.push(newEntry);
    }
    let i = 0;
    for (; i < this._schedulerQueue.length; i++) {
      let currentEntry = this._schedulerQueue[i];
      if (newEntry.endTime < currentEntry.endTime) {
        break;
      }
    }
    this._schedulerQueue.splice(i, 0, newEntry);
    return currentId;
  }
  removeScheduledFunctionWithId(id) {
    for (let i = 0; i < this._schedulerQueue.length; i++) {
      if (this._schedulerQueue[i].id == id) {
        this._schedulerQueue.splice(i, 1);
        break;
      }
    }
  }
  removeAll() {
    this._schedulerQueue = [];
  }
  getTimerCount() {
    return this._schedulerQueue.length;
  }
  tickToNext(step = 1, doTick, tickOptions) {
    if (this._schedulerQueue.length < step) {
      return;
    }
    const startTime = this._currentTickTime;
    const targetTask = this._schedulerQueue[step - 1];
    this.tick(targetTask.endTime - startTime, doTick, tickOptions);
  }
  tick(millis = 0, doTick, tickOptions) {
    let finalTime = this._currentTickTime + millis;
    let lastCurrentTime = 0;
    tickOptions = Object.assign({ processNewMacroTasksSynchronously: true }, tickOptions);
    const schedulerQueue = tickOptions.processNewMacroTasksSynchronously ? this._schedulerQueue : this._schedulerQueue.slice();
    if (schedulerQueue.length === 0 && doTick) {
      doTick(millis);
      return;
    }
    while (schedulerQueue.length > 0) {
      this._currentTickRequeuePeriodicEntries = [];
      let current = schedulerQueue[0];
      if (finalTime < current.endTime) {
        break;
      } else {
        let current2 = schedulerQueue.shift();
        if (!tickOptions.processNewMacroTasksSynchronously) {
          const idx = this._schedulerQueue.indexOf(current2);
          if (idx >= 0) {
            this._schedulerQueue.splice(idx, 1);
          }
        }
        lastCurrentTime = this._currentTickTime;
        this._currentTickTime = current2.endTime;
        if (doTick) {
          doTick(this._currentTickTime - lastCurrentTime);
        }
        let retval = current2.func.apply(global, current2.isRequestAnimationFrame ? [this._currentTickTime] : current2.args);
        if (!retval) {
          break;
        }
        if (!tickOptions.processNewMacroTasksSynchronously) {
          this._currentTickRequeuePeriodicEntries.forEach((newEntry) => {
            let i = 0;
            for (; i < schedulerQueue.length; i++) {
              const currentEntry = schedulerQueue[i];
              if (newEntry.endTime < currentEntry.endTime) {
                break;
              }
            }
            schedulerQueue.splice(i, 0, newEntry);
          });
        }
      }
    }
    lastCurrentTime = this._currentTickTime;
    this._currentTickTime = finalTime;
    if (doTick) {
      doTick(this._currentTickTime - lastCurrentTime);
    }
  }
  executeNextTask(doTick) {
    const current = this._schedulerQueue.shift();
    if (current === void 0) {
      return;
    }
    doTick == null ? void 0 : doTick(current.endTime - this._currentTickTime);
    this._currentTickTime = current.endTime;
    current.func.apply(global, current.isRequestAnimationFrame ? [this._currentTickTime] : current.args);
  }
  flushOnlyPendingTimers(doTick) {
    if (this._schedulerQueue.length === 0) {
      return 0;
    }
    const startTime = this._currentTickTime;
    const lastTask = this._schedulerQueue[this._schedulerQueue.length - 1];
    this.tick(lastTask.endTime - startTime, doTick, { processNewMacroTasksSynchronously: false });
    return this._currentTickTime - startTime;
  }
  flush(limit = 20, flushPeriodic = false, doTick) {
    if (flushPeriodic) {
      return this.flushPeriodic(doTick);
    } else {
      return this.flushNonPeriodic(limit, doTick);
    }
  }
  flushPeriodic(doTick) {
    if (this._schedulerQueue.length === 0) {
      return 0;
    }
    const startTime = this._currentTickTime;
    const lastTask = this._schedulerQueue[this._schedulerQueue.length - 1];
    this.tick(lastTask.endTime - startTime, doTick);
    return this._currentTickTime - startTime;
  }
  flushNonPeriodic(limit, doTick) {
    const startTime = this._currentTickTime;
    let lastCurrentTime = 0;
    let count = 0;
    while (this._schedulerQueue.length > 0) {
      count++;
      if (count > limit) {
        throw new Error("flush failed after reaching the limit of " + limit + " tasks. Does your code use a polling timeout?");
      }
      if (this._schedulerQueue.filter((task) => !task.isPeriodic && !task.isRequestAnimationFrame).length === 0) {
        break;
      }
      const current = this._schedulerQueue.shift();
      lastCurrentTime = this._currentTickTime;
      this._currentTickTime = current.endTime;
      if (doTick) {
        doTick(this._currentTickTime - lastCurrentTime);
      }
      const retval = current.func.apply(global, current.args);
      if (!retval) {
        break;
      }
    }
    return this._currentTickTime - startTime;
  }
};
// Next scheduler id.
__publicField(_Scheduler, "nextNodeJSId", 1);
__publicField(_Scheduler, "nextId", -1);
var Scheduler = _Scheduler;
var FakeAsyncTestZoneSpec = class _FakeAsyncTestZoneSpec {
  constructor(namePrefix, trackPendingRequestAnimationFrame = false, macroTaskOptions) {
    __publicField(this, "trackPendingRequestAnimationFrame");
    __publicField(this, "macroTaskOptions");
    __publicField(this, "_scheduler", new Scheduler());
    __publicField(this, "_microtasks", []);
    __publicField(this, "_lastError", null);
    __publicField(this, "_uncaughtPromiseErrors", Promise[Zone.__symbol__("uncaughtPromiseErrors")]);
    __publicField(this, "pendingPeriodicTimers", []);
    __publicField(this, "pendingTimers", []);
    __publicField(this, "patchDateLocked", false);
    __publicField(this, "tickMode", {
      counter: 0,
      mode: "manual"
    });
    // ZoneSpec implementation below.
    __publicField(this, "name");
    __publicField(this, "properties", { "FakeAsyncTestZoneSpec": this });
    this.trackPendingRequestAnimationFrame = trackPendingRequestAnimationFrame;
    this.macroTaskOptions = macroTaskOptions;
    this.name = "fakeAsyncTestZone for " + namePrefix;
    if (!this.macroTaskOptions) {
      this.macroTaskOptions = global[Zone.__symbol__("FakeAsyncTestMacroTask")];
    }
  }
  static assertInZone() {
    if (Zone.current.get("FakeAsyncTestZoneSpec") == null) {
      throw new Error("The code should be running in the fakeAsync zone to call this function");
    }
  }
  _fnAndFlush(fn, completers) {
    return (...args) => {
      fn.apply(global, args);
      if (this._lastError === null) {
        if (completers.onSuccess != null) {
          completers.onSuccess.apply(global);
        }
        this.flushMicrotasks();
      } else {
        if (completers.onError != null) {
          completers.onError.apply(global);
        }
      }
      return this._lastError === null;
    };
  }
  static _removeTimer(timers, id) {
    let index = timers.indexOf(id);
    if (index > -1) {
      timers.splice(index, 1);
    }
  }
  _dequeueTimer(id) {
    return () => {
      _FakeAsyncTestZoneSpec._removeTimer(this.pendingTimers, id);
    };
  }
  _requeuePeriodicTimer(fn, interval, args, id) {
    return () => {
      if (this.pendingPeriodicTimers.indexOf(id) !== -1) {
        this._scheduler.scheduleFunction(fn, interval, {
          args,
          isPeriodic: true,
          id,
          isRequeuePeriodic: true
        });
      }
    };
  }
  _dequeuePeriodicTimer(id) {
    return () => {
      _FakeAsyncTestZoneSpec._removeTimer(this.pendingPeriodicTimers, id);
    };
  }
  _setTimeout(fn, delay, args, isTimer = true) {
    let removeTimerFn = this._dequeueTimer(Scheduler.nextId);
    let cb = this._fnAndFlush(fn, { onSuccess: removeTimerFn, onError: removeTimerFn });
    let id = this._scheduler.scheduleFunction(cb, delay, { args, isRequestAnimationFrame: !isTimer });
    if (isTimer) {
      this.pendingTimers.push(id);
    }
    return id;
  }
  _clearTimeout(id) {
    _FakeAsyncTestZoneSpec._removeTimer(this.pendingTimers, id);
    this._scheduler.removeScheduledFunctionWithId(id);
  }
  _setInterval(fn, interval, args) {
    let id = Scheduler.nextId;
    let completers = { onSuccess: null, onError: this._dequeuePeriodicTimer(id) };
    let cb = this._fnAndFlush(fn, completers);
    completers.onSuccess = this._requeuePeriodicTimer(cb, interval, args, id);
    this._scheduler.scheduleFunction(cb, interval, { args, isPeriodic: true });
    this.pendingPeriodicTimers.push(id);
    return id;
  }
  _clearInterval(id) {
    _FakeAsyncTestZoneSpec._removeTimer(this.pendingPeriodicTimers, id);
    this._scheduler.removeScheduledFunctionWithId(id);
  }
  _resetLastErrorAndThrow() {
    let error = this._lastError || this._uncaughtPromiseErrors[0];
    this._uncaughtPromiseErrors.length = 0;
    this._lastError = null;
    throw error;
  }
  getCurrentTickTime() {
    return this._scheduler.getCurrentTickTime();
  }
  getFakeSystemTime() {
    return this._scheduler.getFakeSystemTime();
  }
  setFakeBaseSystemTime(realTime) {
    this._scheduler.setFakeBaseSystemTime(realTime);
  }
  getRealSystemTime() {
    return this._scheduler.getRealSystemTime();
  }
  static patchDate() {
    if (!!global[Zone.__symbol__("disableDatePatching")]) {
      return;
    }
    if (global["Date"] === FakeDate) {
      return;
    }
    global["Date"] = FakeDate;
    FakeDate.prototype = OriginalDate.prototype;
    _FakeAsyncTestZoneSpec.checkTimerPatch();
  }
  static resetDate() {
    if (global["Date"] === FakeDate) {
      global["Date"] = OriginalDate;
    }
  }
  static checkTimerPatch() {
    if (!patchedTimers) {
      throw new Error("Expected timers to have been patched.");
    }
    if (global.setTimeout !== patchedTimers.setTimeout) {
      global.setTimeout = patchedTimers.setTimeout;
      global.clearTimeout = patchedTimers.clearTimeout;
    }
    if (global.setInterval !== patchedTimers.setInterval) {
      global.setInterval = patchedTimers.setInterval;
      global.clearInterval = patchedTimers.clearInterval;
    }
  }
  lockDatePatch() {
    this.patchDateLocked = true;
    _FakeAsyncTestZoneSpec.patchDate();
  }
  unlockDatePatch() {
    this.patchDateLocked = false;
    _FakeAsyncTestZoneSpec.resetDate();
  }
  /** @experimental */
  setTickMode(mode, doTick) {
    if (mode === this.tickMode.mode) {
      return;
    }
    this.tickMode.counter++;
    this.tickMode.mode = mode;
    if (mode === "automatic") {
      this.advanceUntilModeChanges(doTick);
    }
  }
  advanceUntilModeChanges(doTick) {
    _FakeAsyncTestZoneSpec.assertInZone();
    const specZone = Zone.current;
    const { counter } = this.tickMode;
    Zone.root.run(() => __async(this, null, function* () {
      yield safeAsync(() => __async(this, null, function* () {
        yield void 0;
        specZone.run(() => {
          this.flushMicrotasks();
        });
      }));
      if (this.tickMode.counter !== counter) {
        return;
      }
      while (true) {
        yield safeAsync(() => this.newMacrotask(specZone));
        if (this.tickMode.counter !== counter) {
          return;
        }
        yield safeAsync(() => specZone.run(() => {
          this._scheduler.executeNextTask(doTick);
        }));
      }
    }));
  }
  // Waits until a new macro task.
  //
  // Used with autoTick(), which is meant to act when the test is waiting, we
  // need to insert ourselves in the macro task queue.
  //
  // @return {!Promise<undefined>}
  newMacrotask(specZone) {
    return __async(this, null, function* () {
      if (originalSetImmediate) {
        yield new Promise((resolve) => {
          originalSetImmediate(resolve);
        });
      } else {
        const channel = new MessageChannel();
        yield new Promise((resolve) => {
          channel.port1.onmessage = resolve;
          channel.port2.postMessage(void 0);
        });
        channel.port1.close();
        channel.port2.close();
        yield new Promise((resolve) => {
          originalTimeout(resolve);
        });
      }
      specZone.run(() => {
        this.flushMicrotasks();
      });
    });
  }
  tickToNext(steps = 1, doTick, tickOptions = { processNewMacroTasksSynchronously: true }) {
    if (steps <= 0) {
      return;
    }
    _FakeAsyncTestZoneSpec.assertInZone();
    this.flushMicrotasks();
    this._scheduler.tickToNext(steps, doTick, tickOptions);
    if (this._lastError !== null) {
      this._resetLastErrorAndThrow();
    }
  }
  tick(millis = 0, doTick, tickOptions = { processNewMacroTasksSynchronously: true }) {
    _FakeAsyncTestZoneSpec.assertInZone();
    this.flushMicrotasks();
    this._scheduler.tick(millis, doTick, tickOptions);
    if (this._lastError !== null) {
      this._resetLastErrorAndThrow();
    }
  }
  flushMicrotasks() {
    _FakeAsyncTestZoneSpec.assertInZone();
    const flushErrors = () => {
      if (this._lastError !== null || this._uncaughtPromiseErrors.length) {
        this._resetLastErrorAndThrow();
      }
    };
    while (this._microtasks.length > 0) {
      let microtask = this._microtasks.shift();
      microtask.func.apply(microtask.target, microtask.args);
    }
    flushErrors();
  }
  flush(limit, flushPeriodic, doTick) {
    _FakeAsyncTestZoneSpec.assertInZone();
    this.flushMicrotasks();
    const elapsed = this._scheduler.flush(limit, flushPeriodic, doTick);
    if (this._lastError !== null) {
      this._resetLastErrorAndThrow();
    }
    return elapsed;
  }
  flushOnlyPendingTimers(doTick) {
    _FakeAsyncTestZoneSpec.assertInZone();
    this.flushMicrotasks();
    const elapsed = this._scheduler.flushOnlyPendingTimers(doTick);
    if (this._lastError !== null) {
      this._resetLastErrorAndThrow();
    }
    return elapsed;
  }
  removeAllTimers() {
    _FakeAsyncTestZoneSpec.assertInZone();
    this._scheduler.removeAll();
    this.pendingPeriodicTimers = [];
    this.pendingTimers = [];
  }
  getTimerCount() {
    return this._scheduler.getTimerCount() + this._microtasks.length;
  }
  onScheduleTask(delegate, current, target, task) {
    switch (task.type) {
      case "microTask":
        let args = task.data && task.data.args;
        let additionalArgs;
        if (args) {
          let callbackIndex = task.data.cbIdx;
          if (typeof args.length === "number" && args.length > callbackIndex + 1) {
            additionalArgs = Array.prototype.slice.call(args, callbackIndex + 1);
          }
        }
        this._microtasks.push({
          func: task.invoke,
          args: additionalArgs,
          target: task.data && task.data.target
        });
        break;
      case "macroTask":
        switch (task.source) {
          case "setTimeout":
            task.data["handleId"] = this._setTimeout(task.invoke, task.data["delay"], Array.prototype.slice.call(task.data["args"], 2));
            break;
          case "setImmediate":
            task.data["handleId"] = this._setTimeout(task.invoke, 0, Array.prototype.slice.call(task.data["args"], 1));
            break;
          case "setInterval":
            task.data["handleId"] = this._setInterval(task.invoke, task.data["delay"], Array.prototype.slice.call(task.data["args"], 2));
            break;
          case "XMLHttpRequest.send":
            if (this.tickMode.mode === "manual") {
              throw new Error("Cannot make XHRs from within a fake async test. Request URL: " + task.data["url"]);
            }
            task = delegate.scheduleTask(target, task);
            break;
          case "requestAnimationFrame":
          case "webkitRequestAnimationFrame":
          case "mozRequestAnimationFrame":
            task.data["handleId"] = this._setTimeout(task.invoke, 16, task.data["args"], this.trackPendingRequestAnimationFrame);
            break;
          default:
            const macroTaskOption = this.findMacroTaskOption(task);
            if (macroTaskOption) {
              const args2 = task.data && task.data["args"];
              const delay = args2 && args2.length > 1 ? args2[1] : 0;
              let callbackArgs = macroTaskOption.callbackArgs ? macroTaskOption.callbackArgs : args2;
              if (!!macroTaskOption.isPeriodic) {
                task.data["handleId"] = this._setInterval(task.invoke, delay, callbackArgs);
                task.data.isPeriodic = true;
              } else {
                task.data["handleId"] = this._setTimeout(task.invoke, delay, callbackArgs);
              }
              break;
            }
            throw new Error("Unknown macroTask scheduled in fake async test: " + task.source);
        }
        break;
      case "eventTask":
        task = delegate.scheduleTask(target, task);
        break;
    }
    return task;
  }
  onCancelTask(delegate, current, target, task) {
    switch (task.source) {
      case "setTimeout":
      case "requestAnimationFrame":
      case "webkitRequestAnimationFrame":
      case "mozRequestAnimationFrame":
        return this._clearTimeout(task.data["handleId"]);
      case "setInterval":
        return this._clearInterval(task.data["handleId"]);
      default:
        const macroTaskOption = this.findMacroTaskOption(task);
        if (macroTaskOption) {
          const handleId = task.data["handleId"];
          return macroTaskOption.isPeriodic ? this._clearInterval(handleId) : this._clearTimeout(handleId);
        }
        return delegate.cancelTask(target, task);
    }
  }
  onInvoke(delegate, current, target, callback, applyThis, applyArgs, source) {
    try {
      _FakeAsyncTestZoneSpec.patchDate();
      return delegate.invoke(target, callback, applyThis, applyArgs, source);
    } finally {
      if (!this.patchDateLocked) {
        _FakeAsyncTestZoneSpec.resetDate();
      }
    }
  }
  findMacroTaskOption(task) {
    if (!this.macroTaskOptions) {
      return null;
    }
    for (let i = 0; i < this.macroTaskOptions.length; i++) {
      const macroTaskOption = this.macroTaskOptions[i];
      if (macroTaskOption.source === task.source) {
        return macroTaskOption;
      }
    }
    return null;
  }
  onHandleError(parentZoneDelegate, currentZone, targetZone, error) {
    this._lastError = error;
    return false;
  }
};
var _fakeAsyncTestZoneSpec = null;
function getProxyZoneSpec() {
  return Zone && Zone["ProxyZoneSpec"];
}
var _sharedProxyZoneSpec = null;
var _sharedProxyZone = null;
function resetFakeAsyncZone() {
  var _a, _b;
  if (_fakeAsyncTestZoneSpec) {
    _fakeAsyncTestZoneSpec.unlockDatePatch();
  }
  _fakeAsyncTestZoneSpec = null;
  (_b = (_a = getProxyZoneSpec()) == null ? void 0 : _a.get()) == null ? void 0 : _b.resetDelegate();
  _sharedProxyZoneSpec == null ? void 0 : _sharedProxyZoneSpec.resetDelegate();
}
function fakeAsync(fn, options = {}) {
  const { flush: flush2 = true } = options;
  const fakeAsyncFn = function(...args) {
    const ProxyZoneSpec = getProxyZoneSpec();
    if (!ProxyZoneSpec) {
      throwProxyZoneError();
    }
    const proxyZoneSpec = ProxyZoneSpec.assertPresent();
    if (Zone.current.get("FakeAsyncTestZoneSpec")) {
      throw new Error("fakeAsync() calls can not be nested");
    }
    try {
      if (!_fakeAsyncTestZoneSpec) {
        const FakeAsyncTestZoneSpec2 = Zone && Zone["FakeAsyncTestZoneSpec"];
        if (proxyZoneSpec.getDelegate() instanceof FakeAsyncTestZoneSpec2) {
          throw new Error("fakeAsync() calls can not be nested");
        }
        _fakeAsyncTestZoneSpec = new FakeAsyncTestZoneSpec2();
      }
      let res;
      const lastProxyZoneSpec = proxyZoneSpec.getDelegate();
      proxyZoneSpec.setDelegate(_fakeAsyncTestZoneSpec);
      _fakeAsyncTestZoneSpec.lockDatePatch();
      try {
        res = fn.apply(this, args);
        if (flush2) {
          _fakeAsyncTestZoneSpec.flush(20, true);
        } else {
          flushMicrotasks();
        }
      } finally {
        proxyZoneSpec.setDelegate(lastProxyZoneSpec);
      }
      if (!flush2) {
        if (_fakeAsyncTestZoneSpec.pendingPeriodicTimers.length > 0) {
          throw new Error(`${_fakeAsyncTestZoneSpec.pendingPeriodicTimers.length} periodic timer(s) still in the queue.`);
        }
        if (_fakeAsyncTestZoneSpec.pendingTimers.length > 0) {
          throw new Error(`${_fakeAsyncTestZoneSpec.pendingTimers.length} timer(s) still in the queue.`);
        }
      }
      return res;
    } finally {
      resetFakeAsyncZone();
    }
  };
  fakeAsyncFn.isFakeAsync = true;
  return fakeAsyncFn;
}
function _getFakeAsyncZoneSpec() {
  if (_fakeAsyncTestZoneSpec == null) {
    _fakeAsyncTestZoneSpec = Zone.current.get("FakeAsyncTestZoneSpec");
    if (_fakeAsyncTestZoneSpec == null) {
      throw new Error("The code should be running in the fakeAsync zone to call this function");
    }
  }
  return _fakeAsyncTestZoneSpec;
}
function tick(millis = 0, ignoreNestedTimeout = false) {
  _getFakeAsyncZoneSpec().tick(millis, null, ignoreNestedTimeout);
}
function flush(maxTurns) {
  return _getFakeAsyncZoneSpec().flush(maxTurns);
}
function discardPeriodicTasks() {
  const zoneSpec = _getFakeAsyncZoneSpec();
  const pendingTimers = zoneSpec.pendingPeriodicTimers;
  zoneSpec.pendingPeriodicTimers.length = 0;
}
function withProxyZone(fn) {
  const autoProxyFn = function(...args) {
    const proxyZoneSpec = getProxyZoneSpec();
    if (proxyZoneSpec === void 0) {
      throw new Error("ProxyZoneSpec is needed for the withProxyZone() test helper but could not be found. Make sure that your environment includes zone-testing.js");
    }
    const proxyZone = proxyZoneSpec.get() !== void 0 ? Zone.current : getOrCreateRootProxy();
    return proxyZone.run(fn, this, args);
  };
  return autoProxyFn;
}
function getOrCreateRootProxy() {
  const ProxyZoneSpec = getProxyZoneSpec();
  if (ProxyZoneSpec === void 0) {
    throw new Error("ProxyZoneSpec is needed for withProxyZone but could not be found. Make sure that your environment includes zone-testing.js");
  }
  if (_sharedProxyZoneSpec === null) {
    _sharedProxyZoneSpec = new ProxyZoneSpec();
  }
  _sharedProxyZone = Zone.root.fork(_sharedProxyZoneSpec);
  return _sharedProxyZone;
}
function flushMicrotasks() {
  _getFakeAsyncZoneSpec().flushMicrotasks();
}
function patchFakeAsyncTest(Zone2) {
  Zone2["FakeAsyncTestZoneSpec"] = FakeAsyncTestZoneSpec;
  Zone2.__load_patch("fakeasync", (global2, Zone3, api) => {
    Zone3[api.symbol("fakeAsyncTest")] = {
      resetFakeAsyncZone,
      flushMicrotasks,
      discardPeriodicTasks,
      tick,
      flush,
      fakeAsync,
      withProxyZone
    };
  }, true);
  patchedTimers = {
    setTimeout: global.setTimeout,
    setInterval: global.setInterval,
    clearTimeout: global.clearTimeout,
    clearInterval: global.clearInterval,
    nativeSetTimeout: global[Zone2.__symbol__("setTimeout")],
    nativeClearTimeout: global[Zone2.__symbol__("clearTimeout")]
  };
  Scheduler.nextId = Scheduler.getNextId();
}
function safeAsync(fn) {
  return __async(this, null, function* () {
    try {
      return yield fn();
    } catch (e) {
      hostReportError(e);
    }
  });
}
function hostReportError(e) {
  Zone.root.run(() => {
    originalTimeout(() => {
      throw e;
    });
  });
}

// packages/zone.js/lib/testing/fake-async.js
patchFakeAsyncTest(Zone);
