import { DEFAULT, ERRORS } from "./constant";
import { parseChanges } from "./diff";
import { GithubAPI } from "./github";
import { generateMarkdown } from "./markdown";

function validateArgs() {
  const args = process.argv.slice(2);

  if (!process.env.GITHUB_TOKEN) {
    throw new Error(ERRORS.tokenMissing);
  }
  if (args.length < 1) {
    throw new Error(ERRORS.invalidArgs);
  }

  const ghToken: string = process.env.GITHUB_TOKEN;
  const repo: string = args[0]?.replace("https://github.com/", "") || ""; // Normalize repo format to owner/repo
  const baseRef: string = args[1] || DEFAULT.baseRef; // Default to latest release
  const headRef: string = args[2] || DEFAULT.headRef; // Default to master branch
  const fileToCompare: string = args[3] || DEFAULT.fileToCompare; // Default to .env.example

  if (!repo || !baseRef || !headRef || !fileToCompare) {
    throw new Error(ERRORS.invalidArgs);
  }

  return { ghToken, repo, baseRef, headRef, fileToCompare };
}

async function main() {
  try {
    let { ghToken, repo, baseRef, headRef, fileToCompare } = validateArgs();
    const ghClient = new GithubAPI(ghToken);

    // if baseRef is "latest", fetch the latest release tag
    if (baseRef === DEFAULT.baseRef) {
      const latestRelease = await ghClient.getLatestRelease(repo);
      baseRef = latestRelease.tag_name;
    }

    console.log(`Compare file: ${fileToCompare}`);
    console.log(`Comparing ${baseRef}...${headRef}`);

    const diffData = await ghClient.compareReferences(repo, baseRef, headRef);
    const diff = diffData.files.find((file) => file.filename === fileToCompare);
    if (!diff?.patch) {
      console.log(`No changes found in ${fileToCompare} file.`);
      process.exit(0);
    }

    // Parse changes
    const changes = parseChanges(diff.patch);

    // Generate markdown
    const markdown = generateMarkdown(changes);

    // Output to stdout
    console.log(markdown);
  } catch (error: any) {
    console.error(`Error processing changes: ${error}`);
    process.exit(1);
  }
}

main();
