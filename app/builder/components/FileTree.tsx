"use client";

export default function FileTree({
  files,
  activeFile,
  setActiveFile,
}: any) {
  return (
    <div className="border rounded-lg p-2">
      {Object.keys(files).map((file) => (
        <div
          key={file}
          onClick={() => setActiveFile(file)}
          className={`p-2 cursor-pointer rounded ${
            activeFile === file ? "bg-gray-200" : ""
          }`}
        >
          {file}
        </div>
      ))}
    </div>
  );
}