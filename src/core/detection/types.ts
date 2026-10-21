export const riskOrder = ["None", "Low", "Medium", "High", "Critical"] as const;

export type RiskLevel = (typeof riskOrder)[number];

export type DetectorType = "email" | "phone" | "nino" | "card";

export type Match = {
  type: DetectorType;
  start: number;
  end: number;
  raw: string;
};

export type FindingAggregate = {
  type: DetectorType;
  risk: Exclude<RiskLevel, "None">;
  count: number;
  maskedExample: string;
};

export type ClassificationResult = {
  fileRisk: RiskLevel;
  findings: FindingAggregate[];
};

export const riskByType: Record<DetectorType, Exclude<RiskLevel, "None">> = {
  email: "Low",
  phone: "Medium",
  nino: "High",
  card: "Critical"
};
