import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_windows_buttons_style" AS ENUM('primary', 'secondary');
  CREATE TYPE "public"."enum_windows_buttons_target" AS ENUM('internal', 'external');
  CREATE TYPE "public"."enum_articles_buttons_style" AS ENUM('primary', 'secondary');
  CREATE TYPE "public"."enum_articles_buttons_target" AS ENUM('internal', 'external');
  CREATE TABLE "windows_buttons" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"style" "enum_windows_buttons_style" DEFAULT 'primary',
  	"target" "enum_windows_buttons_target" DEFAULT 'internal',
  	"slug" varchar,
  	"href" varchar,
  	"open_in_new_tab" boolean DEFAULT false
  );
  
  CREATE TABLE "articles_buttons" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"style" "enum_articles_buttons_style" DEFAULT 'primary',
  	"target" "enum_articles_buttons_target" DEFAULT 'internal',
  	"slug" varchar,
  	"href" varchar,
  	"open_in_new_tab" boolean DEFAULT false
  );
  
  ALTER TABLE "windows_buttons" ADD CONSTRAINT "windows_buttons_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."windows"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles_buttons" ADD CONSTRAINT "articles_buttons_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "windows_buttons_order_idx" ON "windows_buttons" USING btree ("_order");
  CREATE INDEX "windows_buttons_parent_id_idx" ON "windows_buttons" USING btree ("_parent_id");
  CREATE INDEX "articles_buttons_order_idx" ON "articles_buttons" USING btree ("_order");
  CREATE INDEX "articles_buttons_parent_id_idx" ON "articles_buttons" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "windows_buttons" CASCADE;
  DROP TABLE "articles_buttons" CASCADE;
  DROP TYPE "public"."enum_windows_buttons_style";
  DROP TYPE "public"."enum_windows_buttons_target";
  DROP TYPE "public"."enum_articles_buttons_style";
  DROP TYPE "public"."enum_articles_buttons_target";`)
}
