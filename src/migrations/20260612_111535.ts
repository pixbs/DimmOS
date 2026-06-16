import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_windows_window_default_view" AS ENUM('grid', 'table');
  CREATE TYPE "public"."enum_articles_window_default_view" AS ENUM('grid', 'table');
  CREATE TYPE "public"."enum_forms_window_default_view" AS ENUM('grid', 'table');
  ALTER TABLE "windows" ADD COLUMN "window_display_search" boolean DEFAULT false;
  ALTER TABLE "windows" ADD COLUMN "window_display_view_toggle" boolean DEFAULT false;
  ALTER TABLE "windows" ADD COLUMN "window_default_view" "enum_windows_window_default_view" DEFAULT 'grid';
  ALTER TABLE "windows" ADD COLUMN "window_display_history" boolean DEFAULT false;
  ALTER TABLE "articles" ADD COLUMN "window_display_search" boolean DEFAULT false;
  ALTER TABLE "articles" ADD COLUMN "window_display_view_toggle" boolean DEFAULT false;
  ALTER TABLE "articles" ADD COLUMN "window_default_view" "enum_articles_window_default_view" DEFAULT 'grid';
  ALTER TABLE "articles" ADD COLUMN "window_display_history" boolean DEFAULT false;
  ALTER TABLE "forms" ADD COLUMN "window_display_search" boolean DEFAULT false;
  ALTER TABLE "forms" ADD COLUMN "window_display_view_toggle" boolean DEFAULT false;
  ALTER TABLE "forms" ADD COLUMN "window_default_view" "enum_forms_window_default_view" DEFAULT 'grid';
  ALTER TABLE "forms" ADD COLUMN "window_display_history" boolean DEFAULT false;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "windows" DROP COLUMN "window_display_search";
  ALTER TABLE "windows" DROP COLUMN "window_display_view_toggle";
  ALTER TABLE "windows" DROP COLUMN "window_default_view";
  ALTER TABLE "windows" DROP COLUMN "window_display_history";
  ALTER TABLE "articles" DROP COLUMN "window_display_search";
  ALTER TABLE "articles" DROP COLUMN "window_display_view_toggle";
  ALTER TABLE "articles" DROP COLUMN "window_default_view";
  ALTER TABLE "articles" DROP COLUMN "window_display_history";
  ALTER TABLE "forms" DROP COLUMN "window_display_search";
  ALTER TABLE "forms" DROP COLUMN "window_display_view_toggle";
  ALTER TABLE "forms" DROP COLUMN "window_default_view";
  ALTER TABLE "forms" DROP COLUMN "window_display_history";
  DROP TYPE "public"."enum_windows_window_default_view";
  DROP TYPE "public"."enum_articles_window_default_view";
  DROP TYPE "public"."enum_forms_window_default_view";`)
}
