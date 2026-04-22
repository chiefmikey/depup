import isObject from "./isObject.js";
const enumerableKeysOf = (object) => isObject(object)
    ? Reflect.ownKeys(object).filter(key => globalThis.Object.prototype.propertyIsEnumerable.call(object, key))
    : [];
export default enumerableKeysOf;
