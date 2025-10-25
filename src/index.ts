import { parseArgs } from "./cli";
import { DEFAULT } from "./constant";
import { parseChanges } from "./diff";
import { GithubAPI } from "./github";
import { generateMarkdown } from "./markdown";

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
) {
  const ghClient = new GithubAPI(ghToken);

  // if baseRef is "latest", fetch the latest release tag
  if (baseRef === DEFAULT.baseRef) {
    const latestRelease = await ghClient.getLatestRelease(repo);
    console.debug(`Latest release tag: ${JSON.stringify(latestRelease)}`);
    baseRef = latestRelease.tag_name;
  }

  // Get diff from GitHub API
  const diffData = await ghClient.compareReferences(repo, baseRef, headRef);

  // Find the specific file diff
  const diff = diffData.files.find((file) => file.filename === fileToCompare);
  if (!diff?.patch) {
    console.log(`No changes found in ${fileToCompare} file.`);
    return;
  }

  // Parse changes
  const changes = parseChanges(diff.patch);

  // Generate markdown
  return generateMarkdown(changes);
}

async function main() {
  try {
    // Parse command-line arguments
    let { ghToken, repo, baseRef, headRef, fileToCompare } = parseArgs();

    console.log(`Compare file: ${fileToCompare}`);
    console.log(`Comparing ${baseRef}...${headRef}`);

    const markdown = await compare(
      ghToken,
      repo,
      baseRef,
      headRef,
      fileToCompare,
    );

    if (!markdown) {
      console.log("No changes detected.");
      return;
    }

    // Output to stdout
    console.log(markdown);
  } catch (error: any) {
    console.error(`Error processing changes: ${error}`);
    process.exit(1);
  }
}

main();
