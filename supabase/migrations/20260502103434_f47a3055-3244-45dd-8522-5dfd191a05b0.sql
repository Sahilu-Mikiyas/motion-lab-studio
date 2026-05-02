
-- Avatars: restrict raw listing; reads still allowed only via known paths
DROP POLICY IF EXISTS "Avatars public read" ON storage.objects;
CREATE POLICY "Avatars owner read" ON storage.objects FOR SELECT
  USING (bucket_id='avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Avatars admin read" ON storage.objects FOR SELECT
  USING (bucket_id='avatars' AND public.has_role(auth.uid(),'admin'));
UPDATE storage.buckets SET public = false WHERE id = 'avatars';

-- Revoke execute on SECURITY DEFINER functions from anon & authenticated
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, public;
-- has_role still needs to be callable by authenticated users via RLS policies (server-side); keep grant
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
