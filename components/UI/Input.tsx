"use client";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-3">
      {label && (
        <label className="text-[10px] font-mono uppercase tracking-widest text-secondary-500 flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-secondary-700 block"></span>
          {label}
        </label>
      )}
      <input
        {...props}
        className={`bg-secondary-900 text-white px-4 py-3 border rounded-none transition-colors focus:outline-none focus:ring-1 ${
          error 
            ? "border-danger-500/50 focus:border-danger-500 focus:ring-danger-500" 
            : "border-secondary-800 focus:border-primary-400 focus:ring-primary-400"
        } placeholder:text-secondary-700 font-sans text-sm ${props.className || ""}`}
      />
      {error && (
        <span className="text-[10px] font-mono text-danger-500 uppercase tracking-widest">
          ERR: {error}
        </span>
      )}
    </div>
  );
}