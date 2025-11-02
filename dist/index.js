import core from '@actions/core';
import github from '@actions/github';

const DEFAULT = {
    baseRef: "latest",
    headRef: "master",
    fileToCompare: ".env.example",
};
const PREFIXES = {
    added: "+",
    removed: "-",
    context: " ",
    comment: "#",
};
const HEADERS = ["@@", "diff", "index", "---", "+++"];
const ERRORS = {
    tokenMissing: "GitHub token is missing. Please set the GITHUB_TOKEN environment variable.",
    invalidArgs: "Invalid arguments provided. Usage: node src/index.js <repository> [baseRef] [headRef] [fileToCompare]",
};

function setupAction() {
    const ghToken = core.getInput("github-token");
    const repo = core.getInput("repository") ||
        github.context.repo.owner + "/" + github.context.repo.repo;
    const baseRef = core.getInput("base-ref");
    const headRef = core.getInput("head-ref");
    const fileToCompare = core.getInput("env-file-path");
    if (!repo || !baseRef || !headRef || !fileToCompare) {
        throw new Error(ERRORS.invalidArgs);
    }
    return { ghToken, repo, baseRef, headRef, fileToCompare };
}

function parseArgs() {
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

function parseLine(line) {
    if (line.trim().startsWith(PREFIXES.comment)) {
        return null; // Skip comment lines
    }
    let envLine = line;
    if (line.startsWith(PREFIXES.added) ||
        line.startsWith(PREFIXES.removed) ||
        line.startsWith(PREFIXES.context)) {
        envLine = envLine.substring(1); // Remove the diff prefix
    }
    if (envLine.trim() && envLine.includes("=")) {
        const [key, ...value] = envLine.split("=");
        return { key: key.trim(), value: value.join("=").trim() };
    }
    return null;
}
function isDiffHeader(line) {
    return HEADERS.some((header) => line.startsWith(header));
}
function parseDiffEntries(added, removed) {
    // find the same value that in added and removed,
    // it's likely modified variables.
    const commonKeys = new Map();
    added.forEach((_, added) => {
        removed.forEach((_, removed) => {
            if (added === removed) {
                commonKeys.set(added, true);
            }
        });
    });
    // sometimes the same key can be added and removed with the same value
    // e.g. new line added and then removed, or changed line that has the same value
    // so we need to filter those out.
    const commonKVs = new Map();
    added.forEach((addedVal, addedKey) => {
        removed.forEach((removedVal, removedKey) => {
            if (addedKey === removedKey && addedVal === removedVal) {
                commonKVs.set(addedKey, true);
            }
        });
    });
    const modified = new Map();
    commonKeys.forEach((_, key) => {
        if (commonKVs.has(key)) {
            // skip same key-value pairs as they are not modified
            return;
        }
        const newValue = added.get(key);
        const oldValue = removed.get(key);
        modified.set(key, { oldValue, newValue });
    });
    // Remove duplicates from added
    added.forEach((_, key) => {
        if (commonKeys.has(key) || commonKVs.has(key)) {
            added.delete(key);
        }
    });
    // Remove duplicates from removed
    removed.forEach((_, key) => {
        if (commonKeys.has(key) || commonKVs.has(key)) {
            removed.delete(key);
        }
    });
    return { added, removed, modified };
}
/**
 * Parses the diff content to extract environment variable changes.
 * @param diffContent - parse the diff content string to extract environment variable changes
 * @returns An object containing added, removed, and modified environment variables.
 */
function parseChanges(diffContent) {
    // Split diff content into lines
    const lines = diffContent.replaceAll("\\n", "\n").split("\n");
    const added = new Map();
    const removed = new Map();
    for (const line of lines) {
        // Skip diff headers and context lines
        if (isDiffHeader(line)) {
            continue;
        }
        const kv = parseLine(line);
        if (!kv) {
            continue;
        }
        // Parse added lines (start with +)
        if (line.startsWith(PREFIXES.added)) {
            added.set(kv.key, kv.value);
        }
        // Parse removed lines (start with -)
        if (line.startsWith(PREFIXES.removed)) {
            removed.set(kv.key, kv.value);
        }
    }
    return parseDiffEntries(added, removed);
}
/**
 * Checks if there are any changes in the EnvChange object.
 * @param changes - An object containing added, removed, and modified environment variables.
 * @returns A boolean indicating if there are any changes.
 */
function hasChanges(changes) {
    return (changes.added.size > 0 ||
        changes.removed.size > 0 ||
        changes.modified.size > 0);
}
/**
 * Parses the diff content assuming all lines are new additions.
 * @param diffContent - The diff content string to parse.
 * @returns An object containing added environment variables.
 */
function parseAllNewEnv(diffContent) {
    const lines = diffContent.replaceAll("\\n", "\n").split("\n");
    const added = new Map();
    for (const line of lines) {
        // Skip diff headers and context lines
        if (isDiffHeader(line)) {
            continue;
        }
        // Parse added lines (start with +)
        const kv = parseLine(line);
        if (kv) {
            added.set(kv.key, kv.value);
        }
    }
    return { added, removed: new Map(), modified: new Map() };
}

/**
 * Github client to call to Github API
 */
class GithubAPI {
    token;
    baseUrl;
    /**
     * @param token - Github token for authentication to access the repository
     */
    constructor(token) {
        this.token = token;
        this.baseUrl = "https://api.github.com";
    }
    /**
     * Make a GET request to Github API
     * @param endpoint - endpoint to request to Github API with method GET
     * @returns response data from Github API
     */
    async request(endpoint) {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            headers: {
                Authorization: `Bearer ${this.token}`,
                Accept: "application/vnd.github.v3+json",
            },
        });
        if (response.status == 404) {
            return null;
        }
        if (!response.ok) {
            throw new Error(`GitHub API request failed: ${response.status} ${response.statusText}`);
        }
        return response.json();
    }
    /**
     * Get the latest release information from the repository
     * @param repo - repository name informat `owner/repo`
     * @returns latest release information from the repository
     */
    async getLatestRelease(repo) {
        return this.request(`/repos/${repo}/releases/latest`);
    }
    /**
     * Compare two references in the repository
     * @param repo - repository name in format `owner/repo`
     * @param base - base reference (branch, tag, or commit SHA)
     * @param head - head reference (branch, tag, or commit SHA)
     * @returns comparison data between the two references
     */
    async compareReferences(repo, base, head) {
        return this.request(`/repos/${repo}/compare/${base}...${head}`);
    }
    /**
     * Get file content from the repository at specific reference
     * @param repo - repository name in format `owner/repo`
     * @param path - file path in the repository
     * @param ref - reference (branch, tag, or commit SHA)
     * @returns file content data
     */
    async getFileContent(repo, path, ref = null) {
        return this.request(`/repos/${repo}/contents/${path}`);
    }
}

