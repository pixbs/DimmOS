import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "windows" ADD COLUMN "window_collapsible" boolean DEFAULT true;
  ALTER TABLE "windows" ADD COLUMN "window_expandable" boolean DEFAULT false;
  ALTER TABLE "windows" ADD COLUMN "window_resizable" boolean DEFAULT true;
  ALTER TABLE "articles" ADD COLUMN "window_collapsible" boolean DEFAULT true;
  ALTER TABLE "articles" ADD COLUMN "window_expandable" boolean DEFAULT false;
  ALTER TABLE "articles" ADD COLUMN "window_resizable" boolean DEFAULT true;
  ALTER TABLE "forms" ADD COLUMN "window_collapsible" boolean DEFAULT true;
  ALTER TABLE "forms" ADD COLUMN "window_expandable" boolean DEFAULT false;
  ALTER TABLE "forms" ADD COLUMN "window_resizable" boolean DEFAULT true;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "windows" DROP COLUMN "window_collapsible";
  ALTER TABLE "windows" DROP COLUMN "window_expandable";
  ALTER TABLE "windows" DROP COLUMN "window_resizable";
  ALTER TABLE "articles" DROP COLUMN "window_collapsible";
  ALTER TABLE "articles" DROP COLUMN "window_expandable";
  ALTER TABLE "articles" DROP COLUMN "window_resizable";
  ALTER TABLE "forms" DROP COLUMN "window_collapsible";
  ALTER TABLE "forms" DROP COLUMN "window_expandable";
  ALTER TABLE "forms" DROP COLUMN "window_resizable";`)
}
