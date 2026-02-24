import { describe, expect, it } from "vitest";
import { parseKeywords, extractAuthors } from "../lib/parse";

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
});
