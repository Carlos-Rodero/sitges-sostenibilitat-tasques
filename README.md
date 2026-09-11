# Pendents Sostenibilitat · Sitges 2026

Petit bloc compartit de tasques per a l'equip de Sostenibilitat.

## Què fa

- Crear una nova tasca.
- Assignar-la a `CR`, `GL`, `CM` o `PROD`.
- Marcar-la com a feta.
- Filtrar per responsable.
- Amagar les tasques fetes.
- Eliminar una tasca.

## Provar-ho sense backend

Obre `index.html` al navegador.

Si `config.js` no té les credencials de Supabase, l'aplicació funciona en **mode local** i desa les tasques només en aquell navegador mitjançant `localStorage`.

Això permet provar el disseny immediatament, però **no comparteix les tasques entre usuaris**.

## Fer-lo compartit amb Supabase

1. Crea un projecte gratuït a Supabase.
2. Obre **SQL Editor** i executa el contingut de `supabase.sql`.
3. Ves a **Project Settings → API**.
4. Copia:
   - Project URL
   - anon / publishable key
5. Edita `config.js` i enganxa aquests dos valors.
6. Publica els fitxers a GitHub Pages, Netlify o Vercel.

A partir d'aquell moment tots els usuaris veuran la mateixa llista.

## Important sobre seguretat

El fitxer `supabase.sql` inclou unes polítiques RLS pensades **només per fer un prototip ràpid**:
qualsevol persona amb accés a la web pot crear, editar i eliminar tasques.

Per a una versió definitiva és millor afegir autenticació (per exemple, magic link per correu) i limitar les modificacions als membres de l'equip.

## Fitxers

- `index.html` – interfície.
- `styles.css` – disseny.
- `app.js` – lògica.
- `config.js` – configuració de Supabase.
- `supabase.sql` – base de dades i polítiques.
