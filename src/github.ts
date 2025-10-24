import { GithubDiff, LatestRelease } from "./types";

class GithubAPI {
  private token: string;
  private baseUrl: string;

  constructor(token: string) {
    this.token = token;
    this.baseUrl = "https://api.github.com";
  }

  async request<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        Authorization: `Bearer ${this.token}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!response.ok) {
      throw new Error(
        `GitHub API request failed: ${response.status} ${response.statusText}`,
      );
    }

    return response.json() as Promise<T>;
  }

  async getLatestRelease(repo: string): Promise<LatestRelease> {
    return this.request<LatestRelease>(`/repos/${repo}/releases/latest`);
  }

  async compareReferences(
    repo: string,
    base: string,
    head: string,
  ): Promise<GithubDiff> {
    return this.request<GithubDiff>(`/repos/${repo}/compare/${base}...${head}`);
  }
}

export { GithubAPI };
