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

    const data: any = await res.json();
    if (!Array.isArray(data)) return [];

    return data
      .filter((issue: any) => !issue.pull_request) // filter out PRs
      .map((issue: any) => ({
        id: issue.id,
        number: issue.number,
        title: issue.title,
        url: issue.html_url,
        labels: (issue.labels || []).map((l: any) => l.name),
        bodySnippet: (issue.body || "").slice(0, 200),
        createdAt: issue.created_at,
      }));
  } catch {
    return [];
  }
}

