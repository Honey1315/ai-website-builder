"use client";

import { signInWithGoogle } from "@/lib/auth-client";
import Link from "next/link";
import { Button } from "@/components/UI/Button";

export default function AuthErrorPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-secondary-900 border border-secondary-800 p-8 md:p-10 text-center shadow-2xl relative">
        <div className="text-[10px] font-mono text-danger-500 uppercase tracking-widest mb-3 flex items-center justify-center gap-2">
          <span className="w-1.5 h-1.5 bg-danger-500 block"></span>
          AUTH_FAILURE
        </div>
        <h1 className="text-2xl font-display text-white mb-3">
          Authentication Error
        </h1>
        <p className="text-secondary-400 text-sm font-light mb-8 leading-relaxed">
          An error occurred during Google authentication. You can retry connecting or return to the workspace.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="primary"
            onClick={() => signInWithGoogle('/')}
            className="w-full sm:w-auto"
          >
            Retry Google Sign In _
          </Button>
          <Link href="/" className="w-full sm:w-auto">
            <Button
              variant="secondary"
              className="w-full sm:w-auto"
            >
              Return Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}