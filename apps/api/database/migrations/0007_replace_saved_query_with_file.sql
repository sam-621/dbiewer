CREATE TABLE "file" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid DEFAULT nullif(current_setting('app.current_tenant_id', true), '')::uuid NOT NULL,
	"connection_id" uuid NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "file" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP POLICY "saved_query_tenant_isolation" ON "saved_query" CASCADE;--> statement-breakpoint
DROP TABLE "saved_query" CASCADE;--> statement-breakpoint
ALTER TABLE "file" ADD CONSTRAINT "file_tenant_id_workspace_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file" ADD CONSTRAINT "file_connection_id_connection_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."connection"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "file_connection_id_type_name_idx" ON "file" USING btree ("connection_id","type",lower("name"));--> statement-breakpoint
CREATE POLICY "file_tenant_isolation" ON "file" AS PERMISSIVE FOR ALL TO public USING ("file"."tenant_id" = nullif(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("file"."tenant_id" = nullif(current_setting('app.current_tenant_id', true), '')::uuid);