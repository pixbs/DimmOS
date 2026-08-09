import 'dotenv/config'
import { seedCookieServices } from './seed-cookie-services.js'

await seedCookieServices()
console.log('Cookie services seeded from manifest.')
