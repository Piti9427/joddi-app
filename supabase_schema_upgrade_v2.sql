-- ==========================================
-- JODDI APP: Supabase Database Setup Script (V2)
-- ==========================================
-- This script adds a public `users` table for profile data
-- and connects `user_id` across all other tables 
-- to make querying and managing relationships easier in the future.

-- ----------------------------------------------------
-- 1. CREATE PUBLIC USERS TABLE (PROFILES)
-- ----------------------------------------------------
-- Stores public user information (like name, avatar) that is safe to query,
-- linked 1-to-1 with the secure auth.users table.
CREATE TABLE IF NOT EXISTS public.users (
    id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email text,
    display_name text,
    avatar_url text,
    created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Security rule: "Users can only read and update their own profile"
DROP POLICY IF EXISTS "Users can manage their own profile" ON public.users;
CREATE POLICY "Users can manage their own profile" 
ON public.users FOR ALL USING (auth.uid() = id);

-- ----------------------------------------------------
-- 2. AUTOMATICALLY CREATE USER RECORD ON SIGN UP
-- ----------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- 1. Create the public user profile
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email);
  
  -- 2. Create the default categories for this user
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
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ----------------------------------------------------
-- 3. CREATE CATEGORIES & BUDGETS TABLES
-- ----------------------------------------------------
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


-- ----------------------------------------------------
-- 4. ADD / MAP USER_ID TO TRANSACTIONS TABLE
-- ----------------------------------------------------
-- Add the user_id column referencing our new public.users table
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.users(id) ON DELETE CASCADE;

-- Ensure default value is the current logged-in user
ALTER TABLE public.transactions 
ALTER COLUMN user_id SET DEFAULT auth.uid();

-- Add category_id to map back to categories table natively
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL;

-- Lock down transactions table Security
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public access for all operations" ON public.transactions;
DROP POLICY IF EXISTS "Users can manage their own transactions" ON public.transactions;

CREATE POLICY "Users can manage their own transactions" 
ON public.transactions FOR ALL USING (auth.uid() = user_id);
