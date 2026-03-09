'use strict';
/**
 * @license Angular
 * (c) 2010-2026 Google LLC. https://angular.dev/
 * License: MIT
 */

// packages/zone.js/lib/rxjs/rxjs.js
import { Observable, Subscriber, Subscription } from "rxjs";
function patchRxJs(Zone2) {
  Zone2.__load_patch("rxjs", (global, Zone3, api) => {
    const symbol = Zone3.__symbol__;
    const nextSource = "rxjs.Subscriber.next";
    const errorSource = "rxjs.Subscriber.error";
    const completeSource = "rxjs.Subscriber.complete";
    const ObjectDefineProperties = Object.defineProperties;
    const patchObservable = function() {
      const ObservablePrototype = Observable.prototype;
      const _symbolSubscribe = symbol("_subscribe");
      const _subscribe = ObservablePrototype[_symbolSubscribe] = ObservablePrototype._subscribe;
      ObjectDefineProperties(Observable.prototype, {
        _zone: { value: null, writable: true, configurable: true },
        _zoneSource: { value: null, writable: true, configurable: true },
        _zoneSubscribe: { value: null, writable: true, configurable: true },
        source: {
          configurable: true,
          get: function() {
            return this._zoneSource;
          },
          set: function(source) {
            this._zone = Zone3.current;
            this._zoneSource = source;
          }
        },
        _subscribe: {
          configurable: true,
          get: function() {
            if (this._zoneSubscribe) {
              return this._zoneSubscribe;
            } else if (this.constructor === Observable) {
              return _subscribe;
            }
            const proto = Object.getPrototypeOf(this);
            return proto && proto._subscribe;
          },
          set: function(subscribe) {
            this._zone = Zone3.current;
            if (!subscribe) {
              this._zoneSubscribe = subscribe;
            } else {
              this._zoneSubscribe = function() {
                if (this._zone && this._zone !== Zone3.current) {
                  const tearDown = this._zone.run(subscribe, this, arguments);
                  if (typeof tearDown === "function") {
                    const zone = this._zone;
                    return function() {
                      if (zone !== Zone3.current) {
                        return zone.run(tearDown, this, arguments);
                      }
                      return tearDown.apply(this, arguments);
                    };
                  } else {
                    return tearDown;
                  }
                } else {
                  return subscribe.apply(this, arguments);
                }
              };
            }
          }
        },
        subjectFactory: {
          get: function() {
            return this._zoneSubjectFactory;
          },
          set: function(factory) {
            const zone = this._zone;
            this._zoneSubjectFactory = function() {
              if (zone && zone !== Zone3.current) {
                return zone.run(factory, this, arguments);
              }
              return factory.apply(this, arguments);
            };
          }
        }
      });
    };
    api.patchMethod(Observable.prototype, "lift", (delegate) => (self, args) => {
      const observable = delegate.apply(self, args);
      if (observable.operator) {
        observable.operator._zone = Zone3.current;
        api.patchMethod(observable.operator, "call", (operatorDelegate) => (operatorSelf, operatorArgs) => {
          if (operatorSelf._zone && operatorSelf._zone !== Zone3.current) {
            return operatorSelf._zone.run(operatorDelegate, operatorSelf, operatorArgs);
          }
          return operatorDelegate.apply(operatorSelf, operatorArgs);
        });
      }
      return observable;
    });
    const patchSubscription = function() {
      ObjectDefineProperties(Subscription.prototype, {
        _zone: { value: null, writable: true, configurable: true },
        _zoneUnsubscribe: { value: null, writable: true, configurable: true },
        _unsubscribe: {
          get: function() {
            if (this._zoneUnsubscribe || this._zoneUnsubscribeCleared) {
              return this._zoneUnsubscribe;
            }
            const proto = Object.getPrototypeOf(this);
            return proto && proto._unsubscribe;
          },
          set: function(unsubscribe) {
            this._zone = Zone3.current;
            if (!unsubscribe) {
              this._zoneUnsubscribe = unsubscribe;
              this._zoneUnsubscribeCleared = true;
            } else {
              this._zoneUnsubscribeCleared = false;
              this._zoneUnsubscribe = function() {
                if (this._zone && this._zone !== Zone3.current) {
                  return this._zone.run(unsubscribe, this, arguments);
                } else {
                  return unsubscribe.apply(this, arguments);
                }
              };
            }
          }
        }
      });
    };
    const patchSubscriber = function() {
      const next = Subscriber.prototype.next;
      const error = Subscriber.prototype.error;
      const complete = Subscriber.prototype.complete;
      Object.defineProperty(Subscriber.prototype, "destination", {
        configurable: true,
        get: function() {
          return this._zoneDestination;
        },
        set: function(destination) {
          this._zone = Zone3.current;
          this._zoneDestination = destination;
        }
      });
      Subscriber.prototype.next = function() {
        const currentZone = Zone3.current;
        const subscriptionZone = this._zone;
        if (subscriptionZone && subscriptionZone !== currentZone) {
          return subscriptionZone.run(next, this, arguments, nextSource);
        } else {
          return next.apply(this, arguments);
        }
      };
      Subscriber.prototype.error = function() {
        const currentZone = Zone3.current;
        const subscriptionZone = this._zone;
        if (subscriptionZone && subscriptionZone !== currentZone) {
          return subscriptionZone.run(error, this, arguments, errorSource);
        } else {
          return error.apply(this, arguments);
        }
      };
      Subscriber.prototype.complete = function() {
        const currentZone = Zone3.current;
        const subscriptionZone = this._zone;
        if (subscriptionZone && subscriptionZone !== currentZone) {
          return subscriptionZone.run(complete, this, arguments, completeSource);
        } else {
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
