-- ==========================================
-- JODDI APP: Supabase Database Repair & Setup (V3)
-- ==========================================
-- This script is designed to be RE-RUNNABLE without errors.
-- It ensures the public.users table exists and the trigger is active.

-- 1. Create public.users if not exists
CREATE TABLE IF NOT EXISTS public.users (
    id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email text,
    display_name text,
    avatar_url text,
    created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Ensure RLS is enabled and clean
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own profile" ON public.users;
CREATE POLICY "Users can manage their own profile" 
ON public.users FOR ALL USING (auth.uid() = id);

-- 3. Setup Categories & Budgets (Safe creation)
CREATE TABLE IF NOT EXISTS public.categories (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    name text NOT NULL,
    type text NOT NULL CHECK (type IN ('Income', 'Expense')),
    color text DEFAULT '#10b981',
    icon text DEFAULT 'receipt',
    created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, name, type)
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own categories" ON public.categories;
CREATE POLICY "Users can manage their own categories" 
ON public.categories FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.budgets (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    category_id uuid REFERENCES public.categories(id) ON DELETE CASCADE,
    amount_limit numeric NOT NULL CHECK (amount_limit > 0),
    month_year date NOT NULL,
    created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, category_id, month_year)
);

ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own budgets" ON public.budgets;
CREATE POLICY "Users can manage their own budgets" 
ON public.budgets FOR ALL USING (auth.uid() = user_id);

-- 4. Setup Transactions (Safe modification)
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.transactions 
ALTER COLUMN user_id SET DEFAULT auth.uid();

ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL;

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public access for all operations" ON public.transactions;
DROP POLICY IF EXISTS "Users can manage their own transactions" ON public.transactions;
CREATE POLICY "Users can manage their own transactions" 
ON public.transactions FOR ALL USING (auth.uid() = user_id);

-- 5. REPAIR TRIGGER: Function and Trigger setup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- 1. Insert into public.users
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  
  -- 2. Create default categories
  INSERT INTO public.categories (user_id, name, type, color, icon)
  VALUES
    (NEW.id, 'Food & Dining', 'Expense', '#f43f5e', 'utensils'),
    (NEW.id, 'Transportation', 'Expense', '#f59e0b', 'car'),
    (NEW.id, 'Shopping', 'Expense', '#3b82f6', 'shopping-bag'),
    (NEW.id, 'Salary', 'Income', '#10b981', 'banknote')
  ON CONFLICT DO NOTHING;
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. EMERGENCY FIX: Manually sync existing users in auth.users to public.users
-- In case you signed up BEFORE running this script successfully.
INSERT INTO public.users (id, email)
SELECT id, email FROM auth.users
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.categories (user_id, name, type, color, icon)
SELECT id, 'Food & Dining', 'Expense', '#f43f5e', 'utensils' FROM auth.users ON CONFLICT DO NOTHING;
INSERT INTO public.categories (user_id, name, type, color, icon)
SELECT id, 'Transportation', 'Expense', '#f59e0b', 'car' FROM auth.users ON CONFLICT DO NOTHING;
INSERT INTO public.categories (user_id, name, type, color, icon)
SELECT id, 'Shopping', 'Expense', '#3b82f6', 'shopping-bag' FROM auth.users ON CONFLICT DO NOTHING;
INSERT INTO public.categories (user_id, name, type, color, icon)
SELECT id, 'Salary', 'Income', '#10b981', 'banknote' FROM auth.users ON CONFLICT DO NOTHING;
