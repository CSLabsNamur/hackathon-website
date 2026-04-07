-- == STORAGE RLS ==
-- region -- RBAC helpers --
CREATE OR REPLACE FUNCTION public.current_app_user_has_permission(permission_key text)
    RETURNS boolean
    LANGUAGE sql
    STABLE
    SECURITY DEFINER
    SET search_path = public
AS
$$
SELECT EXISTS (SELECT 1
               FROM public."User" u
                        JOIN public."UserRoleAssignment" ura ON ura."userId" = u.id
                        JOIN public."RolePermission" rp ON rp."roleId" = ura."roleId"
                        JOIN public."Permission" p ON p.id = rp."permissionId"
               WHERE u."supabaseAuthId" = auth.uid()::text
                 AND p.key = permission_key);
$$;

CREATE OR REPLACE FUNCTION public.current_app_user_owns_participant(participant_id text)
    RETURNS boolean
    LANGUAGE sql
    STABLE
    SECURITY DEFINER
    SET search_path = public
AS
$$
SELECT EXISTS (SELECT 1
               FROM public."Participant" p
                        JOIN public."User" u ON u.id = p."userId"
               WHERE u."supabaseAuthId" = auth.uid()::text
                 AND p.id = participant_id);
$$;

CREATE OR REPLACE FUNCTION public.current_app_user_shares_team_with_participant(participant_id text)
    RETURNS boolean
    LANGUAGE sql
    STABLE
    SECURITY DEFINER
    SET search_path = public
AS
$$
SELECT EXISTS (SELECT 1
               FROM public."Participant" target
                        JOIN public."Participant" current_participant ON current_participant."teamId" = target."teamId"
                        JOIN public."User" u ON u.id = current_participant."userId"
               WHERE u."supabaseAuthId" = auth.uid()::text
                 AND target.id = participant_id
                 AND target."teamId" IS NOT NULL);
$$;

REVOKE ALL ON FUNCTION public.current_app_user_has_permission(text) FROM public;
REVOKE ALL ON FUNCTION public.current_app_user_owns_participant(text) FROM public;
REVOKE ALL ON FUNCTION public.current_app_user_shares_team_with_participant(text) FROM public;

