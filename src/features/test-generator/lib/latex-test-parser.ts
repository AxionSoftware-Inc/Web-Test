import type {
  GeneratedQuestion,
  TestGeneratorStats,
} from "@/features/test-generator/model/test-generator-types";

const questionBlockPattern = /\\begin\{question\}([\s\S]*?)\\end\{question\}/g;
const choicesPattern = /\\begin\{choices\}([\s\S]*?)\\end\{choices\}/;
const choicePattern = /\\choice\s*([\s\S]*?)(?=\\choice|$)/g;

export function parseLatexTest(input: string): GeneratedQuestion[] {
  const blocks = [...input.matchAll(questionBlockPattern)].map((match) => match[1]);

  return blocks.map((block, index) => {
    const choicesMatch = block.match(choicesPattern);
    const options = choicesMatch
      ? [...choicesMatch[1].matchAll(choicePattern)]
          .map((match) => cleanLatexText(match[1]))
          .filter(Boolean)
      : [];

    const answer = getCommandValue(block, "answer");
    const explanation = getCommandValue(block, "explanation");
    const prompt = cleanLatexText(
      block
        .replace(choicesPattern, "")
        .replace(commandPattern("answer"), "")
        .replace(commandPattern("explanation"), ""),
    );

    return {
      id: `generated-${index + 1}`,
      type: options.length > 0 ? "multiple-choice" : "short-answer",
      prompt,
      options,
      answer,
      explanation,
      source: block.trim(),
    };
  });
}

export function getTestGeneratorStats(questions: GeneratedQuestion[]): TestGeneratorStats {
  return {
    total: questions.length,
    multipleChoice: questions.filter((question) => question.type === "multiple-choice").length,
    shortAnswer: questions.filter((question) => question.type === "short-answer").length,
  };
}

function getCommandValue(block: string, command: string) {
  const value = block.match(commandPattern(command))?.[1];

  return value ? cleanLatexText(value) : undefined;
}

function commandPattern(command: string) {
  return new RegExp(String.raw`\\${command}\{([\s\S]*?)\}\s*(?=\\[a-zA-Z]+|\n\\end\{question\}|$)`);
}

function cleanLatexText(value: string) {
  return value
    .replace(/\\\(|\\\)/g, "")
    .replace(/\\\[/g, "")
    .replace(/\\\]/g, "")
    .replace(/\\\\/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
