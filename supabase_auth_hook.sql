-- Assumes that there is an is_admin flag on the profiles table.
create or replace function public.custom_access_token_hook(event jsonb)
    returns jsonb
    language plpgsql
as
$$
declare
    claims     jsonb;
    user_id    text;
    has_role   boolean := false;
    role_value text;
begin
    -- Resolve user_id from User table by email from claims
    select id into user_id from public."User" where email = (event -> 'claims' ->> 'email');

    -- If no user_id found, deny access
    if user_id is null then
        return jsonb_build_object(
                'error',
                jsonb_build_object(
                        'http_code', 403,
                        'message',
                        'User not found.'
                )
               );
    end if;

    -- Check Admin table first
    select exists(select 1
                  from public."Admin" a
                  where a."userId" = user_id)
    into has_role;

    if has_role then
        role_value := 'admin';
    else
        -- If not admin, check Participant table
        select exists(select 1
                      from public."Participant" p
                      where p."userId" = user_id)
        into has_role;

        if has_role then
            role_value := 'participant';
        end if;
    end if;

    -- If user is neither admin nor participant, deny access
    if not has_role then
        return jsonb_build_object(
                'error',
                jsonb_build_object(
                        'http_code', 403,
                        'message',
                        'User does not have any role.'
                )
               );
    end if;

    -- User has a role, attach it to the claims
    claims := event -> 'claims';

    -- Ensure user_metadata exists
    if jsonb_typeof(claims -> 'user_metadata') is null then
        claims := jsonb_set(claims, '{user_metadata}', '{}'::jsonb);
    end if;

    -- Set role claim under user_metadata
    claims := jsonb_set(
            claims,
            '{user_metadata,role}',
            to_jsonb(role_value)
              );

    -- Update event claims
    event := jsonb_set(event, '{claims}', claims);

    -- Return modified event
    return event;
end;
$$;

grant execute
    on function public.custom_access_token_hook
    to supabase_auth_admin;

revoke execute
    on function public.custom_access_token_hook
    from authenticated, anon, public;

grant select
    on table public."User", public."Admin", public."Participant"
    to supabase_auth_admin;
