-- Configuración de la Base de Datos para Focus Reward

-- 1. Tabla de Perfiles de Usuario (Monedas y Tema)
CREATE TABLE public.user_profiles (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    coins INTEGER DEFAULT 0 NOT NULL,
    current_theme TEXT DEFAULT 'default' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS (Row Level Security) para proteger los datos
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Los usuarios pueden ver su propio perfil" ON public.user_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Los usuarios pueden actualizar su propio perfil" ON public.user_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Los usuarios pueden insertar su propio perfil" ON public.user_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 2. Tabla de Recompensas Desbloqueadas
CREATE TABLE public.user_rewards (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    reward_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, reward_id)
);

ALTER TABLE public.user_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Los usuarios pueden ver sus recompensas" ON public.user_rewards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Los usuarios pueden insertar sus recompensas" ON public.user_rewards FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. Tabla de Tareas Pendientes
CREATE TABLE public.user_tasks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.user_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Los usuarios pueden ver sus tareas" ON public.user_tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Los usuarios pueden insertar tareas" ON public.user_tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Los usuarios pueden eliminar sus tareas" ON public.user_tasks FOR DELETE USING (auth.uid() = user_id);

-- 4. Trigger para crear un perfil vacío automáticamente cuando un usuario anónimo entra por primera vez
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, coins, current_theme)
  VALUES (new.id, 0, 'default');
  
  -- Recompensas por defecto
  INSERT INTO public.user_rewards (user_id, reward_id)
  VALUES (new.id, 'default');
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
