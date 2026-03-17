import Runtype from "./Runtype.js";
import FAILURE from "./utils-internal/FAILURE.js";
import SUCCESS from "./utils-internal/SUCCESS.js";
const String = Runtype.create(({ received, expected }) => typeof received === "string"
    ? SUCCESS(received)
    : FAILURE.TYPE_INCORRECT({ expected, received }), { tag: "string" });
export default String;
