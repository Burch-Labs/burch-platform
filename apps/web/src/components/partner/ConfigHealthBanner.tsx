"use client";

import { useEffect, useState } from "react";

interface ConfigIssue {
  key: string;
  message: string;
}

interface HealthResponse {
  status: "ok" | "degraded";
  config: {
    errors: ConfigIssue[];
    warnings: ConfigIssue[];
  };
}

export function ConfigHealthBanner() {
  const [issues, setIssues] = useState<{
    errors: ConfigIssue[];
    warnings: ConfigIssue[];
  } | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then((data: HealthResponse) => {
        const hasErrors = data.config.errors.length > 0;
        const hasWarnings = data.config.warnings.length > 0;
        if (hasErrors || hasWarnings) {
          setIssues(data.config);
        }
      })
      .catch(() => {
        // Silently ignore — if health check fails we don't want to break the dashboard
      });
  }, []);

  if (!issues || dismissed) return null;

  const hasErrors = issues.errors.length > 0;

  return (
    <div
      className={`mb-6 rounded-xl border px-5 py-4 ${
        hasErrors
          ? "bg-red-50 border-red-200"
          : "bg-amber-50 border-amber-200"
      }`}
      role="alert"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <span className="text-lg flex-shrink-0">{hasErrors ? "🔴" : "⚠️"}</span>
          <div className="min-w-0">
            <p
              className={`text-sm font-semibold ${
                hasErrors ? "text-red-800" : "text-amber-800"
              }`}
            >
              {hasErrors
                ? "Critical configuration errors detected"
                : "Configuration warnings"}
            </p>
            <p
              className={`text-xs mt-0.5 mb-3 ${
                hasErrors ? "text-red-600" : "text-amber-600"
              }`}
            >
              {hasErrors
                ? "Some features may be broken until these are resolved."
                : "Review these before going live."}
            </p>

            {issues.errors.length > 0 && (
              <ul className="space-y-2 mb-3">
                {issues.errors.map((issue) => (
                  <li key={issue.key} className="text-xs">
                    <span className="font-mono font-semibold text-red-700 bg-red-100 px-1.5 py-0.5 rounded">
                      {issue.key}
                    </span>
                    <span className="text-red-700 ml-2">{issue.message}</span>
                  </li>
                ))}
              </ul>
            )}

            {issues.warnings.length > 0 && (
              <ul className="space-y-2">
                {issues.warnings.map((issue) => (
                  <li key={issue.key} className="text-xs">
                    <span className="font-mono font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                      {issue.key}
                    </span>
                    <span className="text-amber-700 ml-2">{issue.message}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <button
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className={`flex-shrink-0 text-lg leading-none hover:opacity-70 transition ${
            hasErrors ? "text-red-400" : "text-amber-400"
          }`}
        >
          ×
        </button>
      </div>
    </div>
  );
}
