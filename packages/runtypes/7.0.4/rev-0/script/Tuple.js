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
const enumerableKeysOf_js_1 = __importDefault(require("./utils-internal/enumerableKeysOf.js"));
const show_js_1 = __importDefault(require("./utils-internal/show.js"));
const unwrapTrivial_js_1 = __importDefault(require("./utils-internal/unwrapTrivial.js"));
const isSpread = (component) => component.tag === "spread";
const Tuple = (...components) => {
    const base = {
        tag: "tuple",
        // TODO: unuse getter
        get components() {
            // Flatten `Spread<Tuple>`.
            const componentsFlattened = [...components];
            for (let i = 0; i < componentsFlattened.length;) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                const component = componentsFlattened[i];
                if (isSpread(component)) {
                    const runtype = (0, unwrapTrivial_js_1.default)(component.content);
                    switch (runtype.tag) {
                        case "tuple":
                            if (globalThis.Array.isArray(runtype.components)) {
                                const components = runtype.components;
                                componentsFlattened.splice(i, 1, ...components);
                            }
                            else {
                                const components = runtype.components;
                                componentsFlattened.splice(i, 1, ...components.leading, (0, Spread_js_1.default)(components.rest), ...components.trailing);
                            }
                            continue;
                        case "array":
                            i++;
                            continue;
                        default:
                            throw new Error(`Unsupported content type of \`Spread\` in \`Tuple\`: ${(0, show_js_1.default)(component.content)}`);
                    }
                }
                else {
                    i++;
                    continue;
                }
            }
            // Split at the `Spread<Array>` if exists.
            const leading = [];
            let rest = undefined;
            const trailing = [];
            for (const component of componentsFlattened) {
                if (isSpread(component)) {
                    if (rest)
                        throw new Error("A rest element cannot follow another rest element.");
                    rest = component.content;
                }
                else if (rest) {
                    trailing.push(component);
                }
                else {
                    leading.push(component);
                }
            }
            return rest ? { leading, rest, trailing } : leading;
        },
    };
    return Runtype_js_1.default.create(({ received: x, innerValidate, expected, parsing }) => {
        if (!globalThis.Array.isArray(x))
            return FAILURE_js_1.default.TYPE_INCORRECT({ expected, received: x });
        if (globalThis.Array.isArray(expected.components)) {
            const components = expected.components;
            if (x.length !== components.length)
                return FAILURE_js_1.default.CONSTRAINT_FAILED({
                    expected,
                    received: x,
                    thrown: `Expected length ${components.length}, but was ${x.length}`,
                });
        }
        else {
            const components = expected.components;
            if (x.length < components.leading.length + components.trailing.length)
                return FAILURE_js_1.default.CONSTRAINT_FAILED({
                    expected,
                    received: x,
                    thrown: `Expected length >= ${components.leading.length + components.trailing.length}, but was ${x.length}`,
                });
        }
        const values = [...x];
        let results = [];
        if (globalThis.Array.isArray(expected.components)) {
            const components = expected.components;
            for (const component of components) {
                const received = values.shift();
                const result = innerValidate({ expected: component, received, parsing });
                results.push(result);
            }
        }
        else {
            const components = expected.components;
            const resultsLeading = [];
            let resultRest = undefined;
            const resultsTrailing = [];
            for (const component of components.leading) {
                const received = values.shift();
                const result = innerValidate({ expected: component, received, parsing });
                resultsLeading.push(result);
            }
            for (const component of components.trailing.toReversed()) {
                const received = values.pop();
                const result = innerValidate({ expected: component, received, parsing });
                resultsTrailing.unshift(result);
            }
            resultRest = innerValidate({ expected: components.rest, received: values, parsing });
            results = [...resultsLeading, resultRest, ...resultsTrailing];
        }
        const details = {};
        for (let i = 0; i < results.length; i++) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const result = results[i];
            if (!result.success)
                details[i] = result;
        }
        if ((0, enumerableKeysOf_js_1.default)(details).length !== 0)
            return FAILURE_js_1.default.CONTENT_INCORRECT({ expected, received: x, details });
        else
            return (0, SUCCESS_js_1.default)(parsing ? results.map(result => result.value) : x);
    }, Spread_js_1.default.asSpreadable(base)).with(self => (0, defineIntrinsics_js_1.default)({}, { asReadonly: () => self }));
};
exports.default = Tuple;
