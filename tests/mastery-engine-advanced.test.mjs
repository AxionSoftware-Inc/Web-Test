import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
  DEFAULT_BKT_PARAMS,
  getAdaptiveBktParams,
  updateKnowledgeProbability,
  traceKnowledgeSequence,
} from "../src/features/mastery-engine/model/bkt.ts";

import {
  estimateAbilityEAP,
  irtProbability,
  irtItemInformation,
  getIRTItemParameters,
} from "../src/features/mastery-engine/model/irt.ts";

import {
  analyzeCognitiveDepth,
  calculateItemDiversity,
  inferCognitiveLevel,
} from "../src/features/mastery-engine/model/depth-analyzer.ts";

import {
  diagnoseMistakePattern,
} from "../src/features/mastery-engine/model/distractor-analyzer.ts";

import {
  calculateRetentionState,
} from "../src/features/mastery-engine/model/decay-engine.ts";

import {
  buildLearningPathSummary,
} from "../src/features/mastery-engine/model/learning-path.ts";

import {
  createTopicGraph,
  buildDynamicGraphFromApiTopics,
} from "../src/features/mastery-engine/model/topic-graph.ts";

import {
  buildMasteryReport,
} from "../src/features/mastery-engine/model/mastery-engine.ts";

import {
  analyzeTelemetryIntegrity,
} from "../src/features/mastery-engine/model/telemetry-cheat-detector.ts";

import {
  evaluateAdaptiveNextStep,
} from "../src/features/mastery-engine/model/cat-engine.ts";

import {
  calibrateItemStatistics,
} from "../src/features/mastery-engine/model/item-calibration.ts";

import {
  evaluatePlacementBlitz,
} from "../src/features/mastery-engine/model/placement-blitz.ts";

import {
  assignMultidimensionalCredit,
} from "../src/features/mastery-engine/model/multidimensional-tracing.ts";

import {
  createServerSyncPayload,
} from "../src/features/mastery-engine/model/mastery-persistence.ts";

describe("Bayesian Knowledge Tracing (BKT) Engine", () => {
  test("Increases knowledge probability on correct answer", () => {
    const prior = 0.25;
    const next = updateKnowledgeProbability(prior, true, DEFAULT_BKT_PARAMS);
    assert.ok(next > prior, "Knowledge probability should increase after a correct answer");
    assert.ok(next <= 1.0, "Probability cannot exceed 1.0");
  });

  test("Decreases knowledge probability on incorrect answer", () => {
    const prior = 0.60;
    const next = updateKnowledgeProbability(prior, false, DEFAULT_BKT_PARAMS);
    assert.ok(next < prior, "Knowledge probability should decrease after a wrong answer");
    assert.ok(next >= 0.0, "Probability cannot be below 0.0");
  });

  test("Adapts guess probability for short answer format", () => {
    const params = getAdaptiveBktParams("medium", "short_answer");
    assert.ok(params.pG < 0.05, "Short answer should have near-zero guessing probability");
  });

  test("Traces knowledge trajectory correctly across multiple answers", () => {
    const sequence = [
      { isCorrect: true, difficulty: "easy" },
      { isCorrect: true, difficulty: "medium" },
      { isCorrect: true, difficulty: "hard" },
    ];
    const result = traceKnowledgeSequence(sequence, 0.20);
    assert.ok(result.finalProbability > 0.70, "Consistent correct answers should yield high BKT probability");
    assert.equal(result.trajectory.length, 4);
  });
});

describe("Item Response Theory (IRT) & Psychometrics", () => {
  test("Computes 3PL probability monotonic with respect to theta", () => {
    const item = getIRTItemParameters("medium");
    const pLow = irtProbability(-2.0, item);
    const pMid = irtProbability(0.0, item);
    const pHigh = irtProbability(2.0, item);

    assert.ok(pLow < pMid && pMid < pHigh, "Higher ability (theta) must yield higher correct probability");
    assert.ok(pLow >= item.c, "Probability cannot be lower than guessing parameter c");
  });

  test("Estimates latent ability theta and Standard Error via Bayes EAP", () => {
    const responses = [
      { isCorrect: true, difficulty: "easy" },
      { isCorrect: true, difficulty: "medium" },
      { isCorrect: true, difficulty: "hard" },
      { isCorrect: true, difficulty: "hard" },
    ];

    const estimate = estimateAbilityEAP(responses);
    assert.ok(estimate.theta > 0.5, "Consistently solving hard questions must result in positive theta");
    assert.ok(estimate.standardError <= 1.0, "Standard error must shrink below prior standard deviation with responses");
    assert.ok(estimate.fisherInformation > 0.5, "Fisher information should be positive");
    assert.ok(estimate.masteryPercent >= 70, "High theta should translate to high mastery percent");
  });

  test("Fisher Information peaks near question difficulty", () => {
    const item = getIRTItemParameters("hard"); // b ≈ 1.6
    const infoAtDifficulty = irtItemInformation(item.b, item);
    const infoFarAway = irtItemInformation(-2.5, item);

    assert.ok(infoAtDifficulty > infoFarAway, "Information should be highest near item difficulty b");
  });
});

