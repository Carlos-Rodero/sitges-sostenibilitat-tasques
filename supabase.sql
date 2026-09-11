
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  text text not null check (char_length(text) > 0),
  responsible text not null check (responsible in ('CR','GL','CM','PROD')),
  done boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.tasks enable row level security;

-- PROTOTIP PÚBLIC:
-- Qualsevol persona que tingui l'enllaç pot llegir i modificar les tasques.
-- És pràctic per provar-ho, però NO és recomanable si l'URL es difon públicament.
create policy "public read tasks"
on public.tasks for select
to anon
using (true);

create policy "public insert tasks"
on public.tasks for insert
to anon
with check (true);

create policy "public update tasks"
on public.tasks for update
to anon
using (true)
with check (true);

create policy "public delete tasks"
on public.tasks for delete
to anon
using (true);

-- Dades inicials opcionals:
insert into public.tasks (text, responsible) values
('Confirmar ampliació del termini per trobar la persona de pràctiques (18–21 setembre)', 'GL'),
('Confirmar amb Aram els camps dels formularis d’acreditats', 'GL'),
('Consultar amb Àngel si podem incorporar l’enquesta de mobilitat a la venda d’entrades', 'CR'),
('Revisar i actualitzar els formularis amb la imatge 2026', 'CR'),
('Consultar amb Mònica si hi ha pressupost per a una altra activitat', 'CR'),
('Contactar amb Alba per l’activitat de Malvasia', 'CR'),
('Preparar comunicació i inscripcions de l’activitat del CEM (10/10)', 'CR'),
('Revisar la formació i incorporar-hi Sostenibilitat / We Are Legend', 'GL'),
('Enviar a Agustina la proposta de modificació de l’Stand We Are Legend', 'CM'),
('Consultar l’estat de la web de Sostenibilitat', 'CM'),
('Consultar amb l’Agència de Viatges com calculen la petjada de carboni', 'CR');
