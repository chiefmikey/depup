import Null from "./Null.js";
import Undefined from "./Undefined.js";
import Union from "./Union.js";
/**
 * An alias for `Union(Null, Undefined)`.
 */
const Nullish = Union(Null, Undefined);
export default Nullish;
