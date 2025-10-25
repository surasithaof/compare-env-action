import { describe, test, expect } from "vitest";
import { EnvChange } from "../src/types";
import { generateMarkdown } from "../src/markdown";

describe("markdown.test.ts - Markdown Utils Test Suite", () => {
  test("should retur no changes detected", () => {
    const changes: EnvChange = {
      added: new Map(),
      removed: new Map(),
      modified: new Map(),
    };
    const markdown = generateMarkdown(changes);
    expect(markdown).toBe("No changes detected.\n\n");
  });

  test("should return empty string if no changes and emptyIfNoChanges is true", () => {
    const changes: EnvChange = {
      added: new Map(),
      removed: new Map(),
      modified: new Map(),
    };
    const markdown = generateMarkdown(changes, "", true);
    expect(markdown).toBe("");
  });

  test("should generate markdown for added variables", () => {
    const changes: EnvChange = {
      added: new Map([["NEW_VAR", "new_value"]]),
      removed: new Map(),
      modified: new Map(),
    };
    const markdown = generateMarkdown(changes);
    expect(markdown).toContain("**New Environment Variables**");
    expect(markdown).toContain("- `NEW_VAR`");
  });

  test("should generate markdown for removed variables", () => {
    const changes: EnvChange = {
      added: new Map(),
      removed: new Map([["OLD_VAR", "old_value"]]),
      modified: new Map(),
    };
    const markdown = generateMarkdown(changes);
    expect(markdown).toContain("**Removed Environment Variables**");
    expect(markdown).toContain("- ~~`OLD_VAR`~~");
  });

  test("should generate markdown for modified variables", () => {
    const changes: EnvChange = {
      added: new Map(),
      removed: new Map(),
      modified: new Map([
        ["CHANGED_VAR", { oldValue: "old", newValue: "new" }],
      ]),
    };
    const markdown = generateMarkdown(changes);
    expect(markdown).toContain("**Modified Environment Variables**");
    expect(markdown).toContain("- **`CHANGED_VAR`**:");
    expect(markdown).toContain("```diff");
    expect(markdown).toContain("- old");
    expect(markdown).toContain("+ new");
  });

  test("should generate markdown with header", () => {
    const header = "## Environment Changes";
    const changes: EnvChange = {
      added: new Map([["TEST_VAR", "test_value"]]),
      removed: new Map(),
      modified: new Map(),
    };

    const markdown = generateMarkdown(changes, header);
    expect(markdown).toContain(header);
  });
});
