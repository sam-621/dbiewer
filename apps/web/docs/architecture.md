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
- Las guards de ruta están en `src/shared/guards/` (`protect.tsx` para sesión con workspace, `onboarding.tsx` para sesión sin workspace, `public.tsx` para rutas sin sesión). `Protect` manda a `/onboarding` si `me.workspace` es `null`, y `Onboarding` manda a `/` si ya existe. Se montan como ruta contenedora (`<Route element={<Protect />}>...</Route>`): renderizan `<Outlet />` o redirigen con `<Navigate replace>`. Sus piezas auxiliares (como `guard-loading.tsx`) van en la misma carpeta.
- `@/` apunta a `src/`.

## API

- **Operations:** cada query, mutation y fragment se declara con `graphql(...)` en `src/lib/api/operations/<dominio>.operations.ts`.
- **Tipos:** `yarn gen:types` los genera en `src/lib/api/codegen/` a partir del schema de `apps/api`. Se importan desde `@/lib/api/types`. Los fragments se leen con `getFragmentData(FRAGMENT, data)`.
- **Errores:** la API devuelve los errores de negocio en `apiErrors` del payload de la mutation (`{ apiErrors: [{ code, message }], <entidad> }`). Cada dominio tiene `src/lib/api/errors/<dominio>.errors.ts` con `get<Dominio>Error(code)`, que traduce ese `code` a un `ApiError` con mensaje para el usuario. Un `code` nuevo en la API se agrega aquí.
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
- Si el payload trae un error en `apiErrors`, se traduce con `get<Dominio>Error(code)`. Si todo sale bien, se refrescan las queries afectadas por sus cache keys con `refetchQueries`; las mutations que cambian el usuario o su workspace refrescan `AccountCacheKeys.Me`. La excepción es el login y el logout: ahí la sesión se invalida con `invalidateQueries`, para que las guards reaccionen.
- Errores inesperados: `Logger.error(error)` y `GENERIC_ERROR`.

```ts
export const useRemoveConnection = () => {
  const queryClient = useQueryClient();
  const { isPending, mutateAsync } = useGqlMutation(REMOVE_CONNECTION_MUTATION);

  const removeConnection = async (
    connectionId: string
  ): Promise<ActionResult<ConnectionErrorCode>> => {
    try {
      const { removeConnection } = await mutateAsync({ connectionId });
      const [apiError] = removeConnection.apiErrors;

      if (apiError) return { isSuccess: false, ...getConnectionError(apiError.code) };

      await queryClient.refetchQueries({ queryKey: [ConnectionCacheKeys.Connections] });
      return { isSuccess: true };
    } catch (error) {
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

Mientras el web solo cree una entidad y no la edite (como las conexiones), su formulario sigue la forma de [formularios que no son `<X>Details`](#formularios-que-no-son-xdetails). Cuando llegue la edición, pasa a `<X>Details`.

```
components/details/
├── <x>-details.tsx           el componente: provider + Form + layout de la página
├── use-<x>-details-form.ts  use<X>DetailsForm, use<X>DetailsFormContext, schema y FormValues
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

### `use-<x>-details-form.ts`

Sigue la forma de los hooks de formulario (ver abajo):

- `use<X>DetailsForm(entity)`: `useForm` con `zodResolver(Schema)` y `defaultValues` tomados de la entidad o vacíos.
- `onSubmit` vive en el hook: si hay entidad, llama al hook de update y hace `form.reset(values)`; si no, llama al de create y navega a `/<ruta>/<id>`.
- `use<X>DetailsFormContext()`: une `useFormContext<FormValues>()` con el contexto de la página. Las secciones lo usan para leer el form y la entidad sin recibir props.

### Secciones y acciones

- Cada sección es una card en su carpeta y lee el form con `use<X>DetailsFormContext()`.
- Cada acción tiene un componente y un hook `use<Acción><X>Button` que llama al hook de mutation, notifica y navega si hace falta.

## Formularios que no son `<X>Details`

Un formulario que no edita una entidad (login, búsqueda) tiene su hook en un archivo junto al componente, sin provider ni contexto:

