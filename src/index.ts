import core from "@actions/core";
import { setupAction } from "./action";
import { parseArgs } from "./cli";
import { DEFAULT } from "./constant";
import { hasChanges, parseAllNewEnv, parseChanges } from "./diff";
import { GithubAPI } from "./github";
import { generateMarkdown } from "./markdown";
import type { EnvChange } from "./types";

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
async function compare(
  ghToken: string,
  repo: string,
  baseRef: string,
  headRef: string,
  fileToCompare: string,
): Promise<EnvChange> {
  const ghClient = new GithubAPI(ghToken);

  // if baseRef is "latest", fetch the latest release tag
  if (baseRef === DEFAULT.baseRef) {
    const latestRelease = await ghClient.getLatestRelease(repo);
    if (!latestRelease) {
      // consider all changes if no release found
      const data = await ghClient.getFileContent(repo, fileToCompare, headRef);
      if (!data) {
        throw new Error(
          `Unable to fetch file content: ${fileToCompare} at reference: ${headRef}. Please ensure the file exists in the repository.`,
        );
      }
      const diff = Buffer.from(
        data.content,
        data.encoding as BufferEncoding,
      ).toString();

      console.log("new file diff", diff);
      return parseAllNewEnv(diff);
    }
    baseRef = latestRelease.tag_name;
  }
  // if not found latest release, consider all changes from the beginning

  // Get diff from GitHub API
  const diffData = await ghClient.compareReferences(repo, baseRef, headRef);
  if (!diffData) {
    throw new Error(
      `Unable to compare references: ${baseRef}...${headRef}. Please ensure the references exist in the repository.`,
    );
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
    const { ghToken, repo, baseRef, headRef, fileToCompare } = parseArgs();
    // const { ghToken, repo, baseRef, headRef, fileToCompare } = setupAction();

    console.log(`Repository: ${repo}`);
    console.log(`Compare file: ${fileToCompare}`);
    console.log(`Comparing ${baseRef}...${headRef}`);

    const changes = await compare(
      ghToken,
      repo,
      baseRef,
      headRef,
      fileToCompare,
    );

    if (!hasChanges(changes)) {
      core.setOutput("has-changes", "false");
      console.log("No changes detected.");
      return;
    }

    const changelog = generateMarkdown(changes);
    core.setOutput("has-changes", "true");
    core.setOutput("changelog", changelog);

    console.log("Changelog:");
    console.log(changelog);
  } catch (error: any) {
    console.error(`Error processing changes: ${error.message}`);
    core.setFailed(error.message);
    process.exit(1);
  }
}

main();
