import { extractCode } from "./lib/extractCode";

// Test 1: Single file with FILE markers
const test1 = `// FILE: src/App.jsx
import "./styles.css";

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Todo List</h1>
      </header>
      <main className="app-main">
        {/* Todo list will be rendered here */}
      </main>
      <footer className="app-footer">
        &copy; 2025 Todo App
      </footer>
    </div>
  );
}

export default App;
// END_FILE`;

console.log("Test 1 result:");
console.log(extractCode(test1));
console.log("---");

// Test 2: Code with markdown fences
const test2 = \`\`\`jsx
import "./styles.css";

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Todo List</h1>
      </header>
      <main className="app-main">
        {/* Todo list will be rendered here */}
      </main>
      <footer className="app-footer">
        &copy; 2025 Todo App
      </footer>
    </div>
  );
}

export default App;
\`\`;

console.log("Test 2 result:");
console.log(extractCode(test2));
console.log("---");

// Test 3: Plain code
const test3 = `import "./styles.css";

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Todo List</h1>
      </header>
      <main className="app-main">
        {/* Todo list will be rendered here */}
      </main>
      <footer className="app-footer">
        &copy; 2025 Todo App
      </footer>
    </div>
  );
}

export default App;`;

console.log("Test 3 result:");
console.log(extractCode(test3));
console.log("---");