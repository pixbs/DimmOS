import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "seo_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"site_title" varchar DEFAULT 'Dimm''s OS' NOT NULL,
  	"site_description" varchar,
  	"default_og_image_id" integer,
  	"twitter_handle" varchar,
  	"canonical_base" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "windows" ADD COLUMN "meta_title" varchar;
  ALTER TABLE "windows" ADD COLUMN "meta_description" varchar;
  ALTER TABLE "windows" ADD COLUMN "meta_image_id" integer;
  ALTER TABLE "windows" ADD COLUMN "meta_no_index" boolean DEFAULT false;
  ALTER TABLE "articles" ADD COLUMN "meta_title" varchar;
  ALTER TABLE "articles" ADD COLUMN "meta_description" varchar;
  ALTER TABLE "articles" ADD COLUMN "meta_image_id" integer;
  ALTER TABLE "articles" ADD COLUMN "meta_no_index" boolean DEFAULT false;
  ALTER TABLE "seo_settings" ADD CONSTRAINT "seo_settings_default_og_image_id_media_id_fk" FOREIGN KEY ("default_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "seo_settings_default_og_image_idx" ON "seo_settings" USING btree ("default_og_image_id");
  ALTER TABLE "windows" ADD CONSTRAINT "windows_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "articles" ADD CONSTRAINT "articles_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "windows_meta_meta_image_idx" ON "windows" USING btree ("meta_image_id");
  CREATE INDEX "articles_meta_meta_image_idx" ON "articles" USING btree ("meta_image_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "seo_settings" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "seo_settings" CASCADE;
  ALTER TABLE "windows" DROP CONSTRAINT "windows_meta_image_id_media_id_fk";
  
  ALTER TABLE "articles" DROP CONSTRAINT "articles_meta_image_id_media_id_fk";
  
  DROP INDEX "windows_meta_meta_image_idx";
  DROP INDEX "articles_meta_meta_image_idx";
  ALTER TABLE "windows" DROP COLUMN "meta_title";
  ALTER TABLE "windows" DROP COLUMN "meta_description";
  ALTER TABLE "windows" DROP COLUMN "meta_image_id";
  ALTER TABLE "windows" DROP COLUMN "meta_no_index";
  ALTER TABLE "articles" DROP COLUMN "meta_title";
  ALTER TABLE "articles" DROP COLUMN "meta_description";
  ALTER TABLE "articles" DROP COLUMN "meta_image_id";
  ALTER TABLE "articles" DROP COLUMN "meta_no_index";`)
}