describe("Cognitive Depth, Transfer Index & Rote Memorization", () => {
  test("Detects template overfitting / rote memorization when user solves identical templates only", () => {
    const identicalAnswers = [
      { isCorrect: true, difficulty: "easy", cognitiveLevel: "recall", prompt: "x + 2 = 5 tenglamani yeching" },
      { isCorrect: true, difficulty: "easy", cognitiveLevel: "recall", prompt: "x + 3 = 6 tenglamani yeching" },
      { isCorrect: true, difficulty: "easy", cognitiveLevel: "recall", prompt: "x + 4 = 7 tenglamani yeching" },
      { isCorrect: false, difficulty: "hard", cognitiveLevel: "analytical", prompt: "Nostandart amaliy geometrik optimallashtirish masalasi" },
    ];

    const result = analyzeCognitiveDepth(identicalAnswers);
    assert.equal(result.depthStatus, "shallow");
    assert.ok(result.isRoteMemorized, "Should be flagged as rote memorized due to high template similarity and failed transfer");
    assert.ok(result.transferIndex < -0.3, "Far transfer index must be negative");
  });

  test("Confirms deep adaptive learning when user excels across all cognitive levels", () => {
    const diverseAnswers = [
      { isCorrect: true, difficulty: "easy", cognitiveLevel: "recall", prompt: "Ta'rif va qoida" },
      { isCorrect: true, difficulty: "medium", cognitiveLevel: "procedural", prompt: "Hisoblash algoritmi" },
      { isCorrect: true, difficulty: "hard", cognitiveLevel: "analytical", prompt: "Nostandart amaliy masala" },
      { isCorrect: true, difficulty: "hard", cognitiveLevel: "conceptual", prompt: "Grafik munosabati va bog'liqlik" },
    ];

    const result = analyzeCognitiveDepth(diverseAnswers);
    assert.equal(result.depthStatus, "deep");
    assert.ok(result.depthScore >= 75);
    assert.equal(result.isRoteMemorized, false);
  });

  test("Calculates item diversity index based on prompt similarity", () => {
    const identical = ["x + 2 = 5 tenglama", "x + 3 = 6 tenglama", "x + 4 = 7 tenglama"];
    const diverse = ["Kvadrat ildiz qoidasi", "Uchburchak yuzi formulasi", "Kinematik tezlanish grafigi"];

    const diversityIdentical = calculateItemDiversity(identical);
    const diversityDiverse = calculateItemDiversity(diverse);

    assert.ok(diversityDiverse > diversityIdentical, "Diverse items must yield higher diversity index");
  });
});

describe("Dynamic Knowledge Graph & Kahn Topological Sort", () => {
  test("Topologically sorts topic dependencies using Kahn algorithm", () => {
    const graph = createTopicGraph();
    const sorted = graph.topologicalOrder();

    assert.ok(sorted.length > 0);
    // Chiziqli tenglamalar (order 1) Kasrli tenglamalardan (order 3) oldin kelishi shart
    const linearIdx = sorted.findIndex((n) => n.slug === "linear-equations");
    const fractionIdx = sorted.findIndex((n) => n.slug === "fraction-equations");
    assert.ok(linearIdx < fractionIdx, "Prerequisites must precede dependents in topological order");
  });

  test("Calculates graph centrality hub score correctly", () => {
    const graph = createTopicGraph();
    const hubScore = graph.getHubScore("linear-equations");
    // linear-equations deyarli barcha mavzularning poydevori
    assert.ok(hubScore > 50, "Fundamental core topic must have high hub score");
  });

  test("Builds dynamic graph from raw API topics", () => {
    const apiTopics = [
      { slug: "cell-biology", title: "Hujayra biologiyasi" },
      { slug: "genetics", title: "Genetika" },
      { slug: "evolution", title: "Evolyutsiya" },
    ];

    const nodes = buildDynamicGraphFromApiTopics(apiTopics, "Biologiya");
    assert.equal(nodes.length, 3);
    assert.equal(nodes[0].subject, "Biologiya");
    assert.equal(nodes[0].level, "foundation");
  });
});

