import Runtype from "./Runtype.js";
import FAILURE from "./utils-internal/FAILURE.js";
import SUCCESS from "./utils-internal/SUCCESS.js";
const Number = Runtype.create(({ received, expected }) => typeof received === "number"
    ? SUCCESS(received)
    : FAILURE.TYPE_INCORRECT({ expected, received }), { tag: "number" });
export default Number;
