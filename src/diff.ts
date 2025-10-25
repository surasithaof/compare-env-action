import { DIFF_HEADERS, DIFF_PREFIXES } from "./constant";
import type { EnvChange } from "./types";

function parseLine(line: string) {
  const envLine = line.substring(1); // Remove the + prefix
  if (envLine.trim() && envLine.includes("=")) {
    const [key, ...value] = envLine.split("=");
    return { key: key!.trim(), value: value.join("=").trim() };
  }
  return null;
}

function isDiffHeader(line: string) {
  return DIFF_HEADERS.some((header: string) => line.startsWith(header));
}

function parseDiffEntries(
  added: Map<string, string>,
  removed: Map<string, string>,
) {
  // find the same value that in added and removed,
  // it's likely modified variables.
  const commonKeys = new Map<string, boolean>();
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
  const commonKVs = new Map<string, boolean>();
  added.forEach((addedVal, addedKey) => {
    removed.forEach((removedVal, removedKey) => {
      if (addedKey === removedKey && addedVal === removedVal) {
        commonKVs.set(addedKey, true);
      }
    });
  });

  const modified = new Map<string, { oldValue: string; newValue: string }>();
  commonKeys.forEach((_, key) => {
    if (commonKVs.has(key)) {
      // skip same key-value pairs as they are not modified
      return;
    }
    const newValue = added.get(key)!;
    const oldValue = removed.get(key)!;
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
export function parseChanges(diffContent: string): EnvChange {
  if (!diffContent) {
    throw new Error("Invalid diff content provided");
  }

  // Split diff content into lines
  const lines = diffContent.replaceAll("\\n", "\n").split("\n");

  const added = new Map<string, string>();
  const removed = new Map<string, string>();

  for (const line of lines) {
    // Skip diff headers and context lines
    if (isDiffHeader(line)) {
      continue;
    }

    // Parse added lines (start with +)
    if (line.startsWith(DIFF_PREFIXES.added)) {
      const kv = parseLine(line);
      if (kv) {
        added.set(kv.key, kv.value);
      }
    }

    // Parse removed lines (start with -)
    if (line.startsWith(DIFF_PREFIXES.removed)) {
      const kv = parseLine(line);
      if (kv) {
        removed.set(kv.key, kv.value);
      }
    }
  }

  return parseDiffEntries(added, removed);
}

/**
 * Checks if there are any changes in the EnvChange object.
 * @param changes - An object containing added, removed, and modified environment variables.
 * @returns A boolean indicating if there are any changes.
 */
export function hasChanges(changes: EnvChange): boolean {
  return (
    changes.added.size > 0 ||
    changes.removed.size > 0 ||
    changes.modified.size > 0
  );
}
