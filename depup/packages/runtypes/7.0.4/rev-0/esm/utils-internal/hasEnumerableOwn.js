const hasEnumerableOwn = (key, object) => globalThis.Object.prototype.propertyIsEnumerable.call(object, key);
export default hasEnumerableOwn;
