// M4: ✅ Structured error logger — wraps console.error and adds structured metadata
export function logError(context: string, error: unknown, meta?: Record<string, unknown>) {
  const timestamp = new Date().toISOString()
  const message = error instanceof Error ? error.message : String(error)
  const stack = error instanceof Error ? error.stack : undefined

  const entry = {
    timestamp,
    context,
    message,
    stack,
    ...meta,
  }

  console.error(JSON.stringify(entry, null, 0))
  // ponytail: M4 — For production, pipe this to Sentry, Datadog, or pino. The JSON format is compatible with most log aggregators.
}

// Convenience wrapper for API route catch blocks
export function apiErrorResponse(context: string, error: unknown, meta?: Record<string, unknown>) {
  logError(context, error, meta)
  return new Response(JSON.stringify({
    success: false,
    error: 'Terjadi kesalahan internal server',
  }), {
    status: 500,
    headers: { 'Content-Type': 'application/json' },
  })
}
