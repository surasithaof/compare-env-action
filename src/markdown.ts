import type { EnvChange } from "./types";

export function generateMarkdown(changes: EnvChange, header: string = "") {
  let markdown = "";
  if (header) {
    markdown += `${header}\n\n`;
  }

  if (
    changes.added.length === 0 &&
    changes.removed.length === 0 &&
    changes.modified.length === 0
  ) {
    markdown += "No changes detected.\n\n";
    return markdown;
  }

  if (changes.added.length > 0) {
    markdown += "**New Environment Variables**\n\n";
    for (const key of changes.added) {
      markdown += `- \`${key.key}\`\n`;
    }
    markdown += "\n";
  }

  if (changes.removed.length > 0) {
    markdown += "**Removed Environment Variables**\n\n";
    for (const key of changes.removed) {
      markdown += `- ~~\`${key.key}\`~~\n`;
    }
    markdown += "\n";
  }

  if (changes.modified.length > 0) {
    markdown += "**Modified Environment Variables**\n\n";
    for (const modified of changes.modified) {
      markdown += `- **\`${modified.key}\`**:\n`;
      markdown += "  ```diff\n";
      markdown += `  - ${modified.oldValue}\n`;
      markdown += `  + ${modified.newValue}\n`;
      markdown += "  ```\n";
    }
    markdown += "\n";
  }

  return markdown;
}
