ALTER TABLE "workspace" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
REVOKE ALL ON "user", "session", "account", "verification" FROM app_user;
