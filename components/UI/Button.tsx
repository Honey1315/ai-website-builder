"use client";

import { IconSpinner } from "./Icons";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "inverted" | "outlined" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  children: React.ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center gap-3 font-mono uppercase tracking-widest transition-all duration-200 focus:outline-none focus-visible:ring-1 focus-visible:ring-primary-400 focus-visible:ring-offset-0 focus-visible:ring-offset-transparent disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:transform-none rounded-none";

  const variants = {
    primary:
      "bg-primary-500 text-secondary-900 hover:bg-primary-400 border border-primary-500 font-bold",
    secondary:
      "bg-transparent text-white border border-secondary-700 hover:border-primary-400 hover:text-primary-400",
    inverted:
      "bg-white text-secondary-900 hover:bg-secondary-200",
    outlined:
      "bg-transparent text-secondary-400 border border-secondary-800 hover:border-primary-500 hover:text-primary-400",
    danger:
      "bg-transparent text-danger-500 border border-danger-500/50 hover:bg-danger-500/10 hover:border-danger-500",
    ghost:
      "bg-transparent text-secondary-400 hover:text-primary-400 hover:bg-secondary-800/50 border border-transparent",
  };

  const sizes = {
    sm: "px-4 py-2 text-[10px]",
    md: "px-6 py-3 text-xs",
    lg: "px-8 py-4 text-sm",
  };

  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${
        props.className || ""
      }`}
    >
      {loading && <IconSpinner className="h-4 w-4" />}
      {children}
    </button>
  );
}