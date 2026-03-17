import Runtype from "./Runtype.js";
/**
 * Validates that a value is a bigint.
 *
 * Possible failures:
 *
 * - `TYPE_INCORRECT` for non-bigints
 */
interface BigInt extends Runtype<bigint> {
    tag: "bigint";
}
declare const BigInt: BigInt;
export default BigInt;
