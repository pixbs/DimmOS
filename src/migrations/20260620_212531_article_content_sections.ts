import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "windows_blocks_summary" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"left_title" varchar,
  	"left_body" varchar,
  	"right_title" varchar,
  	"right_body" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "windows_blocks_stats_stats" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar NOT NULL,
  	"label" varchar NOT NULL
  );
  
  CREATE TABLE "windows_blocks_stats" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "windows_blocks_image_section" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "windows_blocks_description" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"body" jsonb,
  	"block_name" varchar
  );
  
  CREATE TABLE "windows_blocks_section_title" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"description" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "articles_blocks_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"description" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "articles_blocks_summary" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"left_title" varchar,
  	"left_body" varchar,
  	"right_title" varchar,
  	"right_body" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "articles_blocks_stats_stats" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar NOT NULL,
  	"label" varchar NOT NULL
  );
  
  CREATE TABLE "articles_blocks_stats" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "articles_blocks_image_section" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "articles_blocks_description" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"body" jsonb,
  	"block_name" varchar
  );
  
  CREATE TABLE "articles_blocks_section_title" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"description" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "articles_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"tags_id" integer
  );
  
  CREATE TABLE "tags" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "windows_blocks_image" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "windows_blocks_gallery_images" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "windows_blocks_gallery" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "windows_blocks_embed" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "windows_blocks_cta" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "articles_blocks_image" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "articles_blocks_gallery_images" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "articles_blocks_gallery" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "articles_blocks_embed" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "articles_blocks_cta" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "windows_blocks_image" CASCADE;
  DROP TABLE "windows_blocks_gallery_images" CASCADE;
  DROP TABLE "windows_blocks_gallery" CASCADE;
  DROP TABLE "windows_blocks_embed" CASCADE;
  DROP TABLE "windows_blocks_cta" CASCADE;
  DROP TABLE "articles_blocks_image" CASCADE;
  DROP TABLE "articles_blocks_gallery_images" CASCADE;
  DROP TABLE "articles_blocks_gallery" CASCADE;
  DROP TABLE "articles_blocks_embed" CASCADE;
  DROP TABLE "articles_blocks_cta" CASCADE;
  ALTER TABLE "articles" ADD COLUMN "year" numeric;
  ALTER TABLE "articles" ADD COLUMN "bg_image_id" integer;
  ALTER TABLE "articles" ADD COLUMN "fg_image_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "tags_id" integer;
  ALTER TABLE "windows_blocks_summary" ADD CONSTRAINT "windows_blocks_summary_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."windows"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "windows_blocks_stats_stats" ADD CONSTRAINT "windows_blocks_stats_stats_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."windows_blocks_stats"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "windows_blocks_stats" ADD CONSTRAINT "windows_blocks_stats_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."windows"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "windows_blocks_image_section" ADD CONSTRAINT "windows_blocks_image_section_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "windows_blocks_image_section" ADD CONSTRAINT "windows_blocks_image_section_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."windows"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "windows_blocks_description" ADD CONSTRAINT "windows_blocks_description_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."windows"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "windows_blocks_section_title" ADD CONSTRAINT "windows_blocks_section_title_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."windows"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles_blocks_hero" ADD CONSTRAINT "articles_blocks_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles_blocks_summary" ADD CONSTRAINT "articles_blocks_summary_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles_blocks_stats_stats" ADD CONSTRAINT "articles_blocks_stats_stats_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."articles_blocks_stats"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles_blocks_stats" ADD CONSTRAINT "articles_blocks_stats_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles_blocks_image_section" ADD CONSTRAINT "articles_blocks_image_section_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "articles_blocks_image_section" ADD CONSTRAINT "articles_blocks_image_section_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles_blocks_description" ADD CONSTRAINT "articles_blocks_description_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles_blocks_section_title" ADD CONSTRAINT "articles_blocks_section_title_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles_rels" ADD CONSTRAINT "articles_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles_rels" ADD CONSTRAINT "articles_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "windows_blocks_summary_order_idx" ON "windows_blocks_summary" USING btree ("_order");
  CREATE INDEX "windows_blocks_summary_parent_id_idx" ON "windows_blocks_summary" USING btree ("_parent_id");
  CREATE INDEX "windows_blocks_summary_path_idx" ON "windows_blocks_summary" USING btree ("_path");
  CREATE INDEX "windows_blocks_stats_stats_order_idx" ON "windows_blocks_stats_stats" USING btree ("_order");
  CREATE INDEX "windows_blocks_stats_stats_parent_id_idx" ON "windows_blocks_stats_stats" USING btree ("_parent_id");
  CREATE INDEX "windows_blocks_stats_order_idx" ON "windows_blocks_stats" USING btree ("_order");
  CREATE INDEX "windows_blocks_stats_parent_id_idx" ON "windows_blocks_stats" USING btree ("_parent_id");
  CREATE INDEX "windows_blocks_stats_path_idx" ON "windows_blocks_stats" USING btree ("_path");
  CREATE INDEX "windows_blocks_image_section_order_idx" ON "windows_blocks_image_section" USING btree ("_order");
  CREATE INDEX "windows_blocks_image_section_parent_id_idx" ON "windows_blocks_image_section" USING btree ("_parent_id");
  CREATE INDEX "windows_blocks_image_section_path_idx" ON "windows_blocks_image_section" USING btree ("_path");
  CREATE INDEX "windows_blocks_image_section_image_idx" ON "windows_blocks_image_section" USING btree ("image_id");
  CREATE INDEX "windows_blocks_description_order_idx" ON "windows_blocks_description" USING btree ("_order");
  CREATE INDEX "windows_blocks_description_parent_id_idx" ON "windows_blocks_description" USING btree ("_parent_id");
  CREATE INDEX "windows_blocks_description_path_idx" ON "windows_blocks_description" USING btree ("_path");
  CREATE INDEX "windows_blocks_section_title_order_idx" ON "windows_blocks_section_title" USING btree ("_order");
  CREATE INDEX "windows_blocks_section_title_parent_id_idx" ON "windows_blocks_section_title" USING btree ("_parent_id");
  CREATE INDEX "windows_blocks_section_title_path_idx" ON "windows_blocks_section_title" USING btree ("_path");
  CREATE INDEX "articles_blocks_hero_order_idx" ON "articles_blocks_hero" USING btree ("_order");
  CREATE INDEX "articles_blocks_hero_parent_id_idx" ON "articles_blocks_hero" USING btree ("_parent_id");
  CREATE INDEX "articles_blocks_hero_path_idx" ON "articles_blocks_hero" USING btree ("_path");
  CREATE INDEX "articles_blocks_summary_order_idx" ON "articles_blocks_summary" USING btree ("_order");
  CREATE INDEX "articles_blocks_summary_parent_id_idx" ON "articles_blocks_summary" USING btree ("_parent_id");
  CREATE INDEX "articles_blocks_summary_path_idx" ON "articles_blocks_summary" USING btree ("_path");
  CREATE INDEX "articles_blocks_stats_stats_order_idx" ON "articles_blocks_stats_stats" USING btree ("_order");
  CREATE INDEX "articles_blocks_stats_stats_parent_id_idx" ON "articles_blocks_stats_stats" USING btree ("_parent_id");
  CREATE INDEX "articles_blocks_stats_order_idx" ON "articles_blocks_stats" USING btree ("_order");
  CREATE INDEX "articles_blocks_stats_parent_id_idx" ON "articles_blocks_stats" USING btree ("_parent_id");
  CREATE INDEX "articles_blocks_stats_path_idx" ON "articles_blocks_stats" USING btree ("_path");
  CREATE INDEX "articles_blocks_image_section_order_idx" ON "articles_blocks_image_section" USING btree ("_order");
  CREATE INDEX "articles_blocks_image_section_parent_id_idx" ON "articles_blocks_image_section" USING btree ("_parent_id");
  CREATE INDEX "articles_blocks_image_section_path_idx" ON "articles_blocks_image_section" USING btree ("_path");
  CREATE INDEX "articles_blocks_image_section_image_idx" ON "articles_blocks_image_section" USING btree ("image_id");
  CREATE INDEX "articles_blocks_description_order_idx" ON "articles_blocks_description" USING btree ("_order");
  CREATE INDEX "articles_blocks_description_parent_id_idx" ON "articles_blocks_description" USING btree ("_parent_id");
  CREATE INDEX "articles_blocks_description_path_idx" ON "articles_blocks_description" USING btree ("_path");
  CREATE INDEX "articles_blocks_section_title_order_idx" ON "articles_blocks_section_title" USING btree ("_order");
  CREATE INDEX "articles_blocks_section_title_parent_id_idx" ON "articles_blocks_section_title" USING btree ("_parent_id");
  CREATE INDEX "articles_blocks_section_title_path_idx" ON "articles_blocks_section_title" USING btree ("_path");
  CREATE INDEX "articles_rels_order_idx" ON "articles_rels" USING btree ("order");
  CREATE INDEX "articles_rels_parent_idx" ON "articles_rels" USING btree ("parent_id");
  CREATE INDEX "articles_rels_path_idx" ON "articles_rels" USING btree ("path");
  CREATE INDEX "articles_rels_tags_id_idx" ON "articles_rels" USING btree ("tags_id");
  CREATE UNIQUE INDEX "tags_slug_idx" ON "tags" USING btree ("slug");
  CREATE INDEX "tags_updated_at_idx" ON "tags" USING btree ("updated_at");
  CREATE INDEX "tags_created_at_idx" ON "tags" USING btree ("created_at");
  ALTER TABLE "articles" ADD CONSTRAINT "articles_bg_image_id_media_id_fk" FOREIGN KEY ("bg_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "articles" ADD CONSTRAINT "articles_fg_image_id_media_id_fk" FOREIGN KEY ("fg_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "articles_bg_image_idx" ON "articles" USING btree ("bg_image_id");
  CREATE INDEX "articles_fg_image_idx" ON "articles" USING btree ("fg_image_id");
  CREATE INDEX "payload_locked_documents_rels_tags_id_idx" ON "payload_locked_documents_rels" USING btree ("tags_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "windows_blocks_image" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "windows_blocks_gallery_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer
  );
  
  CREATE TABLE "windows_blocks_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "windows_blocks_embed" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"url" varchar NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "windows_blocks_cta" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar NOT NULL,
  	"body" varchar,
  	"link_label" varchar,
  	"link_href" varchar,
  	"link_open_in_new_tab" boolean DEFAULT false,
  	"block_name" varchar
  );
  
  CREATE TABLE "articles_blocks_image" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "articles_blocks_gallery_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer
  );
  
  CREATE TABLE "articles_blocks_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "articles_blocks_embed" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"url" varchar NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "articles_blocks_cta" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar NOT NULL,
  	"body" varchar,
  	"link_label" varchar,
  	"link_href" varchar,
  	"link_open_in_new_tab" boolean DEFAULT false,
  	"block_name" varchar
  );
  
  ALTER TABLE "windows_blocks_summary" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "windows_blocks_stats_stats" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "windows_blocks_stats" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "windows_blocks_image_section" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "windows_blocks_description" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "windows_blocks_section_title" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "articles_blocks_hero" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "articles_blocks_summary" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "articles_blocks_stats_stats" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "articles_blocks_stats" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "articles_blocks_image_section" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "articles_blocks_description" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "articles_blocks_section_title" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "articles_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "tags" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "windows_blocks_summary" CASCADE;
  DROP TABLE "windows_blocks_stats_stats" CASCADE;
  DROP TABLE "windows_blocks_stats" CASCADE;
  DROP TABLE "windows_blocks_image_section" CASCADE;
  DROP TABLE "windows_blocks_description" CASCADE;
  DROP TABLE "windows_blocks_section_title" CASCADE;
  DROP TABLE "articles_blocks_hero" CASCADE;
  DROP TABLE "articles_blocks_summary" CASCADE;
  DROP TABLE "articles_blocks_stats_stats" CASCADE;
  DROP TABLE "articles_blocks_stats" CASCADE;
  DROP TABLE "articles_blocks_image_section" CASCADE;
  DROP TABLE "articles_blocks_description" CASCADE;
  DROP TABLE "articles_blocks_section_title" CASCADE;
  DROP TABLE "articles_rels" CASCADE;
  DROP TABLE "tags" CASCADE;
  ALTER TABLE "articles" DROP CONSTRAINT "articles_bg_image_id_media_id_fk";
  
  ALTER TABLE "articles" DROP CONSTRAINT "articles_fg_image_id_media_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_tags_fk";
  
  DROP INDEX "articles_bg_image_idx";
  DROP INDEX "articles_fg_image_idx";
  DROP INDEX "payload_locked_documents_rels_tags_id_idx";
  ALTER TABLE "windows_blocks_image" ADD CONSTRAINT "windows_blocks_image_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "windows_blocks_image" ADD CONSTRAINT "windows_blocks_image_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."windows"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "windows_blocks_gallery_images" ADD CONSTRAINT "windows_blocks_gallery_images_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "windows_blocks_gallery_images" ADD CONSTRAINT "windows_blocks_gallery_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."windows_blocks_gallery"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "windows_blocks_gallery" ADD CONSTRAINT "windows_blocks_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."windows"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "windows_blocks_embed" ADD CONSTRAINT "windows_blocks_embed_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."windows"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "windows_blocks_cta" ADD CONSTRAINT "windows_blocks_cta_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."windows"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles_blocks_image" ADD CONSTRAINT "articles_blocks_image_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "articles_blocks_image" ADD CONSTRAINT "articles_blocks_image_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles_blocks_gallery_images" ADD CONSTRAINT "articles_blocks_gallery_images_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "articles_blocks_gallery_images" ADD CONSTRAINT "articles_blocks_gallery_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."articles_blocks_gallery"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles_blocks_gallery" ADD CONSTRAINT "articles_blocks_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles_blocks_embed" ADD CONSTRAINT "articles_blocks_embed_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles_blocks_cta" ADD CONSTRAINT "articles_blocks_cta_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "windows_blocks_image_order_idx" ON "windows_blocks_image" USING btree ("_order");
  CREATE INDEX "windows_blocks_image_parent_id_idx" ON "windows_blocks_image" USING btree ("_parent_id");
  CREATE INDEX "windows_blocks_image_path_idx" ON "windows_blocks_image" USING btree ("_path");
  CREATE INDEX "windows_blocks_image_image_idx" ON "windows_blocks_image" USING btree ("image_id");
  CREATE INDEX "windows_blocks_gallery_images_order_idx" ON "windows_blocks_gallery_images" USING btree ("_order");
  CREATE INDEX "windows_blocks_gallery_images_parent_id_idx" ON "windows_blocks_gallery_images" USING btree ("_parent_id");
  CREATE INDEX "windows_blocks_gallery_images_image_idx" ON "windows_blocks_gallery_images" USING btree ("image_id");
  CREATE INDEX "windows_blocks_gallery_order_idx" ON "windows_blocks_gallery" USING btree ("_order");
  CREATE INDEX "windows_blocks_gallery_parent_id_idx" ON "windows_blocks_gallery" USING btree ("_parent_id");
  CREATE INDEX "windows_blocks_gallery_path_idx" ON "windows_blocks_gallery" USING btree ("_path");
  CREATE INDEX "windows_blocks_embed_order_idx" ON "windows_blocks_embed" USING btree ("_order");
  CREATE INDEX "windows_blocks_embed_parent_id_idx" ON "windows_blocks_embed" USING btree ("_parent_id");
  CREATE INDEX "windows_blocks_embed_path_idx" ON "windows_blocks_embed" USING btree ("_path");
  CREATE INDEX "windows_blocks_cta_order_idx" ON "windows_blocks_cta" USING btree ("_order");
  CREATE INDEX "windows_blocks_cta_parent_id_idx" ON "windows_blocks_cta" USING btree ("_parent_id");
  CREATE INDEX "windows_blocks_cta_path_idx" ON "windows_blocks_cta" USING btree ("_path");
  CREATE INDEX "articles_blocks_image_order_idx" ON "articles_blocks_image" USING btree ("_order");
  CREATE INDEX "articles_blocks_image_parent_id_idx" ON "articles_blocks_image" USING btree ("_parent_id");
  CREATE INDEX "articles_blocks_image_path_idx" ON "articles_blocks_image" USING btree ("_path");
  CREATE INDEX "articles_blocks_image_image_idx" ON "articles_blocks_image" USING btree ("image_id");
  CREATE INDEX "articles_blocks_gallery_images_order_idx" ON "articles_blocks_gallery_images" USING btree ("_order");
  CREATE INDEX "articles_blocks_gallery_images_parent_id_idx" ON "articles_blocks_gallery_images" USING btree ("_parent_id");
  CREATE INDEX "articles_blocks_gallery_images_image_idx" ON "articles_blocks_gallery_images" USING btree ("image_id");
  CREATE INDEX "articles_blocks_gallery_order_idx" ON "articles_blocks_gallery" USING btree ("_order");
  CREATE INDEX "articles_blocks_gallery_parent_id_idx" ON "articles_blocks_gallery" USING btree ("_parent_id");
  CREATE INDEX "articles_blocks_gallery_path_idx" ON "articles_blocks_gallery" USING btree ("_path");
  CREATE INDEX "articles_blocks_embed_order_idx" ON "articles_blocks_embed" USING btree ("_order");
  CREATE INDEX "articles_blocks_embed_parent_id_idx" ON "articles_blocks_embed" USING btree ("_parent_id");
  CREATE INDEX "articles_blocks_embed_path_idx" ON "articles_blocks_embed" USING btree ("_path");
  CREATE INDEX "articles_blocks_cta_order_idx" ON "articles_blocks_cta" USING btree ("_order");
  CREATE INDEX "articles_blocks_cta_parent_id_idx" ON "articles_blocks_cta" USING btree ("_parent_id");
  CREATE INDEX "articles_blocks_cta_path_idx" ON "articles_blocks_cta" USING btree ("_path");
  ALTER TABLE "articles" DROP COLUMN "year";
  ALTER TABLE "articles" DROP COLUMN "bg_image_id";
  ALTER TABLE "articles" DROP COLUMN "fg_image_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "tags_id";`)
}
