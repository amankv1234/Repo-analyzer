import { Octokit } from "@octokit/rest";
import { GitHubRepoMetadata, ProviderError } from "@repomentor/shared";

export async function fetchGitHubMetadata(
  owner: string,
  repo: string,
  token?: string
): Promise<GitHubRepoMetadata> {
  const octokit = new Octokit({
    auth: token || process.env.GITHUB_TOKEN || undefined,
  });

  try {
    // 1. Fetch main repo details
    const { data: repoData } = await octokit.rest.repos.get({
      owner,
      repo,
    });

    // 2. Fetch language breakdown
    let languages: Record<string, number> = {};
    try {
      const { data: langData } = await octokit.rest.repos.listLanguages({
        owner,
        repo,
      });
      languages = langData as Record<string, number>;
    } catch {
      // Fallback if languages API fails
      if (repoData.language) {
        languages = { [repoData.language]: 100 };
      }
    }

    // 3. Fetch latest commit SHA on default branch
    let lastCommitSha = "";
    try {
      const { data: commits } = await octokit.rest.repos.listCommits({
        owner,
        repo,
        sha: repoData.default_branch,
        per_page: 1,
      });
      lastCommitSha = commits[0]?.sha ?? "";
    } catch {
      lastCommitSha = "";
    }

    // 4. Contributors count approximation
    let contributorsCount = 1;
    try {
      const { data: contributors } = await octokit.rest.repos.listContributors({
        owner,
        repo,
        per_page: 100,
        anon: "true",
      });
      contributorsCount = Array.isArray(contributors) ? contributors.length : 1;
    } catch {
      contributorsCount = 1;
    }

    return {
      owner: repoData.owner.login,
      name: repoData.name,
      description: repoData.description ?? null,
      stars: repoData.stargazers_count,
      topics: repoData.topics ?? [],
      license: repoData.license?.spdx_id ?? repoData.license?.name ?? null,
      defaultBranch: repoData.default_branch,
      contributorsCount,
      lastCommitSha,
      openIssuesCount: repoData.open_issues_count,
      languages,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    throw new ProviderError("GitHub", `Failed to fetch metadata for ${owner}/${repo}: ${errorMsg}`);
  }
}

