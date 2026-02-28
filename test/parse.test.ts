import { describe, expect, it } from "vitest";
import { parseKeywords, extractAuthors, classifyTypeMain, parseCsvText } from "../lib/parse";

describe("parseKeywords", () => {
  it("parses python-style list string", () => {
    expect(parseKeywords("['a','b']")).toEqual(["a", "b"]);
  });

  it("parses json list string", () => {
    expect(parseKeywords('["x", "y"]')).toEqual(["x", "y"]);
  });

  it("handles empty and null", () => {
    expect(parseKeywords("")).toEqual([]);
    expect(parseKeywords(null)).toEqual([]);
  });
});

describe("extractAuthors", () => {
  it("splits multi-author strings", () => {
    expect(extractAuthors("Ana Li and Bob Ray; Cara Fox")).toEqual(["Ana Li", "Bob Ray", "Cara Fox"]);
  });

  it("removes known noise", () => {
    const authors = extractAuthors("Jane Doe Search for more papers by this author");
    expect(authors).toEqual(["Jane Doe"]);
  });

  it("removes glued affiliation tails", () => {
    const authors = extractAuthors(
      "Jamie J. LadgeNortheastern UniversityBoston CollegeBabson CollegeSearch for more papers by this author"
    );
    expect(authors).toEqual(["Jamie J. Ladge"]);
  });

  it("keeps person name from editorial-note strings", () => {
    const authors = extractAuthors("Eric Arnould served as associate editor for this article. Author Notes");
    expect(authors).toEqual(["Eric Arnould"]);
  });

  it("keeps author order for comma/and separated Oxford-style rows", () => {
    const authors = extractAuthors(
      "Nini YangClayton College & State University of GeorgiaRutgers UniversityNanjing UniversitySearch for more papers by this author, Chao C. ChenClayton College & State University of GeorgiaRutgers UniversityNanjing UniversitySearch for more papers by this author and Jaepil ChoiClayton College & State University of GeorgiaRutgers UniversityNanjing UniversitySearch for more papers by this author"
    );
    expect(authors).toEqual(["Nini Yang", "Chao C. Chen", "Jaepil Choi"]);
  });

  it("supports leading initials and suffix tokens", () => {
    expect(
      extractAuthors(
        "Mani R. Subramani University of Minnesota Boston UniversitySearch for more papers by this author and N. Venkatraman University of Minnesota Boston UniversitySearch for more papers by this author"
      )
    ).toEqual(["Mani R. Subramani", "N. Venkatraman"]);

    expect(extractAuthors("Edward E. Lawler, IIIUniversity of Southern CaliforniaSearch for more papers by this author")).toEqual([
      "Edward E. Lawler III"
    ]);
  });

  it("removes city/state tails from single-author rows", () => {
    expect(extractAuthors("Debra DomalChampaign, IllinoisSearch for more papers by this author")).toEqual(["Debra Domal"]);
  });

  it("handles recent JAR uppercase/affiliation-heavy author blocks", () => {
    const socialImpact = extractAuthors(
      `GREGORY DISTELHORST,\n GREGORY DISTELHORST\n Centre for Industrial Relations and Human Resources and Rotman School of Management, University of TorontoSearch for more papers by this authorJEE-EUN SHIN,\n JEE-EUN SHIN\n Rotman School of Management, University of TorontoSearch for more papers by this author`
    );
    expect(socialImpact).toEqual(["Gregory Distelhorst", "Jee-Eun Shin"]);

    const minorityCalls = extractAuthors(
      `RACHEL W. FLAM,\n RACHEL W. FLAM\n London Business SchoolSearch for more papers by this authorJEREMIAH GREEN,\n JEREMIAH GREEN\n Texas A&M UniversitySearch for more papers by this authorJOSHUA A. LEE,\n JOSHUA A. LEE\n Brigham Young UniversitySearch for more papers by this authorNATHAN Y. SHARP,\n Corresponding Author\n NATHAN Y. SHARP\n nsharp@mays.tamu.edu\n Texas A&M University\n Correspondence: NATHAN SHARP, Texas A&M UniversitySearch for more papers by this author`
    );
    expect(minorityCalls).toEqual(["Rachel W. Flam", "Jeremiah Green", "Joshua A. Lee", "Nathan Y. Sharp"]);
  });

  it("keeps et al entries from source CSV", () => {
    expect(extractAuthors("Agarwal et al.")).toEqual(["Agarwal et al."]);
  });

  it("rejects non-person placeholders", () => {
    expect(extractAuthors("Organization Studies")).toEqual([]);
    expect(extractAuthors("Office 634A")).toEqual([]);
    expect(extractAuthors("Employment Relations")).toEqual([]);
    expect(extractAuthors("Sustainability")).toEqual([]);
  });

  it("returns empty list when no valid author name exists", () => {
    expect(extractAuthors("Correction notice only")).toEqual([]);
  });
});

