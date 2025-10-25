import { describe, test, expect } from "vitest";
import { EnvChange } from "../src/types";
import { parseChanges } from "../src/diff";

describe("diff.test.ts - Diff Utils Test Suite", () => {
  test("should throw if no changes detected", () => {
    const diffText = ``;
    expect(() => parseChanges(diffText)).toThrow(
      "Invalid diff content provided",
    );
  });

  test("should parse invalid diff format", () => {
    const diffText = `@@ -1 +1 @@
This is not a valid diff format
# SOME_COMMENT_ENV=true
+ SOME_INVALID_LINE
- ANOTHER_INVALID_LINE`;
    const changes: EnvChange = parseChanges(diffText);
    expect(changes.added.size).toBe(0);
    expect(changes.removed.size).toBe(0);
    expect(changes.modified.size).toBe(0);
  });

  test("should parse added environment variables", () => {
    const diffText = `@@ -0,0 +1,2 @@
+ NEW_VAR=new_value
+ ANOTHER_VAR=another_value
`;
    const changes: EnvChange = parseChanges(diffText);
    expect(changes.added.size).toBe(2);
    expect(changes.added.get("NEW_VAR")).toBe("new_value");
    expect(changes.added.get("ANOTHER_VAR")).toBe("another_value");
  });

  test("should parse removed environment variables", () => {
    const diffText = `@@ -1,2 +0,0 @@
- OLD_VAR=old_value
- DEPRECATED_VAR=deprecated_value
`;
    const changes: EnvChange = parseChanges(diffText);
    expect(changes.removed.size).toBe(2);
    expect(changes.removed.get("OLD_VAR")).toBe("old_value");
    expect(changes.removed.get("DEPRECATED_VAR")).toBe("deprecated_value");
  });

  test("should parse modified environment variables", () => {
    const diffText = `@@ -1,4 +1,4 @@
+ UNCHANGED_VAR=same_value
- CHANGED_VAR=old_value
+ CHANGED_VAR=new_value
- ANOTHER_CHANGED=123
+ ANOTHER_CHANGED=456
- UNCHANGED_VAR=same_value
`;
    const changes: EnvChange = parseChanges(diffText);
    expect(changes.modified.size).toBe(2);
    expect(changes.modified.get("CHANGED_VAR")).toEqual({
      oldValue: "old_value",
      newValue: "new_value",
    });
    expect(changes.modified.get("ANOTHER_CHANGED")).toEqual({
      oldValue: "123",
      newValue: "456",
    });
  });
});
