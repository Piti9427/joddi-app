-- Feature migration for Wallet Transfer support.
-- Adds the destination payment method column to support transferring funds between wallets.

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS to_payment_method text;

COMMENT ON COLUMN public.transactions.to_payment_method IS 'Destination wallet/payment method when the transaction is a Transfer.';
