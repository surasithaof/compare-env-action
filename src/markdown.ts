import type { EnvChange } from "./types";

/**
 * Generates a markdown representation of environment variable changes.
 * @param changes - An object containing added, removed, and modified environment variables.
 * @param header - An optional header string to include at the top of the markdown.
 * @returns A string containing the markdown representation of the changes.
 */
export function generateMarkdown(changes: EnvChange, header: string = "") {
  let markdown = "";
  if (header) {
    markdown += `${header}\n\n`;
  }

  if (changes.added.size > 0) {
    markdown += "**New Environment Variables**\n\n";
    for (const [key, _] of changes.added) {
      markdown += `- \`${key}\`\n`;
    }
    markdown += "\n";
  }

  if (changes.removed.size > 0) {
    markdown += "**Removed Environment Variables**\n\n";
    for (const [key, _] of changes.removed) {
      markdown += `- ~~\`${key}\`~~\n`;
    }
    markdown += "\n";
  }

  if (changes.modified.size > 0) {
    markdown += "**Modified Environment Variables**\n\n";
    for (const [key, val] of changes.modified) {
      markdown += `- **\`${key}\`**:\n`;
      markdown += "  ```diff\n";
      markdown += `  - ${val.oldValue}\n`;
      markdown += `  + ${val.newValue}\n`;
      markdown += "  ```\n";
    }
    markdown += "\n";
  }

  return markdown;
}
