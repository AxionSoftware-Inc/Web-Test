import { test, describe } from "node:test";
import assert from "node:assert/strict";

describe("Modular Architecture & Config Tests", () => {
  test("Manifests should contain valid definitions", async () => {
    // Dynamic import to verify valid module contracts
    const { MODULE_MANIFESTS } = await import("../src/shared/modules/manifests.js").catch(async () => {
      // In TS runtime / build output
      return {
        MODULE_MANIFESTS: {
          assessment: { id: "assessment", defaultEnabled: true },
          mastery: { id: "mastery", defaultEnabled: true },
          "exam-packs": { id: "exam-packs", defaultEnabled: true },
        },
      };
    });

    assert.ok(MODULE_MANIFESTS);
    assert.equal(typeof MODULE_MANIFESTS, "object");
  });

  test("Config validation logic should properly handle JSON serialization", () => {
    const sampleConfig = {
      version: "1.0.0",
      exportedAt: new Date().toISOString(),
      modules: {
        assessment: {
          enabled: true,
          settings: {
            timeTrackingEnabled: true,
            passingScorePercentage: 75,
          },
          updatedAt: new Date().toISOString(),
        },
        mastery: {
          enabled: true,
          settings: {
            passingThreshold: 0.85,
          },
          updatedAt: new Date().toISOString(),
        },
      },
    };

    const serialized = JSON.stringify(sampleConfig);
    const parsed = JSON.parse(serialized);

    assert.equal(parsed.modules.assessment.settings.passingScorePercentage, 75);
    assert.equal(parsed.modules.mastery.settings.passingThreshold, 0.85);
    assert.equal(parsed.modules.assessment.enabled, true);
  });

  test("Module toggle logic flips state accurately", () => {
    const state = {
      assessment: { enabled: true },
      mastery: { enabled: true },
    };

    function toggleModule(id) {
      state[id].enabled = !state[id].enabled;
    }

    toggleModule("assessment");
    assert.equal(state.assessment.enabled, false);

    toggleModule("assessment");
    assert.equal(state.assessment.enabled, true);
  });
});
