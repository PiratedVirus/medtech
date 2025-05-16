--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 15.8 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: auth; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA auth;


ALTER SCHEMA auth OWNER TO supabase_admin;

--
-- Name: extensions; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA extensions;


ALTER SCHEMA extensions OWNER TO postgres;

--
-- Name: graphql; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA graphql;


ALTER SCHEMA graphql OWNER TO supabase_admin;

--
-- Name: graphql_public; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA graphql_public;


ALTER SCHEMA graphql_public OWNER TO supabase_admin;

--
-- Name: pgbouncer; Type: SCHEMA; Schema: -; Owner: pgbouncer
--

CREATE SCHEMA pgbouncer;


ALTER SCHEMA pgbouncer OWNER TO pgbouncer;

--
-- Name: realtime; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA realtime;


ALTER SCHEMA realtime OWNER TO supabase_admin;

--
-- Name: storage; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA storage;


ALTER SCHEMA storage OWNER TO supabase_admin;

--
-- Name: vault; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA vault;


ALTER SCHEMA vault OWNER TO supabase_admin;

--
-- Name: pg_graphql; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_graphql WITH SCHEMA graphql;


--
-- Name: EXTENSION pg_graphql; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_graphql IS 'pg_graphql: GraphQL support';


--
-- Name: pg_stat_statements; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA extensions;


--
-- Name: EXTENSION pg_stat_statements; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_stat_statements IS 'track planning and execution statistics of all SQL statements executed';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: pgjwt; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgjwt WITH SCHEMA extensions;


--
-- Name: EXTENSION pgjwt; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgjwt IS 'JSON Web Token API for Postgresql';


--
-- Name: supabase_vault; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;


--
-- Name: EXTENSION supabase_vault; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION supabase_vault IS 'Supabase Vault Extension';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: aal_level; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.aal_level AS ENUM (
    'aal1',
    'aal2',
    'aal3'
);


ALTER TYPE auth.aal_level OWNER TO supabase_auth_admin;

--
-- Name: code_challenge_method; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.code_challenge_method AS ENUM (
    's256',
    'plain'
);


ALTER TYPE auth.code_challenge_method OWNER TO supabase_auth_admin;

--
-- Name: factor_status; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.factor_status AS ENUM (
    'unverified',
    'verified'
);


ALTER TYPE auth.factor_status OWNER TO supabase_auth_admin;

--
-- Name: factor_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.factor_type AS ENUM (
    'totp',
    'webauthn',
    'phone'
);


ALTER TYPE auth.factor_type OWNER TO supabase_auth_admin;

--
-- Name: one_time_token_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.one_time_token_type AS ENUM (
    'confirmation_token',
    'reauthentication_token',
    'recovery_token',
    'email_change_token_new',
    'email_change_token_current',
    'phone_change_token'
);


ALTER TYPE auth.one_time_token_type OWNER TO supabase_auth_admin;

--
-- Name: UserRole; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."UserRole" AS ENUM (
    'PATIENT',
    'DOCTOR',
    'DIETICIAN',
    'LAB_TECH',
    'ADMIN',
    'SUPER_ADMIN',
    'NOT_SET'
);


ALTER TYPE public."UserRole" OWNER TO postgres;

--
-- Name: UserStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."UserStatus" AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'SUSPENDED',
    'DELETED'
);


ALTER TYPE public."UserStatus" OWNER TO postgres;

--
-- Name: action; Type: TYPE; Schema: realtime; Owner: supabase_admin
--

CREATE TYPE realtime.action AS ENUM (
    'INSERT',
    'UPDATE',
    'DELETE',
    'TRUNCATE',
    'ERROR'
);


ALTER TYPE realtime.action OWNER TO supabase_admin;

--
-- Name: equality_op; Type: TYPE; Schema: realtime; Owner: supabase_admin
--

CREATE TYPE realtime.equality_op AS ENUM (
    'eq',
    'neq',
    'lt',
    'lte',
    'gt',
    'gte',
    'in'
);


ALTER TYPE realtime.equality_op OWNER TO supabase_admin;

--
-- Name: user_defined_filter; Type: TYPE; Schema: realtime; Owner: supabase_admin
--

CREATE TYPE realtime.user_defined_filter AS (
	column_name text,
	op realtime.equality_op,
	value text
);


ALTER TYPE realtime.user_defined_filter OWNER TO supabase_admin;

--
-- Name: wal_column; Type: TYPE; Schema: realtime; Owner: supabase_admin
--

CREATE TYPE realtime.wal_column AS (
	name text,
	type_name text,
	type_oid oid,
	value jsonb,
	is_pkey boolean,
	is_selectable boolean
);


ALTER TYPE realtime.wal_column OWNER TO supabase_admin;

--
-- Name: wal_rls; Type: TYPE; Schema: realtime; Owner: supabase_admin
--

CREATE TYPE realtime.wal_rls AS (
	wal jsonb,
	is_rls_enabled boolean,
	subscription_ids uuid[],
	errors text[]
);


ALTER TYPE realtime.wal_rls OWNER TO supabase_admin;

--
-- Name: email(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION auth.email() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.email', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')
  )::text
$$;


ALTER FUNCTION auth.email() OWNER TO supabase_auth_admin;

--
-- Name: FUNCTION email(); Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON FUNCTION auth.email() IS 'Deprecated. Use auth.jwt() -> ''email'' instead.';


--
-- Name: jwt(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION auth.jwt() RETURNS jsonb
    LANGUAGE sql STABLE
    AS $$
  select 
    coalesce(
        nullif(current_setting('request.jwt.claim', true), ''),
        nullif(current_setting('request.jwt.claims', true), '')
    )::jsonb
$$;


ALTER FUNCTION auth.jwt() OWNER TO supabase_auth_admin;

--
-- Name: role(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION auth.role() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text
$$;


ALTER FUNCTION auth.role() OWNER TO supabase_auth_admin;

--
-- Name: FUNCTION role(); Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON FUNCTION auth.role() IS 'Deprecated. Use auth.jwt() -> ''role'' instead.';


--
-- Name: uid(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION auth.uid() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;


ALTER FUNCTION auth.uid() OWNER TO supabase_auth_admin;

--
-- Name: FUNCTION uid(); Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON FUNCTION auth.uid() IS 'Deprecated. Use auth.jwt() -> ''sub'' instead.';


--
-- Name: grant_pg_cron_access(); Type: FUNCTION; Schema: extensions; Owner: postgres
--

CREATE FUNCTION extensions.grant_pg_cron_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF EXISTS (
    SELECT
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_cron'
  )
  THEN
    grant usage on schema cron to postgres with grant option;

    alter default privileges in schema cron grant all on tables to postgres with grant option;
    alter default privileges in schema cron grant all on functions to postgres with grant option;
    alter default privileges in schema cron grant all on sequences to postgres with grant option;

    alter default privileges for user supabase_admin in schema cron grant all
        on sequences to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on tables to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on functions to postgres with grant option;

    grant all privileges on all tables in schema cron to postgres with grant option;
    revoke all on table cron.job from postgres;
    grant select on table cron.job to postgres with grant option;
  END IF;
END;
$$;


ALTER FUNCTION extensions.grant_pg_cron_access() OWNER TO postgres;

--
-- Name: FUNCTION grant_pg_cron_access(); Type: COMMENT; Schema: extensions; Owner: postgres
--

COMMENT ON FUNCTION extensions.grant_pg_cron_access() IS 'Grants access to pg_cron';


--
-- Name: grant_pg_graphql_access(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.grant_pg_graphql_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $_$
DECLARE
    func_is_graphql_resolve bool;
BEGIN
    func_is_graphql_resolve = (
        SELECT n.proname = 'resolve'
        FROM pg_event_trigger_ddl_commands() AS ev
        LEFT JOIN pg_catalog.pg_proc AS n
        ON ev.objid = n.oid
    );

    IF func_is_graphql_resolve
    THEN
        -- Update public wrapper to pass all arguments through to the pg_graphql resolve func
        DROP FUNCTION IF EXISTS graphql_public.graphql;
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language sql
        as $$
            select graphql.resolve(
                query := query,
                variables := coalesce(variables, '{}'),
                "operationName" := "operationName",
                extensions := extensions
            );
        $$;

        -- This hook executes when `graphql.resolve` is created. That is not necessarily the last
        -- function in the extension so we need to grant permissions on existing entities AND
        -- update default permissions to any others that are created after `graphql.resolve`
        grant usage on schema graphql to postgres, anon, authenticated, service_role;
        grant select on all tables in schema graphql to postgres, anon, authenticated, service_role;
        grant execute on all functions in schema graphql to postgres, anon, authenticated, service_role;
        grant all on all sequences in schema graphql to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on tables to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on functions to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on sequences to postgres, anon, authenticated, service_role;

        -- Allow postgres role to allow granting usage on graphql and graphql_public schemas to custom roles
        grant usage on schema graphql_public to postgres with grant option;
        grant usage on schema graphql to postgres with grant option;
    END IF;

END;
$_$;


ALTER FUNCTION extensions.grant_pg_graphql_access() OWNER TO supabase_admin;

--
-- Name: FUNCTION grant_pg_graphql_access(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION extensions.grant_pg_graphql_access() IS 'Grants access to pg_graphql';


--
-- Name: grant_pg_net_access(); Type: FUNCTION; Schema: extensions; Owner: postgres
--

CREATE FUNCTION extensions.grant_pg_net_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_net'
  )
  THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_roles
      WHERE rolname = 'supabase_functions_admin'
    )
    THEN
      CREATE USER supabase_functions_admin NOINHERIT CREATEROLE LOGIN NOREPLICATION;
    END IF;

    GRANT USAGE ON SCHEMA net TO supabase_functions_admin, postgres, anon, authenticated, service_role;

    IF EXISTS (
      SELECT FROM pg_extension
      WHERE extname = 'pg_net'
      -- all versions in use on existing projects as of 2025-02-20
      -- version 0.12.0 onwards don't need these applied
      AND extversion IN ('0.2', '0.6', '0.7', '0.7.1', '0.8', '0.10.0', '0.11.0')
    ) THEN
      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;

      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;

      REVOKE ALL ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;
      REVOKE ALL ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;

      GRANT EXECUTE ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
      GRANT EXECUTE ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
    END IF;
  END IF;
END;
$$;


ALTER FUNCTION extensions.grant_pg_net_access() OWNER TO postgres;

--
-- Name: FUNCTION grant_pg_net_access(); Type: COMMENT; Schema: extensions; Owner: postgres
--

COMMENT ON FUNCTION extensions.grant_pg_net_access() IS 'Grants access to pg_net';


--
-- Name: pgrst_ddl_watch(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.pgrst_ddl_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN SELECT * FROM pg_event_trigger_ddl_commands()
  LOOP
    IF cmd.command_tag IN (
      'CREATE SCHEMA', 'ALTER SCHEMA'
    , 'CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO', 'ALTER TABLE'
    , 'CREATE FOREIGN TABLE', 'ALTER FOREIGN TABLE'
    , 'CREATE VIEW', 'ALTER VIEW'
    , 'CREATE MATERIALIZED VIEW', 'ALTER MATERIALIZED VIEW'
    , 'CREATE FUNCTION', 'ALTER FUNCTION'
    , 'CREATE TRIGGER'
    , 'CREATE TYPE', 'ALTER TYPE'
    , 'CREATE RULE'
    , 'COMMENT'
    )
    -- don't notify in case of CREATE TEMP table or other objects created on pg_temp
    AND cmd.schema_name is distinct from 'pg_temp'
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


ALTER FUNCTION extensions.pgrst_ddl_watch() OWNER TO supabase_admin;

--
-- Name: pgrst_drop_watch(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.pgrst_drop_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  obj record;
BEGIN
  FOR obj IN SELECT * FROM pg_event_trigger_dropped_objects()
  LOOP
    IF obj.object_type IN (
      'schema'
    , 'table'
    , 'foreign table'
    , 'view'
    , 'materialized view'
    , 'function'
    , 'trigger'
    , 'type'
    , 'rule'
    )
    AND obj.is_temporary IS false -- no pg_temp objects
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


ALTER FUNCTION extensions.pgrst_drop_watch() OWNER TO supabase_admin;

--
-- Name: set_graphql_placeholder(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.set_graphql_placeholder() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $_$
    DECLARE
    graphql_is_dropped bool;
    BEGIN
    graphql_is_dropped = (
        SELECT ev.schema_name = 'graphql_public'
        FROM pg_event_trigger_dropped_objects() AS ev
        WHERE ev.schema_name = 'graphql_public'
    );

    IF graphql_is_dropped
    THEN
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language plpgsql
        as $$
            DECLARE
                server_version float;
            BEGIN
                server_version = (SELECT (SPLIT_PART((select version()), ' ', 2))::float);

                IF server_version >= 14 THEN
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql extension is not enabled.'
                            )
                        )
                    );
                ELSE
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql is only available on projects running Postgres 14 onwards.'
                            )
                        )
                    );
                END IF;
            END;
        $$;
    END IF;

    END;
$_$;


ALTER FUNCTION extensions.set_graphql_placeholder() OWNER TO supabase_admin;

--
-- Name: FUNCTION set_graphql_placeholder(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION extensions.set_graphql_placeholder() IS 'Reintroduces placeholder function for graphql_public.graphql';


--
-- Name: get_auth(text); Type: FUNCTION; Schema: pgbouncer; Owner: supabase_admin
--

CREATE FUNCTION pgbouncer.get_auth(p_usename text) RETURNS TABLE(username text, password text)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $_$
begin
    raise debug 'PgBouncer auth request: %', p_usename;

    return query
    select 
        rolname::text, 
        case when rolvaliduntil < now() 
            then null 
            else rolpassword::text 
        end 
    from pg_authid 
    where rolname=$1 and rolcanlogin;
end;
$_$;


ALTER FUNCTION pgbouncer.get_auth(p_usename text) OWNER TO supabase_admin;

--
-- Name: apply_rls(jsonb, integer); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer DEFAULT (1024 * 1024)) RETURNS SETOF realtime.wal_rls
    LANGUAGE plpgsql
    AS $$
declare
-- Regclass of the table e.g. public.notes
entity_ regclass = (quote_ident(wal ->> 'schema') || '.' || quote_ident(wal ->> 'table'))::regclass;

-- I, U, D, T: insert, update ...
action realtime.action = (
    case wal ->> 'action'
        when 'I' then 'INSERT'
        when 'U' then 'UPDATE'
        when 'D' then 'DELETE'
        else 'ERROR'
    end
);

-- Is row level security enabled for the table
is_rls_enabled bool = relrowsecurity from pg_class where oid = entity_;

subscriptions realtime.subscription[] = array_agg(subs)
    from
        realtime.subscription subs
    where
        subs.entity = entity_;

-- Subscription vars
roles regrole[] = array_agg(distinct us.claims_role::text)
    from
        unnest(subscriptions) us;

working_role regrole;
claimed_role regrole;
claims jsonb;

subscription_id uuid;
subscription_has_access bool;
visible_to_subscription_ids uuid[] = '{}';

-- structured info for wal's columns
columns realtime.wal_column[];
-- previous identity values for update/delete
old_columns realtime.wal_column[];

error_record_exceeds_max_size boolean = octet_length(wal::text) > max_record_bytes;

-- Primary jsonb output for record
output jsonb;

begin
perform set_config('role', null, true);

columns =
    array_agg(
        (
            x->>'name',
            x->>'type',
            x->>'typeoid',
            realtime.cast(
                (x->'value') #>> '{}',
                coalesce(
                    (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                    (x->>'type')::regtype
                )
            ),
            (pks ->> 'name') is not null,
            true
        )::realtime.wal_column
    )
    from
        jsonb_array_elements(wal -> 'columns') x
        left join jsonb_array_elements(wal -> 'pk') pks
            on (x ->> 'name') = (pks ->> 'name');

old_columns =
    array_agg(
        (
            x->>'name',
            x->>'type',
            x->>'typeoid',
            realtime.cast(
                (x->'value') #>> '{}',
                coalesce(
                    (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                    (x->>'type')::regtype
                )
            ),
            (pks ->> 'name') is not null,
            true
        )::realtime.wal_column
    )
    from
        jsonb_array_elements(wal -> 'identity') x
        left join jsonb_array_elements(wal -> 'pk') pks
            on (x ->> 'name') = (pks ->> 'name');

for working_role in select * from unnest(roles) loop

    -- Update `is_selectable` for columns and old_columns
    columns =
        array_agg(
            (
                c.name,
                c.type_name,
                c.type_oid,
                c.value,
                c.is_pkey,
                pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
            )::realtime.wal_column
        )
        from
            unnest(columns) c;

    old_columns =
            array_agg(
                (
                    c.name,
                    c.type_name,
                    c.type_oid,
                    c.value,
                    c.is_pkey,
                    pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
                )::realtime.wal_column
            )
            from
                unnest(old_columns) c;

    if action <> 'DELETE' and count(1) = 0 from unnest(columns) c where c.is_pkey then
        return next (
            jsonb_build_object(
                'schema', wal ->> 'schema',
                'table', wal ->> 'table',
                'type', action
            ),
            is_rls_enabled,
            -- subscriptions is already filtered by entity
            (select array_agg(s.subscription_id) from unnest(subscriptions) as s where claims_role = working_role),
            array['Error 400: Bad Request, no primary key']
        )::realtime.wal_rls;

    -- The claims role does not have SELECT permission to the primary key of entity
    elsif action <> 'DELETE' and sum(c.is_selectable::int) <> count(1) from unnest(columns) c where c.is_pkey then
        return next (
            jsonb_build_object(
                'schema', wal ->> 'schema',
                'table', wal ->> 'table',
                'type', action
            ),
            is_rls_enabled,
            (select array_agg(s.subscription_id) from unnest(subscriptions) as s where claims_role = working_role),
            array['Error 401: Unauthorized']
        )::realtime.wal_rls;

    else
        output = jsonb_build_object(
            'schema', wal ->> 'schema',
            'table', wal ->> 'table',
            'type', action,
            'commit_timestamp', to_char(
                ((wal ->> 'timestamp')::timestamptz at time zone 'utc'),
                'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
            ),
            'columns', (
                select
                    jsonb_agg(
                        jsonb_build_object(
                            'name', pa.attname,
                            'type', pt.typname
                        )
                        order by pa.attnum asc
                    )
                from
                    pg_attribute pa
                    join pg_type pt
                        on pa.atttypid = pt.oid
                where
                    attrelid = entity_
                    and attnum > 0
                    and pg_catalog.has_column_privilege(working_role, entity_, pa.attname, 'SELECT')
            )
        )
        -- Add "record" key for insert and update
        || case
            when action in ('INSERT', 'UPDATE') then
                jsonb_build_object(
                    'record',
                    (
                        select
                            jsonb_object_agg(
                                -- if unchanged toast, get column name and value from old record
                                coalesce((c).name, (oc).name),
                                case
                                    when (c).name is null then (oc).value
                                    else (c).value
                                end
                            )
                        from
                            unnest(columns) c
                            full outer join unnest(old_columns) oc
                                on (c).name = (oc).name
                        where
                            coalesce((c).is_selectable, (oc).is_selectable)
                            and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                    )
                )
            else '{}'::jsonb
        end
        -- Add "old_record" key for update and delete
        || case
            when action = 'UPDATE' then
                jsonb_build_object(
                        'old_record',
                        (
                            select jsonb_object_agg((c).name, (c).value)
                            from unnest(old_columns) c
                            where
                                (c).is_selectable
                                and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                        )
                    )
            when action = 'DELETE' then
                jsonb_build_object(
                    'old_record',
                    (
                        select jsonb_object_agg((c).name, (c).value)
                        from unnest(old_columns) c
                        where
                            (c).is_selectable
                            and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                            and ( not is_rls_enabled or (c).is_pkey ) -- if RLS enabled, we can't secure deletes so filter to pkey
                    )
                )
            else '{}'::jsonb
        end;

        -- Create the prepared statement
        if is_rls_enabled and action <> 'DELETE' then
            if (select 1 from pg_prepared_statements where name = 'walrus_rls_stmt' limit 1) > 0 then
                deallocate walrus_rls_stmt;
            end if;
            execute realtime.build_prepared_statement_sql('walrus_rls_stmt', entity_, columns);
        end if;

        visible_to_subscription_ids = '{}';

        for subscription_id, claims in (
                select
                    subs.subscription_id,
                    subs.claims
                from
                    unnest(subscriptions) subs
                where
                    subs.entity = entity_
                    and subs.claims_role = working_role
                    and (
                        realtime.is_visible_through_filters(columns, subs.filters)
                        or (
                          action = 'DELETE'
                          and realtime.is_visible_through_filters(old_columns, subs.filters)
                        )
                    )
        ) loop

            if not is_rls_enabled or action = 'DELETE' then
                visible_to_subscription_ids = visible_to_subscription_ids || subscription_id;
            else
                -- Check if RLS allows the role to see the record
                perform
                    -- Trim leading and trailing quotes from working_role because set_config
                    -- doesn't recognize the role as valid if they are included
                    set_config('role', trim(both '"' from working_role::text), true),
                    set_config('request.jwt.claims', claims::text, true);

                execute 'execute walrus_rls_stmt' into subscription_has_access;

                if subscription_has_access then
                    visible_to_subscription_ids = visible_to_subscription_ids || subscription_id;
                end if;
            end if;
        end loop;

        perform set_config('role', null, true);

        return next (
            output,
            is_rls_enabled,
            visible_to_subscription_ids,
            case
                when error_record_exceeds_max_size then array['Error 413: Payload Too Large']
                else '{}'
            end
        )::realtime.wal_rls;

    end if;
end loop;

perform set_config('role', null, true);
end;
$$;


ALTER FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) OWNER TO supabase_admin;

--
-- Name: broadcast_changes(text, text, text, text, text, record, record, text); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text DEFAULT 'ROW'::text) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    -- Declare a variable to hold the JSONB representation of the row
    row_data jsonb := '{}'::jsonb;
BEGIN
    IF level = 'STATEMENT' THEN
        RAISE EXCEPTION 'function can only be triggered for each row, not for each statement';
    END IF;
    -- Check the operation type and handle accordingly
    IF operation = 'INSERT' OR operation = 'UPDATE' OR operation = 'DELETE' THEN
        row_data := jsonb_build_object('old_record', OLD, 'record', NEW, 'operation', operation, 'table', table_name, 'schema', table_schema);
        PERFORM realtime.send (row_data, event_name, topic_name);
    ELSE
        RAISE EXCEPTION 'Unexpected operation type: %', operation;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to process the row: %', SQLERRM;
END;

$$;


ALTER FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text) OWNER TO supabase_admin;

--
-- Name: build_prepared_statement_sql(text, regclass, realtime.wal_column[]); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) RETURNS text
    LANGUAGE sql
    AS $$
      /*
      Builds a sql string that, if executed, creates a prepared statement to
      tests retrive a row from *entity* by its primary key columns.
      Example
          select realtime.build_prepared_statement_sql('public.notes', '{"id"}'::text[], '{"bigint"}'::text[])
      */
          select
      'prepare ' || prepared_statement_name || ' as
          select
              exists(
                  select
                      1
                  from
                      ' || entity || '
                  where
                      ' || string_agg(quote_ident(pkc.name) || '=' || quote_nullable(pkc.value #>> '{}') , ' and ') || '
              )'
          from
              unnest(columns) pkc
          where
              pkc.is_pkey
          group by
              entity
      $$;


ALTER FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) OWNER TO supabase_admin;

--
-- Name: cast(text, regtype); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime."cast"(val text, type_ regtype) RETURNS jsonb
    LANGUAGE plpgsql IMMUTABLE
    AS $$
    declare
      res jsonb;
    begin
      execute format('select to_jsonb(%L::'|| type_::text || ')', val)  into res;
      return res;
    end
    $$;


