const defineProperties = (target, properties, descriptor) => {
    for (const key of Reflect.ownKeys(properties)) {
        const value = properties[key];
        globalThis.Object.defineProperty(target, key, { ...descriptor, value });
    }
    return target;
};
export default defineProperties;
