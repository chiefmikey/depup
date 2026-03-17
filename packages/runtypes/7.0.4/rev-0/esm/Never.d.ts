import Runtype from "./Runtype.js";
/**
 * Validates nothing.
 *
 * Possible failures:
 *
 * - `NOTHING_EXPECTED` for any value
 */
interface Never extends Runtype<never> {
    tag: "never";
}
declare const Never: Never;
export default Never;
