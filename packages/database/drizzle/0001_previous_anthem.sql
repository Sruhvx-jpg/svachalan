CREATE TABLE "integrated_tools" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"gmail" boolean DEFAULT false NOT NULL,
	"google_calendar" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "integrated_tools" ADD CONSTRAINT "integrated_tools_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;