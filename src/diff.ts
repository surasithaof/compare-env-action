import { DIFF_HEADERS, DIFF_PREFIXES } from "./constant";
import type { EnvChange } from "./types";

export function parseChanges(diffContent: string) {
  if (!diffContent) {
    throw new Error("Invalid diff content provided");
  }
  const lines = diffContent.replaceAll("\\n", "\n").split("\n");

  const changes: EnvChange = {
    added: [],
    removed: [],
    modified: [],
  };

  for (const line of lines) {
    // Skip diff headers and context lines
    if (DIFF_HEADERS.some((header: string) => line.startsWith(header))) {
      continue;
    }

    // Parse added lines (start with +)
    if (line.startsWith(DIFF_PREFIXES.added)) {
      const envLine = line.substring(1); // Remove the + prefix
      if (envLine.trim() && envLine.includes("=")) {
        const [key, ...value] = envLine.split("=");
        changes.added.push({ key: key!.trim(), value: value.join("=").trim() });
      }
    }

    // Parse removed lines (start with -)
    if (line.startsWith(DIFF_PREFIXES.removed)) {
      const envLine = line.substring(1); // Remove the - prefix
      if (envLine.trim() && envLine.includes("=")) {
        const [key, ...value] = envLine.split("=");
        changes.removed.push({
          key: key!.trim(),
          value: value.join("=").trim(),
        });
      }
    }
  }

  // find tha same value that in added and removed,
  // it's likely modified variables.
  const commonKeys = changes.added.filter((addedItem) =>
    changes.removed.some((removedItem) => removedItem.key === addedItem.key),
  );

  // sometimes the same key can be added and removed with the same value
  // e.g. new line added and then removed, or changed line that has the same value
  // so we need to filter those out.
  const commonKVs = changes.added.filter((addedItem) =>
    changes.removed.some(
      (removedItem) =>
        removedItem.key === addedItem.key &&
        removedItem.value === addedItem.value,
    ),
  );

  changes.modified = commonKeys
    .filter(
      (item) =>
        !commonKVs.some(
          (dup) => dup.key === item.key && dup.value === item.value,
        ),
    )
    .map((addedItem) => {
      // Find the corresponding removed item to show both old and new values
      const removedItem = changes.removed.find(
        (removedItem) => removedItem.key === addedItem.key,
      );
      return {
        key: addedItem.key,
        oldValue: removedItem ? removedItem.value : "",
        newValue: addedItem.value,
      };
    });

  changes.added = changes.added.filter(
    (addedItem) =>
      !commonKeys.map((item) => item.key).includes(addedItem.key) &&
      !commonKVs.map((item) => item.key).includes(addedItem.key),
  );

  changes.removed = changes.removed.filter(
    (removedItem) =>
      !commonKeys.map((item) => item.key).includes(removedItem.key) &&
      !commonKVs.map((item) => item.key).includes(removedItem.key),
  );

  return changes;
}