ALTER FUNCTION realtime."cast"(val text, type_ regtype) OWNER TO supabase_admin;

--
-- Name: check_equality_op(realtime.equality_op, regtype, text, text); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) RETURNS boolean
    LANGUAGE plpgsql IMMUTABLE
    AS $$
      /*
      Casts *val_1* and *val_2* as type *type_* and check the *op* condition for truthiness
      */
      declare
          op_symbol text = (
              case
                  when op = 'eq' then '='
                  when op = 'neq' then '!='
                  when op = 'lt' then '<'
                  when op = 'lte' then '<='
                  when op = 'gt' then '>'
                  when op = 'gte' then '>='
                  when op = 'in' then '= any'
                  else 'UNKNOWN OP'
              end
          );
          res boolean;
      begin
          execute format(
              'select %L::'|| type_::text || ' ' || op_symbol
              || ' ( %L::'
              || (
                  case
                      when op = 'in' then type_::text || '[]'
                      else type_::text end
              )
              || ')', val_1, val_2) into res;
          return res;
      end;
      $$;


ALTER FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) OWNER TO supabase_admin;

--
-- Name: is_visible_through_filters(realtime.wal_column[], realtime.user_defined_filter[]); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) RETURNS boolean
    LANGUAGE sql IMMUTABLE
    AS $_$
    /*
    Should the record be visible (true) or filtered out (false) after *filters* are applied
    */
        select
            -- Default to allowed when no filters present
            $2 is null -- no filters. this should not happen because subscriptions has a default
            or array_length($2, 1) is null -- array length of an empty array is null
            or bool_and(
                coalesce(
                    realtime.check_equality_op(
                        op:=f.op,
                        type_:=coalesce(
                            col.type_oid::regtype, -- null when wal2json version <= 2.4
                            col.type_name::regtype
                        ),
                        -- cast jsonb to text
                        val_1:=col.value #>> '{}',
                        val_2:=f.value
                    ),
                    false -- if null, filter does not match
                )
            )
        from
            unnest(filters) f
            join unnest(columns) col
                on f.column_name = col.name;
    $_$;


ALTER FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) OWNER TO supabase_admin;

--
-- Name: list_changes(name, name, integer, integer); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) RETURNS SETOF realtime.wal_rls
    LANGUAGE sql
    SET log_min_messages TO 'fatal'
    AS $$
      with pub as (
        select
          concat_ws(
            ',',
            case when bool_or(pubinsert) then 'insert' else null end,
            case when bool_or(pubupdate) then 'update' else null end,
            case when bool_or(pubdelete) then 'delete' else null end
          ) as w2j_actions,
          coalesce(
            string_agg(
              realtime.quote_wal2json(format('%I.%I', schemaname, tablename)::regclass),
              ','
            ) filter (where ppt.tablename is not null and ppt.tablename not like '% %'),
            ''
          ) w2j_add_tables
        from
          pg_publication pp
          left join pg_publication_tables ppt
            on pp.pubname = ppt.pubname
        where
          pp.pubname = publication
        group by
          pp.pubname
        limit 1
      ),
      w2j as (
        select
          x.*, pub.w2j_add_tables
        from
          pub,
          pg_logical_slot_get_changes(
            slot_name, null, max_changes,
            'include-pk', 'true',
            'include-transaction', 'false',
            'include-timestamp', 'true',
            'include-type-oids', 'true',
            'format-version', '2',
            'actions', pub.w2j_actions,
            'add-tables', pub.w2j_add_tables
          ) x
      )
      select
        xyz.wal,
        xyz.is_rls_enabled,
        xyz.subscription_ids,
        xyz.errors
      from
        w2j,
        realtime.apply_rls(
          wal := w2j.data::jsonb,
          max_record_bytes := max_record_bytes
        ) xyz(wal, is_rls_enabled, subscription_ids, errors)
      where
        w2j.w2j_add_tables <> ''
        and xyz.subscription_ids[1] is not null
    $$;


ALTER FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) OWNER TO supabase_admin;

--
-- Name: quote_wal2json(regclass); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.quote_wal2json(entity regclass) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $$
      select
        (
          select string_agg('' || ch,'')
          from unnest(string_to_array(nsp.nspname::text, null)) with ordinality x(ch, idx)
          where
            not (x.idx = 1 and x.ch = '"')
            and not (
              x.idx = array_length(string_to_array(nsp.nspname::text, null), 1)
              and x.ch = '"'
            )
        )
        || '.'
        || (
          select string_agg('' || ch,'')
          from unnest(string_to_array(pc.relname::text, null)) with ordinality x(ch, idx)
          where
            not (x.idx = 1 and x.ch = '"')
            and not (
              x.idx = array_length(string_to_array(nsp.nspname::text, null), 1)
              and x.ch = '"'
            )
          )
      from
        pg_class pc
        join pg_namespace nsp
          on pc.relnamespace = nsp.oid
      where
        pc.oid = entity
    $$;


ALTER FUNCTION realtime.quote_wal2json(entity regclass) OWNER TO supabase_admin;

--
-- Name: send(jsonb, text, text, boolean); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean DEFAULT true) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  BEGIN
    -- Set the topic configuration
    EXECUTE format('SET LOCAL realtime.topic TO %L', topic);

    -- Attempt to insert the message
    INSERT INTO realtime.messages (payload, event, topic, private, extension)
    VALUES (payload, event, topic, private, 'broadcast');
  EXCEPTION
    WHEN OTHERS THEN
      -- Capture and notify the error
      PERFORM pg_notify(
          'realtime:system',
          jsonb_build_object(
              'error', SQLERRM,
              'function', 'realtime.send',
              'event', event,
              'topic', topic,
              'private', private
          )::text
      );
  END;
END;
$$;


ALTER FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean) OWNER TO supabase_admin;

--
-- Name: subscription_check_filters(); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.subscription_check_filters() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    /*
    Validates that the user defined filters for a subscription:
    - refer to valid columns that the claimed role may access
    - values are coercable to the correct column type
    */
    declare
        col_names text[] = coalesce(
                array_agg(c.column_name order by c.ordinal_position),
                '{}'::text[]
            )
            from
                information_schema.columns c
            where
                format('%I.%I', c.table_schema, c.table_name)::regclass = new.entity
                and pg_catalog.has_column_privilege(
                    (new.claims ->> 'role'),
                    format('%I.%I', c.table_schema, c.table_name)::regclass,
                    c.column_name,
                    'SELECT'
                );
        filter realtime.user_defined_filter;
        col_type regtype;

        in_val jsonb;
    begin
        for filter in select * from unnest(new.filters) loop
            -- Filtered column is valid
            if not filter.column_name = any(col_names) then
                raise exception 'invalid column for filter %', filter.column_name;
            end if;

            -- Type is sanitized and safe for string interpolation
            col_type = (
                select atttypid::regtype
                from pg_catalog.pg_attribute
                where attrelid = new.entity
                      and attname = filter.column_name
            );
            if col_type is null then
                raise exception 'failed to lookup type for column %', filter.column_name;
            end if;

            -- Set maximum number of entries for in filter
            if filter.op = 'in'::realtime.equality_op then
                in_val = realtime.cast(filter.value, (col_type::text || '[]')::regtype);
                if coalesce(jsonb_array_length(in_val), 0) > 100 then
                    raise exception 'too many values for `in` filter. Maximum 100';
                end if;
            else
                -- raises an exception if value is not coercable to type
                perform realtime.cast(filter.value, col_type);
            end if;

        end loop;

        -- Apply consistent order to filters so the unique constraint on
        -- (subscription_id, entity, filters) can't be tricked by a different filter order
        new.filters = coalesce(
            array_agg(f order by f.column_name, f.op, f.value),
            '{}'
        ) from unnest(new.filters) f;

        return new;
    end;
    $$;


ALTER FUNCTION realtime.subscription_check_filters() OWNER TO supabase_admin;

--
-- Name: to_regrole(text); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.to_regrole(role_name text) RETURNS regrole
    LANGUAGE sql IMMUTABLE
    AS $$ select role_name::regrole $$;


ALTER FUNCTION realtime.to_regrole(role_name text) OWNER TO supabase_admin;

--
-- Name: topic(); Type: FUNCTION; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE FUNCTION realtime.topic() RETURNS text
    LANGUAGE sql STABLE
    AS $$
select nullif(current_setting('realtime.topic', true), '')::text;
$$;


ALTER FUNCTION realtime.topic() OWNER TO supabase_realtime_admin;

--
-- Name: can_insert_object(text, text, uuid, jsonb); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  INSERT INTO "storage"."objects" ("bucket_id", "name", "owner", "metadata") VALUES (bucketid, name, owner, metadata);
  -- hack to rollback the successful insert
  RAISE sqlstate 'PT200' using
  message = 'ROLLBACK',
  detail = 'rollback successful insert';
END
$$;


ALTER FUNCTION storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb) OWNER TO supabase_storage_admin;