describe("Distractor & Error Pattern Diagnosis", () => {
  test("Detects sign errors when magnitudes match with inverted signs", () => {
    const diagnosis = diagnoseMistakePattern({
      studentAnswer: "-5",
      correctAnswer: "5",
      timeSpentSeconds: 40,
      estimatedSeconds: 45,
      timeQuality: "normal",
      difficulty: "medium",
    });

    assert.equal(diagnosis.mistakeType, "sign_error");
    assert.ok(diagnosis.misconceptionReason.includes("Ishoralar"));
    assert.ok(diagnosis.confidenceScore >= 0.9);
  });

  test("Detects calculation errors when numeric difference is small", () => {
    const diagnosis = diagnoseMistakePattern({
      studentAnswer: "24",
      correctAnswer: "25",
      timeSpentSeconds: 35,
      estimatedSeconds: 40,
      timeQuality: "normal",
      difficulty: "easy",
    });

    assert.equal(diagnosis.mistakeType, "calculation_error");
    assert.ok(diagnosis.misconceptionReason.includes("arifmetik"));
  });

  test("Detects unit / order of magnitude errors", () => {
    const diagnosis = diagnoseMistakePattern({
      studentAnswer: "250",
      correctAnswer: "25",
      timeSpentSeconds: 30,
      estimatedSeconds: 30,
      timeQuality: "normal",
      difficulty: "medium",
    });

    assert.equal(diagnosis.mistakeType, "unit_error");
  });

  test("Detects reading error when answered too fast", () => {
    const diagnosis = diagnoseMistakePattern({
      studentAnswer: "option A",
      correctAnswer: "option B",
      timeSpentSeconds: 4,
      estimatedSeconds: 40,
      timeQuality: "too_fast",
      difficulty: "easy",
    });

    assert.equal(diagnosis.mistakeType, "reading_error");
    assert.ok(diagnosis.misconceptionReason.includes("Shoshqaloqlik"));
  });
});

describe("Spaced Repetition & Decay Engine", () => {
  test("Marks topic as decayed when long time passes without practice", () => {
    const sixtyDaysAgo = new Date(Date.now() - 65 * 24 * 60 * 60 * 1000).toISOString();
    const result = calculateRetentionState({
      mastery: 85,
      attempts: 8,
      lastPracticedAt: sixtyDaysAgo,
    });

    assert.ok(result.isDecayed, "Topic should decay after 65 days of inactivity");
    assert.ok(result.retentionScore < 70, "Retention score should drop over time");
  });

  test("Preserves high retention for recently practiced topics", () => {
    const yesterday = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString();
    const result = calculateRetentionState({
      mastery: 90,
      attempts: 12,
      lastPracticedAt: yesterday,
    });

    assert.equal(result.isDecayed, false);
    assert.ok(result.retentionScore >= 80);
  });
});

describe("Learning Path & Knowledge Frontier", () => {
  test("Calculates learning path and identifies current frontier", () => {
    const topicMasteries = [
      {
        studentId: "s1",
        subject: "Algebra",
        topic: "Chiziqli tenglamalar",
        topicSlug: "linear-equations",
        attempts: 10,
        correct: 9,
        wrong: 1,
        accuracy: 90,
        mastery: 88,
        bktProbability: 0.85,
        depthAnalysis: {
          recallAccuracy: 100,
          proceduralAccuracy: 90,
          analyticalAccuracy: 85,
          depthScore: 88,
          depthStatus: "deep",
          depthSummary: "Deep",
        },
        retention: {
          retentionScore: 88,
          stabilityDays: 30,
          daysSincePractice: 1,
          isDecayed: false,
          recommendedReviewDate: new Date().toISOString(),
        },
        averageTimeSeconds: 30,
        expectedAverageTimeSeconds: 35,
        confidence: "medium",
        status: "mastered",
        isFundamental: true,
        prerequisites: [],
        updatedAt: new Date().toISOString(),
        priorityScore: 10,
      },
    ];

    const summary = buildLearningPathSummary({
      subject: "Algebra",
      topicMasteries,
    });

    assert.equal(summary.completedNodesCount, 1);
    assert.ok(summary.pathProgressPercent > 0);
    assert.ok(summary.nextRecommendedNode !== undefined);
  });
});

