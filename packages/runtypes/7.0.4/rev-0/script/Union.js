"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Runtype_js_1 = __importDefault(require("./Runtype.js"));
const Spread_js_1 = __importDefault(require("./Spread.js"));
const FAILURE_js_1 = __importDefault(require("./utils-internal/FAILURE.js"));
const SUCCESS_js_1 = __importDefault(require("./utils-internal/SUCCESS.js"));
const defineIntrinsics_js_1 = __importDefault(require("./utils-internal/defineIntrinsics.js"));
const Union = (...alternatives) => {
    const base = {
        tag: "union",
        alternatives,
    };
    return Runtype_js_1.default.create(({ received, innerValidate, expected, parsing, }) => {
        if (expected.alternatives.length === 0)
            return FAILURE_js_1.default.NOTHING_EXPECTED({ expected, received });
        const results = [];
        const details = {};
        for (let i = 0; i < expected.alternatives.length; i++) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const alternative = expected.alternatives[i];
            const result = innerValidate({ expected: alternative, received, parsing });
            results.push(result);
            if (result.success) {
                return (0, SUCCESS_js_1.default)(parsing ? result.value : received);
            }
            else {
                details[i] = result;
            }
        }
        return FAILURE_js_1.default.TYPE_INCORRECT({ expected, received, details });
    }, Spread_js_1.default.asSpreadable(base)).with(self => (0, defineIntrinsics_js_1.default)({}, {
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
exports.default = Union;
