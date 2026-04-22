import Runtype from "./Runtype.js";
import SUCCESS from "./utils-internal/SUCCESS.js";
const Unknown = Runtype.create(({ received }) => SUCCESS(received), {
    tag: "unknown",
});
export default Unknown;
