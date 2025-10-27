import { DEFAULT, ERRORS } from "./constant";
export function parseArgs() {
    const args = process.argv.slice(2);
    if (!process.env.GITHUB_TOKEN) {
        throw new Error(ERRORS.tokenMissing);
    }
    if (args.length < 1) {
        throw new Error(ERRORS.invalidArgs);
    }
    const ghToken = process.env.GITHUB_TOKEN;
    const repo = args[0]?.replace("https://github.com/", "") || ""; // Normalize repo format to owner/repo
    const baseRef = args[1] || DEFAULT.baseRef; // Default to latest release
    const headRef = args[2] || DEFAULT.headRef; // Default to master branch
    const fileToCompare = args[3] || DEFAULT.fileToCompare; // Default to .env.example
    if (!repo || !baseRef || !headRef || !fileToCompare) {
        throw new Error(ERRORS.invalidArgs);
    }
    return { ghToken, repo, baseRef, headRef, fileToCompare };
}
//# sourceMappingURL=cli.js.map