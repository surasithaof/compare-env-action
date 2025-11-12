import { GithubDiff, GithubFileContent, LatestRelease } from "./types";

/**
 * Github client to call to Github API
 */
class GithubAPI {
  private token: string;
  private baseUrl: string;

  /**
   * @param token - Github token for authentication to access the repository
   */
  constructor(token: string) {
    this.token = token;
    this.baseUrl = "https://api.github.com";
  }

  /**
   * Make a GET request to Github API
   * @param endpoint - endpoint to request to Github API with method GET
   * @returns response data from Github API
   */
  async request<T>(endpoint: string): Promise<T | null> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        Authorization: `Bearer ${this.token}`,
        Accept: "application/vnd.github.v3+json",
      },
    });
    if (response.status == 404) {
      return null;
    }
    if (!response.ok) {
      throw new Error(
        `GitHub API request failed: ${response.status} ${response.statusText}`,
      );
    }

    return response.json() as Promise<T>;
  }

  /**
   * Get the latest release information from the repository
   * @param repo - repository name informat `owner/repo`
   * @returns latest release information from the repository
   */
  async getLatestRelease(repo: string): Promise<LatestRelease | null> {
    return this.request<LatestRelease>(`/repos/${repo}/releases/latest`);
  }

  /**
   * Compare two references in the repository
   * @param repo - repository name in format `owner/repo`
   * @param base - base reference (branch, tag, or commit SHA)
   * @param head - head reference (branch, tag, or commit SHA)
   * @returns comparison data between the two references
   */
  async compareReferences(
    repo: string,
    base: string,
    head: string,
  ): Promise<GithubDiff | null> {
    return this.request<GithubDiff>(`/repos/${repo}/compare/${base}...${head}`);
  }

  /**
   * Get file content from the repository at specific reference
   * @param repo - repository name in format `owner/repo`
   * @param path - file path in the repository
   * @param ref - reference (branch, tag, or commit SHA)
   * @returns file content data
   */
  async getFileContent(
    repo: string,
    path: string,
    ref: string | null = null,
  ): Promise<GithubFileContent | null> {
    let url = `/repos/${repo}/contents/${path}`;
    if (ref) {
      url += `?ref=${ref}`;
    }
    return this.request<GithubFileContent | null>(url);
  }
}

export { GithubAPI };
