"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const defineProperties = (target, properties, descriptor) => {
    for (const key of Reflect.ownKeys(properties)) {
        const value = properties[key];
        globalThis.Object.defineProperty(target, key, { ...descriptor, value });
    }
    return target;
};
exports.default = defineProperties;
