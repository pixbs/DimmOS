import { readFile } from 'node:fs/promises'

const minimum = {
  branches: 60,
  functions: 70,
  lines: 70,
  statements: 70,
}

function percentage(covered, total) {
  return total === 0 ? 100 : (covered / total) * 100
}

function coveredValues(values) {
  return values.filter((value) => value > 0).length
}

const report = JSON.parse(
  await readFile(new URL('../../artifacts/coverage/coverage-final.json', import.meta.url), 'utf8'),
)
const failures = []

for (const [file, coverage] of Object.entries(report)) {
  const statements = Object.values(coverage.s)
  const functions = Object.values(coverage.f)
  const branches = Object.values(coverage.b).flat()
  const lineCounts = {}
  for (const [statementId, count] of Object.entries(coverage.s)) {
    const line = coverage.statementMap[statementId].start.line
    lineCounts[line] = Math.max(lineCounts[line] ?? 0, count)
  }
  const lines = Object.values(lineCounts)
  const actual = {
    branches: percentage(coveredValues(branches), branches.length),
    functions: percentage(coveredValues(functions), functions.length),
    lines: percentage(coveredValues(lines), lines.length),
    statements: percentage(coveredValues(statements), statements.length),
  }

  for (const [metric, floor] of Object.entries(minimum)) {
    if (actual[metric] < floor) {
      failures.push(`${file}: ${metric} ${actual[metric].toFixed(2)}% < ${floor}%`)
    }
  }
}

if (failures.length) {
  throw new Error(`Per-file coverage floors failed:\n${failures.join('\n')}`)
}

console.log('Per-file coverage floors passed: 70% lines/statements/functions, 60% branches')
