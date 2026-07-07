import { BANNED_KEYWORDS } from "./constants";

export function violatesGuidelines(...texts) {
  const hay = texts.join(" ").toLowerCase();
  return BANNED_KEYWORDS.some((kw) => hay.includes(kw.toLowerCase()));
}
