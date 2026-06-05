"use client";

export default function PreviewPanel({ code }: { code: string }) {
  const srcDoc = `
    <html>
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body>
        <div id="root"></div>
        <script type="module">
          import React from "https://esm.sh/react";
          import ReactDOM from "https://esm.sh/react-dom/client";

          const App = () => {
            return ${code};
          };

          ReactDOM.createRoot(document.getElementById("root")).render(<App />);
        </script>
      </body>
    </html>
  `;

  return (
    <iframe
      className="w-full h-[600px] border rounded-lg"
      sandbox="allow-scripts"
      srcDoc={srcDoc}
    />
  );
}