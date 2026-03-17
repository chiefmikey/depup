import Runtype from "./Runtype.js";
import Spread from "./Spread.js";
import FAILURE from "./utils-internal/FAILURE.js";
import SUCCESS from "./utils-internal/SUCCESS.js";
import defineIntrinsics from "./utils-internal/defineIntrinsics.js";
import enumerableKeysOf from "./utils-internal/enumerableKeysOf.js";
import show from "./utils-internal/show.js";
import unwrapTrivial from "./utils-internal/unwrapTrivial.js";
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
                    const runtype = unwrapTrivial(component.content);
                    switch (runtype.tag) {
                        case "tuple":
                            if (globalThis.Array.isArray(runtype.components)) {
                                const components = runtype.components;
                                componentsFlattened.splice(i, 1, ...components);
                            }
                            else {
                                const components = runtype.components;
                                componentsFlattened.splice(i, 1, ...components.leading, Spread(components.rest), ...components.trailing);
                            }
                            continue;
                        case "array":
                            i++;
                            continue;
                        default:
                            throw new Error(`Unsupported content type of \`Spread\` in \`Tuple\`: ${show(component.content)}`);
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
    return Runtype.create(({ received: x, innerValidate, expected, parsing }) => {
        if (!globalThis.Array.isArray(x))
            return FAILURE.TYPE_INCORRECT({ expected, received: x });
        if (globalThis.Array.isArray(expected.components)) {
            const components = expected.components;
            if (x.length !== components.length)
                return FAILURE.CONSTRAINT_FAILED({
                    expected,
                    received: x,
                    thrown: `Expected length ${components.length}, but was ${x.length}`,
                });
        }
        else {
            const components = expected.components;
            if (x.length < components.leading.length + components.trailing.length)
                return FAILURE.CONSTRAINT_FAILED({
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
        if (enumerableKeysOf(details).length !== 0)
            return FAILURE.CONTENT_INCORRECT({ expected, received: x, details });
        else
            return SUCCESS(parsing ? results.map(result => result.value) : x);
    }, Spread.asSpreadable(base)).with(self => defineIntrinsics({}, { asReadonly: () => self }));
};
export default Tuple;
