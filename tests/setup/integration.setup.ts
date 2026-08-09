import { afterEach, beforeAll, vi } from 'vitest'

import { cleanupPayloadFixtures, getTestPayload } from '../fixtures/payload'

beforeAll(async () => {
  if (process.env.DIMMOS_TEST_RUN !== 'true') {
    throw new Error('Integration tests require the disposable test stack')
  }
  await getTestPayload()
})

afterEach(async () => {
  await cleanupPayloadFixtures()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})
