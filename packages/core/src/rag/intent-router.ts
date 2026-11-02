export type QuestionType =
  | "explain_code"
  | "how_to_run"
  | "where_is_implemented"
  | "add_feature"
  | "general";

export function classifyQuestionIntent(query: string): QuestionType {
  const q = query.toLowerCase();

  if (
    q.includes("how to run") ||
    q.includes("how do i run") ||
    q.includes("setup") ||
    q.includes("start dev") ||
    q.includes("install") ||
    q.includes("prerequisites") ||
    q.includes("how to test") ||
    q.includes("run tests")
  ) {
    return "how_to_run";
  }

  if (
    q.includes("where is") ||
    q.includes("where does") ||
    q.includes("find the") ||
    q.includes("which file") ||
    q.includes("entry point") ||
    q.includes("locate")
  ) {
    return "where_is_implemented";
  }

  if (
    q.includes("how to add") ||
    q.includes("how to implement") ||
    q.includes("create a new") ||
    q.includes("extend") ||
    q.includes("add feature") ||
    q.includes("fix bug")
  ) {
    return "add_feature";
  }

  if (
    q.includes("explain") ||
    q.includes("how does") ||
    q.includes("what does") ||
    q.includes("walk through") ||
    q.includes("architecture of") ||
    q.includes("understand")
  ) {
    return "explain_code";
  }

  return "general";
}

export function getIntentSystemInstructions(intent: QuestionType): string {
  switch (intent) {
    case "how_to_run":
      return "Focus on actionable setup steps, prerequisites, environment variables, commands to install, run and test locally. Cite package.json, Makefile, or README wherever setup steps are documented.";
    case "where_is_implemented":
      return "Focus on pinpointing exact file locations and line ranges. Provide precise citations [file:start-end] and explain the role of each symbol in the module.";
    case "add_feature":
      return "Outline the specific files to modify, new interfaces or functions to add, tests to create, and potential architectural impacts. Ground suggestions in existing codebase patterns.";
    case "explain_code":
      return "Provide a deep architectural explanation of the control flow, data transformations, and design patterns. Explain WHY the code is structured this way with exact line-level citations.";
    default:
      return "Provide an accurate, grounded answer with exact line-level source code citations [filepath:start_line-end_line].";
  }
}