describe("Integrated Advanced Mastery Report with IRT & Transfer", () => {
  test("Builds complete report with deep insights, errors, and learning path", () => {
    const answers = [
      {
        id: "a1",
        studentId: "student-1",
        sessionId: "sess-1",
        testId: "test-1",
        questionId: "q1",
        selectedAnswer: "-3",
        correctAnswer: "3",
        isCorrect: false,
        timeSpentSeconds: 40,
        answeredAt: new Date().toISOString(),
        subject: "Algebra",
        topic: "Chiziqli tenglamalar",
        topicSlug: "linear-equations",
        skills: ["linear-solving"],
        difficulty: "medium",
        cognitiveLevel: "procedural",
        estimatedSeconds: 45,
        masteryWeight: 1.2,
        isFundamental: true,
        prerequisites: [],
        questionPreview: "2x + 6 = 12 tenglamani yeching",
        explanation: "x = 3 bo'ladi",
      },
      {
        id: "a2",
        studentId: "student-1",
        sessionId: "sess-1",
        testId: "test-1",
        questionId: "q2",
        selectedAnswer: "5",
        correctAnswer: "5",
        isCorrect: true,
        timeSpentSeconds: 30,
        answeredAt: new Date().toISOString(),
        subject: "Algebra",
        topic: "Chiziqli tenglamalar",
        topicSlug: "linear-equations",
        skills: ["linear-solving"],
        difficulty: "easy",
        cognitiveLevel: "recall",
        estimatedSeconds: 30,
        masteryWeight: 1.0,
        isFundamental: true,
        prerequisites: [],
        questionPreview: "x - 2 = 3 tenglamani yeching",
        explanation: "x = 5",
      },
    ];

    const report = buildMasteryReport("student-1", answers);

    assert.equal(report.studentId, "student-1");
    assert.equal(report.topics.length, 1);
    assert.ok(report.topics[0].bktProbability > 0);
    assert.ok(report.topics[0].depthAnalysis !== undefined);
    assert.ok(report.topics[0].retention !== undefined);
    assert.ok(report.topics[0].irtTheta !== undefined);
    assert.equal(report.mistakes.length, 1);
    assert.equal(report.mistakes[0].mistakeType, "sign_error");
    assert.ok(report.mistakes[0].misconceptionReason.includes("Ishoralar"));
    assert.ok(report.learningPath !== undefined);
    assert.ok(report.testIntegrityScore !== undefined);
  });
});

describe("Telemetry & Cheat Detection Engine", () => {
  test("Detects suspected internet lookup when user switches tab and answers correctly", () => {
    const result = analyzeTelemetryIntegrity({
      isCorrect: true,
      timeSpentSeconds: 45,
      estimatedSeconds: 40,
      tabSwitchCount: 2,
      outOfTabSeconds: 20,
      difficulty: "hard",
    });

    assert.equal(result.behaviorFlag, "suspected_lookup");
    assert.ok(result.integrityScore < 0.3);
    assert.ok(result.discountedWeight < 0.2, "Cheat-suspected attempt must be heavily discounted");
  });

  test("Detects blind guessing on hard question solved in 3 seconds", () => {
    const result = analyzeTelemetryIntegrity({
      isCorrect: true,
      timeSpentSeconds: 3,
      estimatedSeconds: 45,
      tabSwitchCount: 0,
      difficulty: "hard",
    });

    assert.equal(result.behaviorFlag, "blind_guess");
    assert.ok(result.discountedWeight < 0.5);
  });

  test("Validates clean honest attempt without anomalies", () => {
    const result = analyzeTelemetryIntegrity({
      isCorrect: true,
      timeSpentSeconds: 35,
      estimatedSeconds: 40,
      tabSwitchCount: 0,
      difficulty: "medium",
    });

    assert.equal(result.behaviorFlag, "clean");
    assert.equal(result.integrityScore, 1.0);
    assert.equal(result.discountedWeight, 1.0);
  });
});

