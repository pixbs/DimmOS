import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_media_seo_generated_meta_image_source_collection" AS ENUM('windows', 'articles');
  ALTER TABLE "media" ADD COLUMN "seo_generated_meta_image_source_collection" "enum_media_seo_generated_meta_image_source_collection";
  ALTER TABLE "media" ADD COLUMN "seo_generated_meta_image_source_document_id" varchar;
  ALTER TABLE "media" ADD COLUMN "seo_generated_meta_image_content_signature" varchar;
  ALTER TABLE "media" ADD COLUMN "seo_generated_meta_image_generated_at" timestamp(3) with time zone;
  CREATE INDEX "media_seo_generated_meta_image_seo_generated_meta_image__idx" ON "media" USING btree ("seo_generated_meta_image_source_collection");
  CREATE INDEX "media_seo_generated_meta_image_seo_generated_meta_imag_1_idx" ON "media" USING btree ("seo_generated_meta_image_source_document_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "media_seo_generated_meta_image_seo_generated_meta_image__idx";
  DROP INDEX "media_seo_generated_meta_image_seo_generated_meta_imag_1_idx";
  ALTER TABLE "media" DROP COLUMN "seo_generated_meta_image_source_collection";
  ALTER TABLE "media" DROP COLUMN "seo_generated_meta_image_source_document_id";
  ALTER TABLE "media" DROP COLUMN "seo_generated_meta_image_content_signature";
  ALTER TABLE "media" DROP COLUMN "seo_generated_meta_image_generated_at";
  DROP TYPE "public"."enum_media_seo_generated_meta_image_source_collection";`)
}
