import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_windows_window_startup_viewports" AS ENUM('desktop', 'mobile');
  CREATE TYPE "public"."enum_articles_window_startup_viewports" AS ENUM('desktop', 'mobile');
  CREATE TABLE "windows_blocks_welcome_intro" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"role" varchar,
  	"descriptor" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "windows_blocks_interactive_portrait" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "windows_window_startup_viewports" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_windows_window_startup_viewports",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "articles_blocks_welcome_intro" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"role" varchar,
  	"descriptor" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "articles_blocks_interactive_portrait" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "articles_window_startup_viewports" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_articles_window_startup_viewports",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  ALTER TABLE "windows" ADD COLUMN "window_open_on_startup" boolean DEFAULT false;
  ALTER TABLE "windows" ADD COLUMN "window_startup_order" numeric DEFAULT 0;
  ALTER TABLE "articles" ADD COLUMN "window_open_on_startup" boolean DEFAULT false;
  ALTER TABLE "articles" ADD COLUMN "window_startup_order" numeric DEFAULT 0;
  ALTER TABLE "windows_blocks_welcome_intro" ADD CONSTRAINT "windows_blocks_welcome_intro_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."windows"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "windows_blocks_interactive_portrait" ADD CONSTRAINT "windows_blocks_interactive_portrait_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."windows"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "windows_window_startup_viewports" ADD CONSTRAINT "windows_window_startup_viewports_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."windows"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles_blocks_welcome_intro" ADD CONSTRAINT "articles_blocks_welcome_intro_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles_blocks_interactive_portrait" ADD CONSTRAINT "articles_blocks_interactive_portrait_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles_window_startup_viewports" ADD CONSTRAINT "articles_window_startup_viewports_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "windows_blocks_welcome_intro_order_idx" ON "windows_blocks_welcome_intro" USING btree ("_order");
  CREATE INDEX "windows_blocks_welcome_intro_parent_id_idx" ON "windows_blocks_welcome_intro" USING btree ("_parent_id");
  CREATE INDEX "windows_blocks_welcome_intro_path_idx" ON "windows_blocks_welcome_intro" USING btree ("_path");
  CREATE INDEX "windows_blocks_interactive_portrait_order_idx" ON "windows_blocks_interactive_portrait" USING btree ("_order");
  CREATE INDEX "windows_blocks_interactive_portrait_parent_id_idx" ON "windows_blocks_interactive_portrait" USING btree ("_parent_id");
  CREATE INDEX "windows_blocks_interactive_portrait_path_idx" ON "windows_blocks_interactive_portrait" USING btree ("_path");
  CREATE INDEX "windows_window_startup_viewports_order_idx" ON "windows_window_startup_viewports" USING btree ("order");
  CREATE INDEX "windows_window_startup_viewports_parent_idx" ON "windows_window_startup_viewports" USING btree ("parent_id");
  CREATE INDEX "articles_blocks_welcome_intro_order_idx" ON "articles_blocks_welcome_intro" USING btree ("_order");
  CREATE INDEX "articles_blocks_welcome_intro_parent_id_idx" ON "articles_blocks_welcome_intro" USING btree ("_parent_id");
  CREATE INDEX "articles_blocks_welcome_intro_path_idx" ON "articles_blocks_welcome_intro" USING btree ("_path");
  CREATE INDEX "articles_blocks_interactive_portrait_order_idx" ON "articles_blocks_interactive_portrait" USING btree ("_order");
  CREATE INDEX "articles_blocks_interactive_portrait_parent_id_idx" ON "articles_blocks_interactive_portrait" USING btree ("_parent_id");
  CREATE INDEX "articles_blocks_interactive_portrait_path_idx" ON "articles_blocks_interactive_portrait" USING btree ("_path");
  CREATE INDEX "articles_window_startup_viewports_order_idx" ON "articles_window_startup_viewports" USING btree ("order");
  CREATE INDEX "articles_window_startup_viewports_parent_idx" ON "articles_window_startup_viewports" USING btree ("parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "windows_blocks_welcome_intro" CASCADE;
  DROP TABLE "windows_blocks_interactive_portrait" CASCADE;
  DROP TABLE "windows_window_startup_viewports" CASCADE;
  DROP TABLE "articles_blocks_welcome_intro" CASCADE;
  DROP TABLE "articles_blocks_interactive_portrait" CASCADE;
  DROP TABLE "articles_window_startup_viewports" CASCADE;
  ALTER TABLE "windows" DROP COLUMN "window_open_on_startup";
  ALTER TABLE "windows" DROP COLUMN "window_startup_order";
  ALTER TABLE "articles" DROP COLUMN "window_open_on_startup";
  ALTER TABLE "articles" DROP COLUMN "window_startup_order";
  DROP TYPE "public"."enum_windows_window_startup_viewports";
  DROP TYPE "public"."enum_articles_window_startup_viewports";`)
}