describe("Computerized Adaptive Testing (CAT) Real-time Engine", () => {
  const sampleBank = [
    { id: 1, prompt: "Oson savol", topicSlug: "linear-equations", difficulty: "easy" },
    { id: 2, prompt: "O'rtacha savol 1", topicSlug: "linear-equations", difficulty: "medium" },
    { id: 3, prompt: "Qiyin savol 1", topicSlug: "linear-equations", difficulty: "hard" },
    { id: 4, prompt: "O'rtacha savol 2", topicSlug: "factoring", difficulty: "medium" },
    { id: 5, prompt: "Qiyin savol 2", topicSlug: "factoring", difficulty: "hard" },
  ];

  test("Selects item maximizing Fisher Information for current ability", () => {
    const state = {
      theta: 1.5, // Yuqori qobiliyatli o'quvchi
      standardError: 0.65,
      answeredItemIds: new Set([1]),
      topicFrequencies: new Map([["linear-equations", 1]]),
      totalAnswered: 1,
    };

    const decision = evaluateAdaptiveNextStep(sampleBank, state);
    assert.equal(decision.isTestComplete, false);
    assert.ok(decision.nextItem !== undefined);
    // Yuqori qobiliyatli o'quvchiga qiyin savol (difficulty hard) tavsiya qilinishi kerak
    assert.equal(decision.nextItem?.difficulty, "hard");
  });

  test("Stops early when target measurement precision is reached", () => {
    const state = {
      theta: 1.2,
      standardError: 0.28, // Judayam aniq SE <= 0.35
      answeredItemIds: new Set([1, 2, 3, 4, 5, 6]),
      topicFrequencies: new Map(),
      totalAnswered: 6,
      minItems: 6,
      targetStandardError: 0.35,
    };

    const decision = evaluateAdaptiveNextStep(sampleBank, state);
    assert.equal(decision.isTestComplete, true);
    assert.equal(decision.stopReason, "target_precision_reached");
    assert.equal(decision.precisionPercent, 100);
  });
});

describe("Item Calibration & Psychometric Health Engine", () => {
  test("Calibrates empirical difficulty and Point-Biserial correlation", () => {
    const mockResponses = [
      { questionId: 101, isCorrect: true, studentOverallScore: 90 },
      { questionId: 101, isCorrect: true, studentOverallScore: 85 },
      { questionId: 101, isCorrect: true, studentOverallScore: 80 },
      { questionId: 101, isCorrect: false, studentOverallScore: 40 },
      { questionId: 101, isCorrect: false, studentOverallScore: 35 },
    ];

    const result = calibrateItemStatistics(101, "medium", mockResponses);
    assert.equal(result.totalAttempts, 5);
    assert.equal(result.pValue, 0.6); // 3 ta to'g'ri / 5 ta
    assert.ok(result.pointBiserial > 0.2, "Point-biserial must be positive when high scorers get it right");
    assert.equal(result.itemHealth, "healthy");
  });

  test("Detects flawed question when high scorers get it wrong (negative discrimination)", () => {
    const mockFlawedResponses = [
      { questionId: 202, isCorrect: true, studentOverallScore: 30 },
      { questionId: 202, isCorrect: true, studentOverallScore: 35 },
      { questionId: 202, isCorrect: false, studentOverallScore: 95 },
      { questionId: 202, isCorrect: false, studentOverallScore: 90 },
      { questionId: 202, isCorrect: false, studentOverallScore: 85 },
    ];

    const result = calibrateItemStatistics(202, "easy", mockFlawedResponses);
    assert.ok(result.pointBiserial < 0, "Negative point biserial indicates flawed item");
    assert.equal(result.itemHealth, "flawed_question");
    assert.ok(result.recommendation.includes("Xavfli savol"));
  });
});

