import Literal from "../Literal.js";
import quoteWithDoubleQuote from "./quoteWithDoubleQuote.js";
import Failcode from "../result/Failcode.js";
import show from "./show.js";
import typeOf from "./typeOf.js";
const FAILURE = new Proxy({}, {
    get: (target, key, receiver) => {
        if (key in Failcode)
            return (failure) => {
                const content = {
                    success: false,
                    message: undefined,
                    code: key,
                    ...failure,
                };
                content.message = toMessage(content);
                return content;
            };
        else
            return Reflect.get(target, key, receiver);
    },
});
const toMessage = (failure) => {
    switch (failure.code) {
        case Failcode.TYPE_INCORRECT:
            return `Expected ${show(failure.expected)}, but was ${"details" in failure || "detail" in failure ? "incompatible" : typeOf(failure.received)}`;
        case Failcode.VALUE_INCORRECT:
            switch (failure.expected.tag) {
                case "symbol": {
                    const expected = failure.expected.key;
                    const received = globalThis.Symbol.keyFor(failure.received);
                    const messageExpected = expected === undefined
                        ? "unique symbol"
                        : `symbol for key ${quoteWithDoubleQuote(expected)}`;
                    const messageReceived = received === undefined ? "unique" : `for ${quoteWithDoubleQuote(received)}`;
                    return `Expected ${messageExpected}, but was ${messageReceived}`;
                }
                default:
                    return `Expected ${show(failure.expected)}, but was ${show(Literal(failure.received))}`;
            }
        case Failcode.KEY_INCORRECT:
            return `Expected key to be ${show(failure.expected)}, but was ${"details" in failure ? "incompatible" : show(Literal(failure.received))}`;
        case Failcode.CONTENT_INCORRECT:
            return `Expected ${show(failure.expected)}, but was incompatible`;
        case Failcode.ARGUMENTS_INCORRECT:
            return `Received unexpected arguments: ${failure.detail.message}`;
        case Failcode.RETURN_INCORRECT:
            return `Returned unexpected value: ${failure.detail.message}`;
        case Failcode.RESOLVE_INCORRECT:
            return `Resolved unexpected value: ${failure.detail.message}`;
        case Failcode.CONSTRAINT_FAILED:
            return (`Constraint failed` +
                (failure.thrown
                    ? `: ${failure.thrown instanceof Error ? failure.thrown.message : failure.thrown}`
                    : ""));
        case Failcode.PROPERTY_MISSING:
            return `Expected ${show(failure.expected)}, but was missing`;
        case Failcode.PROPERTY_PRESENT:
        case Failcode.NOTHING_EXPECTED:
            return `Expected nothing, but was present`;
        case Failcode.PARSING_FAILED:
            return (`Parsing failed` +
                ("thrown" in failure
                    ? `: ${failure.thrown instanceof Error ? failure.thrown.message : failure.thrown}`
                    : ""));
        case Failcode.INSTANCEOF_FAILED:
            return (`\`instanceof\` failed in ${show(failure.expected)}` +
                ("thrown" in failure
                    ? `: ${failure.thrown instanceof Error ? failure.thrown.message : failure.thrown}`
                    : ""));
    }
};
export default FAILURE;
