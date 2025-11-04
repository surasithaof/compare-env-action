import { getInput } from "@actions/core";
import { context } from "@actions/github";
import { ERRORS } from "./constant";

export function setupAction() {
  const ghToken = getInput("github-token");
  const repo =
    getInput("repository") || context.repo.owner + "/" + context.repo.repo;
  const baseRef = getInput("base-ref") || "latest";
  const headRef =
    getInput("head-ref") || context.ref.replace("refs/heads/", "");
  const fileToCompare = getInput("env-file-path") || ".env.example";

  if (!repo || !baseRef || !headRef || !fileToCompare) {
    console.table({ repo, baseRef, headRef, fileToCompare });
    throw new Error(ERRORS.invalidArgs);
  }

  return { ghToken, repo, baseRef, headRef, fileToCompare };
}
