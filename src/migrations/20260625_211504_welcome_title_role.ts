import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "windows_blocks_section_title" ADD COLUMN "role" varchar;
  ALTER TABLE "articles_blocks_section_title" ADD COLUMN "role" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "windows_blocks_section_title" DROP COLUMN "role";
  ALTER TABLE "articles_blocks_section_title" DROP COLUMN "role";`)
}
