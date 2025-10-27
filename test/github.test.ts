import { beforeAll, describe, test, expect, vi, afterAll } from "vitest";
import { GithubAPI } from "../src/github";

describe("github.test.ts - GitHub Utils Test Suite", () => {
  const mockToken = "mock_github_token";

  describe("Request to GitHub API", () => {
    beforeAll(() => {
      global.fetch = vi.fn().mockImplementation((url, options) => {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ url, headers: options?.headers }),
        });
      });
    });

    afterAll(() => {
      vi.restoreAllMocks();
    });

    test("should include Authorization and Accept headers", async () => {
      const github = new GithubAPI(mockToken);
      const response = await github.request<any>("/test-endpoint");

      expect(response.headers).toBeDefined();
      expect(response.headers["Authorization"]).toBe(`Bearer ${mockToken}`);
      expect(response.headers["Accept"]).toBe("application/vnd.github.v3+json");
    });

    test("should return null for 404 response", () => {
      vi.restoreAllMocks();
      global.fetch = vi.fn().mockImplementation(() => {
        return Promise.resolve({
          ok: false,
          status: 404,
          statusText: "Not Found",
        });
      });

      const github = new GithubAPI(mockToken);
      const response = github.request<any>("/invalid-endpoint");
      expect(response).resolves.toBeNull();
    });

    test("should throw error for non-OK response", () => {
      vi.restoreAllMocks();
      global.fetch = vi.fn().mockImplementation(() => {
        return Promise.resolve({
          ok: false,
          status: 500,
          statusText: "Internal Server Error",
        });
      });

      const github = new GithubAPI(mockToken);
      const response = github.request<any>("/error-endpoint");
      expect(response).rejects.toThrow(
        "GitHub API request failed: 500 Internal Server Error",
      );
    });
  });

  describe("Get latest release", () => {
    const mockReleaseResponse = { tag_name: "v1.0.0", name: "Initial Release" };

    beforeAll(() => {
      global.fetch = vi.fn().mockImplementation(() => {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockReleaseResponse),
        });
      });
    });

    afterAll(() => {
      vi.restoreAllMocks();
    });

    test("should fetch latest release information", async () => {
      const github = new GithubAPI(mockToken);
      const release = await github.getLatestRelease("owner/repo");

      expect(release).toEqual(mockReleaseResponse);
    });
  });

  describe("Compare references", () => {
    const mockDiffResponse = {
      files: [
        { filename: "env.example", patch: "@@ -1 +1 @@\n+ NEW_VAR=new_value" },
      ],
    };

    beforeAll(() => {
      global.fetch = vi.fn().mockImplementation(() => {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockDiffResponse),
        });
      });
    });

    afterAll(() => {
      vi.restoreAllMocks();
    });

    test("should fetch comparison data between two references", async () => {
      const github = new GithubAPI(mockToken);
      const diff = await github.compareReferences(
        "owner/repo",
        "baseRef",
        "headRef",
      );

      expect(diff).toEqual(mockDiffResponse);
    });
  });

  describe("Get file content", () => {
    const mockFileContentResponse = {
      type: "file",
      encoding: "base64",
      content: Buffer.from("TEST_VAR=test_value").toString("base64"),
    };

    beforeAll(() => {
      global.fetch = vi.fn().mockImplementation(() => {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockFileContentResponse),
        });
      });
    });

    afterAll(() => {
      vi.restoreAllMocks();
    });

    test("should fetch file content at specific reference", async () => {
      const github = new GithubAPI(mockToken);
      const fileContent = await github.getFileContent(
        "owner/repo",
        ".env.example",
        "ref",
      );

      expect(fileContent).toEqual(mockFileContentResponse);
    });

    test("should fetch latset file content when ref is not provided", async () => {
      const github = new GithubAPI(mockToken);
      const fileContent = await github.getFileContent(
        "owner/repo",
        ".env.example",
      );

      expect(fileContent).toEqual(mockFileContentResponse);
    });

    test("should return null for 404 response", async () => {
      vi.restoreAllMocks();
      global.fetch = vi.fn().mockImplementation(() => {
        return Promise.resolve({
          status: 404,
          ok: false,
        });
      });

      const github = new GithubAPI(mockToken);
      const fileContent = await github.getFileContent(
        "owner/repo",
        "nonexistent.file",
      );

      expect(fileContent).toBeNull();
    });
  });
});
