CREATE TABLE "connection" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid DEFAULT nullif(current_setting('app.current_tenant_id', true), '')::uuid NOT NULL,
	"name" text NOT NULL,
	"host" text NOT NULL,
	"port" integer NOT NULL,
	"database" text NOT NULL,
	"username" text NOT NULL,
	"password_encrypted" text,
	"ssl_mode" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "connection" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "connection" ADD CONSTRAINT "connection_tenant_id_workspace_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "connection_tenant_id_name_idx" ON "connection" USING btree ("tenant_id",lower("name"));--> statement-breakpoint
CREATE POLICY "connection_tenant_isolation" ON "connection" AS PERMISSIVE FOR ALL TO public USING ("connection"."tenant_id" = nullif(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("connection"."tenant_id" = nullif(current_setting('app.current_tenant_id', true), '')::uuid);