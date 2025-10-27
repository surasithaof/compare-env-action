export const DEFAULT = {
  baseRef: "latest",
  headRef: "master",
  fileToCompare: ".env.example",
};

export const PREFIXES = {
  added: "+",
  removed: "-",
  context: " ",
  comment: "#",
};

export const HEADERS = ["@@", "diff", "index", "---", "+++"];

export const ERRORS = {
  tokenMissing:
    "GitHub token is missing. Please set the GITHUB_TOKEN environment variable.",
  invalidArgs:
    "Invalid arguments provided. Usage: node src/index.js <repository> [baseRef] [headRef] [fileToCompare]",
};
