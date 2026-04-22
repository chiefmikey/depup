import Runtype from "./Runtype.js";
/**
 * Validates that a value is a function.
 *
 * Possible failures:
 *
 * - `TYPE_INCORRECT` for non-functions
 */
interface Function extends Runtype<(...args: never[]) => unknown> {
    tag: "function";
}
declare const Function: Function;
export default Function;
