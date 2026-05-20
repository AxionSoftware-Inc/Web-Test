export const strictPackExample = `{
  "version": "1.0",
  "pack": {
    "title": "Linear Algebra Foundations",
    "subject": "math",
    "branch": "linear-algebra",
    "level": "foundations",
    "language": "uz"
  },
  "tests": [
    {
      "title": "Vectors Basics",
      "topic": "vectors",
      "difficulty": "easy",
      "time_limit_minutes": 15,
      "questions": [
        {
          "type": "single_choice",
          "body": "Question text with $LaTeX$",
          "options": [
            { "id": "A", "text": "Option A" },
            { "id": "B", "text": "Option B" }
          ],
          "answer": { "correct": "A" },
          "explanation": "Explanation with $LaTeX$",
          "skills": ["skill-1"],
          "difficulty": "easy"
        }
      ]
    }
  ]
}`;
