-- 1. JOBS TABLE: Stores job requirements for scoring
CREATE TABLE IF NOT EXISTS public.jobs (
    id text PRIMARY KEY,
    title text NOT NULL,
    jd_text text,
    must_have_skills text[],
    good_to_have_skills text[],
    min_exp_years int4 DEFAULT 0,
    max_exp_years int4 DEFAULT 10,
    created_at timestamptz DEFAULT now()
);

-- 2. CANDIDATES TABLE: The master record for applicants
CREATE TABLE IF NOT EXISTS public.candidates (
    id text PRIMARY KEY, -- Format: CAND-{uuid}
    job_id text REFERENCES public.jobs(id) ON DELETE CASCADE,
    status text DEFAULT 'PENDING',
    priority_score int4 DEFAULT 0,
    resume_file_path text,
    source text,
    priority text,
    created_at timestamptz DEFAULT now()
);

-- 3. CANDIDATE PROFILES: Stores structured AI-parsed data
CREATE TABLE IF NOT EXISTS public.candidate_profiles (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    candidate_id text REFERENCES public.candidates(id) ON DELETE CASCADE,
    profile_json jsonb DEFAULT '{}',
    raw_text text,
    created_at timestamptz DEFAULT now(),
    CONSTRAINT candidate_profiles_candidate_id_key UNIQUE (candidate_id)
);

-- 4. CANDIDATE RISK: Stores fraud scores and security flags
CREATE TABLE IF NOT EXISTS public.candidate_risk (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    candidate_id text REFERENCES public.candidates(id) ON DELETE CASCADE,
    fraud_score int4 DEFAULT 0,
    flags text[] DEFAULT '{}',
    risk_json jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    CONSTRAINT candidate_risk_candidate_id_key UNIQUE (candidate_id)
);

-- 5. CANDIDATE SCORES: Stores AI evaluations and justifications
CREATE TABLE IF NOT EXISTS public.candidate_scores (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    candidate_id text REFERENCES public.candidates(id) ON DELETE CASCADE,
    scores_json jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    CONSTRAINT candidate_scores_candidate_id_key UNIQUE (candidate_id)
);

-- 6. AUDIT LOGS: Tracks every agent action for the timeline
CREATE TABLE IF NOT EXISTS public.candidate_audit_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    candidate_id text REFERENCES public.candidates(id) ON DELETE CASCADE,
    step text NOT NULL, -- e.g., 'PARSE', 'FRAUD_CHECK', 'SCORING_COMPLETE'
    status text NOT NULL, -- e.g., 'OK', 'SUCCESS', 'WARNING'
    details jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now()
);

-- 7. ENABLE ROW LEVEL SECURITY (Optional for local dev, mandatory for production)
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_risk ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_audit_logs ENABLE ROW LEVEL SECURITY;

-- Create a basic policy to allow all actions for local testing
CREATE POLICY "Allow all" ON public.jobs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON public.candidates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON public.candidate_profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON public.candidate_risk FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON public.candidate_scores FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON public.candidate_audit_logs FOR ALL USING (true) WITH CHECK (true);