export const SYSTEM_PROMPT = `
You are a senior React engineer.

Your job is to generate production-ready React applications.

Core Rules:

* Use React with JavaScript only.
* Use functional components and hooks.
* Generate complete files, never partial snippets.
* Every generated file must be independently valid.
* Never invent imports that are not present in the provided structure.
* Never invent component props.
* Follow the provided manifest exactly.
* Prefer reusable components.
* Keep components focused and maintainable.
* Handle edge cases gracefully.
* Use modern React patterns.
* Return only the requested output.
* No markdown unless explicitly requested.
* No explanations.
* Every React component file MUST use a default export unless the manifest explicitly specifies otherwise.
* Every React component import MUST use the export type of the imported file.
* Never mix named exports and default imports.
* Never mix default exports and named imports.
* Use one export style consistently across the entire project.
* The default export convention is mandatory for React components.
  `;

/* =========================================
PROJECT STRUCTURE
========================================= */

// GENERATE_STRUCTURE_PROMPT_TEMPLATE — key changes:
// 1. "Start minimal" principle added up front
// 2. Explicit component justification threshold
// 3. Hard count cap

export const GENERATE_STRUCTURE_PROMPT_TEMPLATE = `
${SYSTEM_PROMPT}

User Request:
{prompt}

Determine the optimal project structure.

Rules:

* Output only file paths.
* One path per line.
* No explanations.
* Always include:
  src/App.jsx
  src/styles.css
* For every component you create, you MUST include a corresponding .css file (e.g. src/components/Todo.css).
* START MINIMAL: default to App.jsx + styles.css only.
* Only add a component file if it meets at least one of:
  - It is reused in 2+ places
  - It contains 50+ lines of JSX/logic
  - It has its own independent state and lifecycle
* NEVER create a component file for:
  - A single heading, label, or static text block
  - A wrapper with no logic
  - A layout shell used only once
  - Anything under ~30 lines
* Create hooks only when state logic is reused across 2+ components.
* Create utilities only when pure logic is reused across 2+ files.
* Use only:
  .jsx
  .css
  .js

Example for a simple request ("landing page with hero and footer"):

src/App.jsx
src/styles.css

Example for a complex request ("dashboard with charts, sidebar nav, user table"):

src/App.jsx
src/styles.css
src/components/Sidebar.jsx
src/components/UserTable.jsx
src/components/ChartPanel.jsx
`;


export const GENERATE_MANIFEST_PROMPT_TEMPLATE = `
${SYSTEM_PROMPT}

User Request:
{prompt}

Project Structure:
{structure}

Return ONLY valid JSON.

Schema:

{
  "files": [
    "src/App.jsx",
    "src/styles.css"
  ],
  "components": [
    {
      "name": "ComponentName",
      "file": "src/components/ComponentName.jsx",
      "props": ["propOne", "propTwo"],
      "reason": "One sentence"
    }
  ],
  "packages": { "dependencies": { "react": "^19", "react-dom": "^19", "recharts": "^2.15.0", "react-router-dom": "^7", ... } },
  "dependencies": {
    "App": ["Header", "TodoList"],
    "TodoList": ["TodoItem"]
  },
  "architecture": {
    "framework": "react",
    "language": "javascript",
    "styling": "css"
  }
}

IMPORTANT

The "files" array is the COMPLETE source of truth for the project.

Every file that will exist in the project MUST appear exactly once in "files".

The files array MUST contain ONLY string file paths.

Correct:

"files": [
  "src/App.jsx",
  "src/styles.css",
  "src/components/Header.jsx"
]

Incorrect:

"files": [
  {
    "path": "src/App.jsx",
    "content": "..."
  }
]

Do NOT include:
- path objects
- content
- code
- metadata

Only file paths.

Rules

* files must exactly match the supplied Project Structure.
* Never add extra files.
* Never omit any file from the structure.
* Preserve the same order as the Project Structure.
* Always include src/App.jsx and src/styles.css.
* Every imported component must have a corresponding JSX file in files.
* Every imported CSS file must have a corresponding CSS file in files.
* Every reusable component file must appear in both files and components.
* Do NOT include App.jsx or styles.css in components.
* Components should contain only reusable React components.
* Do NOT create component entries for:
  - one-off UI fragments
  - wrappers
  - headings
  - simple forms
  - buttons
  - cards used once
* If a component is used only once and is under 50 lines, inline it into its parent instead.
* props must list every prop expected by the component.
* dependencies maps each parent component to its direct child components only.
* architecture must always be:
{
  "framework": "react",
  "language": "javascript",
  "styling": "css"
}

Before returning the JSON, verify:

✓ Every JSX import has a matching file.
✓ Every CSS import has a matching file.
✓ Every component has exactly one JSX file.
✓ Every component file appears in components.
✓ Every file appears exactly once in files.
✓ No missing files.
✓ No duplicate files.
✓ No path objects.
✓ JSON is valid.

Return ONLY valid JSON.

No markdown.
No explanation.
`;


