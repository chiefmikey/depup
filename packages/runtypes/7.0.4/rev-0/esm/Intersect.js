import Runtype from "./Runtype.js";
import Spread from "./Spread.js";
import FAILURE from "./utils-internal/FAILURE.js";
import SUCCESS from "./utils-internal/SUCCESS.js";
const Intersect = (...intersectees) => {
    const base = {
        tag: "intersect",
        intersectees,
    };
    return Runtype.create(({ received, innerValidate, expected, parsing }) => {
        if (expected.intersectees.length === 0)
            return SUCCESS(received);
        const results = [];
        const details = {};
        let success = SUCCESS(received);
        for (let i = 0; i < expected.intersectees.length; i++) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const intersectee = expected.intersectees[i];
            const result = innerValidate({ expected: intersectee, received, parsing });
            results.push(result);
            if (result.success) {
                if (success)
                    success = result;
            }
            else {
                details[i] = result;
                success = undefined;
            }
        }
        if (!success)
            return FAILURE.TYPE_INCORRECT({ expected, received, details });
        return SUCCESS(parsing ? success.value : received);
    }, Spread.asSpreadable(base));
};
export default Intersect;
