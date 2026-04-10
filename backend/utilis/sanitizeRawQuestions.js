// utils/sanitizeRawQuestions.js

function escapeAnswer(answer) {
  if (typeof answer !== "string") return "";
  return answer
    .replace(/\r?\n/g, "\\n") // escape newlines
    .replace(/`/g, "\\`"); // escape backticks
}

function sanitizeRawQuestions(rawString) {
  try {
    // Pre-clean: strip code fences and escape raw newlines/backticks
    let cleaned = rawString
      .replace(/^```json\s*/, "")
      .replace(/```$/, "")
      .trim();

    // Escape control characters BEFORE parsing
    cleaned = cleaned.replace(/\r?\n/g, "\\n").replace(/`/g, "\\`");

    let parsed = JSON.parse(cleaned);

    // Handle nested "output" wrappers
    if (parsed.output && typeof parsed.output === "string") {
      parsed = JSON.parse(parsed.output.trim());
    }

    // Handle stringified array/object
    if (typeof parsed === "string") {
      parsed = JSON.parse(parsed.trim());
    }

    // Normalize schema
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((q) => q.question && q.answer)
      .map((q) => ({
        question: q.question,
        answer: escapeAnswer(q.answer),
      }));
  } catch (err) {
    console.error("sanitizeRawQuestions error:", err.message);
    return [];
  }
}

module.exports = sanitizeRawQuestions;
