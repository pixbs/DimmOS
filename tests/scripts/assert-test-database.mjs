import pg from 'pg'

const { Client } = pg
const rawUrl = process.env.DATABASE_URL

if (process.env.DIMMOS_TEST_RUN !== 'true') {
  throw new Error('Refusing to run: DIMMOS_TEST_RUN must equal "true".')
}

if (!rawUrl) {
  throw new Error('Refusing to run: DATABASE_URL is not set.')
}

const databaseUrl = new URL(rawUrl)
const allowedHosts = new Set(['postgres', '127.0.0.1', 'localhost'])
const databaseName = databaseUrl.pathname.slice(1)

if (!allowedHosts.has(databaseUrl.hostname)) {
  throw new Error(`Refusing non-local database host: ${databaseUrl.hostname}`)
}

if (!/(?:^|_)test(?:_|$)/.test(databaseName)) {
  throw new Error(`Refusing database without a test name: ${databaseName}`)
}

const client = new Client({ connectionString: rawUrl })
await client.connect()

try {
  const result = await client.query('select current_database() as name')
  if (result.rows[0]?.name !== databaseName) {
    throw new Error(`Connected database mismatch: expected ${databaseName}`)
  }
  console.log(`Database safety check passed: ${databaseUrl.hostname}/${databaseName}`)
} finally {
  await client.end()
}
