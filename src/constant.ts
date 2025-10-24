export const DEFAULT = {
  baseRef: "latest",
  headRef: "master",
  fileToCompare: ".env.example",
};

/**
 * Constants for diff parsing
 */
export const DIFF_PREFIXES = {
  added: "+",
  removed: "-",
  context: " ",
};

export const DIFF_HEADERS = ["@@", "diff", "index", "---", "+++"];

export const ERRORS = {
  tokenMissing:
    "GitHub token is missing. Please set the GITHUB_TOKEN environment variable.",
  invalidArgs:
    "Invalid arguments provided. Usage: node src/index.js <repository> [baseRef] [headRef] [fileToCompare]",
};
