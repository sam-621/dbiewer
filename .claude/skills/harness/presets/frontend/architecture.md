<!--- cSpell:disable --->

# Arquitectura

<!-- si: framework=react-vite -->
SPA en React + Vite + Tailwind v4 que consume `apps/{{backend_app}}`.
<!-- /si -->
<!-- si: framework=next -->
App en Next.js (App Router) + Tailwind v4 que consume `apps/{{backend_app}}`.
<!-- /si -->

## Estructura

<!-- si: framework=react-vite -->
```
src/
├── app/          app.tsx (rutas), app.css (tema de Tailwind v4), providers y error boundary
├── lib/
│   ├── api/      fetchers, operations, errors y tipos (compartido por todos los módulos)
│   └── <módulo>/ una carpeta por dominio: order, product, customer...
└── shared/       componentes, hooks, contexts, guards, i18n y utils compartidos
```
<!-- /si -->
<!-- si: framework=next -->
```
src/
├── app/          rutas de Next: layout.tsx, page.tsx por ruta, app.css (tema de Tailwind v4)
├── lib/
│   ├── api/      fetchers, operations, errors y tipos (compartido por todos los módulos)
│   └── <módulo>/ una carpeta por dominio: order, product, customer...
└── shared/       componentes, hooks, contexts, i18n y utils compartidos
```
<!-- /si -->

## Módulo

```
src/lib/<módulo>/
├── pages/        <nombre>-page.tsx, una por ruta
├── components/   <componente>/<archivo>.tsx, agrupados por pantalla o pieza
├── hooks/        use-<acción>.ts, uno por query o mutation
├── constants/    cache-keys.ts y constantes del módulo
└── utils/        <tema>.utils.ts, funciones puras
```

<!-- si: framework=react-vite -->
- Las rutas se registran en `src/app/app.tsx` importando la página del módulo.
- Las guards de ruta están en `src/shared/guards/` (`protect.tsx` para sesión, `public.tsx` para rutas sin sesión).
<!-- /si -->
<!-- si: framework=next -->
- `src/app/<ruta>/page.tsx` solo importa y renderiza la página del módulo. Nada de lógica en la carpeta `app/`.
- Las páginas del módulo son client components (`'use client'`) salvo que se decida lo contrario para una ruta.
- La sesión se protege en `src/middleware.ts`.
<!-- /si -->
- `@/` apunta a `src/`.

## API

<!-- si: data=graphql -->
- **Operations:** cada query, mutation y fragment se declara con `graphql(...)` en `src/lib/api/operations/<dominio>.operations.ts`.
- **Tipos:** `{{run}} gen:types` los genera en `src/lib/api/codegen/` a partir del schema de `apps/{{backend_app}}`. Se importan desde `@/lib/api/types`. Los fragments se leen con `getFragmentData(FRAGMENT, data)`.
- **Errores:** cada dominio tiene `src/lib/api/errors/<dominio>.errors.ts` con `get<Dominio>Error(apiErrors)`, que traduce el `code` de la API a un `ApiError` con mensaje para el usuario. Un `code` nuevo en la API se agrega aquí.
<!-- /si -->
<!-- si: data=rest -->
- **Endpoints:** cada dominio tiene `src/lib/api/endpoints/<dominio>.endpoints.ts` con una función por endpoint que usa el fetcher compartido (`apiFetch`) y devuelve el tipo de la respuesta.
- **Tipos:** las respuestas se tipan en `src/lib/api/types/<dominio>.types.ts`. Si la API publica OpenAPI, se generan con `{{run}} gen:types`.
- **Errores:** cada dominio tiene `src/lib/api/errors/<dominio>.errors.ts` con `get<Dominio>Error(error)`, que traduce el `code` del body de error a un `ApiError` con mensaje para el usuario. Un `code` nuevo en la API se agrega aquí.
<!-- /si -->
<!-- si: data=trpc -->
- **Cliente:** `src/lib/api/trpc.ts` crea el cliente con el tipo `AppRouter` importado de `apps/{{backend_app}}`. No hay codegen: los tipos salen del router.
- **Errores:** cada dominio tiene `src/lib/api/errors/<dominio>.errors.ts` con `get<Dominio>Error(error)`, que traduce el `code` del `TRPCError` a un `ApiError` con mensaje para el usuario.
<!-- /si -->

