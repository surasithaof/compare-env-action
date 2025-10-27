import core from "@actions/core";
import github from "@actions/github";
import { ERRORS } from "./constant";
export function setupAction() {
    const ghToken = core.getInput("github-token");
    const repo = core.getInput("repository") ||
        github.context.repo.owner + "/" + github.context.repo.repo;
    const baseRef = core.getInput("base-ref");
    const headRef = core.getInput("head-ref");
    const fileToCompare = core.getInput("env-file-path");
    if (!repo || !baseRef || !headRef || !fileToCompare) {
        throw new Error(ERRORS.invalidArgs);
    }
    return { ghToken, repo, baseRef, headRef, fileToCompare };
}
//# sourceMappingURL=action.js.map