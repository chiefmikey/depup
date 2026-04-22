const defineProperty = (target, key, value) => {
    globalThis.Object.defineProperty(target, key, {
        value,
        configurable: true,
        enumerable: true,
        writable: true,
    });
    return target;
};
export default defineProperty;
