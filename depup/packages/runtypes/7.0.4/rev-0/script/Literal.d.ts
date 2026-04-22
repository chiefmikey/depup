import Runtype from "./Runtype.js";
type LiteralStatic = undefined | null | boolean | number | bigint | string;
/**
 * Validates that a value is equal to the given value with the [`SameValueZero`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Equality_comparisons_and_sameness#same-value-zero_equality) equality.
 *
 * Possible failures:
 *
 * - `TYPE_INCORRECT` if they have different `typeof`s
 * - `VALUE_INCORRECT` if they were different as per `SameValueZero`
 */
interface Literal<T extends LiteralStatic = LiteralStatic> extends Runtype<T> {
    tag: "literal";
    value: T;
}
declare const Literal: <T extends LiteralStatic>(value: T) => Literal<T>;
export default Literal;
