export default function AuthErrorPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Something went wrong
        </h1>
        <p className="text-gray-600 mb-6">
          We encountered an error during the authentication process.
        </p>
        <div className="space-x-3">
          <a
            href="/auth/login"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Sign in
          </a>
          <a
            href="/"
            className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Go Home
          </a>
        </div>
      </div>
    </div>
  );
}