-- Flag as Wrong reports table for Design Gate 2
CREATE TABLE IF NOT EXISTS public.flag_as_wrong_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  message_id TEXT NOT NULL,
  reason TEXT,
  user_comment TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- RLS
ALTER TABLE public.flag_as_wrong_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own flags"
  ON public.flag_as_wrong_reports FOR SELECT
  USING (auth.uid() = user_id AND deleted_at IS NULL);

CREATE POLICY "Users can create flags"
  ON public.flag_as_wrong_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Index
CREATE INDEX idx_flag_reports_user_status
  ON public.flag_as_wrong_reports(user_id, status)
  WHERE deleted_at IS NULL;