describe("Cold-Start Placement Blitz Engine", () => {
  const bank = [
    { id: 1, prompt: "Oson savol", topicSlug: "linear", difficulty: "easy", targetB: -1.2 },
    { id: 2, prompt: "O'rta savol", topicSlug: "linear", difficulty: "medium", targetB: 0.0 },
    { id: 3, prompt: "Qiyin savol", topicSlug: "quadratic", difficulty: "hard", targetB: 1.5 },
  ];

  test("Starts with medium question when responses are empty", () => {
    const step = evaluatePlacementBlitz([], bank);
    assert.equal(step.isComplete, false);
    assert.equal(step.nextQuestion?.difficulty, "medium");
  });

  test("Steps to hard difficulty when medium question is answered correctly", () => {
    const responses = [{ questionId: 2, topicSlug: "linear", difficulty: "medium", isCorrect: true }];
    const step = evaluatePlacementBlitz(responses, bank);
    assert.equal(step.isComplete, false);
    assert.equal(step.nextQuestion?.difficulty, "hard");
  });

  test("Concludes placement after 5 responses with calibrated level", () => {
    const responses = [
      { questionId: 1, topicSlug: "linear", difficulty: "medium", isCorrect: true },
      { questionId: 2, topicSlug: "quadratic", difficulty: "hard", isCorrect: true },
      { questionId: 3, topicSlug: "quadratic", difficulty: "hard", isCorrect: true },
      { questionId: 4, topicSlug: "quadratic", difficulty: "hard", isCorrect: true },
      { questionId: 5, topicSlug: "quadratic", difficulty: "hard", isCorrect: true },
    ];
    const step = evaluatePlacementBlitz(responses, bank);
    assert.equal(step.isComplete, true);
    assert.ok(step.result !== undefined);
    assert.equal(step.result?.calibratedLevel, "advanced");
    assert.ok(step.result?.initialTheta > 0.8);
  });
});

describe("Multidimensional Knowledge Tracing & Q-matrix Credit Assignment", () => {
  test("Assigns primary blame to the weakest skill when student fails a multi-skill question", () => {
    const skillMasteries = new Map([
      ["fraction-arithmetic", 85], // Bu skillni yaxshi biladi
      ["word-problem-translation", 30], // Aynan shu skill zaif
    ]);

    const diagnosis = assignMultidimensionalCredit({
      questionId: "q-multi-1",
      isCorrect: false,
      skills: ["fraction-arithmetic", "word-problem-translation"],
      currentSkillMasteries: skillMasteries,
    });

    assert.equal(diagnosis.isCorrect, false);
    assert.equal(diagnosis.primaryRootCauseSkill, "word-problem-translation");
    assert.ok(diagnosis.explanation.includes("word-problem-translation"));

    const wordProblemAssignment = diagnosis.assignments.find((a) => a.skill === "word-problem-translation");
    assert.equal(wordProblemAssignment?.isPrimarySuspect, true);
    assert.ok(wordProblemAssignment?.creditShare > 0.6);
  });

  test("Rewards weaker skill with higher learning gain on successful multi-skill answer", () => {
    const skillMasteries = new Map([
      ["equation-solving", 90],
      ["inequality-signs", 40],
    ]);

    const diagnosis = assignMultidimensionalCredit({
      questionId: "q-multi-2",
      isCorrect: true,
      skills: ["equation-solving", "inequality-signs"],
      currentSkillMasteries: skillMasteries,
    });

    assert.equal(diagnosis.isCorrect, true);
    const signAssignment = diagnosis.assignments.find((a) => a.skill === "inequality-signs");
    const eqAssignment = diagnosis.assignments.find((a) => a.skill === "equation-solving");
    assert.ok(signAssignment?.creditShare > eqAssignment?.creditShare);
  });
});

describe("Mastery Persistence & Server Sync Payload", () => {
  test("Constructs valid server sync payload matching API schema", () => {
    const mockReport = {
      studentId: "student-xyz",
      generatedAt: new Date().toISOString(),
      topics: [
        {
          studentId: "student-xyz",
          subject: "Algebra",
          topic: "Linear",
          topicSlug: "linear-equations",
          attempts: 5,
          correct: 4,
          wrong: 1,
          accuracy: 80,
          mastery: 78,
          bktProbability: 0.82,
          irtTheta: 0.65,
          depthAnalysis: { depthStatus: "deep" },
          retention: { isDecayed: false },
        },
      ],
      overallDepth: "deep",
    };

    const payload = createServerSyncPayload(mockReport);
    assert.equal(payload.student_code, "student-xyz");
    assert.equal(payload.theta, 0.65);
    assert.equal(payload.overall_depth, "deep");
    assert.equal(payload.topics_data.length, 1);
    assert.equal(payload.topics_data[0].topic_slug, "linear-equations");
  });
});

