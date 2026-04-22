import Runtype from "./Runtype.js";
import FAILURE from "./utils-internal/FAILURE.js";
const Never = Runtype.create(({ received, expected }) => FAILURE.NOTHING_EXPECTED({ expected, received }), { tag: "never" });
export default Never;
