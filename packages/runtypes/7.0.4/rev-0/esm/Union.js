import Runtype from "./Runtype.js";
import Spread from "./Spread.js";
import FAILURE from "./utils-internal/FAILURE.js";
import SUCCESS from "./utils-internal/SUCCESS.js";
import defineIntrinsics from "./utils-internal/defineIntrinsics.js";
const Union = (...alternatives) => {
    const base = {
        tag: "union",
        alternatives,
    };
    return Runtype.create(({ received, innerValidate, expected, parsing, }) => {
        if (expected.alternatives.length === 0)
            return FAILURE.NOTHING_EXPECTED({ expected, received });
        const results = [];
        const details = {};
        for (let i = 0; i < expected.alternatives.length; i++) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const alternative = expected.alternatives[i];
            const result = innerValidate({ expected: alternative, received, parsing });
            results.push(result);
            if (result.success) {
                return SUCCESS(parsing ? result.value : received);
            }
            else {
                details[i] = result;
            }
        }
        return FAILURE.TYPE_INCORRECT({ expected, received, details });
    }, Spread.asSpreadable(base)).with(self => defineIntrinsics({}, {
        match: ((...cases) => value => {
            for (let i = 0; i < self.alternatives.length; i++)
                try {
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    return cases[i](self.alternatives[i].parse(value));
                }
                catch (error) {
                    continue;
                }
            throw new Error("No alternatives were matched");
        }),
    }));
};
export default Union;
