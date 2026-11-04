CREATE TABLE "saved_query" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid DEFAULT nullif(current_setting('app.current_tenant_id', true), '')::uuid NOT NULL,
	"connection_id" uuid NOT NULL,
	"name" text NOT NULL,
	"sql" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "saved_query" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "saved_query" ADD CONSTRAINT "saved_query_tenant_id_workspace_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_query" ADD CONSTRAINT "saved_query_connection_id_connection_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."connection"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "saved_query_connection_id_name_idx" ON "saved_query" USING btree ("connection_id",lower("name"));--> statement-breakpoint
CREATE POLICY "saved_query_tenant_isolation" ON "saved_query" AS PERMISSIVE FOR ALL TO public USING ("saved_query"."tenant_id" = nullif(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("saved_query"."tenant_id" = nullif(current_setting('app.current_tenant_id', true), '')::uuid);