## Hooks

### Query

<!-- si: data=graphql -->
```ts
export const useGetOrders = (input?: OrderListInput) => {
  const result = useGqlQuery(GET_ORDERS_QUERY, {
    key: [OrderCacheKeys.Orders],
    variables: { input }
  });

  const orders = result.data?.orders.items.map(o => getFragmentData(COMMON_ORDER_FRAGMENT, o)) ?? [];

  return { orders, ...result };
};
```
<!-- /si -->
<!-- si: data=rest|trpc -->
```ts
export const useGetOrders = (input?: OrderListInput) => {
  const result = useQuery({
    queryKey: [OrderCacheKeys.Orders, input],
    queryFn: () => getOrders(input)
  });

  return { orders: result.data?.items ?? [], ...result };
};
```
<!-- /si -->

### Mutation

- Devuelve `Promise<ActionResult<XErrorCode>>`: `{ isSuccess: true }` o `{ isSuccess: false, error, errorCode }`.
- Si la API devuelve error, se traduce con `get<Dominio>Error`. Si todo sale bien, se refrescan las queries afectadas por sus cache keys.
- Errores inesperados: `Logger.error(error)` y `GENERIC_ERROR`.

<!-- si: data=graphql -->
```ts
export const useRemoveOrder = () => {
  const queryClient = useQueryClient();
  const { isPending, mutateAsync } = useGqlMutation(REMOVE_ORDER_MUTATION);

  const removeOrder = async (orderId: string): Promise<ActionResult<OrderErrorCode>> => {
    try {
      const { apiErrors } = await mutateAsync({ orderId });

      if (apiErrors.length) {
        const { error, errorCode } = getOrderError(apiErrors);

        return { isSuccess: false, error, errorCode };
      }

      await queryClient.refetchQueries({ queryKey: [OrderCacheKeys.Orders] });

      return { isSuccess: true };
    } catch (error) {
      Logger.error(error);
      return { isSuccess: false, error: GENERIC_ERROR };
    }
  };

  return { removeOrder, isLoading: isPending };
};
```
<!-- /si -->
<!-- si: data=rest|trpc -->
```ts
export const useRemoveOrder = () => {
  const queryClient = useQueryClient();
  const { isPending, mutateAsync } = useMutation({ mutationFn: removeOrder });

  const remove = async (orderId: string): Promise<ActionResult<OrderErrorCode>> => {
    try {
      await mutateAsync(orderId);
      await queryClient.refetchQueries({ queryKey: [OrderCacheKeys.Orders] });

      return { isSuccess: true };
    } catch (error) {
      if (isApiError(error)) {
        const { error: message, errorCode } = getOrderError(error);

        return { isSuccess: false, error: message, errorCode };
      }

      Logger.error(error);
      return { isSuccess: false, error: GENERIC_ERROR };
    }
  };

  return { removeOrder: remove, isLoading: isPending };
};
```
<!-- /si -->

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
export const NewProductPage = () => <ProductDetails />;

export const ProductDetailsPage = () => {
  const { id } = useParams() as { id: string };
  const { isLoading, product } = useGetProduct(id);

  if (!isLoading && !product) return <NotFound />;

  return <ProductDetails product={product} />;
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

## UI

- Componentes de `src/shared/components/ui` (shadcn/ui). Si falta uno, se agrega con el CLI de shadcn, no se escribe a mano.
- Íconos de `lucide-react`.
- Tailwind v4: el tema vive en `app.css` con `@theme`. No existe ni se crea `tailwind.config.js`.
