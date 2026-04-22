import Runtype from "./Runtype.js";
import Spread from "./Spread.js";
import FAILURE from "./utils-internal/FAILURE.js";
const Brand = (brand, entity) => {
    const base = {
        tag: "brand",
        brand,
        entity,
    };
    return Runtype.create(({ received, innerValidate, expected, parsing }) => {
        const result = innerValidate({ expected: expected.entity, received, parsing });
        if (result.success)
            return result;
        return FAILURE.TYPE_INCORRECT({ expected, received, detail: result });
    }, Spread.asSpreadable(base));
};
export default Brand;
