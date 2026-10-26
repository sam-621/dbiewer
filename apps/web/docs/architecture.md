<!--- cSpell:disable --->

# Arquitectura

SPA en React + Vite + Tailwind v4 que consume `apps/api`.

## Estructura

```
src/
├── app/          app.tsx (rutas), app.css (tema de Tailwind v4), providers y error boundary
├── lib/
│   ├── api/      fetchers, auth client, operations, errors y tipos (compartido por todos los módulos)
│   └── <módulo>/ una carpeta por dominio: account, workspace, connection, query, schema, history...
└── shared/       componentes, hooks, contexts, guards, i18n y utils compartidos
```

## Módulo

```
src/lib/<módulo>/
├── pages/        <nombre>-page.tsx, una por ruta
├── components/   <componente>/<archivo>.tsx, agrupados por pantalla o pieza
├── hooks/        use-<acción>.ts, uno por query o mutation
├── constants/    cache-keys.ts y constantes del módulo
└── utils/        <tema>.utils.ts, funciones puras
```

- Las rutas se registran en `src/app/app.tsx` importando la página del módulo.
- Las guards de ruta están en `src/shared/guards/` (`protect.tsx` para sesión, `public.tsx` para rutas sin sesión). Se montan como ruta contenedora (`<Route element={<Protect />}>...</Route>`): renderizan `<Outlet />` o redirigen con `<Navigate replace>`. Sus piezas auxiliares (como `guard-loading.tsx`) van en la misma carpeta.
- `@/` apunta a `src/`.

## API

- **Operations:** cada query, mutation y fragment se declara con `graphql(...)` en `src/lib/api/operations/<dominio>.operations.ts`.
- **Tipos:** `yarn gen:types` los genera en `src/lib/api/codegen/` a partir del schema de `apps/api`. Se importan desde `@/lib/api/types`. Los fragments se leen con `getFragmentData(FRAGMENT, data)`.
- **Errores:** la API lanza los errores de negocio como errores de GraphQL con `extensions.code`. Cada dominio tiene `src/lib/api/errors/<dominio>.errors.ts` con `get<Dominio>Error(error)`, que traduce ese `code` a un `ApiError` con mensaje para el usuario. Un `code` nuevo en la API se agrega aquí.
- **Errores del auth client:** Better Auth no pasa por GraphQL. Sus errores se traducen en el mismo `<dominio>.errors.ts` por el `status` HTTP (`getAccountError` → `TOO_MANY_REQUESTS` con 429), y devuelven `ApiError | null`: `null` cae en `GENERIC_ERROR`.

## Hooks

### Query

```ts
export const useGetConnections = () => {
  const result = useGqlQuery(GET_CONNECTIONS_QUERY, {
    key: [ConnectionCacheKeys.Connections]
  });

  const connections =
    result.data?.connections.items.map(c => getFragmentData(COMMON_CONNECTION_FRAGMENT, c)) ?? [];

  return { connections, ...result };
};
```

### Mutation

- Devuelve `Promise<ActionResult<XErrorCode>>`: `{ isSuccess: true }` o `{ isSuccess: false, error, errorCode }`.
- Si la API lanza un error de negocio (`isApiError(error)`), se traduce con `get<Dominio>Error`. Si todo sale bien, se refrescan las queries afectadas por sus cache keys con `refetchQueries`. La sesión (`AccountCacheKeys.Me`) es la excepción: se invalida con `invalidateQueries` después del login o el logout, para que las guards reaccionen.
- Errores inesperados: `Logger.error(error)` y `GENERIC_ERROR`.

```ts
export const useRemoveConnection = () => {
  const queryClient = useQueryClient();
  const { isPending, mutateAsync } = useGqlMutation(REMOVE_CONNECTION_MUTATION);

  const removeConnection = async (
    connectionId: string
  ): Promise<ActionResult<ConnectionErrorCode>> => {
    try {
      await mutateAsync({ connectionId });
      await queryClient.refetchQueries({ queryKey: [ConnectionCacheKeys.Connections] });

      return { isSuccess: true };
    } catch (error) {
      if (isApiError(error)) {
        const { error: message, errorCode } = getConnectionError(error);

        return { isSuccess: false, error: message, errorCode };
      }

      Logger.error(error);
      return { isSuccess: false, error: GENERIC_ERROR };
    }
  };

  return { removeConnection, isLoading: isPending };
};
```

### Mutation del auth client

