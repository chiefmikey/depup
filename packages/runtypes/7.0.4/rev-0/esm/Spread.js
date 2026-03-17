import defineIntrinsics from "./utils-internal/defineIntrinsics.js";
const Spread = globalThis.Object.assign((content) => ({
    tag: "spread",
    content,
}), {
    /** @internal */
    asSpreadable: (base) => defineIntrinsics(base, {
        *[Symbol.iterator]() {
            yield Spread(base);
        },
    }),
});
export default Spread;
