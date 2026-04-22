import Runtype from "./Runtype.js";
import FAILURE from "./utils-internal/FAILURE.js";
import SUCCESS from "./utils-internal/SUCCESS.js";
const InstanceOf = (ctor) => Runtype.create(({ received, expected }) => {
    try {
        if (received instanceof ctor)
            return SUCCESS(received);
        else
            return FAILURE.TYPE_INCORRECT({ expected, received });
    }
    catch (error) {
        return FAILURE.INSTANCEOF_FAILED({ expected, received, thrown: error });
    }
}, { tag: "instanceof", ctor });
export default InstanceOf;
