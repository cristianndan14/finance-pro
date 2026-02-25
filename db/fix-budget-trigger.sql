-- 1. Updates handle_new_budget to STOP creating categories (they are global now)
CREATE OR REPLACE FUNCTION public.handle_new_budget()
RETURNS trigger AS $$
BEGIN
  -- 1. Add Creator as Owner in members table
  INSERT INTO public.budget_members (budget_id, user_id, role)
  VALUES (new.id, new.owner_id, 'owner');

  -- NO Categories created here anymore.

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Updates handle_new_user to seed GLOBAL categories for new users
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  -- Create Profile
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');

  -- Seed Default Global Categories
  INSERT INTO public.categories (user_id, name, icon, color) VALUES
    (new.id, 'Vivienda', 'Home', 'blue'),
    (new.id, 'Alimentación', 'Utensils', 'orange'),
    (new.id, 'Transporte', 'Car', 'gray'),
    (new.id, 'Salud', 'HeartPulse', 'red'),
    (new.id, 'Ocio', 'Ticket', 'purple'),
    (new.id, 'Suscripciones', 'Zap', 'yellow'),
    (new.id, 'Otros', 'MoreHorizontal', 'slate');

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
