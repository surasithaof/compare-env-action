import { GithubDiff, GithubFileContent, LatestRelease } from "./types";
/**
 * Github client to call to Github API
 */
declare class GithubAPI {
    private token;
    private baseUrl;
    /**
     * @param token - Github token for authentication to access the repository
     */
    constructor(token: string);
    /**
     * Make a GET request to Github API
     * @param endpoint - endpoint to request to Github API with method GET
     * @returns response data from Github API
     */
    request<T>(endpoint: string): Promise<T | null>;
    /**
     * Get the latest release information from the repository
     * @param repo - repository name informat `owner/repo`
     * @returns latest release information from the repository
     */
    getLatestRelease(repo: string): Promise<LatestRelease | null>;
    /**
     * Compare two references in the repository
     * @param repo - repository name in format `owner/repo`
     * @param base - base reference (branch, tag, or commit SHA)
     * @param head - head reference (branch, tag, or commit SHA)
     * @returns comparison data between the two references
     */
    compareReferences(repo: string, base: string, head: string): Promise<GithubDiff | null>;
    /**
     * Get file content from the repository at specific reference
     * @param repo - repository name in format `owner/repo`
     * @param path - file path in the repository
     * @param ref - reference (branch, tag, or commit SHA)
     * @returns file content data
     */
    getFileContent(repo: string, path: string, ref?: string | null): Promise<GithubFileContent | null>;
}
export { GithubAPI };
