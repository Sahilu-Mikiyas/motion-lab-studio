
-- ===== ROLES =====
CREATE TYPE public.app_role AS ENUM ('admin', 'creator');
CREATE TYPE public.onboarding_status AS ENUM ('not_started','application_submitted','under_review','legal_pending','complete','rejected');
CREATE TYPE public.submission_status AS ENUM ('pending','submitted','approved','needs_revision');

-- ===== PROFILES =====
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  assigned_level INTEGER NOT NULL DEFAULT 0,
  paid_status BOOLEAN NOT NULL DEFAULT false,
  onboarding_status public.onboarding_status NOT NULL DEFAULT 'not_started',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ===== USER ROLES =====
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- ===== APPLICATIONS =====
CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  country TEXT,
  cv_url TEXT,
  cover_letter TEXT NOT NULL,
  qualifications TEXT NOT NULL,
  questionnaire JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'submitted', -- submitted | approved | rejected
  assigned_level INTEGER,
  reviewer_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- ===== LEGAL DOCS =====
CREATE TABLE public.legal_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  id_document_url TEXT NOT NULL,
  agreement_signed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  signed_name TEXT NOT NULL,
  agreement_version TEXT NOT NULL DEFAULT 'v1.0',
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;

-- ===== LESSONS =====
CREATE TABLE public.lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  youtube_url TEXT,
  module TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  required_level INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, lesson_id)
);
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

-- ===== TASKS =====
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  brief TEXT NOT NULL,
  payout NUMERIC(10,2) NOT NULL DEFAULT 0,
  required_level INTEGER NOT NULL DEFAULT 0,
  is_paid BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  file_url TEXT,
  notes TEXT,
  status public.submission_status NOT NULL DEFAULT 'submitted',
  feedback TEXT,
  payout NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- ===== updated_at helper =====
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER tr_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER tr_applications_updated BEFORE UPDATE ON public.applications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER tr_submissions_updated BEFORE UPDATE ON public.submissions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== Auto-create profile + admin role on signup =====
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );

  IF lower(NEW.email) = 'furiimotionlabs@outlook.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'creator') ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===== POLICIES =====
-- profiles
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins update profiles" ON public.profiles FOR UPDATE USING (public.has_role(auth.uid(),'admin'));

-- user_roles
CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- applications
CREATE POLICY "Users view own application" ON public.applications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own application" ON public.applications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own application" ON public.applications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins view all applications" ON public.applications FOR SELECT USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update applications" ON public.applications FOR UPDATE USING (public.has_role(auth.uid(),'admin'));

-- legal docs
CREATE POLICY "Users view own legal" ON public.legal_documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own legal" ON public.legal_documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins view legal" ON public.legal_documents FOR SELECT USING (public.has_role(auth.uid(),'admin'));

-- lessons (read-all-authed)
CREATE POLICY "Authed view lessons" ON public.lessons FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage lessons" ON public.lessons FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- lesson progress
CREATE POLICY "Users view own progress" ON public.lesson_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users upsert own progress" ON public.lesson_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own progress" ON public.lesson_progress FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins view progress" ON public.lesson_progress FOR SELECT USING (public.has_role(auth.uid(),'admin'));

-- tasks
CREATE POLICY "Authed view tasks" ON public.tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage tasks" ON public.tasks FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- submissions
CREATE POLICY "Users view own submissions" ON public.submissions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create own submissions" ON public.submissions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own submissions" ON public.submissions FOR UPDATE USING (auth.uid() = user_id AND status = 'needs_revision');
CREATE POLICY "Admins view submissions" ON public.submissions FOR SELECT USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update submissions" ON public.submissions FOR UPDATE USING (public.has_role(auth.uid(),'admin'));

-- ===== STORAGE =====
INSERT INTO storage.buckets (id, name, public) VALUES ('applications','applications', false) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('legal-docs','legal-docs', false) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('submissions','submissions', false) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars','avatars', true) ON CONFLICT DO NOTHING;

CREATE POLICY "Users read own application files" ON storage.objects FOR SELECT
  USING (bucket_id='applications' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users upload own application files" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id='applications' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Admins read all application files" ON storage.objects FOR SELECT
  USING (bucket_id='applications' AND public.has_role(auth.uid(),'admin'));

CREATE POLICY "Users read own legal files" ON storage.objects FOR SELECT
  USING (bucket_id='legal-docs' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users upload own legal files" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id='legal-docs' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Admins read all legal files" ON storage.objects FOR SELECT
  USING (bucket_id='legal-docs' AND public.has_role(auth.uid(),'admin'));

CREATE POLICY "Users read own submission files" ON storage.objects FOR SELECT
  USING (bucket_id='submissions' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users upload own submission files" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id='submissions' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Admins read all submission files" ON storage.objects FOR SELECT
  USING (bucket_id='submissions' AND public.has_role(auth.uid(),'admin'));

CREATE POLICY "Avatars public read" ON storage.objects FOR SELECT USING (bucket_id='avatars');
CREATE POLICY "Users upload own avatar" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id='avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users update own avatar" ON storage.objects FOR UPDATE
  USING (bucket_id='avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ===== Seed lessons & tasks =====
INSERT INTO public.lessons (title, description, youtube_url, module, sort_order, required_level) VALUES
('Foundations of 2D Animation','Principles, timing, spacing.','https://www.youtube.com/results?search_query=12+principles+of+animation','Foundations',1,0),
('Squash, Stretch & Anticipation','Apply the first principles in practice.','https://www.youtube.com/results?search_query=squash+and+stretch+animation','Foundations',2,0),
('Walk Cycles','Build a clean side-view walk cycle.','https://www.youtube.com/results?search_query=2d+walk+cycle+tutorial','Body Mechanics',3,0),
('Run Cycles & Weight','Add weight, force and follow-through.','https://www.youtube.com/results?search_query=run+cycle+animation','Body Mechanics',4,1),
('Acting & Lip Sync','Performance basics for character animation.','https://www.youtube.com/results?search_query=acting+for+animators','Performance',5,2);

INSERT INTO public.tasks (lesson_id, title, brief, payout, required_level, is_paid)
SELECT id, 'Submit: ' || title, 'Complete the lesson and submit your exercise file.', 0, required_level, false FROM public.lessons;
