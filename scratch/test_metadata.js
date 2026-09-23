function extractExports(content) {
  const exports = [];
  const componentProps = {};

  // Find all exported function / const names
  // 1. export default function Name(...)
  // 2. export default function(...)
  // 3. export function Name(...)
  // 4. export const Name = (...) =>
  // 5. export default const Name = ...
  const exportPatterns = [
    /export\s+default\s+function\s+([A-Za-z_$][\w$]*)\s*\(/g,
    /export\s+function\s+([A-Za-z_$][\w$]*)\s*\(/g,
    /export\s+const\s+([A-Za-z_$][\w$]*)\s*=\s*(?:function\s*)?\(/g,
    /export\s+default\s+([A-Za-z_$][\w$]*)\b/g,
  ];

  const foundNames = new Set();

  for (const regex of exportPatterns) {
    let match;
    while ((match = regex.exec(content)) !== null) {
      const name = match[1];
      if (name && name !== "function" && name !== "const" && !foundNames.has(name)) {
        foundNames.add(name);
        exports.push(name);
      }
    }
  }

  // Handle anonymous export default function(...)
  if (!foundNames.has("default")) {
    const anonMatch = content.match(/export\s+default\s+function\s*\(/);
    if (anonMatch) {
      exports.push("default");
    }
  }

  // For each found component, extract its parameters using balanced parenthesis parsing
  for (const name of exports) {
    const paramStr = extractParameterString(content, name);
    if (paramStr) {
      componentProps[name] = parseDestructuredProps(paramStr);
    } else {
      componentProps[name] = [];
    }
  }

  return { exports, componentProps };
}

function extractParameterString(content, fnName) {
  let fnRegex;
  if (fnName === "default") {
    fnRegex = /export\s+default\s+function\s*\(/g;
  } else {
    fnRegex = new RegExp(
      `(?:export\\s+default\\s+(?:function|const)?\\s*|export\\s+function\\s+|export\\s+const\\s+|const\\s+)${fnName}\\s*(?:=\\s*(?:function\\s*)?)?\\(`,
      'g'
    );
  }

  const match = fnRegex.exec(content);
  if (!match) return null;

  let depth = 1;
  let startIndex = fnRegex.lastIndex;
  let i = startIndex;

  while (i < content.length && depth > 0) {
    const char = content[i];
    if (char === '(') depth++;
    else if (char === ')') depth--;
    i++;
  }

  return content.slice(startIndex, i - 1);
}

function parseDestructuredProps(params) {
  const trimmed = params.trim();
  if (!trimmed.startsWith('{')) return [];

  let depth = 0;
  let insideBraces = '';
  let found = false;

  for (let i = 0; i < trimmed.length; i++) {
    const char = trimmed[i];
    if (char === '{') {
      depth++;
      if (depth === 1) continue;
    } else if (char === '}') {
      depth--;
      if (depth === 0) {
        insideBraces = trimmed.slice(1, i);
        found = true;
        break;
      }
    }
  }

  if (!found) return [];

  const props = [];
  let current = '';
  let parenDepth = 0;
  let braceDepth = 0;
  let bracketDepth = 0;

  for (let i = 0; i < insideBraces.length; i++) {
    const char = insideBraces[i];
    if (char === '(') parenDepth++;
    else if (char === ')') parenDepth--;
    else if (char === '{') braceDepth++;
    else if (char === '}') braceDepth--;
    else if (char === '[') bracketDepth++;
    else if (char === ']') bracketDepth--;

    if (char === ',' && parenDepth === 0 && braceDepth === 0 && bracketDepth === 0) {
      if (current.trim()) props.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  if (current.trim()) props.push(current.trim());

  return props
    .map((item) => {
      const cleaned = item.split('=')[0].split(':')[0].trim();
      const identMatch = cleaned.match(/^[A-Za-z_$][\w$]*/);
      return identMatch ? identMatch[0] : '';
    })
    .filter(Boolean);
}

// Test cases
const c1 = "export default function GameBoard({ a = 1, b = () => {} }) {}";
const c2 = "export function ScoreBoard({ score, isHigh = false }) {}";
const c3 = "export const Timer = ({ seconds = 60, onTick = () => {} }) => {}";

console.log('C1:', extractExports(c1));
console.log('C2:', extractExports(c2));
console.log('C3:', extractExports(c3));
