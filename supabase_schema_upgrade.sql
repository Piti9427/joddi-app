-- ==========================================
-- JODDI APP: Supabase Database Setup Script
-- ==========================================
-- This script prepares the database for production readiness by adding
-- users tracking, custom categories, budgets, and Row Level Security (RLS).

-- ----------------------------------------------------
-- 1. ADD USER TRACKING TO TRANSACTIONS
-- ----------------------------------------------------
-- Add user_id column to link transactions back to authenticated users.
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Default to authenticated user if available
ALTER TABLE public.transactions 
ALTER COLUMN user_id SET DEFAULT auth.uid();

-- ----------------------------------------------------
-- 2. CREATE CATEGORIES TABLE (Dynamic Categories)
-- ----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    name text NOT NULL,
    type text NOT NULL CHECK (type IN ('Income', 'Expense')),
    color text DEFAULT '#10b981',
    icon text DEFAULT 'receipt',
    created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
    -- Ensure user doesn't create duplicate category names for the same type
    UNIQUE(user_id, name, type)
);

-- Enable RLS for categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------
-- 3. CREATE BUDGETS TABLE
-- ----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.budgets (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    category_id uuid REFERENCES public.categories(id) ON DELETE CASCADE,
    amount_limit numeric NOT NULL CHECK (amount_limit > 0),
    month_year date NOT NULL, -- Format: YYYY-MM-01 (1st day of month)
    created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
    -- One budget per category per month per user
    UNIQUE(user_id, category_id, month_year)
);

-- Enable RLS for budgets
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------
-- 4. UPDATE TRANSACTIONS TO REFERENCE CATEGORIES (Optional/Future)
-- ----------------------------------------------------
-- Note: We are keeping the text-based 'category' column to not break existing app logic immediately.
-- However, we can add a category_id for strict relation mapping later.
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL;


-- ==========================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================
-- Security rule: "Users can only see and modify their OWN data"

-- Update Transactions Policy (Remove public access first)
DROP POLICY IF EXISTS "Allow public access for all operations" ON public.transactions;

CREATE POLICY "Users can manage their own transactions" 
ON public.transactions FOR ALL USING (auth.uid() = user_id);

-- Categories Policy
CREATE POLICY "Users can manage their own categories" 
ON public.categories FOR ALL USING (auth.uid() = user_id);

-- Budgets Policy
CREATE POLICY "Users can manage their own budgets" 
ON public.budgets FOR ALL USING (auth.uid() = user_id);


-- ==========================================
-- 6. DEFAULT DATA TRIGGER (Optional)
-- ==========================================
-- Automatically create standard categories when a new user signs up
CREATE OR REPLACE FUNCTION public.create_default_categories()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.categories (user_id, name, type, color, icon)
  VALUES
    (NEW.id, 'Food & Dining', 'Expense', '#f43f5e', 'utensils'),
    (NEW.id, 'Transportation', 'Expense', '#f59e0b', 'car'),
    (NEW.id, 'Shopping', 'Expense', '#3b82f6', 'shopping-bag'),
    (NEW.id, 'Salary', 'Income', '#10b981', 'banknote');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to fire after auth.users creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_default_categories();
