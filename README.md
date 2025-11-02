# Compare ENV

A TypeScript tool and GitHub Action that compares environment variable changes between Git references and generates detailed markdown reports for release management and CI/CD workflows.

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## Features

- **Environment Variable Tracking**: Compare `.env.example` files between branches, tags, or commits
- **Multiple Usage Modes**: Use as a **GitHub Action** or **CLI**
- **Rich Markdown Reports**: Generate detailed change summaries with diff visualization
- **Flexible Comparisons**: Compare against latest release, specific branches, or commits
- **Comprehensive Detection**: Identifies added, removed, and modified variables
- **GitHub Integration**: Native GitHub API integration with proper error handling
- **Type-Safe**: Built with TypeScript for reliability and maintainability

## Installation

### As a GitHub Action

Add to your workflow file (`.github/workflows/compare-env.yml`):

```yaml
name: Compare Environment Variables
on:
  pull_request:
    paths:
      - ".env.example"
      - ".env.template"

jobs:
  compare-env:
    runs-on: ubuntu-latest
    steps:
      - name: Compare Environment Variables
        uses: your-org/compare-env-action@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          repository: ${{ github.repository }}
          base-ref: "latest"
          head-ref: ${{ github.head_ref }}
          env-file-path: ".env.example"
```

### As a CLI Tool

```bash
# Clone the repository
git clone https://github.com/your-org/compare-env-action.git
cd compare-env-action

# Install dependencies
npm install

# Build the project
npm run build

# Set GitHub token
export GITHUB_TOKEN=your_github_token_here

# Run the comparison
npm run compare owner/repo latest main .env.example
```

## Usage

### GitHub Action Usage

#### Basic Example

```yaml
- name: Compare Environment Variables
  uses: your-org/compare-env-action@v1
  with:
    base-ref: "v1.0.0"
    head-ref: "main"
    env-file-path: ".env.example"
```

#### Advanced Example with Custom Configuration

```yaml
- name: Compare Environment Variables
  uses: your-org/compare-env-action@v1
  id: env-compare
  with:
    github-token: ${{ secrets.CUSTOM_GITHUB_TOKEN }}
    repository: "different-org/different-repo"
    base-ref: "production"
    head-ref: "staging"
    env-file-path: "config/.env.template"

- name: Comment PR with Changes
  if: steps.env-compare.outputs.has-changes == 'true'
  uses: actions/github-script@v7
  with:
    script: |
      github.rest.issues.createComment({
        issue_number: context.issue.number,
        owner: context.repo.owner,
        repo: context.repo.repo,
        body: '${{ steps.env-compare.outputs.changelog }}'
      })
```

### CLI Usage

#### Basic Syntax

```bash
npm run compare <repository> [base-ref] [head-ref] [file-path]
```

#### Examples

```bash
# Compare against latest release
GITHUB_TOKEN=xxx && npm run compare owner/repo

# Compare specific branches
GITHUB_TOKEN=xxx && npm run compare owner/repo main feature/new-env

# Compare with custom file
GITHUB_TOKEN=xxx && npm run compare owner/repo v1.0.0 main .env.production

# Compare tags
GITHUB_TOKEN=xxx && npm run compare owner/repo v1.0.0 v2.0.0 .env.example
```

## Inputs & Outputs

### GitHub Action Inputs

| Input           | Description                         | Required | Default                    | Example                        |
| --------------- | ----------------------------------- | -------- | -------------------------- | ------------------------------ |
| `github-token`  | GitHub token with repository access | No       | `${{ github.token }}`      | `${{ secrets.GITHUB_TOKEN }}`  |
| `repository`    | Repository in format 'owner/repo'   | No       | `${{ github.repository }}` | `microsoft/vscode`             |
| `base-ref`      | Base reference to compare against   | No       | `latest`                   | `main`, `v1.0.0`, `production` |
| `head-ref`      | Head reference to compare           | No       | `master`                   | `feature/branch`, `staging`    |
| `env-file-path` | Path to environment file            | No       | `.env.example`             | `.env.template`, `config/.env` |

### GitHub Action Outputs

| Output        | Type      | Description                      | Example            |
| ------------- | --------- | -------------------------------- | ------------------ |
| `has-changes` | `boolean` | Whether changes were detected    | `true`             |
| `changelog`   | `string`  | Markdown formatted change report | See examples above |

### CLI Arguments

| Position | Argument     | Description                       | Required | Default        | Example            |
| -------- | ------------ | --------------------------------- | -------- | -------------- | ------------------ |
| 1        | `repository` | Repository in format 'owner/repo' | Yes      | -              | `microsoft/vscode` |
| 2        | `base-ref`   | Base reference to compare against | No       | `latest`       | `main`, `v1.0.0`   |
| 3        | `head-ref`   | Head reference to compare         | No       | `master`       | `feature/branch`   |
| 4        | `file-path`  | Path to environment file          | No       | `.env.example` | `.env.template`    |

### CLI Environment Variables

| Variable       | Description                  | Required | Example            |
| -------------- | ---------------------------- | -------- | ------------------ |
| `GITHUB_TOKEN` | GitHub personal access token | Yes      | `ghp_xxxxxxxxxxxx` |

### CLI Exit Codes

| Code | Description                                     |
| ---- | ----------------------------------------------- |
| `0`  | Success - comparison completed                  |
| `1`  | Error - configuration, API, or comparison error |

## Configuration Options

### Special Base References

| Reference | Description                    | Behavior                          |
| --------- | ------------------------------ | --------------------------------- |
| `latest`  | Compare against latest release | Fetches latest GitHub release tag |
| `master`  | Compare against master branch  | Direct branch comparison          |
| `v1.0.0`  | Compare against specific tag   | Direct tag comparison             |
| `abc123`  | Compare against commit SHA     | Direct commit comparison          |

## Security Considerations

### Token Permissions

The GitHub token needs the following permissions:

- `contents:read` - To read repository files and releases
- `metadata:read` - To access basic repository information

### Environment Variables

Never commit actual `.env` files with secrets. Use `.env.example` or `.env.template` files for comparisons.
