import Runtype from "./Runtype.js";
import FAILURE from "./utils-internal/FAILURE.js";
import SUCCESS from "./utils-internal/SUCCESS.js";
const BigInt = Runtype.create(({ received, expected }) => typeof received === "bigint"
    ? SUCCESS(received)
    : FAILURE.TYPE_INCORRECT({ expected, received }), { tag: "bigint" });
export default BigInt;
