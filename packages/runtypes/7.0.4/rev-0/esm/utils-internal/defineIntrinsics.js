import defineProperties from "./defineProperties.js";
const defineIntrinsics = (target, properties) => defineProperties(target, properties, { configurable: true, enumerable: false, writable: true });
export default defineIntrinsics;