/**
 * Generates a markdown representation of environment variable changes.
 * @param changes - An object containing added, removed, and modified environment variables.
 * @param header - An optional header string to include at the top of the markdown.
 * @returns A string containing the markdown representation of the changes.
 */
function generateMarkdown(changes, header = "") {
    let markdown = "";
    if (header) {
        markdown += `${header}\n\n`;
    }
    if (changes.added.size > 0) {
        markdown += "**New Environment Variables**\n\n";
        for (const [key, _] of changes.added) {
            markdown += formatNewVar(key);
        }
        markdown += "\n";
    }
    if (changes.removed.size > 0) {
        markdown += "**Removed Environment Variables**\n\n";
        for (const [key, _] of changes.removed) {
            markdown += formatRemovedVar(key);
        }
        markdown += "\n";
    }
    if (changes.modified.size > 0) {
        markdown += "**Modified Environment Variables**\n\n";
        for (const [key, val] of changes.modified) {
            markdown += formatModifiedVar(key, val.oldValue, val.newValue);
        }
        markdown += "\n";
    }
    return markdown;
}
function formatNewVar(key) {
    return `- \`${key}\`\n`;
}
function formatRemovedVar(key) {
    return `- ~~\`${key}\`~~\n`;
}
function formatModifiedVar(key, oldValue, newValue) {
    return (`- **\`${key}\`**:\n` +
        "  ```diff\n" +
        `  - ${oldValue}\n` +
        `  + ${newValue}\n` +
        "  ```\n");
}

/**
 * Compares a specific file between two references in a GitHub repository
 * and generates a markdown representation of the changes.
 *
 * @param ghToken - The GitHub token for authentication.
 * @param repo - The repository in the format "owner/repo".
 * @param baseRef - The base reference (branch, tag, or commit SHA).
 * @param headRef - The head reference (branch, tag, or commit SHA).
 * @param fileToCompare - The specific file to compare.
 * @returns A markdown string representing the changes, or undefined if no changes.
 */
async function compare(ghToken, repo, baseRef, headRef, fileToCompare) {
    const ghClient = new GithubAPI(ghToken);
    // if baseRef is "latest", fetch the latest release tag
    if (baseRef === DEFAULT.baseRef) {
        const latestRelease = await ghClient.getLatestRelease(repo);
        if (!latestRelease) {
            // consider all changes if no release found
            const data = await ghClient.getFileContent(repo, fileToCompare, headRef);
            if (!data) {
                throw new Error(`Unable to fetch file content: ${fileToCompare} at reference: ${headRef}. Please ensure the file exists in the repository.`);
            }
            const diff = Buffer.from(data.content, data.encoding).toString();
            console.log("new file diff", diff);
            return parseAllNewEnv(diff);
        }
        baseRef = latestRelease.tag_name;
    }
    // if not found latest release, consider all changes from the beginning
    // Get diff from GitHub API
    const diffData = await ghClient.compareReferences(repo, baseRef, headRef);
    if (!diffData) {
        throw new Error(`Unable to compare references: ${baseRef}...${headRef}. Please ensure the references exist in the repository.`);
    }
    // Find the specific file diff
    const diff = diffData.files.find((file) => file.filename === fileToCompare);
    if (!diff?.patch) {
        console.log(`No changes found in ${fileToCompare} file.`);
        return { added: new Map(), removed: new Map(), modified: new Map() };
    }
    // Parse changes
    return parseChanges(diff.patch);
}
async function main() {
    try {
        const { ghToken, repo, baseRef, headRef, fileToCompare } = process.env
            .GITHUB_ACTIONS
            ? setupAction()
            : parseArgs();
        console.log(`Repository: ${repo}`);
        console.log(`Compare file: ${fileToCompare}`);
        console.log(`Comparing ${baseRef}...${headRef}`);
        const changes = await compare(ghToken, repo, baseRef, headRef, fileToCompare);
        if (!hasChanges(changes)) {
            process.env.GITHUB_ACTIONS && core.setOutput("has-changes", "false");
            console.log("No changes detected.");
            return;
        }
        const changelog = generateMarkdown(changes);
        process.env.GITHUB_ACTIONS && core.setOutput("has-changes", "true");
        process.env.GITHUB_ACTIONS && core.setOutput("changelog", changelog);
        console.log("Changelog:");
        console.log(changelog);
    }
    catch (error) {
        console.error(`Error processing changes: ${error.message}`);
        process.env.GITHUB_ACTIONS && core.setFailed(error.message);
        process.exit(1);
    }
}
main();
//# sourceMappingURL=index.js.map