GRANT EXECUTE ON FUNCTION public.current_app_user_has_permission(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_app_user_owns_participant(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_app_user_shares_team_with_participant(text) TO authenticated;
-- endregion

-- region -- cvs --
DROP POLICY IF EXISTS "Give participants access to own folder" ON "storage"."objects";
CREATE POLICY "Give participants access to own folder"
    ON "storage"."objects"
    FOR SELECT
    TO authenticated
    USING (
    bucket_id = 'cvs'::text
        AND (
        (
            public.current_app_user_has_permission('participants.read.own')
                AND public.current_app_user_owns_participant((storage.foldername(objects.name))[1])
            )
            OR (
            public.current_app_user_has_permission('teams.read.own')
                AND public.current_app_user_shares_team_with_participant((storage.foldername(objects.name))[1])
            )
        )
    );

DROP POLICY IF EXISTS "Allow participants to upload own cvs" ON "storage"."objects";
CREATE POLICY "Allow participants to upload own cvs"
    ON "storage"."objects"
    FOR INSERT
    TO authenticated
    WITH CHECK (
    bucket_id = 'cvs'::text
        AND public.current_app_user_has_permission('participants.update.own')
        AND public.current_app_user_owns_participant((storage.foldername(objects.name))[1])
    );

DROP POLICY IF EXISTS "Allow participants to delete own cvs" ON "storage"."objects";
CREATE POLICY "Allow participants to delete own cvs"
    ON "storage"."objects"
    FOR DELETE
    TO authenticated
    USING (
    bucket_id = 'cvs'::text
        AND public.current_app_user_has_permission('participants.update.own')
        AND public.current_app_user_owns_participant((storage.foldername(objects.name))[1])
    );

DROP POLICY IF EXISTS "Admin can list cvs" ON "storage"."objects";
CREATE POLICY "Admin can list cvs"
    ON "storage"."objects"
    FOR SELECT
    TO authenticated
    USING (
    bucket_id = 'cvs'::text
        AND public.current_app_user_has_permission('participants.read.sensitive')
    );

DROP POLICY IF EXISTS "Admin can delete cvs" ON "storage"."objects";
CREATE POLICY "Admin can delete cvs"
    ON "storage"."objects"
    FOR DELETE
    TO authenticated
    USING (
    bucket_id = 'cvs'::text
        AND (
        public.current_app_user_has_permission('participants.update.sensitive')
            OR public.current_app_user_has_permission('participants.delete')
        )
    );
-- endregion

-- region -- submissions --
DROP POLICY IF EXISTS "Give participants access to own submissions" ON "storage"."objects";
CREATE POLICY "Give participants access to own submissions"
    ON "storage"."objects"
    FOR SELECT
    TO authenticated
    USING (
    bucket_id = 'submissions'::text
        AND public.current_app_user_has_permission('submissions.read.own')
        AND public.current_app_user_owns_participant((storage.foldername(objects.name))[1])
    );

DROP POLICY IF EXISTS "Allow participants to upload own submissions" ON "storage"."objects";
CREATE POLICY "Allow participants to upload own submissions"
    ON "storage"."objects"
    FOR INSERT
    TO authenticated
    WITH CHECK (
    bucket_id = 'submissions'::text
        AND public.current_app_user_has_permission('submissions.update.own')
        AND public.current_app_user_owns_participant((storage.foldername(objects.name))[1])
    );

DROP POLICY IF EXISTS "Allow participants to delete own submissions" ON "storage"."objects";
CREATE POLICY "Allow participants to delete own submissions"
    ON "storage"."objects"
    FOR DELETE
    TO authenticated
    USING (
    bucket_id = 'submissions'::text
        AND public.current_app_user_has_permission('submissions.delete.own')
        AND public.current_app_user_owns_participant((storage.foldername(objects.name))[1])
    );

DROP POLICY IF EXISTS "Admins can list submissions" ON "storage"."objects";
CREATE POLICY "Admins can list submissions"
    ON "storage"."objects"
    FOR SELECT
    TO authenticated
    USING (
    bucket_id = 'submissions'::text
        AND public.current_app_user_has_permission('submissionRequests.read')
        AND public.current_app_user_has_permission('participants.read')
    );

DROP POLICY IF EXISTS "Admins can delete submissions" ON "storage"."objects";
CREATE POLICY "Admins can delete submissions"
    ON "storage"."objects"
    FOR DELETE
    TO authenticated
    USING (
    bucket_id = 'submissions'::text
        AND public.current_app_user_has_permission('submissionRequests.delete')
    );
-- endregion

-- region -- sponsors --
DROP POLICY IF EXISTS "Everyone can list sponsor images" ON "storage"."objects";
CREATE POLICY "Everyone can list sponsor images"
    ON "storage"."objects"
    FOR SELECT
    TO public
    USING (
    bucket_id = 'sponsors'::text
    );

DROP POLICY IF EXISTS "Admin can upload sponsor images" ON "storage"."objects";
CREATE POLICY "Admin can upload sponsor images"
    ON "storage"."objects"
    FOR INSERT
    TO authenticated
    WITH CHECK (
    bucket_id = 'sponsors'::text
        AND (
        public.current_app_user_has_permission('sponsors.create')
            OR public.current_app_user_has_permission('sponsors.update')
        )
    );

DROP POLICY IF EXISTS "Admin can delete sponsor images" ON "storage"."objects";
CREATE POLICY "Admin can delete sponsor images"
    ON "storage"."objects"
    FOR DELETE
    TO authenticated
    USING (
    bucket_id = 'sponsors'::text
        AND (
        public.current_app_user_has_permission('sponsors.update')
            OR public.current_app_user_has_permission('sponsors.delete')
        )
    );
-- endregion

-- region -- guests --
DROP POLICY IF EXISTS "Everyone can list guest images" ON "storage"."objects";
CREATE POLICY "Everyone can list guest images"
    ON "storage"."objects"
    FOR SELECT
    TO public
    USING (
    bucket_id = 'guests'::text
    );

DROP POLICY IF EXISTS "Admin can upload guest images" ON "storage"."objects";
CREATE POLICY "Admin can upload guest images"
    ON "storage"."objects"
    FOR INSERT
    TO authenticated
    WITH CHECK (
    bucket_id = 'guests'::text
        AND (
        public.current_app_user_has_permission('guests.create')
            OR public.current_app_user_has_permission('guests.update')
        )
    );

DROP POLICY IF EXISTS "Admin can delete guest images" ON "storage"."objects";
CREATE POLICY "Admin can delete guest images"
    ON "storage"."objects"
    FOR DELETE
    TO authenticated
    USING (
    bucket_id = 'guests'::text
        AND (
        public.current_app_user_has_permission('guests.update')
            OR public.current_app_user_has_permission('guests.delete')
        )
    );
-- endregion
