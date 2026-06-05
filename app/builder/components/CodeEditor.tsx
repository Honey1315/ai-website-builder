"use client";

export default function CodeEditor({
  code,
  setCode,
}: {
  code: string;
  setCode: (val: string) => void;
}) {
  return (
    <textarea
      className="w-full h-[600px] p-4 border rounded-lg font-mono text-sm"
      value={code}
      onChange={(e) => setCode(e.target.value)}
    />
  );
}