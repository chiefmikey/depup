import Runtype from "./Runtype.js";
/**
 * Constructs a possibly-recursive runtype.
 */
const Lazy = (delayed) => {
    const self = {
        get tag() {
            return getWrapped().tag;
        },
    };
    let cached = undefined;
    const getWrapped = () => {
        if (!cached) {
            cached = delayed();
            for (const key of Reflect.ownKeys(cached)) {
                if (key !== "tag") {
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    const descriptor = globalThis.Object.getOwnPropertyDescriptor(cached, key);
                    globalThis.Object.defineProperty(self, key, descriptor);
                }
            }
        }
        return cached;
    };
    return Runtype.create(({ received, parsing }) => getWrapped().inspect(received, { parse: parsing }), self);
};
export default Lazy;
