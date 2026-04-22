import Runtype from "./Runtype.js";
/**
 * Constructs a possibly-recursive runtype.
 */
declare const Lazy: <R extends Runtype.Core>(delayed: () => R) => R;
export default Lazy;
