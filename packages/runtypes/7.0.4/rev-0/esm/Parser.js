import Runtype from "./Runtype.js";
import FAILURE from "./utils-internal/FAILURE.js";
import SUCCESS from "./utils-internal/SUCCESS.js";
const Parser = (underlying, parser) => Runtype.create(({ received, innerValidate, expected, parsing }) => {
    try {
        const result = innerValidate({ expected: expected.underlying, received, parsing });
        if (!result.success)
            return result;
        if (!parsing)
            return result;
        return SUCCESS(expected.parser(result.value));
    }
    catch (error) {
        return FAILURE.PARSING_FAILED({ expected, received, thrown: error });
    }
}, { tag: "parser", underlying, parser });
export default Parser;
