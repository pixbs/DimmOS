import 'dotenv/config'
import { seedCaseStudy } from '../../tests/helpers/seedContent.js'

// Seed a full case study exercising every section block + a Works list, for
// hand QA. Pass a slug as the first arg, otherwise defaults to "case-study-demo".
const slug = process.argv[2] ?? 'case-study-demo'
const doc = await seedCaseStudy(slug)
console.log(`Seeded case study at /${doc.slug} (open it on the running dev server).`)
process.exit(0)
