const Optional = Object.assign(((...args) => ({
    tag: "optional",
    underlying: args[0],
    ...(args.length === 2 ? { default: args[1] } : {}),
})), {
    isOptional: (runtype) => runtype.tag === "optional",
});
export default Optional;
