import Runtype from "./Runtype.js";
import Spread from "./Spread.js";
import FAILURE from "./utils-internal/FAILURE.js";
import SUCCESS from "./utils-internal/SUCCESS.js";
import defineIntrinsics from "./utils-internal/defineIntrinsics.js";
import enumerableKeysOf from "./utils-internal/enumerableKeysOf.js";
import isNumberLikeKey from "./utils-internal/isNumberLikeKey.js";
const Array = (element) => {
    const base = {
        tag: "array",
        element,
    };
    return Runtype.create(({ received, innerValidate, expected, parsing }) => {
        if (!globalThis.Array.isArray(received))
            return FAILURE.TYPE_INCORRECT({ expected, received });
        const keys = enumerableKeysOf(received).filter(isNumberLikeKey);
        const results = keys.map(key => innerValidate({ expected: element, received: received[key], parsing }));
        const details = {};
        for (const key of keys) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const result = results[key];
            if (!result.success)
                details[key] = result;
        }
        if (enumerableKeysOf(details).length !== 0)
            return FAILURE.CONTENT_INCORRECT({ expected, received, details });
        else
            return SUCCESS(parsing ? results.map(result => result.value) : received);
    }, Spread.asSpreadable(base)).with(self => defineIntrinsics({}, { asReadonly: () => self }));
};
export default Array;