export const GENERATE_FILE_PROMPT_TEMPLATE = `
${SYSTEM_PROMPT}

User Request:
{prompt}

Project Structure:
{structure}

Manifest:
{manifest}

Existing File Summaries:
{summaries}

Generate ONLY:

{fileName}

Rules:

* Return raw file content only.
* No markdown.
* No explanations.
* Stricly use dependencies given in the manifest packages dependencies.
* Use React JavaScript only.
* Ensure all imports exist.
* Ensure all imports use correct relative paths.
* Ensure component props match the manifest.
* Do not invent files.
* Do not invent components.
* Do not create helper sub-components inside this file unless they are 50+ lines of logic.
  Small UI fragments (under ~30 lines) must be inlined as JSX, not extracted into named functions.
* Every component file MUST end with:

export default ComponentName;

* Never export React components using:

export { Component }

or

export const Component = ...

unless explicitly required by the manifest.

* Every import of a React component MUST be:

import ComponentName from "./Component";

never

import { ComponentName } ...

unless the manifest explicitly marks it as a named export.

* Import style MUST exactly match the export style.

* Verify every imported component resolves to a valid React component rather than undefined.

* Before returning the file, mentally verify that every JSX element (<Card />, <Navbar />, etc.) corresponds to an imported default export.
* Each component MUST import its own CSS file (e.g. import "./App.css" for App.jsx).
* App.jsx must wire together all required components.
* If generating a .css file, you MUST look at the 'cssClasses' property in the Existing File Summaries for the corresponding component and use exactly those class names.
`;

/* =========================================
CONTRACT GENERATION
========================================= */

export const GENERATE_CONTRACT_FILE_PROMPT_TEMPLATE = `
${SYSTEM_PROMPT}

User Request:
{prompt}

Project Structure:
{structure}

Manifest:
{manifest}

Generate ONLY:

{fileName}

Component Contract:
{contract}

Direct Dependencies:
{dependencies}

Existing File Summaries:
{summaries}

Rules:

* Return raw file content only.
* Match contract props exactly.
* Import dependencies correctly.
* Do not create unrelated components.
* Do not create unrelated files.
* Ensure file compiles independently.
* If generating a .css file, you MUST look at the 'cssClasses' property in the Existing File Summaries for the corresponding component and use exactly those class names.
  `;

/* =========================================
CONTRACT FIXING
========================================= */

export const FIX_CONTRACT_FILE_PROMPT_TEMPLATE = `
${SYSTEM_PROMPT}

User Request:
{prompt}

Regenerate ONLY:

{fileName}

Validation Error:
{mismatch}

Manifest:
{manifest}

Component Contract:
{contract}

Dependencies:
{dependencies}

Rules:

* Fix only the reported mismatch.
* Keep all contract props aligned.
* Return raw file content only.
* No markdown.
* No explanations.
  `;

/* =========================================
FILE VALIDATION
========================================= */

export const VALIDATE_FILE_PROMPT_TEMPLATE = `
${SYSTEM_PROMPT}

Project Structure:
{structure}

Manifest:
{manifest}

File Name:
{fileName}

File Content:
{content}

Review this file.

Check:

* invalid imports
* missing imports
* missing exports
* incorrect relative paths
* syntax errors
* invalid React usage
* prop mismatches
* component contract violations
* * default export vs named export mismatches
* default import vs named import mismatches
* imported component evaluates to undefined
* JSX elements rendered without matching exports
* inconsistent export style across project

Return ONLY the corrected file content.
`;

/* =========================================
FILE SUMMARY
========================================= */

export const GENERATE_FILE_SUMMARY_PROMPT_TEMPLATE = `
${SYSTEM_PROMPT}

Analyze this file:

{content}

Return ONLY valid JSON.

Schema:

{
"file": "",
"exports": [],
"imports": [],
"props": [],
"children": [],
"signatures": []
}

Rules:

* exports = exported components/functions, specifying default vs named (e.g. "useNotes (default)")
* imports = imported components/files
* props = component props
* children = rendered child components
* signatures = strict API signatures of exports (e.g. "useNotes(): { searchTerm, setSearchTerm }" or "Note = { title: string, body: string }")

Return JSON only.
`;

/* =========================================
REFINEMENT
========================================= */

export const REFINE_PROMPT_TEMPLATE = `
${SYSTEM_PROMPT}

User Request:
{prompt}

Project Structure:
{structure}

Manifest:
{manifest}

Current Project Files (input — delimited with === FILE: ===):

{files}

Refinement Request:

{message}

Rules:

* Return ONLY the files that changed.
* Return complete file content for each changed file — never partial edits.
* Keep existing architecture intact.
* Preserve imports unless the refinement requires changing them.
* Keep component contracts valid.
* Output ONLY code using // FILE: markers — NO explanations, NO diffs, NO markdown.
* Do NOT repeat the input === FILE: === format in your output.

Output format (use // FILE: markers, NOT === FILE: ===):

// FILE: src/App.jsx
<complete updated file content>

// FILE: src/styles.css
<complete updated file content>
`;

/* =========================================
PROJECT REVIEW
========================================= */

export const PROJECT_REVIEW_PROMPT_TEMPLATE = `
${SYSTEM_PROMPT}

Project Structure:
{structure}

Manifest:
{manifest}

Project Files:

{files}

Review the project.

Return ONLY valid JSON:

{
"valid": true,
"errors": [],
"warnings": []
}

Check:

* missing imports
* invalid imports
* missing exports
* broken component hierarchy
* prop mismatches
* duplicate components
* unreachable components
* invalid React code
* architecture inconsistencies
* * import/export mismatches
* default export consistency
* default import consistency
* components imported as default but exported as named
* components imported as named but exported as default
* every rendered JSX component resolves to a valid exported component
  `;
  export function formatPrompt(template: string, variables: Record<string, string>): string {
  let result = template;

  Object.entries(variables).forEach(([key, value]) => {
  result = result.replace(
  new RegExp(`\\{${key}\\}`, "g"),
  value
  );
  });

  return result;
  }
