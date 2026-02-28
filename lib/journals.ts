const JOURNAL_FULL_NAMES: Record<string, string> = {
  AMJ: "Academy of Management Journal",
  AMR: "Academy of Management Review",
  ASQ: "Administrative Science Quarterly",
  ISR: "Information Systems Research",
  JAE: "Journal of Accounting and Economics",
  JAR: "Journal of Accounting Research",
  JCR: "Journal of Consumer Research",
  JF: "Journal of Finance",
  JFE: "Journal of Financial Economics",
  JIBS: "Journal of International Business Studies",
  JM: "Journal of Marketing",
  JMR: "Journal of Marketing Research",
  JOC: "INFORMS Journal on Computing",
  JOM: "Journal of Operations Management",
  MISQ: "MIS Quarterly",
  MKS: "Marketing Science",
  MS: "Management Science",
  MSOM: "Manufacturing & Service Operations Management",
  OR: "Operations Research",
  OS: "Organization Science",
  POM: "Production and Operations Management",
  RFS: "Review of Financial Studies",
  SMJ: "Strategic Management Journal",
  TAR: "The Accounting Review"
};

export function journalFullName(acronym: string): string {
  const key = String(acronym ?? "").trim().toUpperCase();
  return JOURNAL_FULL_NAMES[key] ?? String(acronym ?? "").trim();
}

