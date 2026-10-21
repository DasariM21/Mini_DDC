import { detectAll } from "./detectors.ts";
import { maskCard, maskEmail, maskNino, maskPhone } from "./masking.ts";
import type { ClassificationResult, DetectorType, FindingAggregate, Match, RiskLevel } from "./types.ts";
import { riskByType, riskOrder } from "./types.ts";

function getRiskScore(risk: RiskLevel): number {
  return riskOrder.indexOf(risk);
}

function getMaskedExample(match: Match): string {
  switch (match.type) {
    case "email":
      return maskEmail(match.raw);
    case "phone":
      return maskPhone(match.raw);
    case "nino":
      return maskNino(match.raw);
    case "card":
      return maskCard(match.raw);
    default:
      return "***";
  }
}

function aggregateByType(matches: Match[]): FindingAggregate[] {
  const byType = new Map<DetectorType, Match[]>();

  for (const match of matches) {
    const existing = byType.get(match.type);
    if (existing) {
      existing.push(match);
    } else {
      byType.set(match.type, [match]);
    }
  }

  return Array.from(byType.entries())
    .map(([type, typeMatches]) => ({
      type,
      risk: riskByType[type],
      count: typeMatches.length,
      maskedExample: getMaskedExample(typeMatches[0])
    }))
    .sort((a, b) => getRiskScore(a.risk) - getRiskScore(b.risk));
}

export function classifyContent(content: string): ClassificationResult {
  const matches = detectAll(content);
  const findings = aggregateByType(matches);

  const highest = findings.reduce<RiskLevel>(
    (current, item) => (getRiskScore(item.risk) > getRiskScore(current) ? item.risk : current),
    "None"
  );

  return {
    fileRisk: highest,
    findings
  };
}
