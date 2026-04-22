import Runtype from "./Runtype.js";
/**
 * Validates that a value is a boolean.
 *
 * Possible failures:
 *
 * - `TYPE_INCORRECT` for non-booleans
 */
interface Boolean extends Runtype<boolean> {
    tag: "boolean";
}
declare const Boolean: Boolean;
export default Boolean;