describe("classifyTypeMain", () => {
  it("maps raw research article variants", () => {
    expect(classifyTypeMain("originalpaper", "", "", "JIBS")).toBe("Research Article");
  });

  it("infers note/commentary/review from blank type in target journals", () => {
    expect(classifyTypeMain("", "Research Note: A Better Scale", "", "ISR")).toBe("Research Note / Short");
    expect(classifyTypeMain("", "Research Commentary: A New Agenda", "", "MISQ")).toBe("Commentary / Forum / Debate");
    expect(classifyTypeMain("", "A Meta-Analysis of Platform Effects", "", "MS")).toBe("Review");
  });

  it("defaults blank type to research article for target journals", () => {
    expect(classifyTypeMain("", "Learning in Platform Ecosystems", "Empirical analysis...", "MSOM")).toBe("Research Article");
  });

  it("keeps blank as unknown outside target journals", () => {
    expect(classifyTypeMain("", "Some title", "Some abstract", "AMJ")).toBe("Unknown");
  });
});

describe("parseCsvText types", () => {
  it("keeps type_raw and uses normalized type_main for type", () => {
    const csv = [
      "year,vol,iss,author,title,abstract,url,type,journal,field,woke_score,keywords,justification",
      '2020,1,1,"A B","My Title","My abstract","",originalpaper,AMJ,Management,5,"[]","x"'
    ].join("\n");

    const row = parseCsvText(csv)[0];
    expect(row.type_raw).toBe("originalpaper");
    expect(row.type_main).toBe("Research Article");
    expect(row.type).toBe("Research Article");
  });

  it("keeps et al author value from source when full list is unavailable", () => {
    const csv = [
      "year,vol,iss,author,title,abstract,url,type,journal,field,woke_score,keywords,justification",
      '2024,1,1,"Agarwal et al.","Curated Cases on Social Justice and Digital Technologies: Illuminating Phenomena across the World","a","",article,MISQ,Information Systems,5,"[]","x"'
    ].join("\n");

    const row = parseCsvText(csv)[0];
    expect(row.authorsList).toEqual(["Agarwal et al."]);
  });

  it("parses noisy pages without title-based overrides", () => {
    const csv = [
      "year,vol,iss,author,title,abstract,url,type,journal,field,woke_score,keywords,justification",
      '2023,1,1,"KARTHIK BALAKRISHNAN, Corresponding Author KARTHIK BALAKRISHNAN Rice UniversitySearch for more papers by this authorRAFAEL COPAT, RAFAEL COPAT University of Texas at DallasSearch for more papers by this authorDANIELA DE LA PARRA, DANIELA DE LA PARRA University of North Carolina at Chapel HillSearch for more papers by this authorK. RAMESH, K. RAMESH Rice UniversitySearch for more papers by this author","Racial Diversity Exposure and Firm Responses Following the Murder of George Floyd","a","",article,JAR,Accounting,5,"[]","x"',
      '2023,1,1,"Ming zhu Wang, Corresponding Author Ming zhu Wang mingzhu@wustl.edu Olin Business School, Washington University in St. LouisSearch for more papers by this author","Changes in industry and corporate effects in the United States, 1978–2019","a","",article,SMJ,Management,5,"[]","x"'
    ].join("\n");

    const rows = parseCsvText(csv);
    expect(rows[0].authorsList).toEqual(["Karthik Balakrishnan", "Rafael Copat", "Daniela de la Parra", "K. Ramesh"]);
    expect(rows[1].authorsList).toEqual(["Ming Zhu Wang"]);
  });
});
