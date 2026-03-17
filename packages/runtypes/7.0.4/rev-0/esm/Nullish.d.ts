import Null from "./Null.js";
import Undefined from "./Undefined.js";
import Union from "./Union.js";
/**
 * An alias for `Union(Null, Undefined)`.
 */
declare const Nullish: Union<[typeof Null, typeof Undefined]>;
export default Nullish;
