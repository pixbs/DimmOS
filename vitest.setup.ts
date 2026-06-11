// Any setup scripts you might need go here

// Load .env files
import 'dotenv/config'

// Drizzle's hanji spinner writes each frame as a new line in non-TTY environments.
// Intercept stdout to drop the intermediate frames; only the final [✓] line passes through.
const DRIZZLE_SPINNER_RE = /\[[⣷⣯⣟⡿⢿⣻⣽⣾]\]/u
const _stdoutWrite = process.stdout.write.bind(process.stdout)
// @ts-ignore — overriding write to filter spinner noise
process.stdout.write = (...args: Parameters<typeof process.stdout.write>): boolean => {
  const chunk = args[0]
  const str = typeof chunk === 'string' ? chunk : Buffer.from(chunk as Uint8Array).toString('utf8')
  if (DRIZZLE_SPINNER_RE.test(str)) {
    const cb = typeof args[1] === 'function' ? args[1] : typeof args[2] === 'function' ? args[2] : undefined
    cb?.()
    return true
  }
  return _stdoutWrite(...args)
}
