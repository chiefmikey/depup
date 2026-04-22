"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hasEnumerableOwn = (key, object) => globalThis.Object.prototype.propertyIsEnumerable.call(object, key);
exports.default = hasEnumerableOwn;
