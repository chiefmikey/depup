const quoteWithDoubleQuote = (string) => `"${string.replaceAll('"', '\\"')}"`;
export default quoteWithDoubleQuote;
