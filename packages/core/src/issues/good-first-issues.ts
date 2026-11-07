export interface GoodFirstIssue {
  id: number;
  number: number;
  title: string;
  url: string;
  labels: string[];
  bodySnippet: string;
  createdAt: string;
}

/**
 * Discovers beginner-friendly issues from GitHub's REST API for a given repository.
 */
export async function findGoodFirstIssues(
  owner: string,
  repo: string,
  token?: string
): Promise<GoodFirstIssue[]> {
  const url = `https://api.github.com/repos/${owner}/${repo}/issues?labels=good%20first%20issue,help%20wanted&state=open&per_page=10`;

  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "RepoMentor-Issue-Finder",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(url, { headers });
    if (!res.ok) {
      return [];
    }

    interface GitHubIssueItem {
      id: number;
      number: number;
      title: string;
      html_url: string;
      pull_request?: unknown;
      labels?: Array<{ name: string }>;
      body?: string | null;
      created_at: string;
    }

    const data = (await res.json()) as unknown;
    if (!Array.isArray(data)) return [];

    const issues = data as GitHubIssueItem[];
    return issues
      .filter((issue) => !issue.pull_request) // filter out PRs
      .map((issue) => ({
        id: issue.id,
        number: issue.number,
        title: issue.title,
        url: issue.html_url,
        labels: (issue.labels || []).map((l) => l.name),
        bodySnippet: (issue.body || "").slice(0, 200),
        createdAt: issue.created_at,
      }));
  } catch {
    return [];
  }
}
