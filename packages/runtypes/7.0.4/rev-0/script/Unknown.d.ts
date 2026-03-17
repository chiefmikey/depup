import Runtype from "./Runtype.js";
/**
 * Validates anything.
 */
interface Unknown extends Runtype<unknown> {
    tag: "unknown";
}
declare const Unknown: Unknown;
export default Unknown;