--
-- Name: extension(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.extension(name text) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
_parts text[];
_filename text;
BEGIN
	select string_to_array(name, '/') into _parts;
	select _parts[array_length(_parts,1)] into _filename;
	-- @todo return the last part instead of 2
	return reverse(split_part(reverse(_filename), '.', 1));
END
$$;


ALTER FUNCTION storage.extension(name text) OWNER TO supabase_storage_admin;

--
-- Name: filename(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.filename(name text) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
_parts text[];
BEGIN
	select string_to_array(name, '/') into _parts;
	return _parts[array_length(_parts,1)];
END
$$;


ALTER FUNCTION storage.filename(name text) OWNER TO supabase_storage_admin;

--
-- Name: foldername(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.foldername(name text) RETURNS text[]
    LANGUAGE plpgsql
    AS $$
DECLARE
_parts text[];
BEGIN
	select string_to_array(name, '/') into _parts;
	return _parts[1:array_length(_parts,1)-1];
END
$$;


ALTER FUNCTION storage.foldername(name text) OWNER TO supabase_storage_admin;

--
-- Name: get_size_by_bucket(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.get_size_by_bucket() RETURNS TABLE(size bigint, bucket_id text)
    LANGUAGE plpgsql
    AS $$
BEGIN
    return query
        select sum((metadata->>'size')::int) as size, obj.bucket_id
        from "storage".objects as obj
        group by obj.bucket_id;
END
$$;


ALTER FUNCTION storage.get_size_by_bucket() OWNER TO supabase_storage_admin;

--
-- Name: list_multipart_uploads_with_delimiter(text, text, text, integer, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.list_multipart_uploads_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, next_key_token text DEFAULT ''::text, next_upload_token text DEFAULT ''::text) RETURNS TABLE(key text, id text, created_at timestamp with time zone)
    LANGUAGE plpgsql
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(key COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                        substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1)))
                    ELSE
                        key
                END AS key, id, created_at
            FROM
                storage.s3_multipart_uploads
            WHERE
                bucket_id = $5 AND
                key ILIKE $1 || ''%'' AND
                CASE
                    WHEN $4 != '''' AND $6 = '''' THEN
                        CASE
                            WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                                substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                key COLLATE "C" > $4
                            END
                    ELSE
                        true
                END AND
                CASE
                    WHEN $6 != '''' THEN
                        id COLLATE "C" > $6
                    ELSE
                        true
                    END
            ORDER BY
                key COLLATE "C" ASC, created_at ASC) as e order by key COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_key_token, bucket_id, next_upload_token;
END;
$_$;


ALTER FUNCTION storage.list_multipart_uploads_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer, next_key_token text, next_upload_token text) OWNER TO supabase_storage_admin;

--
-- Name: list_objects_with_delimiter(text, text, text, integer, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.list_objects_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, start_after text DEFAULT ''::text, next_token text DEFAULT ''::text) RETURNS TABLE(name text, id uuid, metadata jsonb, updated_at timestamp with time zone)
    LANGUAGE plpgsql
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(name COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(name from length($1) + 1)) > 0 THEN
                        substring(name from 1 for length($1) + position($2 IN substring(name from length($1) + 1)))
                    ELSE
                        name
                END AS name, id, metadata, updated_at
            FROM
                storage.objects
            WHERE
                bucket_id = $5 AND
                name ILIKE $1 || ''%'' AND
                CASE
                    WHEN $6 != '''' THEN
                    name COLLATE "C" > $6
                ELSE true END
                AND CASE
                    WHEN $4 != '''' THEN
                        CASE
                            WHEN position($2 IN substring(name from length($1) + 1)) > 0 THEN
                                substring(name from 1 for length($1) + position($2 IN substring(name from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                name COLLATE "C" > $4
                            END
                    ELSE
                        true
                END
            ORDER BY
                name COLLATE "C" ASC) as e order by name COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_token, bucket_id, start_after;
END;
$_$;


ALTER FUNCTION storage.list_objects_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer, start_after text, next_token text) OWNER TO supabase_storage_admin;

--
-- Name: operation(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.operation() RETURNS text
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    RETURN current_setting('storage.operation', true);
END;
$$;


ALTER FUNCTION storage.operation() OWNER TO supabase_storage_admin;

--
-- Name: search(text, text, integer, integer, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.search(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
declare
  v_order_by text;
  v_sort_order text;
begin
  case
    when sortcolumn = 'name' then
      v_order_by = 'name';
    when sortcolumn = 'updated_at' then
      v_order_by = 'updated_at';
    when sortcolumn = 'created_at' then
      v_order_by = 'created_at';
    when sortcolumn = 'last_accessed_at' then
      v_order_by = 'last_accessed_at';
    else
      v_order_by = 'name';
  end case;

  case
    when sortorder = 'asc' then
      v_sort_order = 'asc';
    when sortorder = 'desc' then
      v_sort_order = 'desc';
    else
      v_sort_order = 'asc';
  end case;

  v_order_by = v_order_by || ' ' || v_sort_order;

  return query execute
    'with folders as (
       select path_tokens[$1] as folder
       from storage.objects
         where objects.name ilike $2 || $3 || ''%''
           and bucket_id = $4
           and array_length(objects.path_tokens, 1) <> $1
       group by folder
       order by folder ' || v_sort_order || '
     )
     (select folder as "name",
            null as id,
            null as updated_at,
            null as created_at,
            null as last_accessed_at,
            null as metadata from folders)
     union all
     (select path_tokens[$1] as "name",
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
     from storage.objects
     where objects.name ilike $2 || $3 || ''%''
       and bucket_id = $4
       and array_length(objects.path_tokens, 1) = $1
     order by ' || v_order_by || ')
     limit $5
     offset $6' using levels, prefix, search, bucketname, limits, offsets;
end;
$_$;


ALTER FUNCTION storage.search(prefix text, bucketname text, limits integer, levels integer, offsets integer, search text, sortcolumn text, sortorder text) OWNER TO supabase_storage_admin;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW; 
END;
$$;


ALTER FUNCTION storage.update_updated_at_column() OWNER TO supabase_storage_admin;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: audit_log_entries; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.audit_log_entries (
    instance_id uuid,
    id uuid NOT NULL,
    payload json,
    created_at timestamp with time zone,
    ip_address character varying(64) DEFAULT ''::character varying NOT NULL
);


ALTER TABLE auth.audit_log_entries OWNER TO supabase_auth_admin;

--
-- Name: TABLE audit_log_entries; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.audit_log_entries IS 'Auth: Audit trail for user actions.';


--
-- Name: flow_state; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.flow_state (
    id uuid NOT NULL,
    user_id uuid,
    auth_code text NOT NULL,
    code_challenge_method auth.code_challenge_method NOT NULL,
    code_challenge text NOT NULL,
    provider_type text NOT NULL,
    provider_access_token text,
    provider_refresh_token text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    authentication_method text NOT NULL,
    auth_code_issued_at timestamp with time zone
);


ALTER TABLE auth.flow_state OWNER TO supabase_auth_admin;

--
-- Name: TABLE flow_state; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.flow_state IS 'stores metadata for pkce logins';


--
-- Name: identities; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.identities (
    provider_id text NOT NULL,
    user_id uuid NOT NULL,
    identity_data jsonb NOT NULL,
    provider text NOT NULL,
    last_sign_in_at timestamp with time zone,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    email text GENERATED ALWAYS AS (lower((identity_data ->> 'email'::text))) STORED,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


ALTER TABLE auth.identities OWNER TO supabase_auth_admin;

--
-- Name: TABLE identities; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.identities IS 'Auth: Stores identities associated to a user.';


--
-- Name: COLUMN identities.email; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.identities.email IS 'Auth: Email is a generated column that references the optional email property in the identity_data';


--
-- Name: instances; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.instances (
    id uuid NOT NULL,
    uuid uuid,
    raw_base_config text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


ALTER TABLE auth.instances OWNER TO supabase_auth_admin;

--
-- Name: TABLE instances; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.instances IS 'Auth: Manages users across multiple sites.';


--
-- Name: mfa_amr_claims; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.mfa_amr_claims (
    session_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    authentication_method text NOT NULL,
    id uuid NOT NULL
);


ALTER TABLE auth.mfa_amr_claims OWNER TO supabase_auth_admin;

--
-- Name: TABLE mfa_amr_claims; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.mfa_amr_claims IS 'auth: stores authenticator method reference claims for multi factor authentication';


--
-- Name: mfa_challenges; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.mfa_challenges (
    id uuid NOT NULL,
    factor_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    verified_at timestamp with time zone,
    ip_address inet NOT NULL,
    otp_code text,
    web_authn_session_data jsonb
);


ALTER TABLE auth.mfa_challenges OWNER TO supabase_auth_admin;

--
-- Name: TABLE mfa_challenges; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.mfa_challenges IS 'auth: stores metadata about challenge requests made';


--
-- Name: mfa_factors; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.mfa_factors (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    friendly_name text,
    factor_type auth.factor_type NOT NULL,
    status auth.factor_status NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    secret text,
    phone text,
    last_challenged_at timestamp with time zone,
    web_authn_credential jsonb,
    web_authn_aaguid uuid
);


ALTER TABLE auth.mfa_factors OWNER TO supabase_auth_admin;

--
-- Name: TABLE mfa_factors; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.mfa_factors IS 'auth: stores metadata about factors';


--
-- Name: one_time_tokens; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.one_time_tokens (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    token_type auth.one_time_token_type NOT NULL,
    token_hash text NOT NULL,
    relates_to text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT one_time_tokens_token_hash_check CHECK ((char_length(token_hash) > 0))
);


ALTER TABLE auth.one_time_tokens OWNER TO supabase_auth_admin;

--
-- Name: refresh_tokens; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.refresh_tokens (
    instance_id uuid,
    id bigint NOT NULL,
    token character varying(255),
    user_id character varying(255),
    revoked boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    parent character varying(255),
    session_id uuid
);


ALTER TABLE auth.refresh_tokens OWNER TO supabase_auth_admin;

--
-- Name: TABLE refresh_tokens; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.refresh_tokens IS 'Auth: Store of tokens used to refresh JWT tokens once they expire.';


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: auth; Owner: supabase_auth_admin
--

CREATE SEQUENCE auth.refresh_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE auth.refresh_tokens_id_seq OWNER TO supabase_auth_admin;

--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: auth; Owner: supabase_auth_admin
--

ALTER SEQUENCE auth.refresh_tokens_id_seq OWNED BY auth.refresh_tokens.id;


--
-- Name: saml_providers; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.saml_providers (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    entity_id text NOT NULL,
    metadata_xml text NOT NULL,
    metadata_url text,
    attribute_mapping jsonb,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    name_id_format text,
    CONSTRAINT "entity_id not empty" CHECK ((char_length(entity_id) > 0)),
    CONSTRAINT "metadata_url not empty" CHECK (((metadata_url = NULL::text) OR (char_length(metadata_url) > 0))),
    CONSTRAINT "metadata_xml not empty" CHECK ((char_length(metadata_xml) > 0))
);


ALTER TABLE auth.saml_providers OWNER TO supabase_auth_admin;

--
-- Name: TABLE saml_providers; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.saml_providers IS 'Auth: Manages SAML Identity Provider connections.';


--
-- Name: saml_relay_states; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.saml_relay_states (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    request_id text NOT NULL,
    for_email text,
    redirect_to text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    flow_state_id uuid,
    CONSTRAINT "request_id not empty" CHECK ((char_length(request_id) > 0))
);


ALTER TABLE auth.saml_relay_states OWNER TO supabase_auth_admin;

--
-- Name: TABLE saml_relay_states; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.saml_relay_states IS 'Auth: Contains SAML Relay State information for each Service Provider initiated login.';


--
-- Name: schema_migrations; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.schema_migrations (
    version character varying(255) NOT NULL
);


ALTER TABLE auth.schema_migrations OWNER TO supabase_auth_admin;

--
-- Name: TABLE schema_migrations; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.schema_migrations IS 'Auth: Manages updates to the auth system.';


--
-- Name: sessions; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.sessions (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    factor_id uuid,
    aal auth.aal_level,
    not_after timestamp with time zone,
    refreshed_at timestamp without time zone,
    user_agent text,
    ip inet,
    tag text
);


ALTER TABLE auth.sessions OWNER TO supabase_auth_admin;

--
-- Name: TABLE sessions; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.sessions IS 'Auth: Stores session data associated to a user.';


--
-- Name: COLUMN sessions.not_after; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.sessions.not_after IS 'Auth: Not after is a nullable column that contains a timestamp after which the session should be regarded as expired.';


--
-- Name: sso_domains; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.sso_domains (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    domain text NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    CONSTRAINT "domain not empty" CHECK ((char_length(domain) > 0))
);


ALTER TABLE auth.sso_domains OWNER TO supabase_auth_admin;

--
-- Name: TABLE sso_domains; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.sso_domains IS 'Auth: Manages SSO email address domain mapping to an SSO Identity Provider.';


--
-- Name: sso_providers; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.sso_providers (
    id uuid NOT NULL,
    resource_id text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    CONSTRAINT "resource_id not empty" CHECK (((resource_id = NULL::text) OR (char_length(resource_id) > 0)))
);


ALTER TABLE auth.sso_providers OWNER TO supabase_auth_admin;

--
-- Name: TABLE sso_providers; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.sso_providers IS 'Auth: Manages SSO identity provider information; see saml_providers for SAML.';


--
-- Name: COLUMN sso_providers.resource_id; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.sso_providers.resource_id IS 'Auth: Uniquely identifies a SSO provider according to a user-chosen resource ID (case insensitive), useful in infrastructure as code.';


--
-- Name: users; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.users (
    instance_id uuid,
    id uuid NOT NULL,
    aud character varying(255),
    role character varying(255),
    email character varying(255),
    encrypted_password character varying(255),
    email_confirmed_at timestamp with time zone,
    invited_at timestamp with time zone,
    confirmation_token character varying(255),
    confirmation_sent_at timestamp with time zone,
    recovery_token character varying(255),
    recovery_sent_at timestamp with time zone,
    email_change_token_new character varying(255),
    email_change character varying(255),
    email_change_sent_at timestamp with time zone,
    last_sign_in_at timestamp with time zone,
    raw_app_meta_data jsonb,
    raw_user_meta_data jsonb,
    is_super_admin boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    phone text DEFAULT NULL::character varying,
    phone_confirmed_at timestamp with time zone,
    phone_change text DEFAULT ''::character varying,
    phone_change_token character varying(255) DEFAULT ''::character varying,
    phone_change_sent_at timestamp with time zone,
    confirmed_at timestamp with time zone GENERATED ALWAYS AS (LEAST(email_confirmed_at, phone_confirmed_at)) STORED,
    email_change_token_current character varying(255) DEFAULT ''::character varying,
    email_change_confirm_status smallint DEFAULT 0,
    banned_until timestamp with time zone,
    reauthentication_token character varying(255) DEFAULT ''::character varying,
    reauthentication_sent_at timestamp with time zone,
    is_sso_user boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    is_anonymous boolean DEFAULT false NOT NULL,
    CONSTRAINT users_email_change_confirm_status_check CHECK (((email_change_confirm_status >= 0) AND (email_change_confirm_status <= 2)))
);


ALTER TABLE auth.users OWNER TO supabase_auth_admin;

--
-- Name: TABLE users; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.users IS 'Auth: Stores user login data within a secure schema.';


--
-- Name: COLUMN users.is_sso_user; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.users.is_sso_user IS 'Auth: Set this column to true when the account comes from SSO. These accounts can have duplicate emails.';


--
-- Name: Appointment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Appointment" (
    id integer NOT NULL,
    "patientId" integer NOT NULL,
    "doctorId" integer NOT NULL,
    "consultationType" text NOT NULL,
    "doctorAvailabilityId" integer NOT NULL,
    "prescriptionLink" text,
    "appointmentFor" text,
    "fullName" text,
    mobile text,
    email text,
    "isDietician" boolean,
    "appointmentDate" timestamp(3) without time zone,
    "appointmentLink" text,
    "subscriptionId" integer,
    status text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp(3) without time zone,
    "deletedAt" timestamp(3) without time zone
);


ALTER TABLE public."Appointment" OWNER TO postgres;

--
-- Name: Appointment_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Appointment_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."Appointment_id_seq" OWNER TO postgres;

--
-- Name: Appointment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Appointment_id_seq" OWNED BY public."Appointment".id;


--
-- Name: Clinic; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Clinic" (
    id integer NOT NULL,
    name text NOT NULL,
    subdomain text,
    domain text,
    address text,
    "contactInfo" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


ALTER TABLE public."Clinic" OWNER TO postgres;

--
-- Name: ClinicSpecialization; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ClinicSpecialization" (
    id integer NOT NULL,
    "clinicId" integer NOT NULL,
    name text NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


ALTER TABLE public."ClinicSpecialization" OWNER TO postgres;

--
-- Name: ClinicSpecialization_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."ClinicSpecialization_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."ClinicSpecialization_id_seq" OWNER TO postgres;

--
-- Name: ClinicSpecialization_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."ClinicSpecialization_id_seq" OWNED BY public."ClinicSpecialization".id;


--
-- Name: Clinic_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Clinic_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."Clinic_id_seq" OWNER TO postgres;

--
-- Name: Clinic_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Clinic_id_seq" OWNED BY public."Clinic".id;


--
-- Name: Complaint; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Complaint" (
    id integer NOT NULL,
    text text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


ALTER TABLE public."Complaint" OWNER TO postgres;

--
-- Name: Complaint_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Complaint_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."Complaint_id_seq" OWNER TO postgres;

--
-- Name: Complaint_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Complaint_id_seq" OWNED BY public."Complaint".id;


--
-- Name: DieticianAvailability; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."DieticianAvailability" (
    id integer NOT NULL,
    "dieticianId" integer NOT NULL,
    "dayOfWeek" text NOT NULL,
    "startTime" text NOT NULL,
    "endTime" text NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


ALTER TABLE public."DieticianAvailability" OWNER TO postgres;

--
-- Name: DieticianAvailability_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."DieticianAvailability_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."DieticianAvailability_id_seq" OWNER TO postgres;

--
-- Name: DieticianAvailability_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."DieticianAvailability_id_seq" OWNED BY public."DieticianAvailability".id;


--
-- Name: DieticianProfile; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."DieticianProfile" (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    specialty text,
    "yearsOfExperience" integer,
    certifications text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


ALTER TABLE public."DieticianProfile" OWNER TO postgres;

--
-- Name: DieticianProfile_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."DieticianProfile_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."DieticianProfile_id_seq" OWNER TO postgres;

--
-- Name: DieticianProfile_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."DieticianProfile_id_seq" OWNED BY public."DieticianProfile".id;


--
-- Name: DoctorAvailability; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."DoctorAvailability" (
    id integer NOT NULL,
    "doctorId" integer NOT NULL,
    date date NOT NULL,
    "startTime" text NOT NULL,
    "endTime" text NOT NULL,
    status text NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


ALTER TABLE public."DoctorAvailability" OWNER TO postgres;

--
-- Name: DoctorAvailability_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."DoctorAvailability_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."DoctorAvailability_id_seq" OWNER TO postgres;

--
-- Name: DoctorAvailability_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."DoctorAvailability_id_seq" OWNED BY public."DoctorAvailability".id;


--
-- Name: DoctorProfile; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."DoctorProfile" (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    specialty text NOT NULL,
    "yearsOfExperience" integer,
    "meetingRoomLink" text,
    "ownerToken1" text,
    "ownerToken2" text,
    "licenseNumber" text,
    "consultationFee" integer NOT NULL,
    rating double precision,
    type text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone,
    "extraInfo" text,
    "isDietician" boolean
);


ALTER TABLE public."DoctorProfile" OWNER TO postgres;

--
-- Name: DoctorProfile_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."DoctorProfile_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."DoctorProfile_id_seq" OWNER TO postgres;

--
-- Name: DoctorProfile_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."DoctorProfile_id_seq" OWNED BY public."DoctorProfile".id;


--
-- Name: HealthMetric; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."HealthMetric" (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    "metricName" text NOT NULL,
    reading double precision NOT NULL,
    "recordedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


ALTER TABLE public."HealthMetric" OWNER TO postgres;

--
-- Name: HealthMetric_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."HealthMetric_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."HealthMetric_id_seq" OWNER TO postgres;

--
-- Name: HealthMetric_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."HealthMetric_id_seq" OWNED BY public."HealthMetric".id;


--
-- Name: LabBooking; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."LabBooking" (
    id integer NOT NULL,
    "patientId" integer NOT NULL,
    "labTechId" integer,
    "labPackageId" integer NOT NULL,
    "appointmentFor" text,
    "fullName" text,
    mobile text,
    email text,
    address text,
    "paymentOption" text,
    status text NOT NULL,
    "labDate" timestamp(3) without time zone NOT NULL,
    "labResult" text[] DEFAULT ARRAY[]::text[],
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


ALTER TABLE public."LabBooking" OWNER TO postgres;

--
-- Name: LabBooking_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."LabBooking_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."LabBooking_id_seq" OWNER TO postgres;

--
-- Name: LabBooking_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."LabBooking_id_seq" OWNED BY public."LabBooking".id;


--
-- Name: LabPackage; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."LabPackage" (
    id integer NOT NULL,
    name text NOT NULL,
    "shortDescription" text,
    description text,
    price integer NOT NULL,
    parameters jsonb,
    "criticalRequirements" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


ALTER TABLE public."LabPackage" OWNER TO postgres;

--
-- Name: LabPackage_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."LabPackage_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."LabPackage_id_seq" OWNER TO postgres;

--
-- Name: LabPackage_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."LabPackage_id_seq" OWNED BY public."LabPackage".id;


--
-- Name: LabTechProfile; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."LabTechProfile" (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    specialization text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


ALTER TABLE public."LabTechProfile" OWNER TO postgres;

--
-- Name: LabTechProfile_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."LabTechProfile_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."LabTechProfile_id_seq" OWNER TO postgres;

--
-- Name: LabTechProfile_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."LabTechProfile_id_seq" OWNED BY public."LabTechProfile".id;


--
-- Name: Medicine; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Medicine" (
    id integer NOT NULL,
    name text NOT NULL,
    category text,
    description text,
    price integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


ALTER TABLE public."Medicine" OWNER TO postgres;

--
-- Name: Medicine_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Medicine_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."Medicine_id_seq" OWNER TO postgres;

--
-- Name: Medicine_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Medicine_id_seq" OWNED BY public."Medicine".id;


--
-- Name: PatientProfile; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PatientProfile" (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    "subscriptionId" integer,
    "planId" integer,
    age integer NOT NULL,
    weight double precision,
    height double precision,
    gender text NOT NULL,
    "bloodGroup" text,
    allergies text,
    "medicalHistory" text,
    "emergencyContact" text,
    "dateOfBirth" timestamp(3) without time zone,
    address text,
    "profilePicture" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


ALTER TABLE public."PatientProfile" OWNER TO postgres;

--
-- Name: PatientProfile_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."PatientProfile_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."PatientProfile_id_seq" OWNER TO postgres;

--
-- Name: PatientProfile_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."PatientProfile_id_seq" OWNED BY public."PatientProfile".id;


--
-- Name: Payment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Payment" (
    id integer NOT NULL,
    "appointmentId" integer,
    "labBookingId" integer,
    "subscriptionId" integer,
    "razorpayOrderId" text,
    "razorpayPaymentId" text,
    amount integer NOT NULL,
    currency text DEFAULT 'INR'::text NOT NULL,
    "paymentStatus" text NOT NULL,
    "paymentMethod" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone,
    "deletedAt" timestamp(3) without time zone
);


ALTER TABLE public."Payment" OWNER TO postgres;

--
-- Name: Payment_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Payment_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."Payment_id_seq" OWNER TO postgres;

--
-- Name: Payment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Payment_id_seq" OWNED BY public."Payment".id;


--
-- Name: Plan; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Plan" (
    id integer NOT NULL,
    name text NOT NULL,
    duration text NOT NULL,
    price numeric(10,2),
    "discountPercentage" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


ALTER TABLE public."Plan" OWNER TO postgres;

--
-- Name: PlanFeature; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PlanFeature" (
    id integer NOT NULL,
    "planId" integer NOT NULL,
    "featureName" text NOT NULL,
    "occurrencesPerInterval" integer,
    "intervalInMonths" integer,
    parameters text,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


ALTER TABLE public."PlanFeature" OWNER TO postgres;

--
-- Name: PlanFeature_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."PlanFeature_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."PlanFeature_id_seq" OWNER TO postgres;

--
-- Name: PlanFeature_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."PlanFeature_id_seq" OWNED BY public."PlanFeature".id;


--
-- Name: Plan_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Plan_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."Plan_id_seq" OWNER TO postgres;

--
-- Name: Plan_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Plan_id_seq" OWNED BY public."Plan".id;


--
-- Name: SubscriptionTracker; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."SubscriptionTracker" (
    "subscriptionId" integer NOT NULL,
    "patientId" integer NOT NULL,
    "planId" integer NOT NULL,
    "doctorConsultationDates" text[] DEFAULT ARRAY[]::text[],
    "dieticianConsultationDates" text[] DEFAULT ARRAY[]::text[],
    "labTestsDates" text[] DEFAULT ARRAY[]::text[],
    "ophthalmologistConsultationDates" text[] DEFAULT ARRAY[]::text[],
    "usedMedicines" text[] DEFAULT ARRAY[]::text[],
    "razorpayOrderId" text,
    "razorpayPaymentId" text,
    "paymentStatus" text DEFAULT 'PENDING'::text,
    "startDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "endDate" timestamp(3) without time zone,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


ALTER TABLE public."SubscriptionTracker" OWNER TO postgres;

--
-- Name: SubscriptionTracker_subscriptionId_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."SubscriptionTracker_subscriptionId_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."SubscriptionTracker_subscriptionId_seq" OWNER TO postgres;

--
-- Name: SubscriptionTracker_subscriptionId_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."SubscriptionTracker_subscriptionId_seq" OWNED BY public."SubscriptionTracker"."subscriptionId";


--
-- Name: User; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."User" (
    id integer NOT NULL,
    "clinicId" integer,
    "phoneNumber" text NOT NULL,
    email text,
    password text,
    name text NOT NULL,
    role public."UserRole" NOT NULL,
    status public."UserStatus" DEFAULT 'ACTIVE'::public."UserStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone,
    "userProfilePicture" text
);


ALTER TABLE public."User" OWNER TO postgres;

--
-- Name: User_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."User_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."User_id_seq" OWNER TO postgres;

--
-- Name: User_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."User_id_seq" OWNED BY public."User".id;


--
-- Name: messages; Type: TABLE; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE TABLE realtime.messages (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
)
PARTITION BY RANGE (inserted_at);


ALTER TABLE realtime.messages OWNER TO supabase_realtime_admin;

--
-- Name: schema_migrations; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE realtime.schema_migrations (
    version bigint NOT NULL,
    inserted_at timestamp(0) without time zone
);


ALTER TABLE realtime.schema_migrations OWNER TO supabase_admin;

--
-- Name: subscription; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE realtime.subscription (
    id bigint NOT NULL,
    subscription_id uuid NOT NULL,
    entity regclass NOT NULL,
    filters realtime.user_defined_filter[] DEFAULT '{}'::realtime.user_defined_filter[] NOT NULL,
    claims jsonb NOT NULL,
    claims_role regrole GENERATED ALWAYS AS (realtime.to_regrole((claims ->> 'role'::text))) STORED NOT NULL,
    created_at timestamp without time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);


ALTER TABLE realtime.subscription OWNER TO supabase_admin;

--
-- Name: subscription_id_seq; Type: SEQUENCE; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE realtime.subscription ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME realtime.subscription_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: buckets; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.buckets (
    id text NOT NULL,
    name text NOT NULL,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    public boolean DEFAULT false,
    avif_autodetection boolean DEFAULT false,
    file_size_limit bigint,
    allowed_mime_types text[],
    owner_id text
);


ALTER TABLE storage.buckets OWNER TO supabase_storage_admin;

--
-- Name: COLUMN buckets.owner; Type: COMMENT; Schema: storage; Owner: supabase_storage_admin
--

COMMENT ON COLUMN storage.buckets.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: migrations; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.migrations (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    hash character varying(40) NOT NULL,
    executed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE storage.migrations OWNER TO supabase_storage_admin;

--
-- Name: objects; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.objects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    bucket_id text,
    name text,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    last_accessed_at timestamp with time zone DEFAULT now(),
    metadata jsonb,
    path_tokens text[] GENERATED ALWAYS AS (string_to_array(name, '/'::text)) STORED,
    version text,
    owner_id text,
    user_metadata jsonb
);


ALTER TABLE storage.objects OWNER TO supabase_storage_admin;

--
-- Name: COLUMN objects.owner; Type: COMMENT; Schema: storage; Owner: supabase_storage_admin
--

COMMENT ON COLUMN storage.objects.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: s3_multipart_uploads; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.s3_multipart_uploads (
    id text NOT NULL,
    in_progress_size bigint DEFAULT 0 NOT NULL,
    upload_signature text NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    version text NOT NULL,
    owner_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_metadata jsonb
);


ALTER TABLE storage.s3_multipart_uploads OWNER TO supabase_storage_admin;

--
-- Name: s3_multipart_uploads_parts; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.s3_multipart_uploads_parts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    upload_id text NOT NULL,
    size bigint DEFAULT 0 NOT NULL,
    part_number integer NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    etag text NOT NULL,
    owner_id text,
    version text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE storage.s3_multipart_uploads_parts OWNER TO supabase_storage_admin;

--
-- Name: refresh_tokens id; Type: DEFAULT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('auth.refresh_tokens_id_seq'::regclass);


--
-- Name: Appointment id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Appointment" ALTER COLUMN id SET DEFAULT nextval('public."Appointment_id_seq"'::regclass);


--
-- Name: Clinic id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Clinic" ALTER COLUMN id SET DEFAULT nextval('public."Clinic_id_seq"'::regclass);


--
-- Name: ClinicSpecialization id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ClinicSpecialization" ALTER COLUMN id SET DEFAULT nextval('public."ClinicSpecialization_id_seq"'::regclass);


--
-- Name: Complaint id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Complaint" ALTER COLUMN id SET DEFAULT nextval('public."Complaint_id_seq"'::regclass);


--
-- Name: DieticianAvailability id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DieticianAvailability" ALTER COLUMN id SET DEFAULT nextval('public."DieticianAvailability_id_seq"'::regclass);


--
-- Name: DieticianProfile id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DieticianProfile" ALTER COLUMN id SET DEFAULT nextval('public."DieticianProfile_id_seq"'::regclass);


--
-- Name: DoctorAvailability id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DoctorAvailability" ALTER COLUMN id SET DEFAULT nextval('public."DoctorAvailability_id_seq"'::regclass);


--
-- Name: DoctorProfile id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DoctorProfile" ALTER COLUMN id SET DEFAULT nextval('public."DoctorProfile_id_seq"'::regclass);


--
-- Name: HealthMetric id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."HealthMetric" ALTER COLUMN id SET DEFAULT nextval('public."HealthMetric_id_seq"'::regclass);


--
-- Name: LabBooking id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."LabBooking" ALTER COLUMN id SET DEFAULT nextval('public."LabBooking_id_seq"'::regclass);


--
-- Name: LabPackage id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."LabPackage" ALTER COLUMN id SET DEFAULT nextval('public."LabPackage_id_seq"'::regclass);


--
-- Name: LabTechProfile id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."LabTechProfile" ALTER COLUMN id SET DEFAULT nextval('public."LabTechProfile_id_seq"'::regclass);


--
-- Name: Medicine id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Medicine" ALTER COLUMN id SET DEFAULT nextval('public."Medicine_id_seq"'::regclass);


--
-- Name: PatientProfile id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PatientProfile" ALTER COLUMN id SET DEFAULT nextval('public."PatientProfile_id_seq"'::regclass);


--
-- Name: Payment id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Payment" ALTER COLUMN id SET DEFAULT nextval('public."Payment_id_seq"'::regclass);


--
-- Name: Plan id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Plan" ALTER COLUMN id SET DEFAULT nextval('public."Plan_id_seq"'::regclass);


--
-- Name: PlanFeature id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PlanFeature" ALTER COLUMN id SET DEFAULT nextval('public."PlanFeature_id_seq"'::regclass);


--
-- Name: SubscriptionTracker subscriptionId; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SubscriptionTracker" ALTER COLUMN "subscriptionId" SET DEFAULT nextval('public."SubscriptionTracker_subscriptionId_seq"'::regclass);


--
-- Name: User id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User" ALTER COLUMN id SET DEFAULT nextval('public."User_id_seq"'::regclass);


--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) FROM stdin;
\.


--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.flow_state (id, user_id, auth_code, code_challenge_method, code_challenge, provider_type, provider_access_token, provider_refresh_token, created_at, updated_at, authentication_method, auth_code_issued_at) FROM stdin;
\.


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id) FROM stdin;
\.


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.instances (id, uuid, raw_base_config, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.mfa_amr_claims (session_id, created_at, updated_at, authentication_method, id) FROM stdin;
\.


--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.mfa_challenges (id, factor_id, created_at, verified_at, ip_address, otp_code, web_authn_session_data) FROM stdin;
\.


--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.mfa_factors (id, user_id, friendly_name, factor_type, status, created_at, updated_at, secret, phone, last_challenged_at, web_authn_credential, web_authn_aaguid) FROM stdin;
\.


--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.one_time_tokens (id, user_id, token_type, token_hash, relates_to, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.refresh_tokens (instance_id, id, token, user_id, revoked, created_at, updated_at, parent, session_id) FROM stdin;
\.


--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.saml_providers (id, sso_provider_id, entity_id, metadata_xml, metadata_url, attribute_mapping, created_at, updated_at, name_id_format) FROM stdin;
\.


--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.saml_relay_states (id, sso_provider_id, request_id, for_email, redirect_to, created_at, updated_at, flow_state_id) FROM stdin;
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.schema_migrations (version) FROM stdin;
20171026211738
20171026211808
20171026211834
20180103212743
20180108183307
20180119214651
20180125194653
00
20210710035447
20210722035447
20210730183235
20210909172000
20210927181326
20211122151130
20211124214934
20211202183645
20220114185221
20220114185340
20220224000811
20220323170000
20220429102000
20220531120530
20220614074223
20220811173540
20221003041349
20221003041400
20221011041400
20221020193600
20221021073300
20221021082433
20221027105023
20221114143122
20221114143410
20221125140132
20221208132122
20221215195500
20221215195800
20221215195900
20230116124310
20230116124412
20230131181311
20230322519590
20230402418590
20230411005111
20230508135423
20230523124323
20230818113222
20230914180801
20231027141322
20231114161723
20231117164230
20240115144230
20240214120130
20240306115329
20240314092811
20240427152123
20240612123726
20240729123726
20240802193726
20240806073726
20241009103726
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.sessions (id, user_id, created_at, updated_at, factor_id, aal, not_after, refreshed_at, user_agent, ip, tag) FROM stdin;
\.


--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.sso_domains (id, sso_provider_id, domain, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.sso_providers (id, resource_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, invited_at, confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at, email_change_token_new, email_change, email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, phone_change, phone_change_token, phone_change_sent_at, email_change_token_current, email_change_confirm_status, banned_until, reauthentication_token, reauthentication_sent_at, is_sso_user, deleted_at, is_anonymous) FROM stdin;
\.


--
-- Data for Name: Appointment; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Appointment" (id, "patientId", "doctorId", "consultationType", "doctorAvailabilityId", "prescriptionLink", "appointmentFor", "fullName", mobile, email, "isDietician", "appointmentDate", "appointmentLink", "subscriptionId", status, "createdAt", "updatedAt", "deletedAt") FROM stdin;
3	18	4	Video	1	\N	self	Anjali Kulkarni	+919699787615		f	2025-05-06 18:30:00	\N	4	Scheduled	2025-05-05 07:44:34.461	2025-05-05 07:44:34.461	\N
\.


--
-- Data for Name: Clinic; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Clinic" (id, name, subdomain, domain, address, "contactInfo", "createdAt", "updatedAt", "deletedAt") FROM stdin;
1	Padmaram Healthcare	\N	\N	Garkheda, CSN	8208534977	2025-04-30 09:45:04.285	2025-04-30 09:45:04.285	\N
\.


--
-- Data for Name: ClinicSpecialization; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ClinicSpecialization" (id, "clinicId", name, "deletedAt") FROM stdin;
\.


--
-- Data for Name: Complaint; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Complaint" (id, text, "createdAt", "updatedAt", "deletedAt") FROM stdin;
\.


--
-- Data for Name: DieticianAvailability; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."DieticianAvailability" (id, "dieticianId", "dayOfWeek", "startTime", "endTime", "deletedAt") FROM stdin;
\.


--
-- Data for Name: DieticianProfile; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."DieticianProfile" (id, "userId", specialty, "yearsOfExperience", certifications, "createdAt", "updatedAt", "deletedAt") FROM stdin;
1	6	Nutritionist	5	\N	2025-04-30 10:53:08.544	2025-04-30 10:53:08.544	\N
\.


--
-- Data for Name: DoctorAvailability; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."DoctorAvailability" (id, "doctorId", date, "startTime", "endTime", status, "deletedAt") FROM stdin;
1	2	2025-05-06	11:00 AM	09:30 AM	booked	\N
3	3	2025-05-12	02:15 PM	02:30 PM	available	\N
5	2	2025-05-10	07:30 PM	08:00 PM	available	\N
4	4	2025-05-13	09:00 AM	09:30 AM	available	\N
6	1	2025-05-11	12:15 PM	12:30 PM	available	\N
7	4	2025-05-14	01:15 PM	02:00 PM	available	\N
8	1	2025-05-12	02:15 PM	02:45 PM	available	\N
12	7	2025-05-16	12:00 AM	12:15 AM	available	\N
13	2	2025-05-12	10:00 AM	10:30 AM	available	\N
15	7	2025-05-12	02:00 PM	03:00 PM	available	\N
16	7	2025-05-12	06:00 PM	07:00 PM	available	\N
18	2	2025-05-12	03:00 PM	03:30 PM	available	\N
9	7	2025-05-15	12:00 AM	12:15 AM	available	\N
14	7	2025-05-15	02:00 PM	03:00 PM	available	\N
19	7	2025-05-14	01:00 AM	01:15 AM	available	\N
20	7	2025-05-15	07:00 AM	07:15 AM	available	\N
17	7	2025-05-17	02:30 PM	03:00 PM	available	\N
21	2	2025-05-15	12:15 PM	01:15 PM	available	\N
2	2	2025-05-17	12:15 PM	12:45 PM	available	\N
\.


--
-- Data for Name: DoctorProfile; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."DoctorProfile" (id, "userId", specialty, "yearsOfExperience", "meetingRoomLink", "ownerToken1", "ownerToken2", "licenseNumber", "consultationFee", rating, type, "createdAt", "updatedAt", "deletedAt", "extraInfo", "isDietician") FROM stdin;
1	3	Endocrinology	8	https://care-diabieties-test.daily.co/doctor-3-1746008554687	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvIjp0cnVlLCJyIjoiZG9jdG9yLTMtMTc0NjAwODU1NDY4NyIsImQiOiJmZDRhZjgyZS0xZGJjLTRhYzAtYjFjZS03NmJjMzE1YmU4ZWUiLCJpYXQiOjE3NDYwMDg1NTZ9.Xd2DO5keViS1MrXb28eoFS42Ks49iBQzFB70lyf9Z1c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvIjp0cnVlLCJyIjoiZG9jdG9yLTMtMTc0NjAwODU1NDY4NyIsImQiOiJmZDRhZjgyZS0xZGJjLTRhYzAtYjFjZS03NmJjMzE1YmU4ZWUiLCJpYXQiOjE3NDYwMDg1NTZ9.Xd2DO5keViS1MrXb28eoFS42Ks49iBQzFB70lyf9Z1c	\N	999	\N	\N	2025-04-30 10:22:36.654	2025-05-15 20:23:09.924	\N	\N	f
2	4	Endocrinology	11	https://care-diabieties-test.daily.co/doctor-4-1746008632862	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvIjp0cnVlLCJyIjoiZG9jdG9yLTQtMTc0NjAwODYzMjg2MiIsImQiOiJmZDRhZjgyZS0xZGJjLTRhYzAtYjFjZS03NmJjMzE1YmU4ZWUiLCJpYXQiOjE3NDYwMDg2MzR9.70_j3A6cHoibrUbT8zpGpbVtjUzyJQKZ3dKY9H2RRZc	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvIjp0cnVlLCJyIjoiZG9jdG9yLTQtMTc0NjAwODYzMjg2MiIsImQiOiJmZDRhZjgyZS0xZGJjLTRhYzAtYjFjZS03NmJjMzE1YmU4ZWUiLCJpYXQiOjE3NDYwMDg2MzR9.70_j3A6cHoibrUbT8zpGpbVtjUzyJQKZ3dKY9H2RRZc	\N	999	\N	\N	2025-04-30 10:23:54.69	2025-05-15 20:23:09.924	\N	\N	f
7	6	Nutritionst	6	https://care-diabieties-test.daily.co/doctor-6-1746989383241	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvIjp0cnVlLCJyIjoiZG9jdG9yLTYtMTc0Njk4OTM4MzI0MSIsImQiOiJmZDRhZjgyZS0xZGJjLTRhYzAtYjFjZS03NmJjMzE1YmU4ZWUiLCJpYXQiOjE3NDY5ODkzODR9.6arJH4FqRzB9IMXPC6G8NvPwuX8aVZ9J6wdLvvLDGD0	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvIjp0cnVlLCJyIjoiZG9jdG9yLTYtMTc0Njk4OTM4MzI0MSIsImQiOiJmZDRhZjgyZS0xZGJjLTRhYzAtYjFjZS03NmJjMzE1YmU4ZWUiLCJpYXQiOjE3NDY5ODkzODV9.cSpbPUFDnMbsDETUzzPIY2n-C4qoNaMf7chSryDjTrA	\N	499	\N	\N	2025-05-11 18:49:45.16	2025-05-11 18:49:45.16	\N	\N	t
3	5	Endocrinology	16	https://care-diabieties-test.daily.co/doctor-5-1746008692141	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvIjp0cnVlLCJyIjoiZG9jdG9yLTUtMTc0NjAwODY5MjE0MSIsImQiOiJmZDRhZjgyZS0xZGJjLTRhYzAtYjFjZS03NmJjMzE1YmU4ZWUiLCJpYXQiOjE3NDYwMDg2OTN9.7ojw7CNFTcfxxyFaZAxtWaquzKK2GUeFR89xUSyWDAE	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvIjp0cnVlLCJyIjoiZG9jdG9yLTUtMTc0NjAwODY5MjE0MSIsImQiOiJmZDRhZjgyZS0xZGJjLTRhYzAtYjFjZS03NmJjMzE1YmU4ZWUiLCJpYXQiOjE3NDYwMDg2OTN9.7ojw7CNFTcfxxyFaZAxtWaquzKK2GUeFR89xUSyWDAE	\N	999	\N	\N	2025-04-30 10:24:53.972	2025-05-15 20:23:09.924	\N	\N	f
4	22	Endocrinology	11	https://care-diabieties-test.daily.co/doctor-22-1746889439028	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvIjp0cnVlLCJyIjoiZG9jdG9yLTIyLTE3NDY4ODk0MzkwMjgiLCJkIjoiZmQ0YWY4MmUtMWRiYy00YWMwLWIxY2UtNzZiYzMxNWJlOGVlIiwiaWF0IjoxNzQ2ODg5NDQwfQ.fvnOtMzxRDpMwuP1-prWGFGGfiFziLEIL82t0Bnc-5M	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvIjp0cnVlLCJyIjoiZG9jdG9yLTIyLTE3NDY4ODk0MzkwMjgiLCJkIjoiZmQ0YWY4MmUtMWRiYy00YWMwLWIxY2UtNzZiYzMxNWJlOGVlIiwiaWF0IjoxNzQ2ODg5NDQwfQ.fvnOtMzxRDpMwuP1-prWGFGGfiFziLEIL82t0Bnc-5M	\N	500	\N	\N	2025-05-10 15:04:00.879	2025-05-12 05:26:44.029	\N	\N	f
8	19	MBBS	2	https://care-diabieties-test.daily.co/doctor-19-1747027273005	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvIjp0cnVlLCJyIjoiZG9jdG9yLTE5LTE3NDcwMjcyNzMwMDUiLCJkIjoiZmQ0YWY4MmUtMWRiYy00YWMwLWIxY2UtNzZiYzMxNWJlOGVlIiwiaWF0IjoxNzQ3MDI3MjczfQ.8vlnCpwlvCNbQK_6LPNDEL5a9bMHw0_KnXFNLC9PApc	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvIjp0cnVlLCJyIjoiZG9jdG9yLTE5LTE3NDcwMjcyNzMwMDUiLCJkIjoiZmQ0YWY4MmUtMWRiYy00YWMwLWIxY2UtNzZiYzMxNWJlOGVlIiwiaWF0IjoxNzQ3MDI3MjczfQ.8vlnCpwlvCNbQK_6LPNDEL5a9bMHw0_KnXFNLC9PApc	\N	499	\N	\N	2025-05-12 05:21:13.571	2025-05-13 15:17:21.492	2025-05-13 15:17:21.491	\N	f
9	9	Multi	1	https://care-diabieties-test.daily.co/doctor-9-1747332392345	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvIjp0cnVlLCJyIjoiZG9jdG9yLTktMTc0NzMzMjM5MjM0NSIsImQiOiJmZDRhZjgyZS0xZGJjLTRhYzAtYjFjZS03NmJjMzE1YmU4ZWUiLCJpYXQiOjE3NDczMzIzOTR9.QABf0trw9TMkPpoimxVgpjDbBD0lw81p48gW_9fryDk	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvIjp0cnVlLCJyIjoiZG9jdG9yLTktMTc0NzMzMjM5MjM0NSIsImQiOiJmZDRhZjgyZS0xZGJjLTRhYzAtYjFjZS03NmJjMzE1YmU4ZWUiLCJpYXQiOjE3NDczMzIzOTR9.QABf0trw9TMkPpoimxVgpjDbBD0lw81p48gW_9fryDk	\N	199	\N	\N	2025-05-15 18:06:34.938	2025-05-15 18:06:34.938	\N	\N	f
10	31	kk	99	https://care-diabieties-test.daily.co/doctor-31-1747334749269	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvIjp0cnVlLCJyIjoiZG9jdG9yLTMxLTE3NDczMzQ3NDkyNjkiLCJkIjoiZmQ0YWY4MmUtMWRiYy00YWMwLWIxY2UtNzZiYzMxNWJlOGVlIiwiaWF0IjoxNzQ3MzM0NzUxfQ.tX1b0frhB6N_ErdEfD4xYlcgVP5yrGnB40mkVaVFAlE	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvIjp0cnVlLCJyIjoiZG9jdG9yLTMxLTE3NDczMzQ3NDkyNjkiLCJkIjoiZmQ0YWY4MmUtMWRiYy00YWMwLWIxY2UtNzZiYzMxNWJlOGVlIiwiaWF0IjoxNzQ3MzM0NzUxfQ.tX1b0frhB6N_ErdEfD4xYlcgVP5yrGnB40mkVaVFAlE	\N	999	\N	\N	2025-05-15 18:45:51.623	2025-05-15 18:45:51.623	\N	\N	f
5	23	Endocrinologist	15	https://care-diabieties-test.daily.co/doctor-23-1746894760625	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvIjp0cnVlLCJyIjoiZG9jdG9yLTIzLTE3NDY4OTQ3NjA2MjUiLCJkIjoiZmQ0YWY4MmUtMWRiYy00YWMwLWIxY2UtNzZiYzMxNWJlOGVlIiwiaWF0IjoxNzQ2ODk0NzYxfQ.vxsQOPKJEoINn79XUVC_fCzknxp5F-K2cJw3fYt9_nQ	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvIjp0cnVlLCJyIjoiZG9jdG9yLTIzLTE3NDY4OTQ3NjA2MjUiLCJkIjoiZmQ0YWY4MmUtMWRiYy00YWMwLWIxY2UtNzZiYzMxNWJlOGVlIiwiaWF0IjoxNzQ2ODk0NzYxfQ.vxsQOPKJEoINn79XUVC_fCzknxp5F-K2cJw3fYt9_nQ	\N	500	\N	\N	2025-05-10 16:32:41.177	2025-05-15 20:23:09.924	\N	\N	f
11	33	xx	44	https://care-diabieties-test.daily.co/doctor-33-1747372498988	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvIjp0cnVlLCJyIjoiZG9jdG9yLTMzLTE3NDczNzI0OTg5ODgiLCJkIjoiZmQ0YWY4MmUtMWRiYy00YWMwLWIxY2UtNzZiYzMxNWJlOGVlIiwiaWF0IjoxNzQ3MzcyNTAwfQ.PrT7-XJNDLqXjmi4bty5x0N4U56eXuH40_74rltr-jM	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvIjp0cnVlLCJyIjoiZG9jdG9yLTMzLTE3NDczNzI0OTg5ODgiLCJkIjoiZmQ0YWY4MmUtMWRiYy00YWMwLWIxY2UtNzZiYzMxNWJlOGVlIiwiaWF0IjoxNzQ3MzcyNTAwfQ.PrT7-XJNDLqXjmi4bty5x0N4U56eXuH40_74rltr-jM	\N	200	\N	\N	2025-05-16 05:15:00.845	2025-05-16 06:26:17.869	2025-05-16 06:26:17.864	\N	t
\.


--
-- Data for Name: HealthMetric; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."HealthMetric" (id, "userId", "metricName", reading, "recordedAt", "createdAt", "updatedAt", "deletedAt") FROM stdin;
1	13	Blood Glucose	200	2025-05-05 03:20:00	2025-05-05 03:20:39.072	2025-05-05 03:30:02.223	\N
2	13	Blood Glucose	180	2025-04-05 03:20:00	2025-05-05 03:20:58.659	2025-05-05 03:30:07.512	\N
3	9	Blood Glucose	204	2025-05-06 18:34:00	2025-05-05 13:04:50.336	2025-05-05 13:04:50.336	\N
4	9	Blood Glucose	204	2025-05-06 18:34:00	2025-05-05 13:04:51.846	2025-05-05 13:04:51.846	\N
5	9	Body Fat	32	2025-05-05 13:05:37.293	2025-05-05 13:05:37.332	2025-05-05 13:05:37.332	\N
6	9	Muscle Mass	24	2025-05-05 13:05:52.672	2025-05-05 13:05:52.673	2025-05-05 13:05:52.673	\N
7	9	BMI	23	2025-05-05 13:06:14.247	2025-05-05 13:06:14.249	2025-05-05 13:06:14.249	\N
8	9	Visceral Fat	12	2025-05-05 13:06:29.492	2025-05-05 13:06:29.493	2025-05-05 13:06:29.493	\N
\.


--
-- Data for Name: LabBooking; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."LabBooking" (id, "patientId", "labTechId", "labPackageId", "appointmentFor", "fullName", mobile, email, address, "paymentOption", status, "labDate", "labResult", "createdAt", "updatedAt", "deletedAt") FROM stdin;
4	12	\N	2	self	Ram Aurange	+918149306224	ram@gmail.com	6,Sector no.93,Vrundawan Colony,	clinic	Scheduled	2025-05-07 00:00:00	{https://7cgjyrzzbjeb6kff.public.blob.vercel-storage.com/Ram-Aurange-labReport-4-padmaram%20logo_20250426_192811_0000.pdf}	2025-05-05 03:00:11.436	2025-05-16 06:51:16.391	\N
\.


--
-- Data for Name: LabPackage; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."LabPackage" (id, name, "shortDescription", description, price, parameters, "criticalRequirements", "createdAt", "updatedAt", "deletedAt") FROM stdin;
2	Basic		In this Lab test you will get tested for HbA1C, FBS, 2 hr PP the basic test needed for diabetes testing and management.	499	"{\\"Basic\\":[\\"Fasting Plasma Glucose\\", \\"HbA1C\\", \\"Glucose Post Prandial\\"]}"	Fasting Required, Package	2025-05-01 14:41:52.88	2025-05-11 15:47:56.865	\N
3	Blood glucose			149	"{\\"Basic\\":[\\"Fasting Plasma Glucose\\", \\"Glucose Post Prandial\\"]}"	Fasting required	2025-05-05 12:30:39.745	2025-05-05 12:32:04.026	\N
1	Care+		CBC: Detects infections, anemia, and blood disorders\t. \t•LFT: Assesses liver health (ALT, AST, Bilirubin, etc.). \t•\tKFT: Checks kidney function (Creatinine, Urea, Electrolytes). \t•\tThyroid Panel: Evaluates thyroid issues (TSH, T3, T4). \t•\tLipid Profile: Measures cholesterol and heart risk. \t•\tBlood Sugar & HbA1c: Detects and monitors diabetes.  Urine Panel \t•\tUrinalysis: Screens for infections, kidney issues, diabetes. \t•\tMicroalbumin: Early detection of diabetic kidney damage.  \t•Vitamin B12 status  \t•Vit D status.	1999	"{   \\"FBS\\": [\\"Fasting Plasma Glucose\\"], \\"HbA1C\\": [\\"HbA1C (Glycosylated Hemoglobin)\\"], \\"2 hour PP\\": [\\"Glucose Post Prandial\\"], \\"LFT (Liver function test)\\": [     \\"Serum Bilirubin (Indirect)\\", \\"SGOT / AST\\", \\"SGPT / ALT\\", \\"Total Protein\\", \\"Albumin\\", \\"Albumin Globulin A/G Ratio\\", \\"Alkaline Phosphatase\\", \\"AST / ALT Ratio\\", \\"Bilirubin Direct\\", \\"Bilirubin Total\\", \\"Globulin\\"   ], \\"KFT (Kidney function test)\\": [     \\"Urea\\", \\"Blood Urea\\", \\"Blood Urea Nitrogen (BUN)\\", \\"Creatinine\\", \\"BUN Creatinine Ratio\\", \\"Uric Acid\\", \\"Electrolytes (Na/K/Cl)\\", \\"Sodium\\", \\"Potassium\\", \\"Chloride\\", \\"Total Protein\\", \\"Albumin\\", \\"Globulin\\", \\"Albumin Globulin A/G Ratio\\", \\"pH Level\\", \\"Specific Gravity\\", \\"Remarks\\", \\"Bilirubin\\", \\"Urobilinogen\\", \\"Nitrite\\", \\"Pus Cells, Urine\\", \\"RBC, Urine\\", \\"Epithelial Cells, Urine\\", \\"Colour, Urine\\", \\"Appearance\\", \\"Casts\\", \\"Crystals\\", \\"Bacteria\\", \\"Blood\\", \\"Glucose\\", \\"Protein\\", \\"Ketones\\"   ], \\"Lipid Profile\\": [     \\"Total Cholesterol\\", \\"Triglycerides\\", \\"HDL Cholesterol\\", \\"VLDL Cholesterol\\", \\"LDL Cholesterol (Calculated)\\", \\"HDL/LDL Ratio\\", \\"HDL/Total Cholesterol Ratio\\"   ], \\"Urine ACR\\": [     \\"Microalbumin, Urine\\", \\"Creatinine, Urine\\", \\"Albumin Creatinine Ratio\\"   ], \\"Throid Profile Test\\": [     \\"TSH\\", \\"T3\\", \\"T4\\"   ], \\"Urine R/M\\": [     \\"Colour\\", \\"Odour\\", \\"pH\\", \\"Specific gravity\\"   ], \\"CBC\\": [     \\"Haemoglobin (Hb)\\", \\"Total WBC Count / TLC\\", \\"RBC Count\\", \\"PCV / Hematocrit\\", \\"MCV\\", \\"MCH\\", \\"MCHC\\", \\"RDW (Red Cell Distribution Width)\\", \\"DLC (Differential Leucocyte Count)\\", \\"Platelet Count\\", \\"MPV (Mean Platelet Volume)\\", \\"Absolute Neutrophil Count (ANC)\\", \\"Absolute Eosinophil Count (AEC)\\", \\"Absolute Lymphocyte Count\\", \\"Absolute Monocyte Count\\", \\"Absolute Basophil Count\\", \\"Meta Myelocytes\\", \\"Myelocytes\\", \\"Blasts / Atypical Cells\\", \\"Atypical Lymphocytes\\", \\"Neutrophils\\", \\"Lymphocytes\\", \\"Monocytes\\", \\"Basophils\\", \\"Eosinophils\\", \\"Band Forms\\", \\"Pro Myelocytes\\", \\"Pro Lymphocytes\\", \\"Plasma Cells\\", \\"Nucleated RBC Count\\"   ], \\"Vitamin D\\": [\\"Vitamin D 25 - Hydroxy\\"], \\"Vitamin B12\\": [\\"Vitamin B12\\"] }"	Fasting required, Package	2025-05-01 09:49:18.163	2025-05-11 15:49:04.544	\N
4	Care		CBC: Detects infections, anemia, and blood disorders\t. \t•LFT: Assesses liver health (ALT, AST, Bilirubin, etc.). \t•\tKFT: Checks kidney function (Creatinine, Urea, Electrolytes). \t•\tThyroid Panel: Evaluates thyroid issues (TSH, T3, T4). \t•\tLipid Profile: Measures cholesterol and heart risk. \t•\tBlood Sugar & HbA1c: Detects and monitors diabetes.  Urine Panel \t•\tUrinalysis: Screens for infections, kidney issues, diabetes. \t•\tMicroalbumin: Early detection of diabetic kidney damage.  	1499	"{   \\"FBS\\": [\\"Fasting Plasma Glucose\\"], \\"HbA1C\\": [\\"HbA1C (Glycosylated Hemoglobin)\\"], \\"2 hour PP\\": [\\"Glucose Post Prandial\\"], \\"LFT (Liver function test)\\": [     \\"Serum Bilirubin (Indirect)\\", \\"SGOT / AST\\", \\"SGPT / ALT\\", \\"Total Protein\\", \\"Albumin\\", \\"Albumin Globulin A/G Ratio\\", \\"Alkaline Phosphatase\\", \\"AST / ALT Ratio\\", \\"Bilirubin Direct\\", \\"Bilirubin Total\\", \\"Globulin\\"   ], \\"KFT (Kidney function test)\\": [     \\"Urea\\", \\"Blood Urea\\", \\"Blood Urea Nitrogen (BUN)\\", \\"Creatinine\\", \\"BUN Creatinine Ratio\\", \\"Uric Acid\\", \\"Electrolytes (Na/K/Cl)\\", \\"Sodium\\", \\"Potassium\\", \\"Chloride\\", \\"pH\\", \\"Specific Gravity\\", \\"Remarks\\", \\"Urobilinogen\\", \\"Nitrite\\", \\"Pus Cells, Urine\\", \\"RBC, Urine\\", \\"Epithelial Cells, Urine\\", \\"Colour\\", \\"Odour\\", \\"Appearance\\", \\"Casts\\", \\"Crystals\\", \\"Bacteria\\", \\"Blood\\", \\"Glucose\\", \\"Protein\\", \\"Ketones\\"   ], \\"Lipid Profile\\": [     \\"Total Cholesterol\\", \\"Triglycerides\\", \\"HDL Cholesterol\\", \\"VLDL Cholesterol\\", \\"LDL Cholesterol (Calculated)\\", \\"HDL/LDL Ratio\\", \\"HDL/Total Cholesterol Ratio\\"   ], \\"Urine ACR\\": [     \\"Microalbumin, Urine\\", \\"Creatinine, Urine\\", \\"Albumin Creatinine Ratio\\"   ], \\"Thyroid Profile Test\\": [\\"TSH\\", \\"T3\\", \\"T4\\"], \\"CBC\\": [     \\"Haemoglobin (Hb)\\", \\"Total WBC Count / TLC\\", \\"RBC Count\\", \\"PCV / Hematocrit\\", \\"MCV\\", \\"MCH\\", \\"MCHC\\", \\"RDW (Red Cell Distribution Width)\\", \\"DLC (Differential Leucocyte Count)\\", \\"Platelet Count\\", \\"MPV (Mean Platelet Volume)\\", \\"Absolute Neutrophil Count (ANC)\\", \\"Absolute Eosinophil Count (AEC)\\", \\"Absolute Lymphocyte Count\\", \\"Absolute Monocyte Count\\", \\"Absolute Basophil Count\\", \\"Meta Myelocytes\\", \\"Myelocytes\\", \\"Blasts / Atypical Cells\\", \\"Atypical Lymphocytes\\", \\"Neutrophils\\", \\"Lymphocytes\\", \\"Monocytes\\", \\"Basophils\\", \\"Eosinophils\\", \\"Band Forms\\", \\"Pro Myelocytes\\", \\"Pro Lymphocytes\\", \\"Plasma Cells\\", \\"Nucleated RBC Count\\"   ] }"	Fasting required, Package	2025-05-06 10:36:10.217	2025-05-11 15:49:35.352	\N
\.


--
-- Data for Name: LabTechProfile; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."LabTechProfile" (id, "userId", specialization, "createdAt", "updatedAt", "deletedAt") FROM stdin;
\.


--
-- Data for Name: Medicine; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Medicine" (id, name, category, description, price, "createdAt", "updatedAt", "deletedAt") FROM stdin;
\.


--
-- Data for Name: PatientProfile; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PatientProfile" (id, "userId", "subscriptionId", "planId", age, weight, height, gender, "bloodGroup", allergies, "medicalHistory", "emergencyContact", "dateOfBirth", address, "profilePicture", "createdAt", "updatedAt", "deletedAt") FROM stdin;
1	2	\N	\N	27	\N	\N	Male	\N	\N	\N	\N	\N	\N	\N	2025-04-30 09:45:40.047	2025-04-30 09:45:40.047	\N
2	7	\N	\N	55	\N	\N	Male	\N	\N	\N	\N	\N	\N	\N	2025-04-30 12:30:46.858	2025-04-30 12:30:46.858	\N
4	10	\N	\N	24	\N	\N	Male	\N	\N	\N	\N	\N	\N	\N	2025-05-01 05:27:16.564	2025-05-01 05:27:16.564	\N
5	11	\N	\N	23	\N	\N	Male	\N	\N	\N	\N	\N	\N	\N	2025-05-01 09:58:16.13	2025-05-01 09:58:16.13	\N
6	12	1	2	56	\N	\N	Male	\N	\N	\N	\N	\N	\N	\N	2025-05-01 15:52:49.433	2025-05-01 15:57:11.54	\N
7	13	\N	\N	23	\N	\N	Male	\N	\N	\N	\N	\N	\N	\N	2025-05-02 07:47:31.726	2025-05-02 07:47:31.726	\N
8	14	\N	\N	24	\N	\N	Male	\N	\N	\N	\N	\N	\N	\N	2025-05-02 07:50:42.959	2025-05-02 07:50:42.959	\N
9	16	\N	\N	56	\N	\N	Male	\N	\N	\N	\N	\N	\N	\N	2025-05-02 13:01:43.21	2025-05-02 13:01:43.21	\N
10	17	\N	\N	78	\N	\N	Female	\N	\N	\N	\N	\N	\N	\N	2025-05-02 19:20:18.121	2025-05-02 19:20:18.121	\N
11	18	4	1	22	\N	\N	Female	\N	\N	\N	\N	\N	\N	\N	2025-05-05 04:44:12.105	2025-05-05 05:33:02.353	\N
12	20	\N	\N	37	\N	\N	Female	\N	\N	\N	\N	\N	\N	\N	2025-05-09 05:58:12.029	2025-05-09 05:58:12.029	\N
13	21	\N	\N	57	\N	\N	Male	\N	\N	\N	\N	\N	\N	\N	2025-05-09 12:56:41.192	2025-05-09 12:56:41.192	\N
14	26	\N	\N	58	\N	\N	Male	\N	\N	\N	\N	\N	\N	\N	2025-05-11 09:52:06.208	2025-05-11 09:52:06.208	\N
15	29	\N	\N	20	\N	\N	Male	\N	\N	\N	\N	\N	\N	\N	2025-05-13 16:12:46.878	2025-05-13 16:12:46.878	\N
16	30	\N	\N	18	\N	\N	Male	\N	\N	\N	\N	\N	\N	\N	2025-05-15 04:48:53.222	2025-05-15 04:48:53.222	\N
\.


--
-- Data for Name: Payment; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Payment" (id, "appointmentId", "labBookingId", "subscriptionId", "razorpayOrderId", "razorpayPaymentId", amount, currency, "paymentStatus", "paymentMethod", "createdAt", "updatedAt", "deletedAt") FROM stdin;
1	\N	\N	1	order_QPinrEqvJM2VPk	pay_QPioURqpDetSOY	599900	INR	Paid	upi	2025-05-01 15:57:11.089	2025-05-01 15:57:11.089	\N
2	\N	4	\N	\N	\N	49900	INR	Pending	offline	2025-05-05 03:00:11.587	2025-05-05 03:00:11.587	\N
3	\N	\N	2	order_QR7WJrwLoiMN43	pay_QR7WSFO2KlgoQ0	100	INR	Paid	upi	2025-05-05 04:46:06.593	2025-05-05 04:46:06.593	\N
4	\N	\N	3	order_QR83I9VaKOwF54	pay_QR83NFHUAHsMhd	100	INR	Paid	upi	2025-05-05 05:17:10.519	2025-05-05 05:17:10.519	\N
5	\N	\N	4	order_QR8IrHP6cfPGga	pay_QR8IyG3qHvZKEQ	100	INR	Paid	upi	2025-05-05 05:33:02.207	2025-05-05 05:33:02.207	\N
\.


--
-- Data for Name: Plan; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Plan" (id, name, duration, price, "discountPercentage", "createdAt", "updatedAt", "deletedAt") FROM stdin;
2	Care	6months	5999.00	25	2025-04-30 10:01:18.897	2025-05-07 04:53:46.138	\N
4	Basic	12months	4999.00	15	2025-04-30 10:05:43.026	2025-05-10 16:26:13.133	\N
1	Basic	6months	2599.00	15	2025-04-30 09:57:14.599	2025-05-10 16:26:42.575	\N
5	Care	12months	9999.00	25	2025-04-30 10:07:10.579	2025-05-11 15:35:22.131	\N
6	Care+	12months	16999.00	35	2025-04-30 10:08:20.891	2025-05-11 15:35:54.087	\N
3	Care+	6months	9999.00	35	2025-04-30 10:04:06.011	2025-05-06 08:25:34.878	\N
\.


--
-- Data for Name: PlanFeature; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PlanFeature" (id, "planId", "featureName", "occurrencesPerInterval", "intervalInMonths", parameters, notes, "createdAt", "updatedAt", "deletedAt") FROM stdin;
461	6	Lab Tests	1	3	    {   "FBS": ["Fasting Plasma Glucose"],   "HbA1C": ["HbA1C (Glycosylated Hemoglobin)"],   "2 hour PP": ["Glucose Post Prandial"],   "LFT (Liver function test)": [     "Serum Bilirubin (Indirect)",     "SGOT / AST",     "SGPT / ALT",     "Total Protein",     "Albumin",     "Albumin Globulin A/G Ratio",     "Alkaline Phosphatase",     "AST / ALT Ratio",     "Bilirubin Direct",     "Bilirubin Total",     "Globulin"   ],   "KFT (Kidney function test)": [     "Urea",     "Blood Urea",     "Blood Urea Nitrogen (BUN)",     "Creatinine",     "BUN Creatinine Ratio",     "Uric Acid",     "Electrolytes (Na/K/Cl)",     "Sodium",     "Potassium",     "Chloride",     "Total Protein",     "Albumin",     "Globulin",     "Albumin Globulin A/G Ratio",     "pH Level",     "Specific Gravity",     "Remarks",     "Bilirubin",     "Urobilinogen",     "Nitrite",     "Pus Cells, Urine",     "RBC, Urine",     "Epithelial Cells, Urine",     "Colour, Urine",     "Appearance",     "Casts",     "Crystals",     "Bacteria",     "Blood",     "Glucose",     "Protein",     "Ketones"   ],   "Lipid Profile": [     "Total Cholesterol",     "Triglycerides",     "HDL Cholesterol",     "VLDL Cholesterol",     "LDL Cholesterol (Calculated)",     "HDL/LDL Ratio",     "HDL/Total Cholesterol Ratio"   ],   "Urine ACR": [     "Microalbumin, Urine",     "Creatinine, Urine",     "Albumin Creatinine Ratio"   ],   "Throid Profile Test": [     "TSH",     "T3",     "T4"   ],   "Urine R/M": [     "Colour",     "Odour",     "pH",     "Specific gravity"   ],   "CBC": [     "Haemoglobin (Hb)",     "Total WBC Count / TLC",     "RBC Count",     "PCV / Hematocrit",     "MCV",     "MCH",     "MCHC",     "RDW (Red Cell Distribution Width)",     "DLC (Differential Leucocyte Count)",     "Platelet Count",     "MPV (Mean Platelet Volume)",     "Absolute Neutrophil Count (ANC)",     "Absolute Eosinophil Count (AEC)",     "Absolute Lymphocyte Count",     "Absolute Monocyte Count",     "Absolute Basophil Count",     "Meta Myelocytes",     "Myelocytes",     "Blasts / Atypical Cells",     "Atypical Lymphocytes",     "Neutrophils",     "Lymphocytes",     "Monocytes",     "Basophils",     "Eosinophils",     "Band Forms",     "Pro Myelocytes",     "Pro Lymphocytes",     "Plasma Cells",     "Nucleated RBC Count"   ],   "Vitamin D": ["Vitamin D 25 - Hydroxy"],   "Vitamin B12": ["Vitamin B12"] }	1 complete blood test + urine every 3 months	2025-05-11 15:35:54.087	2025-05-11 15:35:54.087	\N
462	6	Medicines	\N	\N		Upto 35%	2025-05-11 15:35:54.087	2025-05-11 15:35:54.087	\N
463	6	Biosthesiometer Test (Nerve Sensitivity Test)	1	3			2025-05-11 15:35:54.087	2025-05-11 15:35:54.087	\N
464	6	BP,  Body  Composition   Analysis  test	1	3			2025-05-11 15:35:54.087	2025-05-11 15:35:54.087	\N
367	2	Lab Tests	1	3	{   "FBS": ["Fasting Plasma Glucose"],   "HbA1C": ["HbA1C (Glycosylated Hemoglobin)"],   "2 hour PP": ["Glucose Post Prandial"],   "LFT (Liver function test)": [     "Serum Bilirubin (Indirect)",     "SGOT / AST",     "SGPT / ALT",     "Total Protein",     "Albumin",     "Albumin Globulin A/G Ratio",     "Alkaline Phosphatase",     "AST / ALT Ratio",     "Bilirubin Direct",     "Bilirubin Total",     "Globulin"   ],   "KFT (Kidney function test)": [     "Urea",     "Blood Urea",     "Blood Urea Nitrogen (BUN)",     "Creatinine",     "BUN Creatinine Ratio",     "Uric Acid",     "Electrolytes (Na/K/Cl)",     "Sodium",     "Potassium",     "Chloride",     "pH",     "Specific Gravity",     "Remarks",     "Urobilinogen",     "Nitrite",     "Pus Cells, Urine",     "RBC, Urine",     "Epithelial Cells, Urine",     "Colour",     "Odour",     "Appearance",     "Casts",     "Crystals",     "Bacteria",     "Blood",     "Glucose",     "Protein",     "Ketones"   ],   "Lipid Profile": [     "Total Cholesterol",     "Triglycerides",     "HDL Cholesterol",     "VLDL Cholesterol",     "LDL Cholesterol (Calculated)",     "HDL/LDL Ratio",     "HDL/Total Cholesterol Ratio"   ],   "Urine ACR": [     "Microalbumin, Urine",     "Creatinine, Urine",     "Albumin Creatinine Ratio"   ],   "Thyroid Profile Test": ["TSH", "T3", "T4"],   "CBC": [     "Haemoglobin (Hb)",     "Total WBC Count / TLC",     "RBC Count",     "PCV / Hematocrit",     "MCV",     "MCH",     "MCHC",     "RDW (Red Cell Distribution Width)",     "DLC (Differential Leucocyte Count)",     "Platelet Count",     "MPV (Mean Platelet Volume)",     "Absolute Neutrophil Count (ANC)",     "Absolute Eosinophil Count (AEC)",     "Absolute Lymphocyte Count",     "Absolute Monocyte Count",     "Absolute Basophil Count",     "Meta Myelocytes",     "Myelocytes",     "Blasts / Atypical Cells",     "Atypical Lymphocytes",     "Neutrophils",     "Lymphocytes",     "Monocytes",     "Basophils",     "Eosinophils",     "Band Forms",     "Pro Myelocytes",     "Pro Lymphocytes",     "Plasma Cells",     "Nucleated RBC Count"   ] }	1 complete blood panel and urine test + 1 FBS, HbA1c, 2hr PP	2025-05-07 04:53:46.138	2025-05-07 04:53:46.138	\N
368	2	Doctor Consultation	1	3			2025-05-07 04:53:46.138	2025-05-07 04:53:46.138	\N
369	2	Dietician Consultation	1	3			2025-05-07 04:53:46.138	2025-05-07 04:53:46.138	\N
370	2	Ophthalmologist Consultation	1	6			2025-05-07 04:53:46.138	2025-05-07 04:53:46.138	\N
371	2	Medicines	\N	\N		Upto 25% off	2025-05-07 04:53:46.138	2025-05-07 04:53:46.138	\N
372	2	BP,  Body  Composition  Analysis  test	1	3			2025-05-07 04:53:46.138	2025-05-07 04:53:46.138	\N
373	2	Biosthesiometer Test (Nerve Sensitivity Test)	1	3			2025-05-07 04:53:46.138	2025-05-07 04:53:46.138	\N
437	5	Lab Tests	1	3	{   "FBS": ["Fasting Plasma Glucose"],   "HbA1C": ["HbA1C (Glycosylated Hemoglobin)"],   "2 hour PP": ["Glucose Post Prandial"],   "LFT (Liver function test)": [     "Serum Bilirubin (Indirect)",     "SGOT / AST",     "SGPT / ALT",     "Total Protein",     "Albumin",     "Albumin Globulin A/G Ratio",     "Alkaline Phosphatase",     "AST / ALT Ratio",     "Bilirubin Direct",     "Bilirubin Total",     "Globulin"   ],   "KFT (Kidney function test)": [     "Urea",     "Blood Urea",     "Blood Urea Nitrogen (BUN)",     "Creatinine",     "BUN Creatinine Ratio",     "Uric Acid",     "Electrolytes (Na/K/Cl)",     "Sodium",     "Potassium",     "Chloride",     "pH",     "Specific Gravity",     "Remarks",     "Urobilinogen",     "Nitrite",     "Pus Cells, Urine",     "RBC, Urine",     "Epithelial Cells, Urine",     "Colour",     "Odour",     "Appearance",     "Casts",     "Crystals",     "Bacteria",     "Blood",     "Glucose",     "Protein",     "Ketones"   ],   "Lipid Profile": [     "Total Cholesterol",     "Triglycerides",     "HDL Cholesterol",     "VLDL Cholesterol",     "LDL Cholesterol (Calculated)",     "HDL/LDL Ratio",     "HDL/Total Cholesterol Ratio"   ],   "Urine ACR": [     "Microalbumin, Urine",     "Creatinine, Urine",     "Albumin Creatinine Ratio"   ],   "Thyroid Profile Test": ["TSH", "T3", "T4"],   "CBC": [     "Haemoglobin (Hb)",     "Total WBC Count / TLC",     "RBC Count",     "PCV / Hematocrit",     "MCV",     "MCH",     "MCHC",     "RDW (Red Cell Distribution Width)",     "DLC (Differential Leucocyte Count)",     "Platelet Count",     "MPV (Mean Platelet Volume)",     "Absolute Neutrophil Count (ANC)",     "Absolute Eosinophil Count (AEC)",     "Absolute Lymphocyte Count",     "Absolute Monocyte Count",     "Absolute Basophil Count",     "Meta Myelocytes",     "Myelocytes",     "Blasts / Atypical Cells",     "Atypical Lymphocytes",     "Neutrophils",     "Lymphocytes",     "Monocytes",     "Basophils",     "Eosinophils",     "Band Forms",     "Pro Myelocytes",     "Pro Lymphocytes",     "Plasma Cells",     "Nucleated RBC Count"   ] }	1 complete blood andurine test + 1 FBS, HbA1C, 2hr PP every 3 months	2025-05-11 15:35:22.131	2025-05-11 15:35:22.131	\N
438	5	Doctor Consultation	1	3			2025-05-11 15:35:22.131	2025-05-11 15:35:22.131	\N
439	5	Dietician Consultation	1	3			2025-05-11 15:35:22.131	2025-05-11 15:35:22.131	\N
440	5	Ophthalmologist Consultation	1	12			2025-05-11 15:35:22.131	2025-05-11 15:35:22.131	\N
441	5	Medicines	\N	\N		Upto 25%	2025-05-11 15:35:22.131	2025-05-11 15:35:22.131	\N
442	5	Biosthesiometer Test (Nerve Sensitivity Test)	1	3			2025-05-11 15:35:22.131	2025-05-11 15:35:22.131	\N
443	5	BP,  Body  Composition   Analysis  test	1	3			2025-05-11 15:35:22.131	2025-05-11 15:35:22.131	\N
458	6	Ophthalmologist Consultation	1	12			2025-05-11 15:35:54.087	2025-05-11 15:35:54.087	\N
459	6	Doctor Consultation	1	3			2025-05-11 15:35:54.087	2025-05-11 15:35:54.087	\N
460	6	Dietician Consultation	1	3			2025-05-11 15:35:54.087	2025-05-11 15:35:54.087	\N
409	4	Doctor Consultation	1	3			2025-05-10 16:26:13.133	2025-05-10 16:26:13.133	\N
410	4	Dietician Consultation	\N	\N			2025-05-10 16:26:13.133	2025-05-10 16:26:13.133	\N
411	4	Lab Tests	1	3	{"Basic":["Fasting Plasma Glucose" ,"HbA1C", "Glucose Post Prandial "]}	1 complete blood test + urine	2025-05-10 16:26:13.133	2025-05-10 16:26:13.133	\N
412	4	Ophthalmologist Consultation	\N	\N			2025-05-10 16:26:13.133	2025-05-10 16:26:13.133	\N
413	4	Medicines	\N	\N		Upto 15% off	2025-05-10 16:26:13.133	2025-05-10 16:26:13.133	\N
414	4	BP,  Body  Composition   Analysis  test	1	3			2025-05-10 16:26:13.133	2025-05-10 16:26:13.133	\N
415	4	Biosthesiometer Test (Nerve Sensitivity Test)	1	3			2025-05-10 16:26:13.133	2025-05-10 16:26:13.133	\N
416	1	Doctor Consultation	1	3		-------	2025-05-10 16:26:42.575	2025-05-10 16:26:42.575	\N
417	1	Dietician Consultation	\N	\N			2025-05-10 16:26:42.575	2025-05-10 16:26:42.575	\N
418	1	Lab Tests	1	3	{"Basic":["Fasting Plasma Glucose" ,"HbA1C", "Glucose Post Prandial "]}		2025-05-10 16:26:42.575	2025-05-10 16:26:42.575	\N
419	1	Ophthalmologist Consultation	\N	0			2025-05-10 16:26:42.575	2025-05-10 16:26:42.575	\N
420	1	Medicines	\N	\N		Upto 15% off	2025-05-10 16:26:42.575	2025-05-10 16:26:42.575	\N
421	1	BP,  Body  Composition  Analysis  test	1	3			2025-05-10 16:26:42.575	2025-05-10 16:26:42.575	\N
422	1	Biosthesiometer Test (Nerve Sensitivity Test)	1	3			2025-05-10 16:26:42.575	2025-05-10 16:26:42.575	\N
283	3	Lab Tests	1	3	  {   "FBS": ["Fasting Plasma Glucose"],   "HbA1C": ["HbA1C (Glycosylated Hemoglobin)"],   "2 hour PP": ["Glucose Post Prandial"],   "LFT (Liver function test)": [     "Serum Bilirubin (Indirect)",     "SGOT / AST",     "SGPT / ALT",     "Total Protein",     "Albumin",     "Albumin Globulin A/G Ratio",     "Alkaline Phosphatase",     "AST / ALT Ratio",     "Bilirubin Direct",     "Bilirubin Total",     "Globulin"   ],   "KFT (Kidney function test)": [     "Urea",     "Blood Urea",     "Blood Urea Nitrogen (BUN)",     "Creatinine",     "BUN Creatinine Ratio",     "Uric Acid",     "Electrolytes (Na/K/Cl)",     "Sodium",     "Potassium",     "Chloride",     "Total Protein",     "Albumin",     "Globulin",     "Albumin Globulin A/G Ratio",     "pH Level",     "Specific Gravity",     "Remarks",     "Bilirubin",     "Urobilinogen",     "Nitrite",     "Pus Cells, Urine",     "RBC, Urine",     "Epithelial Cells, Urine",     "Colour, Urine",     "Appearance",     "Casts",     "Crystals",     "Bacteria",     "Blood",     "Glucose",     "Protein",     "Ketones"   ],   "Lipid Profile": [     "Total Cholesterol",     "Triglycerides",     "HDL Cholesterol",     "VLDL Cholesterol",     "LDL Cholesterol (Calculated)",     "HDL/LDL Ratio",     "HDL/Total Cholesterol Ratio"   ],   "Urine ACR": [     "Microalbumin, Urine",     "Creatinine, Urine",     "Albumin Creatinine Ratio"   ],   "Throid Profile Test": [     "TSH",     "T3",     "T4"   ],   "Urine R/M": [     "Colour",     "Odour",     "pH",     "Specific gravity"   ],   "CBC": [     "Haemoglobin (Hb)",     "Total WBC Count / TLC",     "RBC Count",     "PCV / Hematocrit",     "MCV",     "MCH",     "MCHC",     "RDW (Red Cell Distribution Width)",     "DLC (Differential Leucocyte Count)",     "Platelet Count",     "MPV (Mean Platelet Volume)",     "Absolute Neutrophil Count (ANC)",     "Absolute Eosinophil Count (AEC)",     "Absolute Lymphocyte Count",     "Absolute Monocyte Count",     "Absolute Basophil Count",     "Meta Myelocytes",     "Myelocytes",     "Blasts / Atypical Cells",     "Atypical Lymphocytes",     "Neutrophils",     "Lymphocytes",     "Monocytes",     "Basophils",     "Eosinophils",     "Band Forms",     "Pro Myelocytes",     "Pro Lymphocytes",     "Plasma Cells",     "Nucleated RBC Count"   ],   "Vitamin D": ["Vitamin D 25 - Hydroxy"],   "Vitamin B12": ["Vitamin B12"] }	1 complete blood test + urine every 3 months	2025-05-06 08:25:34.878	2025-05-06 08:25:34.878	\N
284	3	Dietician Consultation	1	3			2025-05-06 08:25:34.878	2025-05-06 08:25:34.878	\N
285	3	Ophthalmologist Consultation	1	6			2025-05-06 08:25:34.878	2025-05-06 08:25:34.878	\N
286	3	Doctor Consultation	1	3			2025-05-06 08:25:34.878	2025-05-06 08:25:34.878	\N
287	3	Medicines	\N	\N		upto 35%	2025-05-06 08:25:34.878	2025-05-06 08:25:34.878	\N
288	3	BP,  Body  Composition   Analysis  test	1	3			2025-05-06 08:25:34.878	2025-05-06 08:25:34.878	\N
289	3	Biosthesiometer Test (Nerve Sensitivity Test)	1	3			2025-05-06 08:25:34.878	2025-05-06 08:25:34.878	\N
\.


--
-- Data for Name: SubscriptionTracker; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."SubscriptionTracker" ("subscriptionId", "patientId", "planId", "doctorConsultationDates", "dieticianConsultationDates", "labTestsDates", "ophthalmologistConsultationDates", "usedMedicines", "razorpayOrderId", "razorpayPaymentId", "paymentStatus", "startDate", "endDate", "isActive", "createdAt", "updatedAt", "deletedAt") FROM stdin;
1	6	2	{2025-05-01T15:57:10.632Z,2025-08-01T15:57:10.632Z}	{2025-05-01T15:57:10.632Z,2025-08-01T15:57:10.632Z}	{2025-05-01T15:57:10.632Z,2025-08-01T15:57:10.632Z}	{2025-05-01T15:57:10.633Z}	{}	order_QPinrEqvJM2VPk	pay_QPioURqpDetSOY	PAID	2025-05-01 15:57:10.634	2025-11-01 15:57:10.634	t	2025-05-01 15:57:10.636	2025-05-01 15:57:10.636	\N
2	11	1	{2025-05-05T04:46:06.463Z,2025-08-05T04:46:06.463Z}	{}	{2025-05-05T04:46:06.464Z,2025-08-05T04:46:06.464Z}	{2025-05-05T04:46:06.464Z}	{}	order_QR7WJrwLoiMN43	pay_QR7WSFO2KlgoQ0	PAID	2025-05-05 04:46:06.465	2025-11-05 04:46:06.465	f	2025-05-05 04:46:06.467	2025-05-05 05:14:12.571	\N
3	11	1	{2025-05-05T05:17:10.377Z,2025-08-05T05:17:10.377Z}	{}	{2025-05-05T05:17:10.378Z,2025-08-05T05:17:10.378Z}	{2025-05-05T05:17:10.378Z}	{}	order_QR83I9VaKOwF54	pay_QR83NFHUAHsMhd	PAID	2025-05-05 05:17:10.378	2025-11-05 05:17:10.378	f	2025-05-05 05:17:10.381	2025-05-05 05:29:06.211	\N
4	11	1	{2025-05-05T05:33:02.055Z,""}	{2025-05-08T15:57:10.632Z}	{2025-05-05T05:33:02.056Z,2025-08-05T05:33:02.056Z}	{2025-05-05T05:33:02.056Z}	{}	order_QR8IrHP6cfPGga	pay_QR8IyG3qHvZKEQ	PAID	2025-05-05 05:33:02.058	2025-11-05 05:33:02.058	t	2025-05-05 05:33:02.061	2025-05-16 07:14:53.344	\N
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."User" (id, "clinicId", "phoneNumber", email, password, name, role, status, "createdAt", "updatedAt", "deletedAt", "userProfilePicture") FROM stdin;
26	1	+917721886665	\N		Nagesh	PATIENT	ACTIVE	2025-05-11 09:52:06.208	2025-05-11 21:31:57.352	\N	\N
31	1	81493062233	s@s.com	123	Saurabh	DOCTOR	DELETED	2025-05-15 18:44:31.086	2025-05-16 05:09:59.064	2025-05-15 20:03:21.9	https://res.cloudinary.com/pirated-virus-cloud/image/upload/v1747334670/aulnyu0qgo1falkkpkxx.jpg
5	1	+911212343458	arun.singh@gmail.com	Test@123	Arun Singh	DOCTOR	ACTIVE	2025-04-30 10:13:38.613	2025-04-30 11:53:47.546	\N	https://res.cloudinary.com/pirated-virus-cloud/image/upload/v1746005030/drarun_cdayrd.png
4	1	+911212343457	setu.gupta@gmail.com	Test@123	Setu Gupta	DOCTOR	ACTIVE	2025-04-30 10:13:07.207	2025-04-30 11:54:02.606	\N	https://res.cloudinary.com/pirated-virus-cloud/image/upload/v1746005030/drsetu_hfc9ya.png
3	1	+911212343456	nikhil.gupta@gmail.com	Test@123	Nikhil Gupta	DOCTOR	ACTIVE	2025-04-30 10:12:26.11	2025-04-30 11:54:16.373	\N	https://res.cloudinary.com/pirated-virus-cloud/image/upload/v1746005032/drnikhil_o81uyg.png
7	1	+919421300873	\N	\N	Sudhir Kulkarni 	PATIENT	ACTIVE	2025-04-30 12:30:46.858	2025-04-30 12:30:46.858	\N	\N
10	1	+919763139329	\N	\N	Atharv Joshi	PATIENT	ACTIVE	2025-05-01 05:27:16.564	2025-05-01 05:27:16.564	\N	\N
11	1	+919322393149	\N	\N	Ganesh	PATIENT	ACTIVE	2025-05-01 09:58:16.13	2025-05-01 09:58:16.13	\N	\N
13	1	+919028137344	\N	\N	Hemanshu	PATIENT	ACTIVE	2025-05-02 07:47:31.726	2025-05-02 07:47:31.726	\N	\N
14	1	+919503773091	\N	\N	Hemanshu Rathod	PATIENT	ACTIVE	2025-05-02 07:50:42.959	2025-05-02 07:50:42.959	\N	\N
17	1	+919921651111	\N	\N	Pushpaben joshi	PATIENT	ACTIVE	2025-05-02 19:20:18.121	2025-05-02 19:20:18.121	\N	\N
18	1	+919699787615	\N	\N	Anjali Kulkarni	PATIENT	ACTIVE	2025-05-05 04:44:12.105	2025-05-05 04:44:12.105	\N	\N
22	1	8226762281	abh@gmail.com	12345	Dr Kishore Kharche	DOCTOR	ACTIVE	2025-05-10 14:03:13.16	2025-05-12 05:26:43.592	\N	\N
29	1	+919322251891	\N	\N	Ved Pingle 	PATIENT	ACTIVE	2025-05-13 16:12:46.878	2025-05-13 16:12:46.878	\N	\N
20	1	+918483834033	\N	\N	Suvarna	PATIENT	ACTIVE	2025-05-09 05:58:12.029	2025-05-09 05:58:12.029	\N	\N
21	1	+919860435240	\N	\N	Ramesh wagh 	PATIENT	ACTIVE	2025-05-09 12:56:41.192	2025-05-09 12:56:41.192	\N	\N
23	1	9100277812			Dr. Bukan	DOCTOR	ACTIVE	2025-05-10 16:30:57.444	2025-05-10 16:30:57.444	\N	\N
30	1	+919022499484	\N	\N	Krish	PATIENT	ACTIVE	2025-05-15 04:48:53.222	2025-05-15 04:48:53.222	\N	\N
6	1	+911212343459	suvarna@gmail.com	Test@123	Suvarna Domde	DOCTOR	ACTIVE	2025-04-30 10:26:25.446	2025-05-11 18:44:41.854	\N	https://res.cloudinary.com/pirated-virus-cloud/image/upload/v1746011772/awrv8fhemdpjxh3rq7cp.png
16	1	+917875322847	\N	\N	Ram	PATIENT	ACTIVE	2025-05-02 13:01:43.21	2025-05-15 18:01:14.953	\N	\N
2	1	+918149306224	saurabhk201@gmail.com	\N	Saurabh Kulkarni	PATIENT	ACTIVE	2025-04-30 09:45:40.047	2025-05-15 18:38:46.132	2025-05-15 18:38:46.129	\N
19	1	7875322847	aurangeabhinav777@gmail.com		Dr Abhinav	DOCTOR	ACTIVE	2025-05-06 09:32:49.33	2025-05-15 20:03:49.514	\N	https://res.cloudinary.com/pirated-virus-cloud/image/upload/v1747027149/xbyiypo0izjnsjb2cp0b.jpg
9	1	+918208531234	\N		Dr.Abhinav Aurange	DOCTOR	DELETED	2025-04-30 19:12:05.199	2025-05-15 20:13:15.214	2025-05-15 20:08:29.386	\N
12	1	+918208534977	ram@gmail.com	\N	Ram Aurange	PATIENT	ACTIVE	2025-05-01 15:52:49.433	2025-05-15 20:13:38.288	\N	\N
33	1	1231235119	sa@sa.com	111	Sample Dr	NOT_SET	ACTIVE	2025-05-16 05:14:35.418	2025-05-16 06:26:18.014	\N	\N
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin
--

COPY realtime.schema_migrations (version, inserted_at) FROM stdin;
20211116024918	2025-04-30 09:28:17
20211116045059	2025-04-30 09:28:17
20211116050929	2025-04-30 09:28:17
20211116051442	2025-04-30 09:28:17
20211116212300	2025-04-30 09:28:17
20211116213355	2025-04-30 09:28:17
20211116213934	2025-04-30 09:28:17
20211116214523	2025-04-30 09:28:17
20211122062447	2025-04-30 09:28:17
20211124070109	2025-04-30 09:28:17
20211202204204	2025-04-30 09:28:17
20211202204605	2025-04-30 09:28:17
20211210212804	2025-04-30 09:28:17
20211228014915	2025-04-30 09:28:17
20220107221237	2025-04-30 09:28:17
20220228202821	2025-04-30 09:28:17
20220312004840	2025-04-30 09:28:17
20220603231003	2025-04-30 09:28:17
20220603232444	2025-04-30 09:28:17
20220615214548	2025-04-30 09:28:17
20220712093339	2025-04-30 09:28:17
20220908172859	2025-04-30 09:28:17
20220916233421	2025-04-30 09:28:17
20230119133233	2025-04-30 09:28:18
20230128025114	2025-04-30 09:28:18
20230128025212	2025-04-30 09:28:18
20230227211149	2025-04-30 09:28:18
20230228184745	2025-04-30 09:28:18
20230308225145	2025-04-30 09:28:18
20230328144023	2025-04-30 09:28:18
20231018144023	2025-04-30 09:28:18
20231204144023	2025-04-30 09:28:18
20231204144024	2025-04-30 09:28:18
20231204144025	2025-04-30 09:28:18
20240108234812	2025-04-30 09:28:18
20240109165339	2025-04-30 09:28:18
20240227174441	2025-04-30 09:28:18
20240311171622	2025-04-30 09:28:18
20240321100241	2025-04-30 09:28:18
20240401105812	2025-04-30 09:28:18
20240418121054	2025-04-30 09:28:18
20240523004032	2025-04-30 09:28:18
20240618124746	2025-04-30 09:28:18
20240801235015	2025-04-30 09:28:18
20240805133720	2025-04-30 09:28:18
20240827160934	2025-04-30 09:28:18
20240919163303	2025-04-30 09:28:18
20240919163305	2025-04-30 09:28:18
20241019105805	2025-04-30 09:28:18
20241030150047	2025-04-30 09:28:18
20241108114728	2025-04-30 09:28:18
20241121104152	2025-04-30 09:28:18
20241130184212	2025-04-30 09:28:18
20241220035512	2025-04-30 09:28:18
20241220123912	2025-04-30 09:28:18
20241224161212	2025-04-30 09:28:18
20250107150512	2025-04-30 09:28:18
20250110162412	2025-04-30 09:28:18
20250123174212	2025-04-30 09:28:18
20250128220012	2025-04-30 09:28:18
\.


--
-- Data for Name: subscription; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin
--

COPY realtime.subscription (id, subscription_id, entity, filters, claims, created_at) FROM stdin;
\.


--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.buckets (id, name, owner, created_at, updated_at, public, avif_autodetection, file_size_limit, allowed_mime_types, owner_id) FROM stdin;
\.


--
-- Data for Name: migrations; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.migrations (id, name, hash, executed_at) FROM stdin;
0	create-migrations-table	e18db593bcde2aca2a408c4d1100f6abba2195df	2025-04-30 09:28:10.915163
1	initialmigration	6ab16121fbaa08bbd11b712d05f358f9b555d777	2025-04-30 09:28:10.931777
2	storage-schema	5c7968fd083fcea04050c1b7f6253c9771b99011	2025-04-30 09:28:10.937296
3	pathtoken-column	2cb1b0004b817b29d5b0a971af16bafeede4b70d	2025-04-30 09:28:10.969592
4	add-migrations-rls	427c5b63fe1c5937495d9c635c263ee7a5905058	2025-04-30 09:28:10.99598
5	add-size-functions	79e081a1455b63666c1294a440f8ad4b1e6a7f84	2025-04-30 09:28:11.002128
6	change-column-name-in-get-size	f93f62afdf6613ee5e7e815b30d02dc990201044	2025-04-30 09:28:11.011228
7	add-rls-to-buckets	e7e7f86adbc51049f341dfe8d30256c1abca17aa	2025-04-30 09:28:11.017506
8	add-public-to-buckets	fd670db39ed65f9d08b01db09d6202503ca2bab3	2025-04-30 09:28:11.023361
9	fix-search-function	3a0af29f42e35a4d101c259ed955b67e1bee6825	2025-04-30 09:28:11.031605
10	search-files-search-function	68dc14822daad0ffac3746a502234f486182ef6e	2025-04-30 09:28:11.050373
11	add-trigger-to-auto-update-updated_at-column	7425bdb14366d1739fa8a18c83100636d74dcaa2	2025-04-30 09:28:11.068235
12	add-automatic-avif-detection-flag	8e92e1266eb29518b6a4c5313ab8f29dd0d08df9	2025-04-30 09:28:11.076513
13	add-bucket-custom-limits	cce962054138135cd9a8c4bcd531598684b25e7d	2025-04-30 09:28:11.086029
14	use-bytes-for-max-size	941c41b346f9802b411f06f30e972ad4744dad27	2025-04-30 09:28:11.092548
15	add-can-insert-object-function	934146bc38ead475f4ef4b555c524ee5d66799e5	2025-04-30 09:28:11.126916
16	add-version	76debf38d3fd07dcfc747ca49096457d95b1221b	2025-04-30 09:28:11.132922
17	drop-owner-foreign-key	f1cbb288f1b7a4c1eb8c38504b80ae2a0153d101	2025-04-30 09:28:11.139151
18	add_owner_id_column_deprecate_owner	e7a511b379110b08e2f214be852c35414749fe66	2025-04-30 09:28:11.146378
19	alter-default-value-objects-id	02e5e22a78626187e00d173dc45f58fa66a4f043	2025-04-30 09:28:11.157063
20	list-objects-with-delimiter	cd694ae708e51ba82bf012bba00caf4f3b6393b7	2025-04-30 09:28:11.165152
21	s3-multipart-uploads	8c804d4a566c40cd1e4cc5b3725a664a9303657f	2025-04-30 09:28:11.180647
22	s3-multipart-uploads-big-ints	9737dc258d2397953c9953d9b86920b8be0cdb73	2025-04-30 09:28:11.21522
23	optimize-search-function	9d7e604cddc4b56a5422dc68c9313f4a1b6f132c	2025-04-30 09:28:11.244657
24	operation-function	8312e37c2bf9e76bbe841aa5fda889206d2bf8aa	2025-04-30 09:28:11.251428
25	custom-metadata	d974c6057c3db1c1f847afa0e291e6165693b990	2025-04-30 09:28:11.257615
\.


--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.objects (id, bucket_id, name, owner, created_at, updated_at, last_accessed_at, metadata, version, owner_id, user_metadata) FROM stdin;
\.


--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.s3_multipart_uploads (id, in_progress_size, upload_signature, bucket_id, key, version, owner_id, created_at, user_metadata) FROM stdin;
\.


--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.s3_multipart_uploads_parts (id, upload_id, size, part_number, bucket_id, key, etag, owner_id, version, created_at) FROM stdin;
\.


--
-- Data for Name: secrets; Type: TABLE DATA; Schema: vault; Owner: supabase_admin
--

COPY vault.secrets (id, name, description, secret, key_id, nonce, created_at, updated_at) FROM stdin;
\.


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('auth.refresh_tokens_id_seq', 1, false);


--
-- Name: Appointment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Appointment_id_seq"', 3, true);


--
-- Name: ClinicSpecialization_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."ClinicSpecialization_id_seq"', 1, false);


--
-- Name: Clinic_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Clinic_id_seq"', 1, true);


--
-- Name: Complaint_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Complaint_id_seq"', 1, false);


--
-- Name: DieticianAvailability_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."DieticianAvailability_id_seq"', 1, false);


--
-- Name: DieticianProfile_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."DieticianProfile_id_seq"', 1, true);


--
-- Name: DoctorAvailability_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."DoctorAvailability_id_seq"', 21, true);


--
-- Name: DoctorProfile_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."DoctorProfile_id_seq"', 11, true);


--
-- Name: HealthMetric_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."HealthMetric_id_seq"', 8, true);


--
-- Name: LabBooking_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."LabBooking_id_seq"', 4, true);


--
-- Name: LabPackage_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."LabPackage_id_seq"', 4, true);


--
-- Name: LabTechProfile_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."LabTechProfile_id_seq"', 1, false);


--
-- Name: Medicine_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Medicine_id_seq"', 1, false);


--
-- Name: PatientProfile_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."PatientProfile_id_seq"', 16, true);


--
-- Name: Payment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Payment_id_seq"', 5, true);


--
-- Name: PlanFeature_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."PlanFeature_id_seq"', 464, true);


--
-- Name: Plan_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Plan_id_seq"', 6, true);


--
-- Name: SubscriptionTracker_subscriptionId_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."SubscriptionTracker_subscriptionId_seq"', 4, true);


--
-- Name: User_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."User_id_seq"', 33, true);


--
-- Name: subscription_id_seq; Type: SEQUENCE SET; Schema: realtime; Owner: supabase_admin
--

SELECT pg_catalog.setval('realtime.subscription_id_seq', 1, false);


--
-- Name: mfa_amr_claims amr_id_pk; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT amr_id_pk PRIMARY KEY (id);


--
-- Name: audit_log_entries audit_log_entries_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.audit_log_entries
    ADD CONSTRAINT audit_log_entries_pkey PRIMARY KEY (id);


--
-- Name: flow_state flow_state_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.flow_state
    ADD CONSTRAINT flow_state_pkey PRIMARY KEY (id);


--
-- Name: identities identities_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_pkey PRIMARY KEY (id);


--
-- Name: identities identities_provider_id_provider_unique; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_provider_id_provider_unique UNIQUE (provider_id, provider);


--
-- Name: instances instances_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.instances
    ADD CONSTRAINT instances_pkey PRIMARY KEY (id);


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_authentication_method_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_authentication_method_pkey UNIQUE (session_id, authentication_method);


--
-- Name: mfa_challenges mfa_challenges_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_pkey PRIMARY KEY (id);


--
-- Name: mfa_factors mfa_factors_last_challenged_at_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_last_challenged_at_key UNIQUE (last_challenged_at);


--
-- Name: mfa_factors mfa_factors_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_pkey PRIMARY KEY (id);


--
-- Name: one_time_tokens one_time_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_token_unique; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_unique UNIQUE (token);


--
-- Name: saml_providers saml_providers_entity_id_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_entity_id_key UNIQUE (entity_id);


--
-- Name: saml_providers saml_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_pkey PRIMARY KEY (id);


--
-- Name: saml_relay_states saml_relay_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: sso_domains sso_domains_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_pkey PRIMARY KEY (id);


--
-- Name: sso_providers sso_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sso_providers
    ADD CONSTRAINT sso_providers_pkey PRIMARY KEY (id);


--
-- Name: users users_phone_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_phone_key UNIQUE (phone);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: Appointment Appointment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Appointment"
    ADD CONSTRAINT "Appointment_pkey" PRIMARY KEY (id);


--
-- Name: ClinicSpecialization ClinicSpecialization_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ClinicSpecialization"
    ADD CONSTRAINT "ClinicSpecialization_pkey" PRIMARY KEY (id);


--
-- Name: Clinic Clinic_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Clinic"
    ADD CONSTRAINT "Clinic_pkey" PRIMARY KEY (id);


--
-- Name: Complaint Complaint_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Complaint"
    ADD CONSTRAINT "Complaint_pkey" PRIMARY KEY (id);


--
-- Name: DieticianAvailability DieticianAvailability_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DieticianAvailability"
    ADD CONSTRAINT "DieticianAvailability_pkey" PRIMARY KEY (id);


--
-- Name: DieticianProfile DieticianProfile_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DieticianProfile"
    ADD CONSTRAINT "DieticianProfile_pkey" PRIMARY KEY (id);


--
-- Name: DoctorAvailability DoctorAvailability_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DoctorAvailability"
    ADD CONSTRAINT "DoctorAvailability_pkey" PRIMARY KEY (id);


--
-- Name: DoctorProfile DoctorProfile_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DoctorProfile"
    ADD CONSTRAINT "DoctorProfile_pkey" PRIMARY KEY (id);


--
-- Name: HealthMetric HealthMetric_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."HealthMetric"
    ADD CONSTRAINT "HealthMetric_pkey" PRIMARY KEY (id);


--
-- Name: LabBooking LabBooking_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."LabBooking"
    ADD CONSTRAINT "LabBooking_pkey" PRIMARY KEY (id);


--
-- Name: LabPackage LabPackage_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."LabPackage"
    ADD CONSTRAINT "LabPackage_pkey" PRIMARY KEY (id);


--
-- Name: LabTechProfile LabTechProfile_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."LabTechProfile"
    ADD CONSTRAINT "LabTechProfile_pkey" PRIMARY KEY (id);


--
-- Name: Medicine Medicine_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Medicine"
    ADD CONSTRAINT "Medicine_pkey" PRIMARY KEY (id);


--
-- Name: PatientProfile PatientProfile_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PatientProfile"
    ADD CONSTRAINT "PatientProfile_pkey" PRIMARY KEY (id);


--
-- Name: Payment Payment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_pkey" PRIMARY KEY (id);


--
-- Name: PlanFeature PlanFeature_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PlanFeature"
    ADD CONSTRAINT "PlanFeature_pkey" PRIMARY KEY (id);


--
-- Name: Plan Plan_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Plan"
    ADD CONSTRAINT "Plan_pkey" PRIMARY KEY (id);


--
-- Name: SubscriptionTracker SubscriptionTracker_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SubscriptionTracker"
    ADD CONSTRAINT "SubscriptionTracker_pkey" PRIMARY KEY ("subscriptionId");


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER TABLE ONLY realtime.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: subscription pk_subscription; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.subscription
    ADD CONSTRAINT pk_subscription PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: buckets buckets_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.buckets
    ADD CONSTRAINT buckets_pkey PRIMARY KEY (id);


--
-- Name: migrations migrations_name_key; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_name_key UNIQUE (name);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- Name: objects objects_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT objects_pkey PRIMARY KEY (id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_pkey PRIMARY KEY (id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_pkey PRIMARY KEY (id);


--
-- Name: audit_logs_instance_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX audit_logs_instance_id_idx ON auth.audit_log_entries USING btree (instance_id);


--
-- Name: confirmation_token_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX confirmation_token_idx ON auth.users USING btree (confirmation_token) WHERE ((confirmation_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: email_change_token_current_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX email_change_token_current_idx ON auth.users USING btree (email_change_token_current) WHERE ((email_change_token_current)::text !~ '^[0-9 ]*$'::text);


--
-- Name: email_change_token_new_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX email_change_token_new_idx ON auth.users USING btree (email_change_token_new) WHERE ((email_change_token_new)::text !~ '^[0-9 ]*$'::text);


--
-- Name: factor_id_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX factor_id_created_at_idx ON auth.mfa_factors USING btree (user_id, created_at);


--
-- Name: flow_state_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX flow_state_created_at_idx ON auth.flow_state USING btree (created_at DESC);


--
-- Name: identities_email_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX identities_email_idx ON auth.identities USING btree (email text_pattern_ops);


--
-- Name: INDEX identities_email_idx; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON INDEX auth.identities_email_idx IS 'Auth: Ensures indexed queries on the email column';


--
-- Name: identities_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX identities_user_id_idx ON auth.identities USING btree (user_id);


--
-- Name: idx_auth_code; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_auth_code ON auth.flow_state USING btree (auth_code);


--
-- Name: idx_user_id_auth_method; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_user_id_auth_method ON auth.flow_state USING btree (user_id, authentication_method);


--
-- Name: mfa_challenge_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX mfa_challenge_created_at_idx ON auth.mfa_challenges USING btree (created_at DESC);


--
-- Name: mfa_factors_user_friendly_name_unique; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX mfa_factors_user_friendly_name_unique ON auth.mfa_factors USING btree (friendly_name, user_id) WHERE (TRIM(BOTH FROM friendly_name) <> ''::text);


--
-- Name: mfa_factors_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX mfa_factors_user_id_idx ON auth.mfa_factors USING btree (user_id);


--
-- Name: one_time_tokens_relates_to_hash_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX one_time_tokens_relates_to_hash_idx ON auth.one_time_tokens USING hash (relates_to);


--
-- Name: one_time_tokens_token_hash_hash_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX one_time_tokens_token_hash_hash_idx ON auth.one_time_tokens USING hash (token_hash);


--
-- Name: one_time_tokens_user_id_token_type_key; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX one_time_tokens_user_id_token_type_key ON auth.one_time_tokens USING btree (user_id, token_type);


--
-- Name: reauthentication_token_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX reauthentication_token_idx ON auth.users USING btree (reauthentication_token) WHERE ((reauthentication_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: recovery_token_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX recovery_token_idx ON auth.users USING btree (recovery_token) WHERE ((recovery_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: refresh_tokens_instance_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_instance_id_idx ON auth.refresh_tokens USING btree (instance_id);


--
-- Name: refresh_tokens_instance_id_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_instance_id_user_id_idx ON auth.refresh_tokens USING btree (instance_id, user_id);


--
-- Name: refresh_tokens_parent_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_parent_idx ON auth.refresh_tokens USING btree (parent);


--
-- Name: refresh_tokens_session_id_revoked_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_session_id_revoked_idx ON auth.refresh_tokens USING btree (session_id, revoked);


--
-- Name: refresh_tokens_updated_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_updated_at_idx ON auth.refresh_tokens USING btree (updated_at DESC);


--
-- Name: saml_providers_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_providers_sso_provider_id_idx ON auth.saml_providers USING btree (sso_provider_id);


--
-- Name: saml_relay_states_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_relay_states_created_at_idx ON auth.saml_relay_states USING btree (created_at DESC);


--
-- Name: saml_relay_states_for_email_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_relay_states_for_email_idx ON auth.saml_relay_states USING btree (for_email);


--
-- Name: saml_relay_states_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_relay_states_sso_provider_id_idx ON auth.saml_relay_states USING btree (sso_provider_id);


--
-- Name: sessions_not_after_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sessions_not_after_idx ON auth.sessions USING btree (not_after DESC);


--
-- Name: sessions_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sessions_user_id_idx ON auth.sessions USING btree (user_id);


--
-- Name: sso_domains_domain_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX sso_domains_domain_idx ON auth.sso_domains USING btree (lower(domain));


--
-- Name: sso_domains_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sso_domains_sso_provider_id_idx ON auth.sso_domains USING btree (sso_provider_id);


--
-- Name: sso_providers_resource_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX sso_providers_resource_id_idx ON auth.sso_providers USING btree (lower(resource_id));


--
-- Name: unique_phone_factor_per_user; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX unique_phone_factor_per_user ON auth.mfa_factors USING btree (user_id, phone);


--
-- Name: user_id_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX user_id_created_at_idx ON auth.sessions USING btree (user_id, created_at);


--
-- Name: users_email_partial_key; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX users_email_partial_key ON auth.users USING btree (email) WHERE (is_sso_user = false);


--
-- Name: INDEX users_email_partial_key; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON INDEX auth.users_email_partial_key IS 'Auth: A partial unique index that applies only when is_sso_user is false';


--
-- Name: users_instance_id_email_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX users_instance_id_email_idx ON auth.users USING btree (instance_id, lower((email)::text));


--
-- Name: users_instance_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX users_instance_id_idx ON auth.users USING btree (instance_id);


--
-- Name: users_is_anonymous_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX users_is_anonymous_idx ON auth.users USING btree (is_anonymous);


--
-- Name: Appointment_deletedAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Appointment_deletedAt_idx" ON public."Appointment" USING btree ("deletedAt");


--
-- Name: ClinicSpecialization_deletedAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ClinicSpecialization_deletedAt_idx" ON public."ClinicSpecialization" USING btree ("deletedAt");


--
-- Name: Clinic_deletedAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Clinic_deletedAt_idx" ON public."Clinic" USING btree ("deletedAt");


--
-- Name: Clinic_domain_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Clinic_domain_key" ON public."Clinic" USING btree (domain);


--
-- Name: Clinic_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Clinic_name_key" ON public."Clinic" USING btree (name);


--
-- Name: Clinic_subdomain_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Clinic_subdomain_key" ON public."Clinic" USING btree (subdomain);


--
-- Name: Complaint_deletedAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Complaint_deletedAt_idx" ON public."Complaint" USING btree ("deletedAt");


--
-- Name: Complaint_text_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Complaint_text_key" ON public."Complaint" USING btree (text);


--
-- Name: DieticianAvailability_deletedAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "DieticianAvailability_deletedAt_idx" ON public."DieticianAvailability" USING btree ("deletedAt");


--
-- Name: DieticianProfile_deletedAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "DieticianProfile_deletedAt_idx" ON public."DieticianProfile" USING btree ("deletedAt");


--
-- Name: DieticianProfile_userId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "DieticianProfile_userId_key" ON public."DieticianProfile" USING btree ("userId");


--
-- Name: DoctorAvailability_deletedAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "DoctorAvailability_deletedAt_idx" ON public."DoctorAvailability" USING btree ("deletedAt");


--
-- Name: DoctorProfile_deletedAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "DoctorProfile_deletedAt_idx" ON public."DoctorProfile" USING btree ("deletedAt");


--
-- Name: DoctorProfile_licenseNumber_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "DoctorProfile_licenseNumber_key" ON public."DoctorProfile" USING btree ("licenseNumber");


--
-- Name: DoctorProfile_userId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "DoctorProfile_userId_key" ON public."DoctorProfile" USING btree ("userId");


--
-- Name: HealthMetric_deletedAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "HealthMetric_deletedAt_idx" ON public."HealthMetric" USING btree ("deletedAt");


--
-- Name: HealthMetric_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "HealthMetric_userId_idx" ON public."HealthMetric" USING btree ("userId");


--
-- Name: LabBooking_deletedAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "LabBooking_deletedAt_idx" ON public."LabBooking" USING btree ("deletedAt");


--
-- Name: LabPackage_deletedAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "LabPackage_deletedAt_idx" ON public."LabPackage" USING btree ("deletedAt");


--
-- Name: LabPackage_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "LabPackage_name_key" ON public."LabPackage" USING btree (name);


--
-- Name: LabTechProfile_deletedAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "LabTechProfile_deletedAt_idx" ON public."LabTechProfile" USING btree ("deletedAt");


--
-- Name: LabTechProfile_userId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "LabTechProfile_userId_key" ON public."LabTechProfile" USING btree ("userId");


--
-- Name: Medicine_deletedAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Medicine_deletedAt_idx" ON public."Medicine" USING btree ("deletedAt");


--
-- Name: Medicine_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Medicine_name_key" ON public."Medicine" USING btree (name);


--
-- Name: PatientProfile_deletedAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "PatientProfile_deletedAt_idx" ON public."PatientProfile" USING btree ("deletedAt");


--
-- Name: PatientProfile_userId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "PatientProfile_userId_key" ON public."PatientProfile" USING btree ("userId");


--
-- Name: Payment_appointmentId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Payment_appointmentId_key" ON public."Payment" USING btree ("appointmentId");


--
-- Name: Payment_deletedAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Payment_deletedAt_idx" ON public."Payment" USING btree ("deletedAt");


--
-- Name: Payment_labBookingId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Payment_labBookingId_key" ON public."Payment" USING btree ("labBookingId");


--
-- Name: Payment_subscriptionId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Payment_subscriptionId_key" ON public."Payment" USING btree ("subscriptionId");


--
-- Name: PlanFeature_deletedAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "PlanFeature_deletedAt_idx" ON public."PlanFeature" USING btree ("deletedAt");


--
-- Name: Plan_deletedAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Plan_deletedAt_idx" ON public."Plan" USING btree ("deletedAt");


--
-- Name: SubscriptionTracker_deletedAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "SubscriptionTracker_deletedAt_idx" ON public."SubscriptionTracker" USING btree ("deletedAt");


--
-- Name: User_deletedAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "User_deletedAt_idx" ON public."User" USING btree ("deletedAt");


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: User_phoneNumber_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "User_phoneNumber_key" ON public."User" USING btree ("phoneNumber");


--
-- Name: ix_realtime_subscription_entity; Type: INDEX; Schema: realtime; Owner: supabase_admin
--

CREATE INDEX ix_realtime_subscription_entity ON realtime.subscription USING btree (entity);


--
-- Name: subscription_subscription_id_entity_filters_key; Type: INDEX; Schema: realtime; Owner: supabase_admin
--

CREATE UNIQUE INDEX subscription_subscription_id_entity_filters_key ON realtime.subscription USING btree (subscription_id, entity, filters);


--
-- Name: bname; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX bname ON storage.buckets USING btree (name);


--
-- Name: bucketid_objname; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX bucketid_objname ON storage.objects USING btree (bucket_id, name);


--
-- Name: idx_multipart_uploads_list; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX idx_multipart_uploads_list ON storage.s3_multipart_uploads USING btree (bucket_id, key, created_at);


--
-- Name: idx_objects_bucket_id_name; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX idx_objects_bucket_id_name ON storage.objects USING btree (bucket_id, name COLLATE "C");


--
-- Name: name_prefix_search; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX name_prefix_search ON storage.objects USING btree (name text_pattern_ops);


--
-- Name: subscription tr_check_filters; Type: TRIGGER; Schema: realtime; Owner: supabase_admin
--

CREATE TRIGGER tr_check_filters BEFORE INSERT OR UPDATE ON realtime.subscription FOR EACH ROW EXECUTE FUNCTION realtime.subscription_check_filters();


--
-- Name: objects update_objects_updated_at; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER update_objects_updated_at BEFORE UPDATE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.update_updated_at_column();


--
-- Name: identities identities_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: mfa_challenges mfa_challenges_auth_factor_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_auth_factor_id_fkey FOREIGN KEY (factor_id) REFERENCES auth.mfa_factors(id) ON DELETE CASCADE;


--
-- Name: mfa_factors mfa_factors_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: one_time_tokens one_time_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: saml_providers saml_providers_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_flow_state_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_flow_state_id_fkey FOREIGN KEY (flow_state_id) REFERENCES auth.flow_state(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: sso_domains sso_domains_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: Appointment Appointment_doctorAvailabilityId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Appointment"
    ADD CONSTRAINT "Appointment_doctorAvailabilityId_fkey" FOREIGN KEY ("doctorAvailabilityId") REFERENCES public."DoctorAvailability"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Appointment Appointment_doctorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Appointment"
    ADD CONSTRAINT "Appointment_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Appointment Appointment_patientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Appointment"
    ADD CONSTRAINT "Appointment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Appointment Appointment_subscriptionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Appointment"
    ADD CONSTRAINT "Appointment_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES public."SubscriptionTracker"("subscriptionId") ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ClinicSpecialization ClinicSpecialization_clinicId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ClinicSpecialization"
    ADD CONSTRAINT "ClinicSpecialization_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES public."Clinic"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: DieticianAvailability DieticianAvailability_dieticianId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DieticianAvailability"
    ADD CONSTRAINT "DieticianAvailability_dieticianId_fkey" FOREIGN KEY ("dieticianId") REFERENCES public."DieticianProfile"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: DieticianProfile DieticianProfile_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DieticianProfile"
    ADD CONSTRAINT "DieticianProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: DoctorAvailability DoctorAvailability_doctorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DoctorAvailability"
    ADD CONSTRAINT "DoctorAvailability_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES public."DoctorProfile"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: DoctorProfile DoctorProfile_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DoctorProfile"
    ADD CONSTRAINT "DoctorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: HealthMetric HealthMetric_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."HealthMetric"
    ADD CONSTRAINT "HealthMetric_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: LabBooking LabBooking_labPackageId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."LabBooking"
    ADD CONSTRAINT "LabBooking_labPackageId_fkey" FOREIGN KEY ("labPackageId") REFERENCES public."LabPackage"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: LabBooking LabBooking_labTechId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."LabBooking"
    ADD CONSTRAINT "LabBooking_labTechId_fkey" FOREIGN KEY ("labTechId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: LabBooking LabBooking_patientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."LabBooking"
    ADD CONSTRAINT "LabBooking_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: LabTechProfile LabTechProfile_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."LabTechProfile"
    ADD CONSTRAINT "LabTechProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: PatientProfile PatientProfile_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PatientProfile"
    ADD CONSTRAINT "PatientProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Payment Payment_appointmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES public."Appointment"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Payment Payment_labBookingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_labBookingId_fkey" FOREIGN KEY ("labBookingId") REFERENCES public."LabBooking"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Payment Payment_subscriptionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES public."SubscriptionTracker"("subscriptionId") ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: PlanFeature PlanFeature_planId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PlanFeature"
    ADD CONSTRAINT "PlanFeature_planId_fkey" FOREIGN KEY ("planId") REFERENCES public."Plan"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: SubscriptionTracker SubscriptionTracker_patientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SubscriptionTracker"
    ADD CONSTRAINT "SubscriptionTracker_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES public."PatientProfile"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: SubscriptionTracker SubscriptionTracker_planId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SubscriptionTracker"
    ADD CONSTRAINT "SubscriptionTracker_planId_fkey" FOREIGN KEY ("planId") REFERENCES public."Plan"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: User User_clinicId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES public."Clinic"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: objects objects_bucketId_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT "objects_bucketId_fkey" FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_upload_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_upload_id_fkey FOREIGN KEY (upload_id) REFERENCES storage.s3_multipart_uploads(id) ON DELETE CASCADE;


--
-- Name: audit_log_entries; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.audit_log_entries ENABLE ROW LEVEL SECURITY;

--
-- Name: flow_state; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.flow_state ENABLE ROW LEVEL SECURITY;

--
-- Name: identities; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.identities ENABLE ROW LEVEL SECURITY;

--
-- Name: instances; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.instances ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_amr_claims; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.mfa_amr_claims ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_challenges; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.mfa_challenges ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_factors; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.mfa_factors ENABLE ROW LEVEL SECURITY;

--
-- Name: one_time_tokens; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.one_time_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: refresh_tokens; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.refresh_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_providers; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.saml_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_relay_states; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.saml_relay_states ENABLE ROW LEVEL SECURITY;

--
-- Name: schema_migrations; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.schema_migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: sessions; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_domains; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.sso_domains ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_providers; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.sso_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

--
-- Name: messages; Type: ROW SECURITY; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

--
-- Name: migrations; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: objects; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.s3_multipart_uploads ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads_parts; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.s3_multipart_uploads_parts ENABLE ROW LEVEL SECURITY;

--
-- Name: supabase_realtime; Type: PUBLICATION; Schema: -; Owner: postgres
--

CREATE PUBLICATION supabase_realtime WITH (publish = 'insert, update, delete, truncate');


ALTER PUBLICATION supabase_realtime OWNER TO postgres;

--
-- Name: SCHEMA auth; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA auth TO anon;
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT USAGE ON SCHEMA auth TO service_role;
GRANT ALL ON SCHEMA auth TO supabase_auth_admin;
GRANT ALL ON SCHEMA auth TO dashboard_user;
GRANT ALL ON SCHEMA auth TO postgres;


--
-- Name: SCHEMA extensions; Type: ACL; Schema: -; Owner: postgres
--

GRANT USAGE ON SCHEMA extensions TO anon;
GRANT USAGE ON SCHEMA extensions TO authenticated;
GRANT USAGE ON SCHEMA extensions TO service_role;
GRANT ALL ON SCHEMA extensions TO dashboard_user;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT USAGE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;


--
-- Name: SCHEMA realtime; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA realtime TO postgres;
GRANT USAGE ON SCHEMA realtime TO anon;
GRANT USAGE ON SCHEMA realtime TO authenticated;
GRANT USAGE ON SCHEMA realtime TO service_role;
GRANT ALL ON SCHEMA realtime TO supabase_realtime_admin;


--
-- Name: SCHEMA storage; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT ALL ON SCHEMA storage TO postgres;
GRANT USAGE ON SCHEMA storage TO anon;
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT USAGE ON SCHEMA storage TO service_role;
GRANT ALL ON SCHEMA storage TO supabase_storage_admin;
GRANT ALL ON SCHEMA storage TO dashboard_user;


--
-- Name: SCHEMA vault; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA vault TO postgres WITH GRANT OPTION;
GRANT USAGE ON SCHEMA vault TO service_role;


--
-- Name: FUNCTION email(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.email() TO dashboard_user;


--
-- Name: FUNCTION jwt(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.jwt() TO postgres;
GRANT ALL ON FUNCTION auth.jwt() TO dashboard_user;


--
-- Name: FUNCTION role(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.role() TO dashboard_user;


--
-- Name: FUNCTION uid(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.uid() TO dashboard_user;


--
-- Name: FUNCTION algorithm_sign(signables text, secret text, algorithm text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.algorithm_sign(signables text, secret text, algorithm text) FROM postgres;
GRANT ALL ON FUNCTION extensions.algorithm_sign(signables text, secret text, algorithm text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.algorithm_sign(signables text, secret text, algorithm text) TO dashboard_user;


--
-- Name: FUNCTION armor(bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.armor(bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.armor(bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.armor(bytea) TO dashboard_user;


--
-- Name: FUNCTION armor(bytea, text[], text[]); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.armor(bytea, text[], text[]) FROM postgres;
GRANT ALL ON FUNCTION extensions.armor(bytea, text[], text[]) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.armor(bytea, text[], text[]) TO dashboard_user;


--
-- Name: FUNCTION crypt(text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.crypt(text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.crypt(text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.crypt(text, text) TO dashboard_user;


--
-- Name: FUNCTION dearmor(text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.dearmor(text) FROM postgres;
GRANT ALL ON FUNCTION extensions.dearmor(text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.dearmor(text) TO dashboard_user;


--
-- Name: FUNCTION decrypt(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.decrypt(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.decrypt(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.decrypt(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION decrypt_iv(bytea, bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.decrypt_iv(bytea, bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.decrypt_iv(bytea, bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.decrypt_iv(bytea, bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION digest(bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.digest(bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.digest(bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.digest(bytea, text) TO dashboard_user;


--
-- Name: FUNCTION digest(text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.digest(text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.digest(text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.digest(text, text) TO dashboard_user;


--
-- Name: FUNCTION encrypt(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.encrypt(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.encrypt(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.encrypt(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION encrypt_iv(bytea, bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.encrypt_iv(bytea, bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.encrypt_iv(bytea, bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.encrypt_iv(bytea, bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION gen_random_bytes(integer); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.gen_random_bytes(integer) FROM postgres;
GRANT ALL ON FUNCTION extensions.gen_random_bytes(integer) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.gen_random_bytes(integer) TO dashboard_user;


--
-- Name: FUNCTION gen_random_uuid(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.gen_random_uuid() FROM postgres;
GRANT ALL ON FUNCTION extensions.gen_random_uuid() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.gen_random_uuid() TO dashboard_user;


--
-- Name: FUNCTION gen_salt(text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.gen_salt(text) FROM postgres;
GRANT ALL ON FUNCTION extensions.gen_salt(text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.gen_salt(text) TO dashboard_user;


--
-- Name: FUNCTION gen_salt(text, integer); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.gen_salt(text, integer) FROM postgres;
GRANT ALL ON FUNCTION extensions.gen_salt(text, integer) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.gen_salt(text, integer) TO dashboard_user;


--
-- Name: FUNCTION grant_pg_cron_access(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.grant_pg_cron_access() FROM postgres;
GRANT ALL ON FUNCTION extensions.grant_pg_cron_access() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.grant_pg_cron_access() TO dashboard_user;


--
-- Name: FUNCTION grant_pg_graphql_access(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.grant_pg_graphql_access() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION grant_pg_net_access(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.grant_pg_net_access() FROM postgres;
GRANT ALL ON FUNCTION extensions.grant_pg_net_access() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.grant_pg_net_access() TO dashboard_user;


--
-- Name: FUNCTION hmac(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.hmac(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.hmac(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.hmac(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION hmac(text, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.hmac(text, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.hmac(text, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.hmac(text, text, text) TO dashboard_user;


--
-- Name: FUNCTION pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT blk_read_time double precision, OUT blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT blk_read_time double precision, OUT blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision) FROM postgres;
GRANT ALL ON FUNCTION extensions.pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT blk_read_time double precision, OUT blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT blk_read_time double precision, OUT blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision) TO dashboard_user;


--
-- Name: FUNCTION pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone) FROM postgres;
GRANT ALL ON FUNCTION extensions.pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone) TO dashboard_user;


--
-- Name: FUNCTION pg_stat_statements_reset(userid oid, dbid oid, queryid bigint); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pg_stat_statements_reset(userid oid, dbid oid, queryid bigint) FROM postgres;
GRANT ALL ON FUNCTION extensions.pg_stat_statements_reset(userid oid, dbid oid, queryid bigint) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pg_stat_statements_reset(userid oid, dbid oid, queryid bigint) TO dashboard_user;


--
-- Name: FUNCTION pgp_armor_headers(text, OUT key text, OUT value text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_armor_headers(text, OUT key text, OUT value text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_armor_headers(text, OUT key text, OUT value text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_armor_headers(text, OUT key text, OUT value text) TO dashboard_user;


--
-- Name: FUNCTION pgp_key_id(bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_key_id(bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_key_id(bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_key_id(bytea) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt(bytea, bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt(bytea, bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt_bytea(bytea, bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt_bytea(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt_bytea(bytea, bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_encrypt(text, bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_encrypt(text, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_encrypt_bytea(bytea, bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_encrypt_bytea(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_decrypt(bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_decrypt(bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_decrypt_bytea(bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_decrypt_bytea(bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_encrypt(text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_encrypt(text, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_encrypt_bytea(bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_encrypt_bytea(bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgrst_ddl_watch(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgrst_ddl_watch() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION pgrst_drop_watch(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgrst_drop_watch() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION set_graphql_placeholder(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.set_graphql_placeholder() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION sign(payload json, secret text, algorithm text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.sign(payload json, secret text, algorithm text) FROM postgres;
GRANT ALL ON FUNCTION extensions.sign(payload json, secret text, algorithm text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.sign(payload json, secret text, algorithm text) TO dashboard_user;


--
-- Name: FUNCTION try_cast_double(inp text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.try_cast_double(inp text) FROM postgres;
GRANT ALL ON FUNCTION extensions.try_cast_double(inp text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.try_cast_double(inp text) TO dashboard_user;


--
-- Name: FUNCTION url_decode(data text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.url_decode(data text) FROM postgres;
GRANT ALL ON FUNCTION extensions.url_decode(data text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.url_decode(data text) TO dashboard_user;


--
-- Name: FUNCTION url_encode(data bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.url_encode(data bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.url_encode(data bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.url_encode(data bytea) TO dashboard_user;


--
-- Name: FUNCTION uuid_generate_v1(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v1() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v1() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v1() TO dashboard_user;


--
-- Name: FUNCTION uuid_generate_v1mc(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v1mc() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v1mc() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v1mc() TO dashboard_user;


--
-- Name: FUNCTION uuid_generate_v3(namespace uuid, name text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v3(namespace uuid, name text) FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v3(namespace uuid, name text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v3(namespace uuid, name text) TO dashboard_user;


--
-- Name: FUNCTION uuid_generate_v4(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v4() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v4() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v4() TO dashboard_user;


--
-- Name: FUNCTION uuid_generate_v5(namespace uuid, name text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v5(namespace uuid, name text) FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v5(namespace uuid, name text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v5(namespace uuid, name text) TO dashboard_user;


--
-- Name: FUNCTION uuid_nil(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_nil() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_nil() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_nil() TO dashboard_user;


--
-- Name: FUNCTION uuid_ns_dns(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_ns_dns() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_ns_dns() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_ns_dns() TO dashboard_user;


--
-- Name: FUNCTION uuid_ns_oid(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_ns_oid() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_ns_oid() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_ns_oid() TO dashboard_user;


--
-- Name: FUNCTION uuid_ns_url(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_ns_url() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_ns_url() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_ns_url() TO dashboard_user;


--
-- Name: FUNCTION uuid_ns_x500(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_ns_x500() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_ns_x500() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_ns_x500() TO dashboard_user;


--
-- Name: FUNCTION verify(token text, secret text, algorithm text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.verify(token text, secret text, algorithm text) FROM postgres;
GRANT ALL ON FUNCTION extensions.verify(token text, secret text, algorithm text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.verify(token text, secret text, algorithm text) TO dashboard_user;


--
-- Name: FUNCTION graphql("operationName" text, query text, variables jsonb, extensions jsonb); Type: ACL; Schema: graphql_public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO postgres;
GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO anon;
GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO authenticated;
GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO service_role;


--
-- Name: FUNCTION get_auth(p_usename text); Type: ACL; Schema: pgbouncer; Owner: supabase_admin
--

REVOKE ALL ON FUNCTION pgbouncer.get_auth(p_usename text) FROM PUBLIC;
GRANT ALL ON FUNCTION pgbouncer.get_auth(p_usename text) TO pgbouncer;
GRANT ALL ON FUNCTION pgbouncer.get_auth(p_usename text) TO postgres;


--
-- Name: FUNCTION apply_rls(wal jsonb, max_record_bytes integer); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO postgres;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO anon;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO authenticated;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO service_role;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO supabase_realtime_admin;


--
-- Name: FUNCTION broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text) TO postgres;
GRANT ALL ON FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text) TO dashboard_user;


--
-- Name: FUNCTION build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO postgres;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO anon;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO authenticated;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO service_role;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO supabase_realtime_admin;


--
-- Name: FUNCTION "cast"(val text, type_ regtype); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO postgres;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO dashboard_user;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO anon;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO authenticated;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO service_role;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO supabase_realtime_admin;


--
-- Name: FUNCTION check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO postgres;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO anon;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO authenticated;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO service_role;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO supabase_realtime_admin;


--
-- Name: FUNCTION is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO postgres;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO anon;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO authenticated;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO service_role;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO supabase_realtime_admin;


--
-- Name: FUNCTION list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO postgres;
GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO anon;
GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO authenticated;
GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO service_role;
GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO supabase_realtime_admin;


--
-- Name: FUNCTION quote_wal2json(entity regclass); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO postgres;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO anon;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO authenticated;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO service_role;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO supabase_realtime_admin;


--
-- Name: FUNCTION send(payload jsonb, event text, topic text, private boolean); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean) TO postgres;
GRANT ALL ON FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean) TO dashboard_user;


--
-- Name: FUNCTION subscription_check_filters(); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO postgres;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO dashboard_user;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO anon;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO authenticated;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO service_role;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO supabase_realtime_admin;


--
-- Name: FUNCTION to_regrole(role_name text); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO postgres;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO anon;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO authenticated;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO service_role;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO supabase_realtime_admin;


--
-- Name: FUNCTION topic(); Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON FUNCTION realtime.topic() TO postgres;
GRANT ALL ON FUNCTION realtime.topic() TO dashboard_user;


--
-- Name: FUNCTION _crypto_aead_det_decrypt(message bytea, additional bytea, key_id bigint, context bytea, nonce bytea); Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT ALL ON FUNCTION vault._crypto_aead_det_decrypt(message bytea, additional bytea, key_id bigint, context bytea, nonce bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION vault._crypto_aead_det_decrypt(message bytea, additional bytea, key_id bigint, context bytea, nonce bytea) TO service_role;


--
-- Name: FUNCTION create_secret(new_secret text, new_name text, new_description text, new_key_id uuid); Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT ALL ON FUNCTION vault.create_secret(new_secret text, new_name text, new_description text, new_key_id uuid) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION vault.create_secret(new_secret text, new_name text, new_description text, new_key_id uuid) TO service_role;


--
-- Name: FUNCTION update_secret(secret_id uuid, new_secret text, new_name text, new_description text, new_key_id uuid); Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT ALL ON FUNCTION vault.update_secret(secret_id uuid, new_secret text, new_name text, new_description text, new_key_id uuid) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION vault.update_secret(secret_id uuid, new_secret text, new_name text, new_description text, new_key_id uuid) TO service_role;


--
-- Name: TABLE audit_log_entries; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.audit_log_entries TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE auth.audit_log_entries TO postgres;
GRANT SELECT ON TABLE auth.audit_log_entries TO postgres WITH GRANT OPTION;


--
-- Name: TABLE flow_state; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE auth.flow_state TO postgres;
GRANT SELECT ON TABLE auth.flow_state TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.flow_state TO dashboard_user;


--
-- Name: TABLE identities; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE auth.identities TO postgres;
GRANT SELECT ON TABLE auth.identities TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.identities TO dashboard_user;


--
-- Name: TABLE instances; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.instances TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE auth.instances TO postgres;
GRANT SELECT ON TABLE auth.instances TO postgres WITH GRANT OPTION;


--
-- Name: TABLE mfa_amr_claims; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE auth.mfa_amr_claims TO postgres;
GRANT SELECT ON TABLE auth.mfa_amr_claims TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.mfa_amr_claims TO dashboard_user;


--
-- Name: TABLE mfa_challenges; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE auth.mfa_challenges TO postgres;
GRANT SELECT ON TABLE auth.mfa_challenges TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.mfa_challenges TO dashboard_user;


--
-- Name: TABLE mfa_factors; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE auth.mfa_factors TO postgres;
GRANT SELECT ON TABLE auth.mfa_factors TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.mfa_factors TO dashboard_user;


--
-- Name: TABLE one_time_tokens; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE auth.one_time_tokens TO postgres;
GRANT SELECT ON TABLE auth.one_time_tokens TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.one_time_tokens TO dashboard_user;


--
-- Name: TABLE refresh_tokens; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.refresh_tokens TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE auth.refresh_tokens TO postgres;
GRANT SELECT ON TABLE auth.refresh_tokens TO postgres WITH GRANT OPTION;


--
-- Name: SEQUENCE refresh_tokens_id_seq; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON SEQUENCE auth.refresh_tokens_id_seq TO dashboard_user;
GRANT ALL ON SEQUENCE auth.refresh_tokens_id_seq TO postgres;


--
-- Name: TABLE saml_providers; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE auth.saml_providers TO postgres;
GRANT SELECT ON TABLE auth.saml_providers TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.saml_providers TO dashboard_user;


--
-- Name: TABLE saml_relay_states; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE auth.saml_relay_states TO postgres;
GRANT SELECT ON TABLE auth.saml_relay_states TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.saml_relay_states TO dashboard_user;


--
-- Name: TABLE schema_migrations; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.schema_migrations TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE auth.schema_migrations TO postgres;
GRANT SELECT ON TABLE auth.schema_migrations TO postgres WITH GRANT OPTION;


--
-- Name: TABLE sessions; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE auth.sessions TO postgres;
GRANT SELECT ON TABLE auth.sessions TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.sessions TO dashboard_user;


--
-- Name: TABLE sso_domains; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE auth.sso_domains TO postgres;
GRANT SELECT ON TABLE auth.sso_domains TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.sso_domains TO dashboard_user;


--
-- Name: TABLE sso_providers; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE auth.sso_providers TO postgres;
GRANT SELECT ON TABLE auth.sso_providers TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.sso_providers TO dashboard_user;


--
-- Name: TABLE users; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.users TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE auth.users TO postgres;
GRANT SELECT ON TABLE auth.users TO postgres WITH GRANT OPTION;


--
-- Name: TABLE pg_stat_statements; Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON TABLE extensions.pg_stat_statements FROM postgres;
GRANT ALL ON TABLE extensions.pg_stat_statements TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE extensions.pg_stat_statements TO dashboard_user;


--
-- Name: TABLE pg_stat_statements_info; Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON TABLE extensions.pg_stat_statements_info FROM postgres;
GRANT ALL ON TABLE extensions.pg_stat_statements_info TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE extensions.pg_stat_statements_info TO dashboard_user;


--
-- Name: TABLE "Appointment"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public."Appointment" TO anon;
GRANT ALL ON TABLE public."Appointment" TO authenticated;
GRANT ALL ON TABLE public."Appointment" TO service_role;


--
-- Name: SEQUENCE "Appointment_id_seq"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public."Appointment_id_seq" TO anon;
GRANT ALL ON SEQUENCE public."Appointment_id_seq" TO authenticated;
GRANT ALL ON SEQUENCE public."Appointment_id_seq" TO service_role;


--
-- Name: TABLE "Clinic"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public."Clinic" TO anon;
GRANT ALL ON TABLE public."Clinic" TO authenticated;
GRANT ALL ON TABLE public."Clinic" TO service_role;


--
-- Name: TABLE "ClinicSpecialization"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public."ClinicSpecialization" TO anon;
GRANT ALL ON TABLE public."ClinicSpecialization" TO authenticated;
GRANT ALL ON TABLE public."ClinicSpecialization" TO service_role;


--
-- Name: SEQUENCE "ClinicSpecialization_id_seq"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public."ClinicSpecialization_id_seq" TO anon;
GRANT ALL ON SEQUENCE public."ClinicSpecialization_id_seq" TO authenticated;
GRANT ALL ON SEQUENCE public."ClinicSpecialization_id_seq" TO service_role;


--
-- Name: SEQUENCE "Clinic_id_seq"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public."Clinic_id_seq" TO anon;
GRANT ALL ON SEQUENCE public."Clinic_id_seq" TO authenticated;
GRANT ALL ON SEQUENCE public."Clinic_id_seq" TO service_role;


--
-- Name: TABLE "Complaint"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public."Complaint" TO anon;
GRANT ALL ON TABLE public."Complaint" TO authenticated;
GRANT ALL ON TABLE public."Complaint" TO service_role;


--
-- Name: SEQUENCE "Complaint_id_seq"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public."Complaint_id_seq" TO anon;
GRANT ALL ON SEQUENCE public."Complaint_id_seq" TO authenticated;
GRANT ALL ON SEQUENCE public."Complaint_id_seq" TO service_role;


--
-- Name: TABLE "DieticianAvailability"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public."DieticianAvailability" TO anon;
GRANT ALL ON TABLE public."DieticianAvailability" TO authenticated;
GRANT ALL ON TABLE public."DieticianAvailability" TO service_role;


--
-- Name: SEQUENCE "DieticianAvailability_id_seq"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public."DieticianAvailability_id_seq" TO anon;
GRANT ALL ON SEQUENCE public."DieticianAvailability_id_seq" TO authenticated;
GRANT ALL ON SEQUENCE public."DieticianAvailability_id_seq" TO service_role;


--
-- Name: TABLE "DieticianProfile"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public."DieticianProfile" TO anon;
GRANT ALL ON TABLE public."DieticianProfile" TO authenticated;
GRANT ALL ON TABLE public."DieticianProfile" TO service_role;


--
-- Name: SEQUENCE "DieticianProfile_id_seq"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public."DieticianProfile_id_seq" TO anon;
GRANT ALL ON SEQUENCE public."DieticianProfile_id_seq" TO authenticated;
GRANT ALL ON SEQUENCE public."DieticianProfile_id_seq" TO service_role;


--
-- Name: TABLE "DoctorAvailability"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public."DoctorAvailability" TO anon;
GRANT ALL ON TABLE public."DoctorAvailability" TO authenticated;
GRANT ALL ON TABLE public."DoctorAvailability" TO service_role;


--
-- Name: SEQUENCE "DoctorAvailability_id_seq"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public."DoctorAvailability_id_seq" TO anon;
GRANT ALL ON SEQUENCE public."DoctorAvailability_id_seq" TO authenticated;
GRANT ALL ON SEQUENCE public."DoctorAvailability_id_seq" TO service_role;


--
-- Name: TABLE "DoctorProfile"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public."DoctorProfile" TO anon;
GRANT ALL ON TABLE public."DoctorProfile" TO authenticated;
GRANT ALL ON TABLE public."DoctorProfile" TO service_role;


--
-- Name: SEQUENCE "DoctorProfile_id_seq"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public."DoctorProfile_id_seq" TO anon;
GRANT ALL ON SEQUENCE public."DoctorProfile_id_seq" TO authenticated;
GRANT ALL ON SEQUENCE public."DoctorProfile_id_seq" TO service_role;


--
-- Name: TABLE "HealthMetric"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public."HealthMetric" TO anon;
GRANT ALL ON TABLE public."HealthMetric" TO authenticated;
GRANT ALL ON TABLE public."HealthMetric" TO service_role;


--
-- Name: SEQUENCE "HealthMetric_id_seq"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public."HealthMetric_id_seq" TO anon;
GRANT ALL ON SEQUENCE public."HealthMetric_id_seq" TO authenticated;
GRANT ALL ON SEQUENCE public."HealthMetric_id_seq" TO service_role;


--
-- Name: TABLE "LabBooking"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public."LabBooking" TO anon;
GRANT ALL ON TABLE public."LabBooking" TO authenticated;
GRANT ALL ON TABLE public."LabBooking" TO service_role;


--
-- Name: SEQUENCE "LabBooking_id_seq"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public."LabBooking_id_seq" TO anon;
GRANT ALL ON SEQUENCE public."LabBooking_id_seq" TO authenticated;
GRANT ALL ON SEQUENCE public."LabBooking_id_seq" TO service_role;


--
-- Name: TABLE "LabPackage"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public."LabPackage" TO anon;
GRANT ALL ON TABLE public."LabPackage" TO authenticated;
GRANT ALL ON TABLE public."LabPackage" TO service_role;


--
-- Name: SEQUENCE "LabPackage_id_seq"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public."LabPackage_id_seq" TO anon;
GRANT ALL ON SEQUENCE public."LabPackage_id_seq" TO authenticated;
GRANT ALL ON SEQUENCE public."LabPackage_id_seq" TO service_role;


--
-- Name: TABLE "LabTechProfile"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public."LabTechProfile" TO anon;
GRANT ALL ON TABLE public."LabTechProfile" TO authenticated;
GRANT ALL ON TABLE public."LabTechProfile" TO service_role;


--
-- Name: SEQUENCE "LabTechProfile_id_seq"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public."LabTechProfile_id_seq" TO anon;
GRANT ALL ON SEQUENCE public."LabTechProfile_id_seq" TO authenticated;
GRANT ALL ON SEQUENCE public."LabTechProfile_id_seq" TO service_role;


--
-- Name: TABLE "Medicine"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public."Medicine" TO anon;
GRANT ALL ON TABLE public."Medicine" TO authenticated;
GRANT ALL ON TABLE public."Medicine" TO service_role;


--
-- Name: SEQUENCE "Medicine_id_seq"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public."Medicine_id_seq" TO anon;
GRANT ALL ON SEQUENCE public."Medicine_id_seq" TO authenticated;
GRANT ALL ON SEQUENCE public."Medicine_id_seq" TO service_role;


--
-- Name: TABLE "PatientProfile"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public."PatientProfile" TO anon;
GRANT ALL ON TABLE public."PatientProfile" TO authenticated;
GRANT ALL ON TABLE public."PatientProfile" TO service_role;


--
-- Name: SEQUENCE "PatientProfile_id_seq"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public."PatientProfile_id_seq" TO anon;
GRANT ALL ON SEQUENCE public."PatientProfile_id_seq" TO authenticated;
GRANT ALL ON SEQUENCE public."PatientProfile_id_seq" TO service_role;


--
-- Name: TABLE "Payment"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public."Payment" TO anon;
GRANT ALL ON TABLE public."Payment" TO authenticated;
GRANT ALL ON TABLE public."Payment" TO service_role;


--
-- Name: SEQUENCE "Payment_id_seq"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public."Payment_id_seq" TO anon;
GRANT ALL ON SEQUENCE public."Payment_id_seq" TO authenticated;
GRANT ALL ON SEQUENCE public."Payment_id_seq" TO service_role;


--
-- Name: TABLE "Plan"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public."Plan" TO anon;
GRANT ALL ON TABLE public."Plan" TO authenticated;
GRANT ALL ON TABLE public."Plan" TO service_role;


--
-- Name: TABLE "PlanFeature"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public."PlanFeature" TO anon;
GRANT ALL ON TABLE public."PlanFeature" TO authenticated;
GRANT ALL ON TABLE public."PlanFeature" TO service_role;


--
-- Name: SEQUENCE "PlanFeature_id_seq"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public."PlanFeature_id_seq" TO anon;
GRANT ALL ON SEQUENCE public."PlanFeature_id_seq" TO authenticated;
GRANT ALL ON SEQUENCE public."PlanFeature_id_seq" TO service_role;


--
-- Name: SEQUENCE "Plan_id_seq"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public."Plan_id_seq" TO anon;
GRANT ALL ON SEQUENCE public."Plan_id_seq" TO authenticated;
GRANT ALL ON SEQUENCE public."Plan_id_seq" TO service_role;


--
-- Name: TABLE "SubscriptionTracker"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public."SubscriptionTracker" TO anon;
GRANT ALL ON TABLE public."SubscriptionTracker" TO authenticated;
GRANT ALL ON TABLE public."SubscriptionTracker" TO service_role;


--
-- Name: SEQUENCE "SubscriptionTracker_subscriptionId_seq"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public."SubscriptionTracker_subscriptionId_seq" TO anon;
GRANT ALL ON SEQUENCE public."SubscriptionTracker_subscriptionId_seq" TO authenticated;
GRANT ALL ON SEQUENCE public."SubscriptionTracker_subscriptionId_seq" TO service_role;


--
-- Name: TABLE "User"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public."User" TO anon;
GRANT ALL ON TABLE public."User" TO authenticated;
GRANT ALL ON TABLE public."User" TO service_role;


--
-- Name: SEQUENCE "User_id_seq"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public."User_id_seq" TO anon;
GRANT ALL ON SEQUENCE public."User_id_seq" TO authenticated;
GRANT ALL ON SEQUENCE public."User_id_seq" TO service_role;


--
-- Name: TABLE messages; Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON TABLE realtime.messages TO postgres;
GRANT ALL ON TABLE realtime.messages TO dashboard_user;
GRANT SELECT,INSERT,UPDATE ON TABLE realtime.messages TO anon;
GRANT SELECT,INSERT,UPDATE ON TABLE realtime.messages TO authenticated;
GRANT SELECT,INSERT,UPDATE ON TABLE realtime.messages TO service_role;


--
-- Name: TABLE schema_migrations; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE realtime.schema_migrations TO postgres;
GRANT ALL ON TABLE realtime.schema_migrations TO dashboard_user;
GRANT SELECT ON TABLE realtime.schema_migrations TO anon;
GRANT SELECT ON TABLE realtime.schema_migrations TO authenticated;
GRANT SELECT ON TABLE realtime.schema_migrations TO service_role;
GRANT ALL ON TABLE realtime.schema_migrations TO supabase_realtime_admin;


--
-- Name: TABLE subscription; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE realtime.subscription TO postgres;
GRANT ALL ON TABLE realtime.subscription TO dashboard_user;
GRANT SELECT ON TABLE realtime.subscription TO anon;
GRANT SELECT ON TABLE realtime.subscription TO authenticated;
GRANT SELECT ON TABLE realtime.subscription TO service_role;
GRANT ALL ON TABLE realtime.subscription TO supabase_realtime_admin;


--
-- Name: SEQUENCE subscription_id_seq; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE realtime.subscription_id_seq TO postgres;
GRANT ALL ON SEQUENCE realtime.subscription_id_seq TO dashboard_user;
GRANT USAGE ON SEQUENCE realtime.subscription_id_seq TO anon;
GRANT USAGE ON SEQUENCE realtime.subscription_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE realtime.subscription_id_seq TO service_role;
GRANT ALL ON SEQUENCE realtime.subscription_id_seq TO supabase_realtime_admin;


--
-- Name: TABLE buckets; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.buckets TO anon;
GRANT ALL ON TABLE storage.buckets TO authenticated;
GRANT ALL ON TABLE storage.buckets TO service_role;
GRANT ALL ON TABLE storage.buckets TO postgres;


--
-- Name: TABLE migrations; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.migrations TO anon;
GRANT ALL ON TABLE storage.migrations TO authenticated;
GRANT ALL ON TABLE storage.migrations TO service_role;
GRANT ALL ON TABLE storage.migrations TO postgres;


--
-- Name: TABLE objects; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.objects TO anon;
GRANT ALL ON TABLE storage.objects TO authenticated;
GRANT ALL ON TABLE storage.objects TO service_role;
GRANT ALL ON TABLE storage.objects TO postgres;


--
-- Name: TABLE s3_multipart_uploads; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.s3_multipart_uploads TO service_role;
GRANT SELECT ON TABLE storage.s3_multipart_uploads TO authenticated;
GRANT SELECT ON TABLE storage.s3_multipart_uploads TO anon;


--
-- Name: TABLE s3_multipart_uploads_parts; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.s3_multipart_uploads_parts TO service_role;
GRANT SELECT ON TABLE storage.s3_multipart_uploads_parts TO authenticated;
GRANT SELECT ON TABLE storage.s3_multipart_uploads_parts TO anon;


--
-- Name: TABLE secrets; Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT SELECT,REFERENCES,DELETE,TRUNCATE ON TABLE vault.secrets TO postgres WITH GRANT OPTION;
GRANT SELECT,DELETE ON TABLE vault.secrets TO service_role;


--
-- Name: TABLE decrypted_secrets; Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT SELECT,REFERENCES,DELETE,TRUNCATE ON TABLE vault.decrypted_secrets TO postgres WITH GRANT OPTION;
GRANT SELECT,DELETE ON TABLE vault.decrypted_secrets TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: auth; Owner: supabase_auth_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON SEQUENCES  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON SEQUENCES  TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: auth; Owner: supabase_auth_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON FUNCTIONS  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON FUNCTIONS  TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: auth; Owner: supabase_auth_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON TABLES  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON TABLES  TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: extensions; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA extensions GRANT ALL ON SEQUENCES  TO postgres WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: extensions; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA extensions GRANT ALL ON FUNCTIONS  TO postgres WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: extensions; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA extensions GRANT ALL ON TABLES  TO postgres WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: graphql; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES  TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES  TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES  TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: graphql; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS  TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS  TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS  TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: graphql; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES  TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES  TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES  TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: graphql_public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES  TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES  TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES  TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: graphql_public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS  TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS  TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS  TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: graphql_public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES  TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES  TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES  TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES  TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES  TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES  TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES  TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES  TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES  TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS  TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS  TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS  TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS  TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS  TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS  TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES  TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES  TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES  TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES  TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES  TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES  TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: realtime; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON SEQUENCES  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON SEQUENCES  TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: realtime; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON FUNCTIONS  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON FUNCTIONS  TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: realtime; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON TABLES  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON TABLES  TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: storage; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES  TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES  TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES  TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: storage; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS  TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS  TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS  TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: storage; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES  TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES  TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES  TO service_role;


--
-- Name: issue_graphql_placeholder; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER issue_graphql_placeholder ON sql_drop
         WHEN TAG IN ('DROP EXTENSION')
   EXECUTE FUNCTION extensions.set_graphql_placeholder();


ALTER EVENT TRIGGER issue_graphql_placeholder OWNER TO supabase_admin;

--
-- Name: issue_pg_cron_access; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER issue_pg_cron_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_cron_access();


ALTER EVENT TRIGGER issue_pg_cron_access OWNER TO supabase_admin;

--
-- Name: issue_pg_graphql_access; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER issue_pg_graphql_access ON ddl_command_end
         WHEN TAG IN ('CREATE FUNCTION')
   EXECUTE FUNCTION extensions.grant_pg_graphql_access();


ALTER EVENT TRIGGER issue_pg_graphql_access OWNER TO supabase_admin;

--
-- Name: issue_pg_net_access; Type: EVENT TRIGGER; Schema: -; Owner: postgres
--

CREATE EVENT TRIGGER issue_pg_net_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_net_access();


ALTER EVENT TRIGGER issue_pg_net_access OWNER TO postgres;

--
-- Name: pgrst_ddl_watch; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER pgrst_ddl_watch ON ddl_command_end
   EXECUTE FUNCTION extensions.pgrst_ddl_watch();


ALTER EVENT TRIGGER pgrst_ddl_watch OWNER TO supabase_admin;

--
-- Name: pgrst_drop_watch; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER pgrst_drop_watch ON sql_drop
   EXECUTE FUNCTION extensions.pgrst_drop_watch();


ALTER EVENT TRIGGER pgrst_drop_watch OWNER TO supabase_admin;

--
-- PostgreSQL database dump complete
--

