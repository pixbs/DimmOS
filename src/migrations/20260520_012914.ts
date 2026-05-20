import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_cookie_services_cookies_storage_type" AS ENUM('cookie', 'localStorage', 'sessionStorage', 'indexedDB', 'other');
  CREATE TYPE "public"."enum_cookie_services_category" AS ENUM('essential', 'functional', 'analytics', 'marketing');
  CREATE TYPE "public"."enum_cookie_consents_categories" AS ENUM('essential', 'functional', 'analytics', 'marketing');
  CREATE TABLE "cookie_services_cookies" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"storage_type" "enum_cookie_services_cookies_storage_type",
  	"name" varchar,
  	"duration" varchar,
  	"description" varchar
  );
  
  CREATE TABLE "cookie_services" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"category" "enum_cookie_services_category" NOT NULL,
  	"description" varchar,
  	"legal_name" varchar,
  	"privacy_policy_url" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "cookie_consents_categories" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_cookie_consents_categories",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "cookie_consents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"consent_id" varchar NOT NULL,
  	"ip_address" varchar,
  	"user_agent" varchar,
  	"language" varchar,
  	"consent_version" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "cookie_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar DEFAULT 'We use cookies',
  	"description" varchar DEFAULT 'We use cookies and similar technologies to make this site work and to understand how it is used. Essential cookies are required for the site to function. Optional cookies (analytics, functional, marketing) will only be set if you choose to allow them. You can update your preferences at any time.',
  	"consent_version" varchar DEFAULT '1.0',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "forms_blocks_email" ADD COLUMN "is_pre_defined" boolean DEFAULT false;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "cookie_services_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "cookie_consents_id" integer;
  ALTER TABLE "cookie_services_cookies" ADD CONSTRAINT "cookie_services_cookies_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."cookie_services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cookie_consents_categories" ADD CONSTRAINT "cookie_consents_categories_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."cookie_consents"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "cookie_services_cookies_order_idx" ON "cookie_services_cookies" USING btree ("_order");
  CREATE INDEX "cookie_services_cookies_parent_id_idx" ON "cookie_services_cookies" USING btree ("_parent_id");
  CREATE INDEX "cookie_services_updated_at_idx" ON "cookie_services" USING btree ("updated_at");
  CREATE INDEX "cookie_services_created_at_idx" ON "cookie_services" USING btree ("created_at");
  CREATE INDEX "cookie_consents_categories_order_idx" ON "cookie_consents_categories" USING btree ("order");
  CREATE INDEX "cookie_consents_categories_parent_idx" ON "cookie_consents_categories" USING btree ("parent_id");
  CREATE UNIQUE INDEX "cookie_consents_consent_id_idx" ON "cookie_consents" USING btree ("consent_id");
  CREATE INDEX "cookie_consents_updated_at_idx" ON "cookie_consents" USING btree ("updated_at");
  CREATE INDEX "cookie_consents_created_at_idx" ON "cookie_consents" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_cookie_services_fk" FOREIGN KEY ("cookie_services_id") REFERENCES "public"."cookie_services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_cookie_consents_fk" FOREIGN KEY ("cookie_consents_id") REFERENCES "public"."cookie_consents"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_cookie_services_id_idx" ON "payload_locked_documents_rels" USING btree ("cookie_services_id");
  CREATE INDEX "payload_locked_documents_rels_cookie_consents_id_idx" ON "payload_locked_documents_rels" USING btree ("cookie_consents_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "cookie_services_cookies" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cookie_services" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cookie_consents_categories" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cookie_consents" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cookie_settings" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "cookie_services_cookies" CASCADE;
  DROP TABLE "cookie_services" CASCADE;
  DROP TABLE "cookie_consents_categories" CASCADE;
  DROP TABLE "cookie_consents" CASCADE;
  DROP TABLE "cookie_settings" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_cookie_services_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_cookie_consents_fk";
  
  DROP INDEX "payload_locked_documents_rels_cookie_services_id_idx";
  DROP INDEX "payload_locked_documents_rels_cookie_consents_id_idx";
  ALTER TABLE "forms_blocks_email" DROP COLUMN "is_pre_defined";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "cookie_services_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "cookie_consents_id";
  DROP TYPE "public"."enum_cookie_services_cookies_storage_type";
  DROP TYPE "public"."enum_cookie_services_category";
  DROP TYPE "public"."enum_cookie_consents_categories";`)
}