```
components/<pieza>/
├── <pieza>-form.tsx          solo UI
├── use-<pieza>-form.ts       use<Pieza>Form, schema y FormValues
└── <sub-pieza>/              una carpeta por pieza que muestra el form (como link-sent/)
    └── <sub-pieza>.tsx
```

- `use<Pieza>Form(params)`: sigue la forma de los [hooks de formulario](#hooks-de-formulario), con `defaultValues` vacíos.
- Los mensajes del schema son keys de i18n y se muestran con `t(errors.<campo>.message)`.

## Modales con formulario

Un formulario que se abre en un modal tiene un componente `<acción>-<x>-dialog/` con el `Dialog` de coss, su botón y su estado abierto/cerrado adentro. El formulario va aparte, con la forma de [formularios que no son `<X>Details`](#formularios-que-no-son-xdetails):

```
components/
├── new-<x>-dialog/
│   └── new-<x>-dialog.tsx    Dialog + DialogTrigger + DialogHeader, y el estado isOpen
└── <x>-form/
    ├── <x>-form.tsx          Form envolviendo DialogPanel (campos) y DialogFooter (botones)
    └── use-<x>-form.ts
```

- El modal se cierra desde el formulario con un callback por parámetro: `<ConnectionForm onSuccess={() => setIsOpen(false)} />`. "Cancel" es un `DialogClose`.
- Después de guardar no se navega: la mutation refresca la cache y la pantalla de atrás se actualiza sola.

## Hooks de formulario

Todo hook de formulario (`<X>Details` u otro) vive en un solo archivo `use-<nombre>-form.ts`, sin carpeta, y tiene la misma forma:

- El hook tiene adentro la mutation y el `onSubmit`, que se devuelve ya envuelto con `form.handleSubmit`.
- Si el submit falla, el error va con `form.setError('root', { message: result.error })`: así `isSubmitSuccessful` queda en `false` y RHF limpia `errors.root` en el siguiente submit. No hay estado `submitError` aparte.
- El componente lee el error de `form.formState.errors.root?.message` y el éxito de `form.formState.isSubmitSuccessful` (por ejemplo, para mostrar un estado "enviado" en lugar del form). `form.reset()` vuelve al form vacío.
- Devuelve `{ form, isLoading, onSubmit, ... }`: `form` es el resultado de `useForm` sin spread, y al lado lo demás que use el componente.
- El schema de zod y `type FormValues = z.infer<typeof Schema>` van en el mismo archivo, debajo del hook. No hay `form-schema.ts`.
- Lo que llega de afuera (callbacks) entra por parámetro.
- El componente solo arma la UI: `<Form onSubmit={onSubmit}>` y lee `form.register`, `form.formState`, etc.

```ts
export const useLoginForm = () => {
  const { signInMagicLink, isLoading } = useSignInMagicLink();

  const form = useForm<FormValues>({
    resolver: zodResolver(Schema),
    defaultValues: { email: '' }
  });

  const onSubmit = async ({ email }: FormValues) => {
    const result = await signInMagicLink(email);

    if (!result.isSuccess) form.setError('root', { message: result.error });
  };

  return { form, isLoading, onSubmit: form.handleSubmit(onSubmit) };
};

const Schema = z.object({
  email: z.email('Enter a valid email')
});

type FormValues = z.infer<typeof Schema>;
```

## UI

- Componentes de `src/shared/components/ui` (coss ui). Si falta uno, se agrega desde el registry `@coss`, no se escribe a mano. Ver `docs/design-system.md`.
- Íconos de [amicons](https://amicons.design) a través del wrapper `@/shared/components/icons/icons` (`amicons/icons/round/{line,solid}/<nombre>.svg?react` con `vite-plugin-svgr`, prop `variant="line" | "solid"`; el estado seleccionado usa `solid`). Si falta un ícono, se agrega al wrapper. Lo nuevo no usa `lucide-react`.
- Tailwind v4: el tema vive en `app.css` con `@theme`. No existe ni se crea `tailwind.config.js`.
