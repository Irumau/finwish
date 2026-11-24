CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"currency_code" varchar(3) DEFAULT 'USD' NOT NULL,
	"country_code" varchar(2) DEFAULT 'US' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "exchange_rates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"from_currency" varchar(3) NOT NULL,
	"to_currency" varchar(3) NOT NULL,
	"rate" numeric(16, 6) NOT NULL,
	"source" varchar(50) NOT NULL,
	"fetched_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "uq_exchange_rate_pair" UNIQUE("from_currency","to_currency","fetched_at")
);
--> statement-breakpoint
CREATE TABLE "product_price_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"price" numeric(12, 2) NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"url" text NOT NULL,
	"url_hash" char(64) NOT NULL,
	"store_name" varchar(100),
	"title" varchar(500),
	"image_url" text,
	"current_price" numeric(12, 2),
	"currency" varchar(3) DEFAULT 'USD',
	"scrape_status" varchar(30) DEFAULT 'PENDING' NOT NULL,
	"last_scraped_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "products_url_hash_unique" UNIQUE("url_hash")
);
--> statement-breakpoint
CREATE TABLE "budgets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"category" varchar(50) NOT NULL,
	"limit_amount" numeric(12, 2) NOT NULL,
	"is_soft_limit" boolean DEFAULT true NOT NULL,
	"rollover_unused" boolean DEFAULT false NOT NULL,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "financial_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"original_amount" numeric(12, 2) NOT NULL,
	"original_currency" varchar(3) NOT NULL,
	"exchange_rate_used" numeric(16, 6) DEFAULT '1.000000' NOT NULL,
	"type" varchar(10) NOT NULL,
	"bucket_type" varchar(20) DEFAULT 'VARIABLE' NOT NULL,
	"category" varchar(50) NOT NULL,
	"description" text,
	"transaction_date" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "chk_financial_records_amount_positive" CHECK ("financial_records"."amount" > 0)
);
--> statement-breakpoint
CREATE TABLE "savings_goals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(120) NOT NULL,
	"target_amount" numeric(12, 2) NOT NULL,
	"target_date" date,
	"status" varchar(20) DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "chk_savings_goals_target_positive" CHECK ("savings_goals"."target_amount" > 0)
);
--> statement-breakpoint
CREATE TABLE "wishlist_contributions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"savings_goal_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"financial_record_id" uuid,
	"amount" numeric(12, 2) NOT NULL,
	"contribution_date" timestamp with time zone DEFAULT now(),
	"notes" text,
	CONSTRAINT "chk_contributions_amount_positive" CHECK ("wishlist_contributions"."amount" > 0)
);
--> statement-breakpoint
CREATE TABLE "wishlist_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"savings_goal_id" uuid,
	"desired_price" numeric(12, 2),
	"priority" varchar(10) DEFAULT 'MEDIUM',
	"status" varchar(20) DEFAULT 'SAVING',
	"target_date" date,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "wishlist_items_savings_goal_id_unique" UNIQUE("savings_goal_id")
);
--> statement-breakpoint
ALTER TABLE "product_price_history" ADD CONSTRAINT "product_price_history_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_records" ADD CONSTRAINT "financial_records_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_goals" ADD CONSTRAINT "savings_goals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wishlist_contributions" ADD CONSTRAINT "wishlist_contributions_savings_goal_id_savings_goals_id_fk" FOREIGN KEY ("savings_goal_id") REFERENCES "public"."savings_goals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wishlist_contributions" ADD CONSTRAINT "wishlist_contributions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wishlist_contributions" ADD CONSTRAINT "wishlist_contributions_financial_record_id_financial_records_id_fk" FOREIGN KEY ("financial_record_id") REFERENCES "public"."financial_records"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_savings_goal_id_savings_goals_id_fk" FOREIGN KEY ("savings_goal_id") REFERENCES "public"."savings_goals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_users_email" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_exchange_rates_lookup" ON "exchange_rates" USING btree ("from_currency","to_currency","fetched_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_price_history_product_date" ON "product_price_history" USING btree ("product_id","recorded_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_products_url_hash" ON "products" USING btree ("url_hash");--> statement-breakpoint
CREATE INDEX "idx_products_scrape_status" ON "products" USING btree ("scrape_status","last_scraped_at");--> statement-breakpoint
CREATE INDEX "idx_budgets_user_period" ON "budgets" USING btree ("user_id","period_start","period_end");--> statement-breakpoint
CREATE INDEX "idx_budgets_user_created" ON "budgets" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_budgets_user_id" ON "budgets" USING btree ("user_id","id");--> statement-breakpoint
CREATE INDEX "idx_financial_records_user_date" ON "financial_records" USING btree ("user_id","transaction_date" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_financial_records_user_created" ON "financial_records" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_financial_records_user_id" ON "financial_records" USING btree ("user_id","id");--> statement-breakpoint
CREATE INDEX "idx_savings_goals_user_status" ON "savings_goals" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "idx_savings_goals_user_created" ON "savings_goals" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_savings_goals_user_id" ON "savings_goals" USING btree ("user_id","id");--> statement-breakpoint
CREATE INDEX "idx_contributions_goal" ON "wishlist_contributions" USING btree ("savings_goal_id");--> statement-breakpoint
CREATE INDEX "idx_contributions_user" ON "wishlist_contributions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_contributions_user_date" ON "wishlist_contributions" USING btree ("user_id","contribution_date");--> statement-breakpoint
CREATE INDEX "idx_contributions_user_id" ON "wishlist_contributions" USING btree ("user_id","id");--> statement-breakpoint
CREATE INDEX "idx_wishlist_user_status" ON "wishlist_items" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "idx_wishlist_user_product" ON "wishlist_items" USING btree ("user_id","product_id");--> statement-breakpoint
CREATE INDEX "idx_wishlist_user_created" ON "wishlist_items" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_wishlist_user_id" ON "wishlist_items" USING btree ("user_id","id");