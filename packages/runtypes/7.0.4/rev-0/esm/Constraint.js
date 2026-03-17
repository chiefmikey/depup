import Runtype from "./Runtype.js";
import FAILURE from "./utils-internal/FAILURE.js";
import SUCCESS from "./utils-internal/SUCCESS.js";
const Constraint = (underlying, constraint) => Runtype.create(({ received, innerValidate, expected, parsing }) => {
    const result = innerValidate({ expected: expected.underlying, received, parsing: true });
    if (!result.success)
        return result;
    try {
        constraint(result.value);
        return SUCCESS(parsing ? result.value : received);
    }
    catch (error) {
        return FAILURE.CONSTRAINT_FAILED({ expected, received, thrown: error });
    }
}, { tag: "constraint", underlying, constraint });
export default Constraint;
