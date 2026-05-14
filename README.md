# Late Nola

Organizá tu álbum, marcá las que tenés y encontrá las que te faltan.

## Stack

- Vite + React 19 + TypeScript
- Tailwind CSS v3 + tailwindcss-animate
- lucide-react, clsx, tailwind-merge
- Persistencia local vía `localStorage`
- Supabase preparado para integrarse

## Cómo correr

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # build de producción en dist/
npm run preview  # sirve el build local
```

## Estructura

```
src/
├── types/          # Interfaces TypeScript
├── data/           # Mocks estáticos
├── lib/            # Utilidades puras
├── hooks/          # Hooks de dominio
├── contexts/       # React contexts
├── services/       # Stubs Supabase
├── components/     # Componentes reutilizables
├── features/       # Componentes por dominio
└── views/          # Vistas de cada tab
```

## Conectar Supabase

1. Crear un proyecto en [supabase.com](https://supabase.com) y copiar la URL y la anon key.
2. Crear `.env.local` en esta carpeta con:
   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGci...
   ```
3. Instalar el cliente: `npm install @supabase/supabase-js`
4. Completar las implementaciones reales en `src/services/supabase.ts` y el resto de `src/services/`.