Las acciones de Better Auth (login, logout) usan `useMutation` de react-query sobre `authClient` en vez de `useGqlMutation`. El cliente no lanza: devuelve `{ data, error }`, así que el hook lee `error` y lo traduce con `get<Dominio>Error` solo si el dominio tiene un code que corresponda a esa acción (el 429 del magic link). Si no hay ninguno (logout), todo error va a `Logger.error` y `GENERIC_ERROR`, y el hook devuelve `ActionResult` sin code. Devuelve el mismo `ActionResult`. Las URLs de callback van absolutas (`${window.location.origin}/...`), porque Better Auth resuelve las relativas contra la URL de la api.

```ts
export const useSignInMagicLink = () => {
  const { isPending, mutateAsync } = useMutation({
    mutationFn: (email: string) =>
      authClient.signIn.magicLink({
        email,
        callbackURL: `${window.location.origin}/`,
        errorCallbackURL: `${window.location.origin}/login`
      })
  });

  const signInMagicLink = async (email: string): Promise<ActionResult<AccountErrorCode>> => {
    try {
      const { error } = await mutateAsync(email);

      if (!error) return { isSuccess: true };

      const accountError = getAccountError(error);
      if (accountError) return { isSuccess: false, ...accountError };

      Logger.error(error);
      return { isSuccess: false, error: GENERIC_ERROR };
    } catch (error) {
      Logger.error(error);
      return { isSuccess: false, error: GENERIC_ERROR };
    }
  };

  return { signInMagicLink, isLoading: isPending };
};
```

### Cache keys

Cada módulo define `constants/cache-keys.ts` con un objeto `<Módulo>CacheKeys`. Nunca strings sueltos como key.

## Componente `<X>Details` (crear y editar)

Cada entidad editable tiene un solo componente `<X>Details` que sirve para crear y para editar. Si recibe la entidad, edita; si no, crea.

```
components/details/
├── <x>-details.tsx           el componente: provider + Form + layout de la página
├── use-form/
│   ├── form-schema.ts        schema de zod
│   └── use-form.ts           use<X>DetailsForm y use<X>DetailsFormContext
├── actions/                  acciones del header (remove, archive...)
│   └── remove/
│       ├── remove-<x>.tsx
│       └── use-remove-<x>-button.ts
└── <sección>/                una carpeta por card o pieza del formulario
```

### Páginas

Las dos páginas renderizan el mismo componente:

```tsx
export const NewConnectionPage = () => <ConnectionDetails />;

export const ConnectionDetailsPage = () => {
  const { id } = useParams() as { id: string };
  const { isLoading, connection } = useGetConnection(id);

  if (!isLoading && !connection) return <NotFound />;

  return <ConnectionDetails connection={connection} />;
};
```

### `use-form.ts`

- `use<X>DetailsForm(entity)`: `useForm` con `zodResolver(Schema)` y `defaultValues` tomados de la entidad o vacíos.
- `onSubmit`: si hay entidad, llama al hook de update y hace `form.reset(values)`; si no, llama al de create y navega a `/<ruta>/<id>`.
- `use<X>DetailsFormContext()`: une `useFormContext<FormValues>()` con el contexto de la página. Las secciones lo usan para leer el form y la entidad sin recibir props.
- `export type FormValues = z.infer<typeof Schema>`.

### Secciones y acciones

- Cada sección es una card en su carpeta y lee el form con `use<X>DetailsFormContext()`.
- Cada acción tiene un componente y un hook `use<Acción><X>Button` que llama al hook de mutation, notifica y navega si hace falta.

## Formularios que no son `<X>Details`

Un formulario que no edita una entidad (login, búsqueda) usa la misma carpeta `use-form/` dentro de su componente, sin provider ni contexto:

```
components/<pieza>/
├── <pieza>-form.tsx
└── use-form/
    ├── form-schema.ts        schema de zod
    └── use-form.ts           use<Pieza>Form y FormValues
```

- `use<Pieza>Form()`: `useForm` con `zodResolver(Schema)` y `defaultValues` vacíos.
- Los mensajes del schema son keys de i18n y se muestran con `t(errors.<campo>.message)`.

## UI

- Componentes de `src/shared/components/ui` (coss ui). Si falta uno, se agrega desde el registry `@coss`, no se escribe a mano. Ver `docs/design-system.md`.
- Íconos de `lucide-react`.
- Tailwind v4: el tema vive en `app.css` con `@theme`. No existe ni se crea `tailwind.config.js`.
