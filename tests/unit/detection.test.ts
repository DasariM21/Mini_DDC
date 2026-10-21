import { readFileSync } from "node:fs";
import { join } from "node:path";
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  detectAll,
  detectCards,
  detectEmails,
  detectNinos,
  detectUkPhones
} from "../../src/core/detection/detectors.ts";
import { classifyContent } from "../../src/core/detection/classifier.ts";
import { isValidLuhn } from "../../src/core/detection/luhn.ts";
import { analyzeUpload } from "../../src/core/upload/analyze-upload.ts";

describe("email detector", () => {
  it("detects plausible email", () => {
    const hits = detectEmails("Contact alex@example.test today");
    assert.equal(hits.length, 1);
  });

  it("rejects malformed email", () => {
    const hits = detectEmails("Bad address alex@@example.test should fail");
    assert.equal(hits.length, 0);
  });
});

describe("UK phone detector", () => {
  it("detects common UK mobile forms", () => {
    const hits = detectUkPhones("Call 07700 900123 or +44 7700 900123");
    assert.equal(hits.length, 2);
  });

  it("does not detect short invalid number", () => {
    const hits = detectUkPhones("Invalid 12345 number");
    assert.equal(hits.length, 0);
  });
});

describe("NINO detector", () => {
  it("detects valid NINO format", () => {
    const hits = detectNinos("Candidate AB 12 34 56 C is present");
    assert.equal(hits.length, 1);
  });

  it("rejects invalid prefix", () => {
    const hits = detectNinos("Invalid NINO DF 12 34 56 C");
    assert.equal(hits.length, 0);
  });
});

describe("card detector and Luhn", () => {
  it("accepts Luhn-valid candidate", () => {
    const hits = detectCards("Card: 4111 1111 1111 1111");
    assert.equal(hits.length, 1);
  });

  it("rejects Luhn-invalid candidate", () => {
    const hits = detectCards("Card: 4111 1111 1111 1112");
    assert.equal(hits.length, 0);
  });

  it("validates Luhn directly", () => {
    assert.equal(isValidLuhn("4111111111111111"), true);
    assert.equal(isValidLuhn("4111111111111112"), false);
  });
});

describe("classification and aggregation", () => {
  it("uses highest-risk-wins on mixed content", () => {
    const content = [
      "Email: alex@example.test",
      "Phone: 07700 900123",
      "NINO: AB 12 34 56 C",
      "Card: 4111 1111 1111 1111"
    ].join("\n");

    const result = classifyContent(content);
    assert.equal(result.fileRisk, "Critical");
    assert.deepEqual(
      result.findings.map((item) => item.type).sort(),
      ["card", "email", "nino", "phone"]
    );
  });

  it("counts repeated matches by type", () => {
    const content = "a@example.test a@example.test 07700 900123 07700 900123";
    const result = classifyContent(content);

    const emailFinding = result.findings.find((item) => item.type === "email");
    const phoneFinding = result.findings.find((item) => item.type === "phone");

    assert.equal(emailFinding?.count, 2);
    assert.equal(phoneFinding?.count, 2);
  });

  it("keeps overlapping detector matches non-overlapping and prefers higher risk", () => {
    const matches = detectAll("x07700900123@example.test");
    assert.deepEqual(matches.map((match) => match.type), ["phone"]);
  });

  it("maps acceptance example for malformed email", () => {
    const result = classifyContent("alex@@example.test");
    assert.equal(result.fileRisk, "None");
    assert.equal(result.findings.length, 0);
  });

  it("uses synthetic fixture text without exposing raw values", () => {
    const fixturePath = join(process.cwd(), "tests", "fixtures", "sample-mixed.txt");
    const content = readFileSync(fixturePath, "utf8");

    const all = detectAll(content);
    const result = classifyContent(content);
    const serializedResult = JSON.stringify(result);

    assert.equal(all.length > 0, true);
    assert.notEqual(result.fileRisk, "None");
    for (const match of all) {
      assert.equal(serializedResult.includes(match.raw), false);
    }
  });

  it("matches expected outcomes for all 30 acceptance fixtures", () => {
    const fixtureDirectory = join(process.cwd(), "tests", "fixtures", "additional");
    const expectedResults = JSON.parse(
      readFileSync(join(fixtureDirectory, "EXPECTED_RESULTS.json"), "utf8")
    ) as Array<{ file: string; expected_file_risk: string }>;

    for (const fixture of expectedResults) {
      const bytes = readFileSync(join(fixtureDirectory, fixture.file));
      const analysis = analyzeUpload(fixture.file, bytes);

      if (fixture.expected_file_risk === "Reject") {
        assert.equal(analysis.ok, false, fixture.file);
      } else {
        assert.equal(analysis.ok, true, fixture.file);
        if (analysis.ok) {
          assert.equal(analysis.result.fileRisk, fixture.expected_file_risk, fixture.file);
        }
      }
    }
  });

  it("rejects binary and invalid UTF-8 bytes without returning content", () => {
    assert.deepEqual(analyzeUpload("binary.txt", Uint8Array.from([0x61, 0, 0x62])), {
      ok: false,
      reason: "binary"
    });
    assert.deepEqual(analyzeUpload("invalid.txt", Uint8Array.from([0xc3, 0x28])), {
      ok: false,
      reason: "invalid-utf8"
    });
  });
});
