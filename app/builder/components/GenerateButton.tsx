"use client";

export default function GenerateButton({ onClick, loading }: any) {
  return (
    <button
      onClick={onClick}
      className="bg-blue-600 text-white px-4 py-2 rounded-lg"
      disabled={loading}
    >
      {loading ? "Generating..." : "Generate"}
    </button>
  );
}