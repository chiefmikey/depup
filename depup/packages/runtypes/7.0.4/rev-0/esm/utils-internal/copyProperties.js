const copyProperties = (dst, src) => {
    globalThis.Object.defineProperties(dst, globalThis.Object.getOwnPropertyDescriptors(src));
};
export default copyProperties;
