import Runtype from "./Runtype.js";
import FAILURE from "./utils-internal/FAILURE.js";
import SUCCESS from "./utils-internal/SUCCESS.js";
const Function = Runtype.create(({ received, expected }) => typeof received === "function"
    ? SUCCESS(received)
    : FAILURE.TYPE_INCORRECT({ expected, received }), { tag: "function" });
export default Function;
