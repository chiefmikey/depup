import Runtype from "./Runtype.js";
/**
 * Validates that a value is a number.
 *
 * Possible failures:
 *
 * - `TYPE_INCORRECT` for non-numbers
 */
interface Number extends Runtype<number> {
    tag: "number";
}
declare const Number: Number;
export default Number;
