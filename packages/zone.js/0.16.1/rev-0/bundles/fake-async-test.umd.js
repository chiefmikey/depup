'use strict';
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
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
    var __getOwnPropSymbols = Object.getOwnPropertySymbols;
    var __hasOwnProp = Object.prototype.hasOwnProperty;
    var __propIsEnum = Object.prototype.propertyIsEnumerable;
    var __defNormalProp = function (obj, key, value) { return key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value: value }) : obj[key] = value; };
    var __spreadValues = function (a, b) {
        for (var prop in b || (b = {}))
            if (__hasOwnProp.call(b, prop))
                __defNormalProp(a, prop, b[prop]);
        if (__getOwnPropSymbols)
            for (var _i = 0, _c = __getOwnPropSymbols(b); _i < _c.length; _i++) {
                var prop = _c[_i];
                if (__propIsEnum.call(b, prop))
                    __defNormalProp(a, prop, b[prop]);
            }
        return a;
    };
    var __publicField = function (obj, key, value) {
        __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
        return value;
    };
    var __async = function (__this, __arguments, generator) {
        return new Promise(function (resolve, reject) {
            var fulfilled = function (value) {
                try {
                    step(generator.next(value));
                }
                catch (e) {
                    reject(e);
                }
            };
            var rejected = function (value) {
                try {
                    step(generator.throw(value));
                }
                catch (e) {
                    reject(e);
                }
            };
            var step = function (x) { return x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected); };
            step((generator = generator.apply(__this, __arguments)).next());
        });
    };
    // packages/zone.js/lib/zone-spec/proxy.js
    function throwProxyZoneError() {
        var jestPatched = typeof jest !== "undefined" && jest["__zone_patch__"];
        if (jestPatched) {
            throw new Error("Only globals are patched with zone-testing. If you import `it`, `describe`, etc. directly, you cannot use `fakeAsync` or `waitForAsync`.");
        }
        else {
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
            var d = new OriginalDate();
            d.setTime(FakeDate.now());
            return d;
        }
        else {
            var args = Array.prototype.slice.call(arguments);
            return new (OriginalDate.bind.apply(OriginalDate, __spreadArray([void 0], args, false)))();
        }
    }
    FakeDate.now = function () {
        var fakeAsyncTestZoneSpec = Zone.current.get("FakeAsyncTestZoneSpec");
        if (fakeAsyncTestZoneSpec) {
            return fakeAsyncTestZoneSpec.getFakeSystemTime();
        }
        return OriginalDate.now.apply(this, arguments);
    };
    FakeDate.UTC = OriginalDate.UTC;
    FakeDate.parse = OriginalDate.parse;
    var patchedTimers;
    var timeoutCallback = function () {
    };
    var _Scheduler = /** @class */ (function () {
        function _Scheduler() {
            // Scheduler queue with the tuple of end time and callback function - sorted by end time.
            __publicField(this, "_schedulerQueue", []);
            // Current simulated time in millis.
            __publicField(this, "_currentTickTime", 0);
            // Current fake system base time in millis.
            __publicField(this, "_currentFakeBaseSystemTime", OriginalDate.now());
            // track requeuePeriodicTimer
            __publicField(this, "_currentTickRequeuePeriodicEntries", []);
        }
        _Scheduler.getNextId = function () {
            var id = patchedTimers.nativeSetTimeout.call(global, timeoutCallback, 0);
            patchedTimers.nativeClearTimeout.call(global, id);
            if (typeof id === "number") {
                return id;
            }
            return _Scheduler.nextNodeJSId++;
        };
        _Scheduler.prototype.getCurrentTickTime = function () {
            return this._currentTickTime;
        };
        _Scheduler.prototype.getFakeSystemTime = function () {
            return this._currentFakeBaseSystemTime + this._currentTickTime;
        };
        _Scheduler.prototype.setFakeBaseSystemTime = function (fakeBaseSystemTime) {
            this._currentFakeBaseSystemTime = fakeBaseSystemTime;
        };
        _Scheduler.prototype.getRealSystemTime = function () {
            return OriginalDate.now();
        };
        _Scheduler.prototype.scheduleFunction = function (cb, delay, options) {
            options = __spreadValues(__spreadValues({}, {
                args: [],
                isPeriodic: false,
                isRequestAnimationFrame: false,
                id: -1,
                isRequeuePeriodic: false
            }), options);
            var currentId = options.id < 0 ? _Scheduler.nextId : options.id;
            _Scheduler.nextId = _Scheduler.getNextId();
            var endTime = this._currentTickTime + delay;
            var newEntry = {
                endTime: endTime,
                id: currentId,
                func: cb,
                args: options.args,
                delay: delay,
                isPeriodic: options.isPeriodic,
                isRequestAnimationFrame: options.isRequestAnimationFrame
            };
            if (options.isRequeuePeriodic) {
                this._currentTickRequeuePeriodicEntries.push(newEntry);
            }
            var i = 0;
            for (; i < this._schedulerQueue.length; i++) {
                var currentEntry = this._schedulerQueue[i];
                if (newEntry.endTime < currentEntry.endTime) {
                    break;
                }
            }
            this._schedulerQueue.splice(i, 0, newEntry);
            return currentId;
        };
        _Scheduler.prototype.removeScheduledFunctionWithId = function (id) {
            for (var i = 0; i < this._schedulerQueue.length; i++) {
                if (this._schedulerQueue[i].id == id) {
                    this._schedulerQueue.splice(i, 1);
                    break;
                }
            }
        };
        _Scheduler.prototype.removeAll = function () {
            this._schedulerQueue = [];
        };
        _Scheduler.prototype.getTimerCount = function () {
            return this._schedulerQueue.length;
        };
        _Scheduler.prototype.tickToNext = function (step, doTick, tickOptions) {
            if (step === void 0) { step = 1; }
            if (this._schedulerQueue.length < step) {
                return;
            }
            var startTime = this._currentTickTime;
            var targetTask = this._schedulerQueue[step - 1];
            this.tick(targetTask.endTime - startTime, doTick, tickOptions);
        };
        _Scheduler.prototype.tick = function (millis, doTick, tickOptions) {
            if (millis === void 0) { millis = 0; }
            var finalTime = this._currentTickTime + millis;
            var lastCurrentTime = 0;
            tickOptions = Object.assign({ processNewMacroTasksSynchronously: true }, tickOptions);
            var schedulerQueue = tickOptions.processNewMacroTasksSynchronously ? this._schedulerQueue : this._schedulerQueue.slice();
            if (schedulerQueue.length === 0 && doTick) {
                doTick(millis);
                return;
            }
            while (schedulerQueue.length > 0) {
                this._currentTickRequeuePeriodicEntries = [];
                var current = schedulerQueue[0];
                if (finalTime < current.endTime) {
                    break;
                }
                else {
                    var current2 = schedulerQueue.shift();
                    if (!tickOptions.processNewMacroTasksSynchronously) {
                        var idx = this._schedulerQueue.indexOf(current2);
                        if (idx >= 0) {
                            this._schedulerQueue.splice(idx, 1);
                        }
                    }
                    lastCurrentTime = this._currentTickTime;
                    this._currentTickTime = current2.endTime;
                    if (doTick) {
                        doTick(this._currentTickTime - lastCurrentTime);
                    }
                    var retval = current2.func.apply(global, current2.isRequestAnimationFrame ? [this._currentTickTime] : current2.args);
                    if (!retval) {
                        break;
                    }
                    if (!tickOptions.processNewMacroTasksSynchronously) {
                        this._currentTickRequeuePeriodicEntries.forEach(function (newEntry) {
                            var i = 0;
                            for (; i < schedulerQueue.length; i++) {
                                var currentEntry = schedulerQueue[i];
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
        };
        _Scheduler.prototype.executeNextTask = function (doTick) {
            var current = this._schedulerQueue.shift();
            if (current === void 0) {
                return;
            }
            doTick == null ? void 0 : doTick(current.endTime - this._currentTickTime);
            this._currentTickTime = current.endTime;
            current.func.apply(global, current.isRequestAnimationFrame ? [this._currentTickTime] : current.args);
        };
        _Scheduler.prototype.flushOnlyPendingTimers = function (doTick) {
            if (this._schedulerQueue.length === 0) {
                return 0;
            }
            var startTime = this._currentTickTime;
            var lastTask = this._schedulerQueue[this._schedulerQueue.length - 1];
            this.tick(lastTask.endTime - startTime, doTick, { processNewMacroTasksSynchronously: false });
            return this._currentTickTime - startTime;
        };
        _Scheduler.prototype.flush = function (limit, flushPeriodic, doTick) {
            if (limit === void 0) { limit = 20; }
            if (flushPeriodic === void 0) { flushPeriodic = false; }
            if (flushPeriodic) {
                return this.flushPeriodic(doTick);
            }
            else {
                return this.flushNonPeriodic(limit, doTick);
            }
        };
        _Scheduler.prototype.flushPeriodic = function (doTick) {
            if (this._schedulerQueue.length === 0) {
                return 0;
            }
            var startTime = this._currentTickTime;
            var lastTask = this._schedulerQueue[this._schedulerQueue.length - 1];
            this.tick(lastTask.endTime - startTime, doTick);
            return this._currentTickTime - startTime;
        };
        _Scheduler.prototype.flushNonPeriodic = function (limit, doTick) {
            var startTime = this._currentTickTime;
            var lastCurrentTime = 0;
            var count = 0;
            while (this._schedulerQueue.length > 0) {
                count++;
                if (count > limit) {
                    throw new Error("flush failed after reaching the limit of " + limit + " tasks. Does your code use a polling timeout?");
                }
                if (this._schedulerQueue.filter(function (task) { return !task.isPeriodic && !task.isRequestAnimationFrame; }).length === 0) {
                    break;
                }
                var current = this._schedulerQueue.shift();
                lastCurrentTime = this._currentTickTime;
                this._currentTickTime = current.endTime;
                if (doTick) {
                    doTick(this._currentTickTime - lastCurrentTime);
                }
                var retval = current.func.apply(global, current.args);
                if (!retval) {
                    break;
                }
            }
            return this._currentTickTime - startTime;
        };
        return _Scheduler;
    }());
    // Next scheduler id.
    __publicField(_Scheduler, "nextNodeJSId", 1);
    __publicField(_Scheduler, "nextId", -1);
    var Scheduler = _Scheduler;
    var FakeAsyncTestZoneSpec = /** @class */ (function () {
        function _FakeAsyncTestZoneSpec(namePrefix, trackPendingRequestAnimationFrame, macroTaskOptions) {
            if (trackPendingRequestAnimationFrame === void 0) { trackPendingRequestAnimationFrame = false; }
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
        _FakeAsyncTestZoneSpec.assertInZone = function () {
            if (Zone.current.get("FakeAsyncTestZoneSpec") == null) {
                throw new Error("The code should be running in the fakeAsync zone to call this function");
            }
        };
        _FakeAsyncTestZoneSpec.prototype._fnAndFlush = function (fn, completers) {
            var _this = this;
            return function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                fn.apply(global, args);
                if (_this._lastError === null) {
                    if (completers.onSuccess != null) {
                        completers.onSuccess.apply(global);
                    }
                    _this.flushMicrotasks();
                }
                else {
                    if (completers.onError != null) {
                        completers.onError.apply(global);
                    }
                }
                return _this._lastError === null;
            };
        };
        _FakeAsyncTestZoneSpec._removeTimer = function (timers, id) {
            var index = timers.indexOf(id);
            if (index > -1) {
                timers.splice(index, 1);
            }
        };
        _FakeAsyncTestZoneSpec.prototype._dequeueTimer = function (id) {
            var _this = this;
            return function () {
                _FakeAsyncTestZoneSpec._removeTimer(_this.pendingTimers, id);
            };
        };
        _FakeAsyncTestZoneSpec.prototype._requeuePeriodicTimer = function (fn, interval, args, id) {
            var _this = this;
            return function () {
                if (_this.pendingPeriodicTimers.indexOf(id) !== -1) {
                    _this._scheduler.scheduleFunction(fn, interval, {
                        args: args,
                        isPeriodic: true,
                        id: id,
                        isRequeuePeriodic: true
                    });
                }
            };
        };
        _FakeAsyncTestZoneSpec.prototype._dequeuePeriodicTimer = function (id) {
            var _this = this;
            return function () {
                _FakeAsyncTestZoneSpec._removeTimer(_this.pendingPeriodicTimers, id);
            };
        };
        _FakeAsyncTestZoneSpec.prototype._setTimeout = function (fn, delay, args, isTimer) {
            if (isTimer === void 0) { isTimer = true; }
            var removeTimerFn = this._dequeueTimer(Scheduler.nextId);
            var cb = this._fnAndFlush(fn, { onSuccess: removeTimerFn, onError: removeTimerFn });
            var id = this._scheduler.scheduleFunction(cb, delay, { args: args, isRequestAnimationFrame: !isTimer });
            if (isTimer) {
                this.pendingTimers.push(id);
            }
            return id;
        };
        _FakeAsyncTestZoneSpec.prototype._clearTimeout = function (id) {
            _FakeAsyncTestZoneSpec._removeTimer(this.pendingTimers, id);
            this._scheduler.removeScheduledFunctionWithId(id);
        };
        _FakeAsyncTestZoneSpec.prototype._setInterval = function (fn, interval, args) {
            var id = Scheduler.nextId;
            var completers = { onSuccess: null, onError: this._dequeuePeriodicTimer(id) };
            var cb = this._fnAndFlush(fn, completers);
            completers.onSuccess = this._requeuePeriodicTimer(cb, interval, args, id);
            this._scheduler.scheduleFunction(cb, interval, { args: args, isPeriodic: true });
            this.pendingPeriodicTimers.push(id);
            return id;
        };
        _FakeAsyncTestZoneSpec.prototype._clearInterval = function (id) {
            _FakeAsyncTestZoneSpec._removeTimer(this.pendingPeriodicTimers, id);
            this._scheduler.removeScheduledFunctionWithId(id);
        };
        _FakeAsyncTestZoneSpec.prototype._resetLastErrorAndThrow = function () {
            var error = this._lastError || this._uncaughtPromiseErrors[0];
            this._uncaughtPromiseErrors.length = 0;
            this._lastError = null;
            throw error;
        };
        _FakeAsyncTestZoneSpec.prototype.getCurrentTickTime = function () {
            return this._scheduler.getCurrentTickTime();
        };
        _FakeAsyncTestZoneSpec.prototype.getFakeSystemTime = function () {
            return this._scheduler.getFakeSystemTime();
        };
        _FakeAsyncTestZoneSpec.prototype.setFakeBaseSystemTime = function (realTime) {
            this._scheduler.setFakeBaseSystemTime(realTime);
        };
        _FakeAsyncTestZoneSpec.prototype.getRealSystemTime = function () {
            return this._scheduler.getRealSystemTime();
        };
        _FakeAsyncTestZoneSpec.patchDate = function () {
            if (!!global[Zone.__symbol__("disableDatePatching")]) {
                return;
            }
            if (global["Date"] === FakeDate) {
                return;
            }
            global["Date"] = FakeDate;
            FakeDate.prototype = OriginalDate.prototype;
            _FakeAsyncTestZoneSpec.checkTimerPatch();
        };
        _FakeAsyncTestZoneSpec.resetDate = function () {
            if (global["Date"] === FakeDate) {
                global["Date"] = OriginalDate;
            }
        };
        _FakeAsyncTestZoneSpec.checkTimerPatch = function () {
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
        };
        _FakeAsyncTestZoneSpec.prototype.lockDatePatch = function () {
            this.patchDateLocked = true;
            _FakeAsyncTestZoneSpec.patchDate();
        };
        _FakeAsyncTestZoneSpec.prototype.unlockDatePatch = function () {
            this.patchDateLocked = false;
            _FakeAsyncTestZoneSpec.resetDate();
        };
        /** @experimental */
        _FakeAsyncTestZoneSpec.prototype.setTickMode = function (mode, doTick) {
            if (mode === this.tickMode.mode) {
                return;
            }
            this.tickMode.counter++;
            this.tickMode.mode = mode;
            if (mode === "automatic") {
                this.advanceUntilModeChanges(doTick);
            }
        };
        _FakeAsyncTestZoneSpec.prototype.advanceUntilModeChanges = function (doTick) {
            var _this = this;
            _FakeAsyncTestZoneSpec.assertInZone();
            var specZone = Zone.current;
            var counter = this.tickMode.counter;
            Zone.root.run(function () { return __async(_this, null, function () {
                var _this = this;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0: return [4 /*yield*/, safeAsync(function () { return __async(_this, null, function () {
                                var _this = this;
                                return __generator(this, function (_c) {
                                    switch (_c.label) {
                                        case 0: return [4 /*yield*/, void 0];
                                        case 1:
                                            _c.sent();
                                            specZone.run(function () {
                                                _this.flushMicrotasks();
                                            });
                                            return [2 /*return*/];
                                    }
                                });
                            }); })];
                        case 1:
                            _c.sent();
                            if (this.tickMode.counter !== counter) {
                                return [2 /*return*/];
                            }
                            _c.label = 2;
                        case 2:
                            if (!true) return [3 /*break*/, 5];
                            return [4 /*yield*/, safeAsync(function () { return _this.newMacrotask(specZone); })];
                        case 3:
                            _c.sent();
                            if (this.tickMode.counter !== counter) {
                                return [2 /*return*/];
                            }
                            return [4 /*yield*/, safeAsync(function () { return specZone.run(function () {
                                    _this._scheduler.executeNextTask(doTick);
                                }); })];
                        case 4:
                            _c.sent();
                            return [3 /*break*/, 2];
                        case 5: return [2 /*return*/];
                    }
                });
            }); });
        };
        // Waits until a new macro task.
        //
        // Used with autoTick(), which is meant to act when the test is waiting, we
        // need to insert ourselves in the macro task queue.
        //
        // @return {!Promise<undefined>}
        _FakeAsyncTestZoneSpec.prototype.newMacrotask = function (specZone) {
            return __async(this, null, function () {
                var channel_1;
                var _this = this;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            if (!originalSetImmediate) return [3 /*break*/, 2];
                            return [4 /*yield*/, new Promise(function (resolve) {
                                    originalSetImmediate(resolve);
                                })];
                        case 1:
                            _c.sent();
                            return [3 /*break*/, 5];
                        case 2:
                            channel_1 = new MessageChannel();
                            return [4 /*yield*/, new Promise(function (resolve) {
                                    channel_1.port1.onmessage = resolve;
                                    channel_1.port2.postMessage(void 0);
                                })];
                        case 3:
                            _c.sent();
                            channel_1.port1.close();
                            channel_1.port2.close();
                            return [4 /*yield*/, new Promise(function (resolve) {
                                    originalTimeout(resolve);
                                })];
                        case 4:
                            _c.sent();
                            _c.label = 5;
                        case 5:
                            specZone.run(function () {
                                _this.flushMicrotasks();
                            });
                            return [2 /*return*/];
                    }
                });
            });
        };
        _FakeAsyncTestZoneSpec.prototype.tickToNext = function (steps, doTick, tickOptions) {
            if (steps === void 0) { steps = 1; }
            if (tickOptions === void 0) { tickOptions = { processNewMacroTasksSynchronously: true }; }
            if (steps <= 0) {
                return;
            }
            _FakeAsyncTestZoneSpec.assertInZone();
            this.flushMicrotasks();
            this._scheduler.tickToNext(steps, doTick, tickOptions);
            if (this._lastError !== null) {
                this._resetLastErrorAndThrow();
            }
        };
        _FakeAsyncTestZoneSpec.prototype.tick = function (millis, doTick, tickOptions) {
            if (millis === void 0) { millis = 0; }
            if (tickOptions === void 0) { tickOptions = { processNewMacroTasksSynchronously: true }; }
            _FakeAsyncTestZoneSpec.assertInZone();
            this.flushMicrotasks();
            this._scheduler.tick(millis, doTick, tickOptions);
            if (this._lastError !== null) {
                this._resetLastErrorAndThrow();
            }
        };
        _FakeAsyncTestZoneSpec.prototype.flushMicrotasks = function () {
            var _this = this;
            _FakeAsyncTestZoneSpec.assertInZone();
            var flushErrors = function () {
                if (_this._lastError !== null || _this._uncaughtPromiseErrors.length) {
                    _this._resetLastErrorAndThrow();
                }
            };
            while (this._microtasks.length > 0) {
                var microtask = this._microtasks.shift();
                microtask.func.apply(microtask.target, microtask.args);
            }
            flushErrors();
        };
        _FakeAsyncTestZoneSpec.prototype.flush = function (limit, flushPeriodic, doTick) {
            _FakeAsyncTestZoneSpec.assertInZone();
            this.flushMicrotasks();
            var elapsed = this._scheduler.flush(limit, flushPeriodic, doTick);
            if (this._lastError !== null) {
                this._resetLastErrorAndThrow();
            }
            return elapsed;
        };
        _FakeAsyncTestZoneSpec.prototype.flushOnlyPendingTimers = function (doTick) {
            _FakeAsyncTestZoneSpec.assertInZone();
            this.flushMicrotasks();
            var elapsed = this._scheduler.flushOnlyPendingTimers(doTick);
            if (this._lastError !== null) {
                this._resetLastErrorAndThrow();
            }
            return elapsed;
        };
        _FakeAsyncTestZoneSpec.prototype.removeAllTimers = function () {
            _FakeAsyncTestZoneSpec.assertInZone();
            this._scheduler.removeAll();
            this.pendingPeriodicTimers = [];
            this.pendingTimers = [];
        };
        _FakeAsyncTestZoneSpec.prototype.getTimerCount = function () {
            return this._scheduler.getTimerCount() + this._microtasks.length;
        };
        _FakeAsyncTestZoneSpec.prototype.onScheduleTask = function (delegate, current, target, task) {
            switch (task.type) {
                case "microTask":
                    var args = task.data && task.data.args;
                    var additionalArgs = void 0;
                    if (args) {
                        var callbackIndex = task.data.cbIdx;
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
                            var macroTaskOption = this.findMacroTaskOption(task);
                            if (macroTaskOption) {
                                var args2 = task.data && task.data["args"];
                                var delay = args2 && args2.length > 1 ? args2[1] : 0;
                                var callbackArgs = macroTaskOption.callbackArgs ? macroTaskOption.callbackArgs : args2;
                                if (!!macroTaskOption.isPeriodic) {
                                    task.data["handleId"] = this._setInterval(task.invoke, delay, callbackArgs);
                                    task.data.isPeriodic = true;
                                }
                                else {
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
        };
        _FakeAsyncTestZoneSpec.prototype.onCancelTask = function (delegate, current, target, task) {
            switch (task.source) {
                case "setTimeout":
                case "requestAnimationFrame":
                case "webkitRequestAnimationFrame":
                case "mozRequestAnimationFrame":
                    return this._clearTimeout(task.data["handleId"]);
                case "setInterval":
                    return this._clearInterval(task.data["handleId"]);
                default:
                    var macroTaskOption = this.findMacroTaskOption(task);
                    if (macroTaskOption) {
                        var handleId = task.data["handleId"];
                        return macroTaskOption.isPeriodic ? this._clearInterval(handleId) : this._clearTimeout(handleId);
                    }
                    return delegate.cancelTask(target, task);
            }
        };
        _FakeAsyncTestZoneSpec.prototype.onInvoke = function (delegate, current, target, callback, applyThis, applyArgs, source) {
            try {
                _FakeAsyncTestZoneSpec.patchDate();
                return delegate.invoke(target, callback, applyThis, applyArgs, source);
            }
            finally {
                if (!this.patchDateLocked) {
                    _FakeAsyncTestZoneSpec.resetDate();
                }
            }
        };
        _FakeAsyncTestZoneSpec.prototype.findMacroTaskOption = function (task) {
            if (!this.macroTaskOptions) {
                return null;
            }
            for (var i = 0; i < this.macroTaskOptions.length; i++) {
                var macroTaskOption = this.macroTaskOptions[i];
                if (macroTaskOption.source === task.source) {
                    return macroTaskOption;
                }
            }
            return null;
        };
        _FakeAsyncTestZoneSpec.prototype.onHandleError = function (parentZoneDelegate, currentZone, targetZone, error) {
            this._lastError = error;
            return false;
        };
        return _FakeAsyncTestZoneSpec;
    }());
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
    function fakeAsync(fn, options) {
        if (options === void 0) { options = {}; }
        var _c = options.flush, flush2 = _c === void 0 ? true : _c;
        var fakeAsyncFn = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            var ProxyZoneSpec = getProxyZoneSpec();
            if (!ProxyZoneSpec) {
                throwProxyZoneError();
            }
            var proxyZoneSpec = ProxyZoneSpec.assertPresent();
            if (Zone.current.get("FakeAsyncTestZoneSpec")) {
                throw new Error("fakeAsync() calls can not be nested");
            }
            try {
                if (!_fakeAsyncTestZoneSpec) {
                    var FakeAsyncTestZoneSpec2 = Zone && Zone["FakeAsyncTestZoneSpec"];
                    if (proxyZoneSpec.getDelegate() instanceof FakeAsyncTestZoneSpec2) {
                        throw new Error("fakeAsync() calls can not be nested");
                    }
                    _fakeAsyncTestZoneSpec = new FakeAsyncTestZoneSpec2();
                }
                var res = void 0;
                var lastProxyZoneSpec = proxyZoneSpec.getDelegate();
                proxyZoneSpec.setDelegate(_fakeAsyncTestZoneSpec);
                _fakeAsyncTestZoneSpec.lockDatePatch();
                try {
                    res = fn.apply(this, args);
                    if (flush2) {
                        _fakeAsyncTestZoneSpec.flush(20, true);
                    }
                    else {
                        flushMicrotasks();
                    }
                }
                finally {
                    proxyZoneSpec.setDelegate(lastProxyZoneSpec);
                }
                if (!flush2) {
                    if (_fakeAsyncTestZoneSpec.pendingPeriodicTimers.length > 0) {
                        throw new Error("".concat(_fakeAsyncTestZoneSpec.pendingPeriodicTimers.length, " periodic timer(s) still in the queue."));
                    }
                    if (_fakeAsyncTestZoneSpec.pendingTimers.length > 0) {
                        throw new Error("".concat(_fakeAsyncTestZoneSpec.pendingTimers.length, " timer(s) still in the queue."));
                    }
                }
                return res;
            }
            finally {
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
    function tick(millis, ignoreNestedTimeout) {
        if (millis === void 0) { millis = 0; }
        if (ignoreNestedTimeout === void 0) { ignoreNestedTimeout = false; }
        _getFakeAsyncZoneSpec().tick(millis, null, ignoreNestedTimeout);
    }
    function flush(maxTurns) {
        return _getFakeAsyncZoneSpec().flush(maxTurns);
    }
    function discardPeriodicTasks() {
        var zoneSpec = _getFakeAsyncZoneSpec();
        var pendingTimers = zoneSpec.pendingPeriodicTimers;
        zoneSpec.pendingPeriodicTimers.length = 0;
    }
    function withProxyZone(fn) {
        var autoProxyFn = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            var proxyZoneSpec = getProxyZoneSpec();
            if (proxyZoneSpec === void 0) {
                throw new Error("ProxyZoneSpec is needed for the withProxyZone() test helper but could not be found. Make sure that your environment includes zone-testing.js");
            }
            var proxyZone = proxyZoneSpec.get() !== void 0 ? Zone.current : getOrCreateRootProxy();
            return proxyZone.run(fn, this, args);
        };
        return autoProxyFn;
    }
    function getOrCreateRootProxy() {
        var ProxyZoneSpec = getProxyZoneSpec();
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
        Zone2.__load_patch("fakeasync", function (global2, Zone3, api) {
            Zone3[api.symbol("fakeAsyncTest")] = {
                resetFakeAsyncZone: resetFakeAsyncZone,
                flushMicrotasks: flushMicrotasks,
                discardPeriodicTasks: discardPeriodicTasks,
                tick: tick,
                flush: flush,
                fakeAsync: fakeAsync,
                withProxyZone: withProxyZone
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
        return __async(this, null, function () {
            var e_1;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, fn()];
                    case 1: return [2 /*return*/, _c.sent()];
                    case 2:
                        e_1 = _c.sent();
                        hostReportError(e_1);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    }
    function hostReportError(e) {
        Zone.root.run(function () {
            originalTimeout(function () {
                throw e;
            });
        });
    }
    // packages/zone.js/lib/testing/fake-async.js
    patchFakeAsyncTest(Zone);
    if (__exports != exports)
        module.exports = exports;
    return module.exports;
}));
