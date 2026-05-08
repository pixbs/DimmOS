import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "windows" ADD COLUMN "slug" varchar;
  ALTER TABLE "works" ADD COLUMN "slug" varchar;
  CREATE INDEX "windows_slug_idx" ON "windows" USING btree ("slug");
  CREATE INDEX "works_slug_idx" ON "works" USING btree ("slug");
  ALTER TABLE "forms_blocks_email" DROP COLUMN "pre_defined_value";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "windows_slug_idx";
  DROP INDEX "works_slug_idx";
  ALTER TABLE "forms_blocks_email" ADD COLUMN "pre_defined_value" varchar;
  ALTER TABLE "windows" DROP COLUMN "slug";
  ALTER TABLE "works" DROP COLUMN "slug";`)
}
