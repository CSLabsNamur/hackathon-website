BEGIN;

-- Supabase custom access token hook.
--
-- Keep this hook as a coarse application-membership gate.
-- Authorization itself is enforced by the Nuxt/Prisma/CASL RBAC layer and by RBAC-aware Storage RLS.
--
-- This deliberately does not serialize application roles or permissions into the JWT.
-- Permission changes should be read from the database, not from stale tokens.
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
    RETURNS jsonb
    LANGUAGE plpgsql
AS
$$
DECLARE
    app_user_id             text;
    has_admin_profile       boolean;
    has_participant_profile boolean;
BEGIN
    -- Resolve the application user from JWT sub
    SELECT id
    INTO app_user_id
    FROM public."User"
    WHERE "supabaseAuthId" = (event -> 'claims' ->> 'sub');

    -- Deny tokens for Auth users that are not known by the application
    -- This should not happen.
    IF app_user_id IS NULL THEN
        RETURN jsonb_build_object(
                'error',
                jsonb_build_object(
                        'http_code', 403,
                        'message', 'User not found.'
                )
               );
    END IF;

    -- A user must have exactly one profile (Admin or Participant)
    SELECT EXISTS (SELECT 1 FROM public."Admin" WHERE "userId" = app_user_id)
    INTO has_admin_profile;

    SELECT EXISTS (SELECT 1 FROM public."Participant" WHERE "userId" = app_user_id)
    INTO has_participant_profile;

    IF has_admin_profile = has_participant_profile THEN
        RETURN jsonb_build_object(
                'error',
                jsonb_build_object(
                        'http_code', 403,
                        'message', 'User must have exactly one application profile.'
                )
               );
    END IF;

    RETURN event;
END;
$$;

GRANT EXECUTE
    ON FUNCTION public.custom_access_token_hook(jsonb)
    TO supabase_auth_admin;

REVOKE EXECUTE
    ON FUNCTION public.custom_access_token_hook(jsonb)
    FROM authenticated, anon, public;

-- The hook runs as supabase_auth_admin, so it needs read access to the profile tables used above
GRANT SELECT
    ON TABLE public."User", public."Admin", public."Participant"
    TO supabase_auth_admin;

GRANT USAGE ON SCHEMA "public" TO supabase_auth_admin;

COMMIT;
