-- == STORAGE RLS==
--region -- cvs --
-- Give participants access to their own cvs
CREATE POLICY "Give participants access to own folder"
    ON "storage"."objects"
    FOR SELECT
    TO authenticated
    USING (
    ((bucket_id = 'cvs'::text) AND (EXISTS (SELECT 1
                                            FROM (public."Participant" p
                                                JOIN public."User" u ON ((u.id = p."userId")))
                                            WHERE ((u.email = (auth.jwt() ->> 'email'::text)) AND
                                                   ((storage.foldername(objects.name))[1] = p.id)))))
    );

-- Allow participants to upload their own cvs
CREATE POLICY "Allow participants to upload own cvs"
    ON "storage"."objects"
    FOR INSERT
    TO authenticated
    WITH CHECK (
    ((bucket_id = 'cvs'::text) AND (EXISTS (SELECT 1
                                            FROM (public."Participant" p
                                                JOIN public."User" u ON ((u.id = p."userId")))
                                            WHERE ((u.email = (auth.jwt() ->> 'email'::text)) AND
                                                   ((storage.foldername(objects.name))[1] = p.id)))))
    );

-- Allow participants to delete their own cvs
CREATE POLICY "Allow participants to delete own cvs"
    ON "storage"."objects"
    FOR DELETE
    TO authenticated
    USING (
    ((bucket_id = 'cvs'::text) AND (EXISTS (SELECT 1
                                            FROM (public."Participant" p
                                                JOIN public."User" u ON ((u.id = p."userId")))
                                            WHERE ((u.email = (auth.jwt() ->> 'email'::text)) AND
                                                   ((storage.foldername(objects.name))[1] = p.id)))))
    );

-- Admin can list cvs
CREATE POLICY "Admin can list cvs"
    ON "storage"."objects"
    FOR SELECT
    TO authenticated
    USING (
    ((bucket_id = 'cvs'::text) AND (((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = 'admin'::text))
    );

-- Admin can delete cvs
CREATE POLICY "Admin can delete cvs"
    ON "storage"."objects"
    FOR DELETE
    TO authenticated
    USING (
    ((bucket_id = 'cvs'::text) AND (((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = 'admin'::text))
    );
-- endregion

--region -- submissions --
-- Give participants access to their own file submissions
CREATE POLICY "Give participants access to own submissions"
    ON "storage"."objects"
    FOR SELECT
    TO authenticated
    USING (
    ((bucket_id = 'submissions'::text) AND (EXISTS (SELECT 1
                                                    FROM (public."Participant" p
                                                        JOIN public."User" u ON ((u.id = p."userId")))
                                                    WHERE ((u.email = (auth.jwt() ->> 'email'::text)) AND
                                                           ((storage.foldername(objects.name))[1] = p.id)))))
    );

-- Allow participants to upload their own file submissions
CREATE POLICY "Allow participants to upload own submissions"
    ON "storage"."objects"
    FOR INSERT
    TO authenticated
    WITH CHECK (
    ((bucket_id = 'submissions'::text) AND (EXISTS (SELECT 1
                                                    FROM (public."Participant" p
                                                        JOIN public."User" u ON ((u.id = p."userId")))
                                                    WHERE ((u.email = (auth.jwt() ->> 'email'::text)) AND
                                                           ((storage.foldername(objects.name))[1] = p.id)))))
    );

-- Allow participants to delete their own file submissions
CREATE POLICY "Allow participants to delete own submissions"
    ON "storage"."objects"
    FOR DELETE
    TO authenticated
    USING (
    ((bucket_id = 'submissions'::text) AND (EXISTS (SELECT 1
                                                    FROM (public."Participant" p
                                                        JOIN public."User" u ON ((u.id = p."userId")))
                                                    WHERE ((u.email = (auth.jwt() ->> 'email'::text)) AND
                                                           ((storage.foldername(objects.name))[1] = p.id)))))
    );

-- Admins can list
CREATE POLICY "Admins can list submissions"
    ON "storage"."objects"
    FOR SELECT
    TO authenticated
    USING (
    ((bucket_id = 'submissions'::text) AND (((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = 'admin'::text))
    );

-- Admins can delete
CREATE POLICY "Admins can delete submissions"
    ON "storage"."objects"
    FOR DELETE
    TO authenticated
    USING (
    ((bucket_id = 'submissions'::text) AND (((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = 'admin'::text))
    );
-- endregion
