# Project Governance - RepoMentor

---

## 1. Principles

RepoMentor is an open-source, community-driven project dedicated to improving the developer onboarding experience across open-source and proprietary software. We operate on principles of:
- **Transparency**: Architectural discussions, roadmaps, and decisions occur openly in GitHub Discussions, PRs, and Architectural Decision Records (`docs/decisions/`).
- **Meritocracy**: Influence is earned through sustained, high-quality technical contributions, thoughtful code reviews, and community support.
- **Welcoming DX**: We prioritize newcomer friendliness, clear documentation, and helpful onboarding.

---

## 2. Roles & Responsibilities

### 2.1 Contributors
Anyone who submits an issue, pull request, documentation improvement, or benchmark case.
- **Responsibilities**: Follow the [Code of Conduct](file:///CODE_OF_CONDUCT.md), adhere to coding standards in [AGENTS.md](file:///AGENTS.md), and participate constructively in code reviews.

### 2.2 Core Contributors (Reviewers)
Active contributors who have demonstrated consistent commitment and domain expertise.
- **Permissions**: Triage issues, review pull requests, guide newcomers.
- **Responsibilities**: Maintain high review quality, verify that PRs follow security policies, and ensure test coverage.

### 2.3 Maintainers
Trusted custodians responsible for the technical direction, releases, and operational integrity of RepoMentor.
- **Permissions**: Write access to `main`, repository administration, npm package publishing, and release tagging.
- **Responsibilities**: Triage security advisories, cut releases, arbitrate technical stalemates, and steward architectural roadmaps.

---

## 3. Decision-Making Process

- **Minor Changes (Bug fixes, doc improvements, minor features)**: Require approval from at least **one maintainer** and a passing CI build.
- **Major Architectural Decisions (New database extensions, changing LLM abstractions, core data model alterations)**:
  1. Author an **Architectural Decision Record (ADR)** in `docs/decisions/`.
  2. Open a GitHub Discussion or RFC PR for community review.
  3. Consensus among active maintainers within a 7-day review window.

---

## 4. Path to Maintainership

We actively invite contributors to become maintainers. Criteria for nomination:
1. Demonstrated sustained participation over a minimum of 3 months.
2. 10+ merged non-trivial PRs across core packages (`core`, `api`, `web`, `db`).
3. 20+ thoughtful pull request reviews.
4. Adherence to the Code of Conduct and proactive assistance to newcomers.

Nominations can be proposed by any existing maintainer and require unanimous approval of active maintainers.

