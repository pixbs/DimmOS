import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_windows_blocks_article_list_types" AS ENUM('case-study', 'service');
  CREATE TYPE "public"."enum_windows_blocks_article_list_sort_field" AS ENUM('createdAt', 'updatedAt', 'title', 'shortcutOrder');
  CREATE TYPE "public"."enum_windows_blocks_article_list_sort_direction" AS ENUM('desc', 'asc');
  CREATE TYPE "public"."enum_articles_blocks_article_list_types" AS ENUM('case-study', 'service');
  CREATE TYPE "public"."enum_articles_blocks_article_list_sort_field" AS ENUM('createdAt', 'updatedAt', 'title', 'shortcutOrder');
  CREATE TYPE "public"."enum_articles_blocks_article_list_sort_direction" AS ENUM('desc', 'asc');
  CREATE TABLE "windows_blocks_article_list_types" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "enum_windows_blocks_article_list_types",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "windows_blocks_article_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"sort_field" "enum_windows_blocks_article_list_sort_field" DEFAULT 'createdAt',
  	"sort_direction" "enum_windows_blocks_article_list_sort_direction" DEFAULT 'desc',
  	"limit" numeric DEFAULT 6,
  	"block_name" varchar
  );
  
  CREATE TABLE "articles_blocks_article_list_types" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "enum_articles_blocks_article_list_types",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "articles_blocks_article_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"sort_field" "enum_articles_blocks_article_list_sort_field" DEFAULT 'createdAt',
  	"sort_direction" "enum_articles_blocks_article_list_sort_direction" DEFAULT 'desc',
  	"limit" numeric DEFAULT 6,
  	"block_name" varchar
  );
  
  ALTER TABLE "windows_blocks_article_list_types" ADD CONSTRAINT "windows_blocks_article_list_types_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."windows_blocks_article_list"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "windows_blocks_article_list" ADD CONSTRAINT "windows_blocks_article_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."windows"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles_blocks_article_list_types" ADD CONSTRAINT "articles_blocks_article_list_types_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."articles_blocks_article_list"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles_blocks_article_list" ADD CONSTRAINT "articles_blocks_article_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "windows_blocks_article_list_types_order_idx" ON "windows_blocks_article_list_types" USING btree ("order");
  CREATE INDEX "windows_blocks_article_list_types_parent_idx" ON "windows_blocks_article_list_types" USING btree ("parent_id");
  CREATE INDEX "windows_blocks_article_list_order_idx" ON "windows_blocks_article_list" USING btree ("_order");
  CREATE INDEX "windows_blocks_article_list_parent_id_idx" ON "windows_blocks_article_list" USING btree ("_parent_id");
  CREATE INDEX "windows_blocks_article_list_path_idx" ON "windows_blocks_article_list" USING btree ("_path");
  CREATE INDEX "articles_blocks_article_list_types_order_idx" ON "articles_blocks_article_list_types" USING btree ("order");
  CREATE INDEX "articles_blocks_article_list_types_parent_idx" ON "articles_blocks_article_list_types" USING btree ("parent_id");
  CREATE INDEX "articles_blocks_article_list_order_idx" ON "articles_blocks_article_list" USING btree ("_order");
  CREATE INDEX "articles_blocks_article_list_parent_id_idx" ON "articles_blocks_article_list" USING btree ("_parent_id");
  CREATE INDEX "articles_blocks_article_list_path_idx" ON "articles_blocks_article_list" USING btree ("_path");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "windows_blocks_article_list_types" CASCADE;
  DROP TABLE "windows_blocks_article_list" CASCADE;
  DROP TABLE "articles_blocks_article_list_types" CASCADE;
  DROP TABLE "articles_blocks_article_list" CASCADE;
  DROP TYPE "public"."enum_windows_blocks_article_list_types";
  DROP TYPE "public"."enum_windows_blocks_article_list_sort_field";
  DROP TYPE "public"."enum_windows_blocks_article_list_sort_direction";
  DROP TYPE "public"."enum_articles_blocks_article_list_types";
  DROP TYPE "public"."enum_articles_blocks_article_list_sort_field";
  DROP TYPE "public"."enum_articles_blocks_article_list_sort_direction";`)
}
