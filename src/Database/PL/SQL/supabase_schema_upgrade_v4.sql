-- Free-first production feature migration.
-- Adds tracking fields needed by offline sync, payment-method tracking,
-- local budget periods, and receipt image metadata without adding paid services.

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'cash',
  ADD COLUMN IF NOT EXISTS created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;

ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now());

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'categories_user_name_type_key'
      AND conrelid = 'public.categories'::regclass
  ) THEN
    ALTER TABLE public.categories
      ADD CONSTRAINT categories_user_name_type_key UNIQUE (user_id, name, type);
  END IF;
END $$;

ALTER TABLE public.budgets
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS period text DEFAULT 'monthly',
  ADD COLUMN IF NOT EXISTS icon text DEFAULT 'tag',
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;

ALTER TABLE public.budgets
  DROP CONSTRAINT IF EXISTS budgets_period_check;

ALTER TABLE public.budgets
  ADD CONSTRAINT budgets_period_check
  CHECK (period IN ('daily', 'weekly', 'monthly', 'yearly'));

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now());

CREATE TABLE IF NOT EXISTS public.receipts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  transaction_id uuid REFERENCES public.transactions(id) ON DELETE SET NULL,
  storage_path text,
  ocr_text text,
  parsed_merchant text,
  parsed_amount numeric,
  parsed_date timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own receipts" ON public.receipts;
CREATE POLICY "Users can manage their own receipts"
ON public.receipts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Users can read their own receipt images" ON storage.objects;
CREATE POLICY "Users can read their own receipt images"
ON storage.objects FOR SELECT
USING (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can upload their own receipt images" ON storage.objects;
CREATE POLICY "Users can upload their own receipt images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can delete their own receipt images" ON storage.objects;
CREATE POLICY "Users can delete their own receipt images"
ON storage.objects FOR DELETE
USING (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);
