const quoteWithBacktick = (string) => `\`${string.replaceAll("`", "\\`")}\``;
export default quoteWithBacktick;
