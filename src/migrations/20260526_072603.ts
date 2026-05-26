import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_articles_type" AS ENUM('case-study', 'service');
  CREATE TABLE "windows_blocks_rich_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"content" jsonb,
  	"block_name" varchar
  );
  
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
  
  CREATE TABLE "articles_blocks_rich_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"content" jsonb,
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
  
  CREATE TABLE "articles" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"type" "enum_articles_type" NOT NULL,
  	"slug" varchar NOT NULL,
  	"show_shortcut" boolean DEFAULT false,
  	"shortcut_name" varchar,
  	"shortcut_icon" varchar DEFAULT 'ri-folder-fill',
  	"shortcut_order" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "works" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "works" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_works_fk";
  
  DROP INDEX "payload_locked_documents_rels_works_id_idx";
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "articles_id" integer;
  ALTER TABLE "windows_blocks_rich_text" ADD CONSTRAINT "windows_blocks_rich_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."windows"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "windows_blocks_image" ADD CONSTRAINT "windows_blocks_image_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "windows_blocks_image" ADD CONSTRAINT "windows_blocks_image_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."windows"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "windows_blocks_gallery_images" ADD CONSTRAINT "windows_blocks_gallery_images_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "windows_blocks_gallery_images" ADD CONSTRAINT "windows_blocks_gallery_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."windows_blocks_gallery"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "windows_blocks_gallery" ADD CONSTRAINT "windows_blocks_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."windows"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "windows_blocks_embed" ADD CONSTRAINT "windows_blocks_embed_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."windows"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "windows_blocks_cta" ADD CONSTRAINT "windows_blocks_cta_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."windows"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles_blocks_rich_text" ADD CONSTRAINT "articles_blocks_rich_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles_blocks_image" ADD CONSTRAINT "articles_blocks_image_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "articles_blocks_image" ADD CONSTRAINT "articles_blocks_image_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles_blocks_gallery_images" ADD CONSTRAINT "articles_blocks_gallery_images_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "articles_blocks_gallery_images" ADD CONSTRAINT "articles_blocks_gallery_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."articles_blocks_gallery"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles_blocks_gallery" ADD CONSTRAINT "articles_blocks_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles_blocks_embed" ADD CONSTRAINT "articles_blocks_embed_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles_blocks_cta" ADD CONSTRAINT "articles_blocks_cta_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "windows_blocks_rich_text_order_idx" ON "windows_blocks_rich_text" USING btree ("_order");
  CREATE INDEX "windows_blocks_rich_text_parent_id_idx" ON "windows_blocks_rich_text" USING btree ("_parent_id");
  CREATE INDEX "windows_blocks_rich_text_path_idx" ON "windows_blocks_rich_text" USING btree ("_path");
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
  CREATE INDEX "articles_blocks_rich_text_order_idx" ON "articles_blocks_rich_text" USING btree ("_order");
  CREATE INDEX "articles_blocks_rich_text_parent_id_idx" ON "articles_blocks_rich_text" USING btree ("_parent_id");
  CREATE INDEX "articles_blocks_rich_text_path_idx" ON "articles_blocks_rich_text" USING btree ("_path");
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
  CREATE INDEX "articles_type_idx" ON "articles" USING btree ("type");
  CREATE UNIQUE INDEX "articles_slug_idx" ON "articles" USING btree ("slug");
  CREATE INDEX "articles_updated_at_idx" ON "articles" USING btree ("updated_at");
  CREATE INDEX "articles_created_at_idx" ON "articles" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_articles_fk" FOREIGN KEY ("articles_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_articles_id_idx" ON "payload_locked_documents_rels" USING btree ("articles_id");
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "works_id";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "works" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"show_shortcut" boolean DEFAULT false,
  	"shortcut_name" varchar,
  	"shortcut_icon" varchar DEFAULT 'ri-folder-fill',
  	"shortcut_order" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "windows_blocks_rich_text" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "windows_blocks_image" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "windows_blocks_gallery_images" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "windows_blocks_gallery" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "windows_blocks_embed" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "windows_blocks_cta" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "articles_blocks_rich_text" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "articles_blocks_image" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "articles_blocks_gallery_images" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "articles_blocks_gallery" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "articles_blocks_embed" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "articles_blocks_cta" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "articles" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "windows_blocks_rich_text" CASCADE;
  DROP TABLE "windows_blocks_image" CASCADE;
  DROP TABLE "windows_blocks_gallery_images" CASCADE;
  DROP TABLE "windows_blocks_gallery" CASCADE;
  DROP TABLE "windows_blocks_embed" CASCADE;
  DROP TABLE "windows_blocks_cta" CASCADE;
  DROP TABLE "articles_blocks_rich_text" CASCADE;
  DROP TABLE "articles_blocks_image" CASCADE;
  DROP TABLE "articles_blocks_gallery_images" CASCADE;
  DROP TABLE "articles_blocks_gallery" CASCADE;
  DROP TABLE "articles_blocks_embed" CASCADE;
  DROP TABLE "articles_blocks_cta" CASCADE;
  DROP TABLE "articles" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_articles_fk";
  
  DROP INDEX "payload_locked_documents_rels_articles_id_idx";
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "works_id" integer;
  CREATE UNIQUE INDEX "works_slug_idx" ON "works" USING btree ("slug");
  CREATE INDEX "works_updated_at_idx" ON "works" USING btree ("updated_at");
  CREATE INDEX "works_created_at_idx" ON "works" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_works_fk" FOREIGN KEY ("works_id") REFERENCES "public"."works"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_works_id_idx" ON "payload_locked_documents_rels" USING btree ("works_id");
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "articles_id";
  DROP TYPE "public"."enum_articles_type";`)
}
