-- ============================================================
-- TripCraft AI — Initial Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- ── 1. Profiles (extends auth.users) ─────────────────────────

CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    avatar_url TEXT,
    travel_style TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- ── 2. Trips ─────────────────────────────────────────────────

CREATE TABLE public.trips (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    destination TEXT NOT NULL,
    country TEXT,
    start_date DATE,
    end_date DATE,
    num_days INTEGER,
    budget_level TEXT CHECK (budget_level IN ('budget', 'mid-range', 'luxury')),
    travel_style TEXT CHECK (travel_style IN ('adventure', 'relaxation', 'cultural', 'foodie', 'family', 'solo', 'romantic')),
    num_travelers INTEGER DEFAULT 1,
    special_requests TEXT,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'generated', 'saved', 'archived')),
    cover_image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own trips"
    ON public.trips FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own trips"
    ON public.trips FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trips"
    ON public.trips FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own trips"
    ON public.trips FOR DELETE
    USING (auth.uid() = user_id);

CREATE INDEX idx_trips_user_id ON public.trips(user_id);

-- ── 3. Itinerary Days ────────────────────────────────────────

CREATE TABLE public.itinerary_days (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
    day_number INTEGER NOT NULL,
    date DATE,
    title TEXT,
    summary TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.itinerary_days ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own itinerary days"
    ON public.itinerary_days FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.trips
            WHERE trips.id = itinerary_days.trip_id
            AND trips.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create own itinerary days"
    ON public.itinerary_days FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.trips
            WHERE trips.id = itinerary_days.trip_id
            AND trips.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own itinerary days"
    ON public.itinerary_days FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.trips
            WHERE trips.id = itinerary_days.trip_id
            AND trips.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own itinerary days"
    ON public.itinerary_days FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.trips
            WHERE trips.id = itinerary_days.trip_id
            AND trips.user_id = auth.uid()
        )
    );

CREATE INDEX idx_itinerary_days_trip_id ON public.itinerary_days(trip_id);

-- ── 4. Activities ────────────────────────────────────────────

CREATE TABLE public.activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    day_id UUID REFERENCES public.itinerary_days(id) ON DELETE CASCADE NOT NULL,
    time_slot TEXT CHECK (time_slot IN ('morning', 'afternoon', 'evening', 'night')),
    start_time TIME,
    end_time TIME,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT CHECK (category IN ('attraction', 'dining', 'accommodation', 'transportation', 'shopping', 'entertainment', 'nature', 'culture')),
    location_name TEXT,
    location_address TEXT,
    estimated_cost DECIMAL(10, 2),
    currency TEXT DEFAULT 'USD',
    notes TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own activities"
    ON public.activities FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.itinerary_days
            JOIN public.trips ON trips.id = itinerary_days.trip_id
            WHERE itinerary_days.id = activities.day_id
            AND trips.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create own activities"
    ON public.activities FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.itinerary_days
            JOIN public.trips ON trips.id = itinerary_days.trip_id
            WHERE itinerary_days.id = activities.day_id
            AND trips.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own activities"
    ON public.activities FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.itinerary_days
            JOIN public.trips ON trips.id = itinerary_days.trip_id
            WHERE itinerary_days.id = activities.day_id
            AND trips.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own activities"
    ON public.activities FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.itinerary_days
            JOIN public.trips ON trips.id = itinerary_days.trip_id
            WHERE itinerary_days.id = activities.day_id
            AND trips.user_id = auth.uid()
        )
    );

CREATE INDEX idx_activities_day_id ON public.activities(day_id);

-- ── 5. Auto-create profile on signup ─────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── 6. Auto-update updated_at timestamps ─────────────────────

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_trips_updated_at
    BEFORE UPDATE ON public.trips
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
