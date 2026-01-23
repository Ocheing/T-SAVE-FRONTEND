-- =============================================================================
-- PROFILE SYNC IMPROVEMENTS
-- Ensures profiles are properly created and synced with auth data
-- =============================================================================

-- 1. Improved handle_new_user function
-- This ensures profile is always created when a new user signs up
-- and properly handles both email/password and OAuth signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    existing_profile_id uuid;
BEGIN
    -- Check if profile already exists (for edge cases)
    SELECT id INTO existing_profile_id 
    FROM public.profiles 
    WHERE id = new.id;
    
    IF existing_profile_id IS NOT NULL THEN
        -- Profile exists, update it with any new metadata
        UPDATE public.profiles SET
            email = COALESCE(new.email, email),
            full_name = COALESCE(
                new.raw_user_meta_data->>'full_name',
                new.raw_user_meta_data->>'name',
                full_name
            ),
            phone = COALESCE(new.raw_user_meta_data->>'phone', phone),
            id_number = COALESCE(new.raw_user_meta_data->>'id_number', id_number),
            avatar_url = COALESCE(
                new.raw_user_meta_data->>'avatar_url',
                new.raw_user_meta_data->>'picture',
                avatar_url
            ),
            updated_at = now()
        WHERE id = new.id;
    ELSE
        -- Create new profile
        INSERT INTO public.profiles (
            id,
            email,
            full_name,
            phone,
            id_number,
            avatar_url,
            created_at,
            updated_at
        ) VALUES (
            new.id,
            new.email,
            COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
            new.raw_user_meta_data->>'phone',
            new.raw_user_meta_data->>'id_number',
            COALESCE(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture'),
            now(),
            now()
        );
    END IF;
    
    RETURN new;
EXCEPTION
    WHEN unique_violation THEN
        -- Handle race condition - profile was created by another process
        -- Update existing profile instead
        UPDATE public.profiles SET
            email = COALESCE(new.email, email),
            full_name = COALESCE(
                new.raw_user_meta_data->>'full_name',
                new.raw_user_meta_data->>'name',
                full_name
            ),
            updated_at = now()
        WHERE id = new.id;
        
        RETURN new;
    WHEN OTHERS THEN
        -- Log error but don't fail the auth signup
        RAISE WARNING 'Error creating profile for user %: %', new.id, SQLERRM;
        RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Handle user metadata updates (when user updates their profile via Supabase Auth)
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Only proceed if metadata has changed
    IF new.raw_user_meta_data IS DISTINCT FROM old.raw_user_meta_data OR 
       new.email IS DISTINCT FROM old.email THEN
        
        UPDATE public.profiles SET
            email = COALESCE(new.email, email),
            full_name = COALESCE(
                new.raw_user_meta_data->>'full_name',
                new.raw_user_meta_data->>'name',
                full_name
            ),
            phone = COALESCE(new.raw_user_meta_data->>'phone', phone),
            id_number = COALESCE(new.raw_user_meta_data->>'id_number', id_number),
            avatar_url = COALESCE(
                new.raw_user_meta_data->>'avatar_url',
                new.raw_user_meta_data->>'picture',
                avatar_url
            ),
            updated_at = now()
        WHERE id = new.id;
    END IF;
    
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Drop existing trigger if it exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 4. Add trigger for user updates
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
    AFTER UPDATE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_user_update();

-- 5. Function to ensure profile exists (can be called from frontend if needed)
CREATE OR REPLACE FUNCTION public.ensure_profile_exists()
RETURNS void AS $$
DECLARE
    current_user_id uuid;
    user_email text;
    user_name text;
BEGIN
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RETURN;
    END IF;
    
    -- Get user info from auth.users
    SELECT email, raw_user_meta_data->>'full_name'
    INTO user_email, user_name
    FROM auth.users
    WHERE id = current_user_id;
    
    -- Insert or update profile
    INSERT INTO public.profiles (id, email, full_name, created_at, updated_at)
    VALUES (current_user_id, user_email, COALESCE(user_name, ''), now(), now())
    ON CONFLICT (id) DO UPDATE SET
        email = COALESCE(EXCLUDED.email, profiles.email),
        updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.ensure_profile_exists TO authenticated;

-- =============================================================================
-- DONE - Profile sync is now robust and handles:
-- 1. New user signups (email/password and OAuth)
-- 2. User metadata updates
-- 3. Edge cases with race conditions
-- 4. Fallback function to ensure profile exists
-- =============================================================================
