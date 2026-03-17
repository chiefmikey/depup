import Runtype from "./Runtype.js";
import FAILURE from "./utils-internal/FAILURE.js";
import SUCCESS from "./utils-internal/SUCCESS.js";
/**
 * <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Equality_comparisons_and_sameness#same-value-zero_equality>
 */
const sameValueZero = (x, y) => {
    if (typeof x === "number" && typeof y === "number") {
        // x and y are equal (may be -0 and 0) or they are both NaN
        return x === y || (x !== x && y !== y);
    }
    return x === y;
};
const Literal = (value) => Runtype.create(({ received: x, expected }) => sameValueZero(x, value)
    ? SUCCESS(x)
    : typeof x !== typeof value || value === null
        ? FAILURE.TYPE_INCORRECT({ expected, received: x })
        : FAILURE.VALUE_INCORRECT({ expected, received: x }), { tag: "literal", value });
export default Literal;
