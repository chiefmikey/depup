"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const isObject_js_1 = __importDefault(require("./isObject.js"));
const enumerableKeysOf = (object) => (0, isObject_js_1.default)(object)
    ? Reflect.ownKeys(object).filter(key => globalThis.Object.prototype.propertyIsEnumerable.call(object, key))
    : [];
exports.default = enumerableKeysOf;
