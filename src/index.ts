import { setOutput, setFailed } from "@actions/core";
import { setupAction } from "./action";
import { parseArgs } from "./cli";
import { DEFAULT } from "./constant";
import { hasChanges, parseAllNewEnv, parseChanges } from "./diff";
// import { GithubAPI } from "./github";
import { generateMarkdown } from "./markdown";
import type { EnvChange } from "./types";
import { Octokit } from "@octokit/rest";

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
  const ghClient = new Octokit({ auth: ghToken });
  const [owner, repoName] = repo.split("/");

  // if baseRef is "latest", fetch the latest release tag
  if (baseRef === DEFAULT.baseRef) {
    const latestRelease = await ghClient.rest.repos
      .getLatestRelease({
        owner: owner,
        repo: repoName,
      })
      .catch((error) => {
        if (error.status === 404) {
          return null;
        }
        throw error;
      });

    // if not found latest release, consider all changes from the beginning
    if (!latestRelease) {
      // consider all changes if no release found
      const content = await ghClient.rest.repos.getContent({
        owner: owner,
        repo: repoName,
        path: fileToCompare,
        ref: headRef,
      });
      if (!content?.data) {
        throw new Error(
          `Unable to fetch file content: ${fileToCompare} at reference: ${headRef}. Please ensure the file exists in the repository.`,
        );
      }
      if (!("content" in content.data)) {
        throw new Error(
          `The path: ${fileToCompare} is not a file in the repository.`,
        );
      }
      const diff = Buffer.from(
        content.data.content,
        content.data.encoding as BufferEncoding,
      ).toString();

      console.log("new file diff", diff);
      return parseAllNewEnv(diff);
    }
    baseRef = latestRelease.data.tag_name;
  }

  // Get diff from GitHub API
  const diffData = await ghClient.rest.repos.compareCommits({
    owner: owner,
    repo: repoName,
    base: baseRef,
    head: headRef,
  });
  if (!diffData?.data?.files) {
    throw new Error(
      `Unable to compare references: ${baseRef}...${headRef}. Please ensure the references exist in the repository.`,
    );
  }

  // Find the specific file diff
  const diff = diffData.data.files.find(
    (file) => file.filename === fileToCompare,
  );
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

    const changes = await compare(
      ghToken,
      repo,
      baseRef,
      headRef,
      fileToCompare,
    );

    const hasChangesFlag = hasChanges(changes);
    if (process.env.GITHUB_ACTIONS) {
      setOutput("has-changes", hasChangesFlag ? "true" : "false");
    }

    if (!hasChangesFlag) {
      console.log("No changes detected.");
      return;
    }

    const changelog = generateMarkdown(changes);
    if (process.env.GITHUB_ACTIONS) {
      setOutput("changelog", changelog);
    }

    console.log("Changelog:");
    console.log(changelog);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error(`Error processing changes: ${error.message}`);

    if (process.env.GITHUB_ACTIONS) {
      setFailed(error.message);
    }

    process.exit(1);
  }
}

main();
