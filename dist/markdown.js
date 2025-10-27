/**
 * Generates a markdown representation of environment variable changes.
 * @param changes - An object containing added, removed, and modified environment variables.
 * @param header - An optional header string to include at the top of the markdown.
 * @returns A string containing the markdown representation of the changes.
 */
export function generateMarkdown(changes, header = "") {
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
//# sourceMappingURL=markdown.js.map