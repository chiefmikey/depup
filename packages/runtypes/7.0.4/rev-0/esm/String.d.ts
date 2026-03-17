import Runtype from "./Runtype.js";
/**
 * Validates that a value is a string.
 *
 * Possible failures:
 *
 * - `TYPE_INCORRECT` for non-strings
 */
interface String extends Runtype<string> {
    tag: "string";
}
declare const String: String;
export default String;
