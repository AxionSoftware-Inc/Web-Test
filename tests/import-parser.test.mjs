import { test, describe } from "node:test";
import assert from "node:assert/strict";

function slugify(value) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 50);
}

function parseCsv(text) {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const hasHeader = lines[0]?.toLowerCase().includes("test_slug") || lines[0]?.toLowerCase().includes("slug");
  return (hasHeader ? lines.slice(1) : lines).map((line, index) => {
    const [testSlug, itemTitle, orderValue, requiredValue] = line.split(",").map((value) => value.trim().replace(/^"|"$/g, ""));
    return {
      test_slug: testSlug,
      title: itemTitle || testSlug,
      order: Number(orderValue || index + 1),
      is_required: requiredValue ? requiredValue.toLowerCase() !== "false" : true,
    };
  }).filter((item) => item.test_slug);
}

describe("Import Parser Tests", () => {
  test("Slugifies titles reliably", () => {
    assert.equal(slugify("Algebra Foundations 101"), "algebra-foundations-101");
    assert.equal(slugify("O'zbek tili & Adabiyot!"), "o-zbek-tili-adabiyot");
    assert.equal(slugify("   multiple---hyphens   "), "multiple-hyphens");
  });

  test("Parses CSV tests correctly with header", () => {
    const csv = "test_slug,title,order,is_required\nalgebra-1,Algebra Drill,1,true\nlinear-2,Linear Eq,2,false";
    const result = parseCsv(csv);
    assert.equal(result.length, 2);
    assert.equal(result[0].test_slug, "algebra-1");
    assert.equal(result[0].title, "Algebra Drill");
    assert.equal(result[0].is_required, true);
    assert.equal(result[1].is_required, false);
  });

  test("Parses CSV tests without header", () => {
    const csv = "math-test,Mathematics 1,1,true";
    const result = parseCsv(csv);
    assert.equal(result.length, 1);
    assert.equal(result[0].test_slug, "math-test");
    assert.equal(result[0].title, "Mathematics 1");
  });
});
