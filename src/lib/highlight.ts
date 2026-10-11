// A very small syntax highlighter for the docs (no dependencies).
// Returns HTML with <span class="tok-x"> wrappers; input is escaped first.

export type Lang = "js" | "ts" | "jsx" | "php" | "python" | "json" | "bash" | "html" | "text";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const STR = String.raw`"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'`;
const TPL = String.raw`\`(?:[^\`\\]|\\.)*\``;
const NUM = String.raw`\b\d+(?:\.\d+)?\b`;
const FN = String.raw`\b[A-Za-z_$][\w$]*(?=\()`;

type Rule = [cls: string, pattern: string];

const RULES: Record<string, Rule[]> = {
  js: [
    ["c", String.raw`\/\/[^\n]*|\/\*[\s\S]*?\*\/`],
    ["s", `${STR}|${TPL}`],
    [
      "k",
      String.raw`\b(?:const|let|var|function|return|if|else|await|async|import|from|export|default|new|try|catch|throw|true|false|null|undefined|for|of|in|class|typeof|require|module)\b`,
    ],
    ["n", NUM],
    ["f", FN],
  ],
  php: [
    ["c", String.raw`\/\/[^\n]*|#[^\n]*|\/\*[\s\S]*?\*\/`],
    ["s", STR],
    ["t", String.raw`<\?php|\?>`],
    ["a", String.raw`\$[A-Za-z_]\w*`],
    [
      "k",
      String.raw`\b(?:function|return|if|else|elseif|foreach|as|echo|true|false|null|new|array|require|require_once|use|exit|die|isset|empty|fn|match)\b`,
    ],
    ["n", NUM],
    ["f", FN],
  ],
  python: [
    ["c", String.raw`#[^\n]*`],
    ["s", STR],
    ["k", String.raw`\b(?:def|return|if|else|elif|import|from|as|True|False|None|for|in|with|try|except|raise|class|lambda|and|or|not|is|pass)\b`],
    ["n", NUM],
    ["f", FN],
    ["a", String.raw`@[\w.]+`],
  ],
  json: [
    ["a", String.raw`"(?:[^"\\\n]|\\.)*"(?=\s*:)`],
    ["s", STR],
    ["k", String.raw`\b(?:true|false|null)\b`],
    ["n", String.raw`-?\b\d+(?:\.\d+)?\b`],
  ],
  bash: [
    ["c", String.raw`(?:^|\s)#[^\n]*`],
    ["s", STR],
    ["k", String.raw`\b(?:curl|npm|npx|node|cd|git|php|python|pip|export)\b`],
    ["a", String.raw`(?:^|\s)--?[\w-]+`],
  ],
  html: [
    ["c", String.raw`<!--[\s\S]*?-->`],
    ["s", STR],
    ["t", String.raw`<\/?[A-Za-z][\w-]*|\/?>`],
    ["a", String.raw`[\w-:@]+(?==)`],
  ],
};
RULES.ts = RULES.js;
RULES.jsx = RULES.js;

export function highlight(code: string, lang: Lang): string {
  const rules = RULES[lang];
  if (!rules) return esc(code);
  const re = new RegExp(rules.map(([, p]) => `(${p})`).join("|"), "g");
  let out = "";
  let last = 0;
  for (let m = re.exec(code); m; m = re.exec(code)) {
    if (m[0] === "") {
      re.lastIndex++;
      continue;
    }
    const idx = m.slice(1).findIndex((g) => g !== undefined);
    out += esc(code.slice(last, m.index));
    out += `<span class="tok-${rules[idx][0]}">${esc(m[0])}</span>`;
    last = m.index + m[0].length;
  }
  return out + esc(code.slice(last));
}
