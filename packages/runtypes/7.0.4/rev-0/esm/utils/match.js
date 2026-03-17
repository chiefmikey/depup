const match = (...cases) => value => {
    for (const [T, f] of cases)
        try {
            return f(T.parse(value));
        }
        catch (error) {
            continue;
        }
    throw new Error("No alternatives were matched");
};
const when = (...args) => (Array.isArray(args[0]) ? args[0] : [args[0], args[1]]);
export default match;
// eslint-disable-next-line import/no-named-export
export { when };
