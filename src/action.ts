import { getInput } from "@actions/core";
import { context } from "@actions/github";
import { ERRORS } from "./constant";

export function setupAction() {
  const ghToken = getInput("github-token");
  const repo =
    getInput("repository") || context.repo.owner + "/" + context.repo.repo;
  const baseRef = getInput("base-ref");
  const headRef = getInput("head-ref");
  const fileToCompare = getInput("env-file-path");

  if (!repo || !baseRef || !headRef || !fileToCompare) {
    throw new Error(ERRORS.invalidArgs);
  }

  return { ghToken, repo, baseRef, headRef, fileToCompare };
}
