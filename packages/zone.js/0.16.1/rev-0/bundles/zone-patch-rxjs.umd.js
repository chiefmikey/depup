'use strict';
/**
 * @license Angular
 * (c) 2010-2026 Google LLC. https://angular.dev/
 * License: MIT
 */ (function (g, f) { if (typeof define == "function" && define.amd) {
    define(["rxjs"], function (_d_0) { var d = { "rxjs": _d_0 }, r = function (m) { if (m in d)
        return d[m]; if (typeof require == "function")
        return require(m); throw new Error("Cannot find module '" + m + "'"); }; return f(r); });
}
else if (typeof exports == "object" && typeof module < "u") {
    module.exports = f(require);
}
else {
    var gN = { "rxjs": "rxjs" }, gReq = function (r) { var mod = r in gN ? g[gN[r]] : g[r]; return mod; };
    var m = f(gReq);
    for (var i in m)
        g[i] = m[i];
} }(typeof globalThis < "u" ? globalThis : typeof self < "u" ? self : this, function (require) {
    var exports = {};
    var __exports = exports;
    var module = { exports: exports };
    // packages/zone.js/lib/rxjs/rxjs.js
    var import_rxjs = require("rxjs");
    function patchRxJs(Zone2) {
        Zone2.__load_patch("rxjs", function (global, Zone3, api) {
            var symbol = Zone3.__symbol__;
            var nextSource = "rxjs.Subscriber.next";
            var errorSource = "rxjs.Subscriber.error";
            var completeSource = "rxjs.Subscriber.complete";
            var ObjectDefineProperties = Object.defineProperties;
            var patchObservable = function () {
                var ObservablePrototype = import_rxjs.Observable.prototype;
                var _symbolSubscribe = symbol("_subscribe");
                var _subscribe = ObservablePrototype[_symbolSubscribe] = ObservablePrototype._subscribe;
                ObjectDefineProperties(import_rxjs.Observable.prototype, {
                    _zone: { value: null, writable: true, configurable: true },
                    _zoneSource: { value: null, writable: true, configurable: true },
                    _zoneSubscribe: { value: null, writable: true, configurable: true },
                    source: {
                        configurable: true,
                        get: function () {
                            return this._zoneSource;
                        },
                        set: function (source) {
                            this._zone = Zone3.current;
                            this._zoneSource = source;
                        }
                    },
                    _subscribe: {
                        configurable: true,
                        get: function () {
                            if (this._zoneSubscribe) {
                                return this._zoneSubscribe;
                            }
                            else if (this.constructor === import_rxjs.Observable) {
                                return _subscribe;
                            }
                            var proto = Object.getPrototypeOf(this);
                            return proto && proto._subscribe;
                        },
                        set: function (subscribe) {
                            this._zone = Zone3.current;
                            if (!subscribe) {
                                this._zoneSubscribe = subscribe;
                            }
                            else {
                                this._zoneSubscribe = function () {
                                    if (this._zone && this._zone !== Zone3.current) {
                                        var tearDown_1 = this._zone.run(subscribe, this, arguments);
                                        if (typeof tearDown_1 === "function") {
                                            var zone_1 = this._zone;
                                            return function () {
                                                if (zone_1 !== Zone3.current) {
                                                    return zone_1.run(tearDown_1, this, arguments);
                                                }
                                                return tearDown_1.apply(this, arguments);
                                            };
                                        }
                                        else {
                                            return tearDown_1;
                                        }
                                    }
                                    else {
                                        return subscribe.apply(this, arguments);
                                    }
                                };
                            }
                        }
                    },
                    subjectFactory: {
                        get: function () {
                            return this._zoneSubjectFactory;
                        },
                        set: function (factory) {
                            var zone = this._zone;
                            this._zoneSubjectFactory = function () {
                                if (zone && zone !== Zone3.current) {
                                    return zone.run(factory, this, arguments);
                                }
                                return factory.apply(this, arguments);
                            };
                        }
                    }
                });
            };
            api.patchMethod(import_rxjs.Observable.prototype, "lift", function (delegate) { return function (self, args) {
                var observable = delegate.apply(self, args);
                if (observable.operator) {
                    observable.operator._zone = Zone3.current;
                    api.patchMethod(observable.operator, "call", function (operatorDelegate) { return function (operatorSelf, operatorArgs) {
                        if (operatorSelf._zone && operatorSelf._zone !== Zone3.current) {
                            return operatorSelf._zone.run(operatorDelegate, operatorSelf, operatorArgs);
                        }
                        return operatorDelegate.apply(operatorSelf, operatorArgs);
                    }; });
                }
                return observable;
            }; });
            var patchSubscription = function () {
                ObjectDefineProperties(import_rxjs.Subscription.prototype, {
                    _zone: { value: null, writable: true, configurable: true },
                    _zoneUnsubscribe: { value: null, writable: true, configurable: true },
                    _unsubscribe: {
                        get: function () {
                            if (this._zoneUnsubscribe || this._zoneUnsubscribeCleared) {
                                return this._zoneUnsubscribe;
                            }
                            var proto = Object.getPrototypeOf(this);
                            return proto && proto._unsubscribe;
                        },
                        set: function (unsubscribe) {
                            this._zone = Zone3.current;
                            if (!unsubscribe) {
                                this._zoneUnsubscribe = unsubscribe;
                                this._zoneUnsubscribeCleared = true;
                            }
                            else {
                                this._zoneUnsubscribeCleared = false;
                                this._zoneUnsubscribe = function () {
                                    if (this._zone && this._zone !== Zone3.current) {
                                        return this._zone.run(unsubscribe, this, arguments);
                                    }
                                    else {
                                        return unsubscribe.apply(this, arguments);
                                    }
                                };
                            }
                        }
                    }
                });
            };
            var patchSubscriber = function () {
                var next = import_rxjs.Subscriber.prototype.next;
                var error = import_rxjs.Subscriber.prototype.error;
                var complete = import_rxjs.Subscriber.prototype.complete;
                Object.defineProperty(import_rxjs.Subscriber.prototype, "destination", {
                    configurable: true,
                    get: function () {
                        return this._zoneDestination;
                    },
                    set: function (destination) {
                        this._zone = Zone3.current;
                        this._zoneDestination = destination;
                    }
                });
                import_rxjs.Subscriber.prototype.next = function () {
                    var currentZone = Zone3.current;
                    var subscriptionZone = this._zone;
                    if (subscriptionZone && subscriptionZone !== currentZone) {
                        return subscriptionZone.run(next, this, arguments, nextSource);
                    }
                    else {
                        return next.apply(this, arguments);
                    }
                };
                import_rxjs.Subscriber.prototype.error = function () {
                    var currentZone = Zone3.current;
                    var subscriptionZone = this._zone;
                    if (subscriptionZone && subscriptionZone !== currentZone) {
                        return subscriptionZone.run(error, this, arguments, errorSource);
                    }
                    else {
                        return error.apply(this, arguments);
                    }
                };
                import_rxjs.Subscriber.prototype.complete = function () {
                    var currentZone = Zone3.current;
                    var subscriptionZone = this._zone;
                    if (subscriptionZone && subscriptionZone !== currentZone) {
                        return subscriptionZone.run(complete, this, arguments, completeSource);
                    }
                    else {
                        return complete.call(this);
                    }
                };
            };
            patchObservable();
            patchSubscription();
            patchSubscriber();
        });
    }
    // packages/zone.js/lib/rxjs/rollup-rxjs.js
    patchRxJs(Zone);
    if (__exports != exports)
        module.exports = exports;
    return module.exports;
}));
