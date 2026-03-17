"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Literal_js_1 = __importDefault(require("../Literal.js"));
const quoteWithDoubleQuote_js_1 = __importDefault(require("./quoteWithDoubleQuote.js"));
const Failcode_js_1 = __importDefault(require("../result/Failcode.js"));
const show_js_1 = __importDefault(require("./show.js"));
const typeOf_js_1 = __importDefault(require("./typeOf.js"));
const FAILURE = new Proxy({}, {
    get: (target, key, receiver) => {
        if (key in Failcode_js_1.default)
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
        case Failcode_js_1.default.TYPE_INCORRECT:
            return `Expected ${(0, show_js_1.default)(failure.expected)}, but was ${"details" in failure || "detail" in failure ? "incompatible" : (0, typeOf_js_1.default)(failure.received)}`;
        case Failcode_js_1.default.VALUE_INCORRECT:
            switch (failure.expected.tag) {
                case "symbol": {
                    const expected = failure.expected.key;
                    const received = globalThis.Symbol.keyFor(failure.received);
                    const messageExpected = expected === undefined
                        ? "unique symbol"
                        : `symbol for key ${(0, quoteWithDoubleQuote_js_1.default)(expected)}`;
                    const messageReceived = received === undefined ? "unique" : `for ${(0, quoteWithDoubleQuote_js_1.default)(received)}`;
                    return `Expected ${messageExpected}, but was ${messageReceived}`;
                }
                default:
                    return `Expected ${(0, show_js_1.default)(failure.expected)}, but was ${(0, show_js_1.default)((0, Literal_js_1.default)(failure.received))}`;
            }
        case Failcode_js_1.default.KEY_INCORRECT:
            return `Expected key to be ${(0, show_js_1.default)(failure.expected)}, but was ${"details" in failure ? "incompatible" : (0, show_js_1.default)((0, Literal_js_1.default)(failure.received))}`;
        case Failcode_js_1.default.CONTENT_INCORRECT:
            return `Expected ${(0, show_js_1.default)(failure.expected)}, but was incompatible`;
        case Failcode_js_1.default.ARGUMENTS_INCORRECT:
            return `Received unexpected arguments: ${failure.detail.message}`;
        case Failcode_js_1.default.RETURN_INCORRECT:
            return `Returned unexpected value: ${failure.detail.message}`;
        case Failcode_js_1.default.RESOLVE_INCORRECT:
            return `Resolved unexpected value: ${failure.detail.message}`;
        case Failcode_js_1.default.CONSTRAINT_FAILED:
            return (`Constraint failed` +
                (failure.thrown
                    ? `: ${failure.thrown instanceof Error ? failure.thrown.message : failure.thrown}`
                    : ""));
        case Failcode_js_1.default.PROPERTY_MISSING:
            return `Expected ${(0, show_js_1.default)(failure.expected)}, but was missing`;
        case Failcode_js_1.default.PROPERTY_PRESENT:
        case Failcode_js_1.default.NOTHING_EXPECTED:
            return `Expected nothing, but was present`;
        case Failcode_js_1.default.PARSING_FAILED:
            return (`Parsing failed` +
                ("thrown" in failure
                    ? `: ${failure.thrown instanceof Error ? failure.thrown.message : failure.thrown}`
                    : ""));
        case Failcode_js_1.default.INSTANCEOF_FAILED:
            return (`\`instanceof\` failed in ${(0, show_js_1.default)(failure.expected)}` +
                ("thrown" in failure
                    ? `: ${failure.thrown instanceof Error ? failure.thrown.message : failure.thrown}`
                    : ""));
    }
};
exports.default = FAILURE;
