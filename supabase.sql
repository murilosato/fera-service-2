
-- 1. LIMPEZA DE GATILHOS ANTIGOS
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- 2. FUNÇÃO DE GATILHO ROBUSTA (SECURITY DEFINER é crucial aqui)
create or replace function public.handle_new_user()
returns trigger 
security definer 
set search_path = public
as $$
declare
  target_company_id uuid;
  target_role text;
  metadata_company_id text;
begin
  -- Captura metadados
  metadata_company_id := new.raw_user_meta_data->>'company_id';
  target_role := coalesce(new.raw_user_meta_data->>'role', 'DIRETORIA_MASTER');

  -- Lógica de Empresa: Vincular ou Criar
  if metadata_company_id is not null and metadata_company_id <> '' then
    target_company_id := metadata_company_id::uuid;
  else
    insert into public.companies (name)
    values ('Fera Service - ' || split_part(new.email, '@', 1))
    returning id into target_company_id;
  end if;

  -- Criar Perfil
  insert into public.profiles (id, company_id, full_name, email, role, status)
  values (
    new.id, 
    target_company_id, 
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    target_role,
    'ativo'
  );

  -- Auto-confirmação (Força o Supabase Auth a aceitar o login)
  update auth.users 
  set email_confirmed_at = now(),
      confirmed_at = now(),
      last_sign_in_at = now()
  where id = new.id;
  
  return new;
exception when others then
  -- Em caso de erro, ainda permitimos a criação do usuário auth para não travar o fluxo
  return new;
end;
$$ language plpgsql;

-- 3. REATIVAÇÃO DO GATILHO
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
