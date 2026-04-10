// utils/sanitizeMarkdown.js

export function sanitizeMarkdown(raw = "") {
  if (!raw) return "";

  let cleaned = raw
    .replace(/\\n/g, "\n")
    .replace(/\\`{3}/g, "```")
    .replace(/\\`/g, "`")
    .replace(/\\([^\w])/g, "$1")
    .trim();

  // Ensure fenced blocks start on their own line
  cleaned = cleaned.replace(/:\s*```/g, ":\n```");

  // Auto-wrap code after "For example:" if no fences exist
  // Match "For example", "Example", "Code example", "Sample code", "Snippet", "e.g.", "Demo", "Illustration"
  // Supports plural forms, optional colon/period, and sloppy spacing
  if (
    /(for example|example|code example|sample|sample code|snippet|e\.g\.|demo|illustration)s?\s*[:.]?\s*(?!\n```)/i.test(
      cleaned,
    )
  ) {
    cleaned = cleaned.replace(
      /(for example|example|code example|sample|sample code|snippet|e\.g\.|demo|illustration)s?\s*[:.]?([\s\S]*)/i,
      (_, intro, code) => {
        const lang = detectLanguage(code);
        const formatted = code
          .replace(/;\s*/g, ";\n")
          .replace(/\}\s*/g, "}\n")
          .replace(/\{\s*/g, "{\n");
        return `${intro}:\n\`\`\`${lang}\n${formatted.trim()}\n\`\`\``;
      },
    );
  }

  return cleaned;
}

// Language detection based on keywords
function detectLanguage(code) {
  if (/System\.out\.println|FileReader|Exception/.test(code)) return "java";
  if (/def |lambda |print\(/.test(code)) return "python";
  if (/SELECT|FROM|WHERE/.test(code)) return "sql";
  if (/var |let |const /.test(code)) return "javascript";
  if (/public static void main/.test(code)) return "java";
  if (/function\s+\w+\(/.test(code)) return "javascript";
  if (/package\s+\w+/.test(code)) return "java";
  if (/console\.log/.test(code)) return "javascript";
  if (/class\s+\w+/.test(code)) return "csharp";
  if (/using\s+System/.test(code)) return "csharp";
  if (/<?php/.test(code)) return "php";
  if (/echo\s+/.test(code)) return "php";
  if (/puts\s+/.test(code)) return "ruby";
  if (/fn\s+\w+/.test(code)) return "rust";
  if (/func\s+\w+/.test(code)) return "go";
  if (/fun\s+\w+/.test(code)) return "kotlin";
  if (/val\s+\w+/.test(code)) return "scala";
  if (/SELECT\s+.+\s+INTO/.test(code)) return "sql";
  if (/<!DOCTYPE html>/.test(code)) return "html";
  if (/{\s*[a-z-]+\s*:\s*.+}/.test(code)) return "css";
  if (/^{.*}$/s.test(code)) return "json";
  if (/^---/.test(code)) return "yaml";
  if (/^<\?xml/.test(code)) return "xml";
  if (/#!\/bin\/bash/.test(code)) return "bash";
  if (/Write-Host/.test(code)) return "powershell";
  if (/plot\(/.test(code)) return "r";
  if (/function\s+\[.*\]/.test(code)) return "matlab";
  if (/void\s+main/.test(code)) return "c";
  if (/cout\s*<</.test(code)) return "cpp";
  if (/#include/.test(code)) return "cpp";
  if (/class\s+\w+\s*{/.test(code)) return "swift";
  if (/import\s+dart:/.test(code)) return "dart";
  if (/use\s+strict/.test(code)) return "perl";
  if (/main\s*=\s*do/.test(code)) return "haskell";
  if (/local\s+\w+\s*=/.test(code)) return "lua";
  if (/#include\s+<objc/.test(code)) return "objectivec";
  if (/section\s+\.text/.test(code)) return "asm";
  if (/^# /.test(code)) return "markdown";
  if (/FROM\s+\w+/.test(code)) return "dockerfile";
  if (/query\s*{/.test(code)) return "graphql";

  return ""; // default: plain fenced block
}
