"use client";

interface DeployButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export default function DeployButton({ onClick, disabled }: DeployButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2.5 font-mono text-[10px] uppercase tracking-widest flex items-center gap-3 border transition-colors rounded-none ${
        disabled 
          ? "border-secondary-800 text-secondary-600 bg-secondary-900/50 cursor-not-allowed" 
          : "border-secondary-700 text-white bg-transparent hover:border-primary-400 hover:text-primary-400"
      }`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-3.5 h-3.5"
      >
        <path
          strokeLinecap="square"
          strokeLinejoin="miter"
          d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.438 4.438 0 002.946-2.946 4.493 4.493 0 004.306-1.758q.26-.118.513-.255Q11.666 11.832 11.55 11.55z"
        />
      </svg>
      Deploy to Vercel
    </button>
  );
}