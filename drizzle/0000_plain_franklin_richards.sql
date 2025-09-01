CREATE TABLE "admins" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "admins_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "game_stats" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"games_played" integer DEFAULT 0,
	"games_won" integer DEFAULT 0,
	"current_streak" integer DEFAULT 0,
	"max_streak" integer DEFAULT 0,
	"guess_distribution" text DEFAULT '{}',
	"last_played_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "gameplays" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"game_id" integer,
	"num_tries" integer,
	"points_earned" integer,
	"guess_sequence" text,
	"completed" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "games" (
	"id" serial PRIMARY KEY NOT NULL,
	"word" text NOT NULL,
	"hint" text,
	"created_at" timestamp DEFAULT now(),
	"active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"full_name" text,
	"email" text,
	"password" text,
	"phone_number" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "game_stats" ADD CONSTRAINT "game_stats_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gameplays" ADD CONSTRAINT "gameplays_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gameplays" ADD CONSTRAINT "gameplays_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE no action ON UPDATE no action;