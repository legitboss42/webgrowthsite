-- 2026-10-25: exactly two owner-registered businesses are eligible for
-- separate role-bound Meta social actions. WhatsApp remains webgrowth-only
-- at the protected action validator. Existing approval rows remain intact.
ALTER TABLE public.openclaw_social_approvals
  DROP CONSTRAINT IF EXISTS openclaw_social_approvals_business_id_check;
ALTER TABLE public.openclaw_social_approvals
  ADD CONSTRAINT openclaw_social_approvals_business_id_check
  CHECK (business_id IN ('webgrowth', 'nouncompass'));
