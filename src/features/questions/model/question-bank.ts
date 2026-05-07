import { platformTests, getTestQuestions } from "@/features/test-engine/model/test-engine-content";

export function getQuestionBankItems() {
  return platformTests.flatMap((test) =>
    getTestQuestions(test.id).map((question, index) => ({
      ...question,
      index,
      testId: test.id,
      testTitle: test.title,
      subject: test.subject,
      topic: test.category,
      difficulty: test.difficulty,
      bankId: `${test.id}__${question.id}`,
    })),
  );
}

export function getQuestionBankItem(bankId: string) {
  return getQuestionBankItems().find((item) => item.bankId === bankId);
}
