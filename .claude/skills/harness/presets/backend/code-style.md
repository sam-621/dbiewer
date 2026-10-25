<!--- cSpell:disable --->

# Estilo de código

Aplica a todo código nuevo. Si un archivo existente lo contradice, manda este doc.

## General

<!-- si: comments=none -->
- **Sin comentarios.** Ni explicativos, ni JSDoc, ni `TODO`, ni separadores. Solo si el usuario lo pide, y solo el que pidió.
<!-- /si -->
<!-- si: comments=why -->
- **Comentarios solo para el porqué** que el código no puede decir (una restricción externa, un bug de una librería, una decisión no obvia). Nunca para describir qué hace el código. Sin JSDoc ni separadores.
<!-- /si -->
- **Código y tests en inglés**, incluidos strings y valores de prueba.
- **Sin `any`**; `unknown` + narrowing.
- **Sin non-null assertion (`!`)**. Si algo puede ser `null`, se maneja o se usa un helper que lance.
- **Dinero en centavos** (enteros). Porcentajes como fracción (`0.2`).
- **Sin parámetros con default solo para que los tests escriban menos.** Si producción siempre pasa el argumento, es requerido.
<!-- si: architecture=ddd|modular -->
- **Clases, no objetos de funciones** (`export const Foo = { merge }` no).
- No mezclar validación y persistencia en un service.
<!-- /si -->

## Formato e imports

- ESLint + Prettier mandan. Correr `{{run}} lint:fix`; no reordenar imports a mano.
- Grupos de imports (los impone `simple-import-sort`): externos → `@/...` → relativos `../` → relativos `./`.
<!-- si: architecture=ddd|modular -->
- `@/` apunta a `src/`. Se usa para cruzar módulos; relativos solo dentro del mismo módulo.
<!-- /si -->
<!-- si: architecture=layered -->
- `@/` apunta a `src/`. Se usa para cruzar capas; relativos solo dentro de la misma carpeta.
<!-- /si -->
- `import type` para lo que solo es tipo (regla `consistent-type-imports`).
- Argumentos sin usar se prefijan con `_` (`_repositories`).

## Naming

<!-- si: architecture=ddd|modular -->
| Qué | Regla | Ejemplo |
|-----|-------|---------|
| Carpeta del use case | verbo en kebab-case | `use-cases/add-customer/` |
| Clase del use case | sustantivo agente, nunca el verbo ni `Service` | `OrderCustomerAdder` |
| Archivo del use case | kebab-case de la clase | `order-customer-adder.ts` |
| Tipo del input | `<Clase>Input` | `OrderCustomerAdderInput` |
| Service | sustantivo del concepto | `OrderFinder`, `CustomerRegistry` |
| Error | describe el caso + `Error` | `MissingShippingAddressError` |
| Archivo de errores | `<módulo>-errors.ts` | `order-errors.ts` |
| Variable de instancia | camelCase de la clase | `const orderRemover = new OrderRemover(uowCtx)` |
<!-- /si -->
<!-- si: architecture=ddd -->
| Value object | singular; la entidad guarda el arreglo | `CustomField`, `customFields: CustomField[]` |
<!-- /si -->
<!-- si: architecture=layered -->
| Qué | Regla | Ejemplo |
|-----|-------|---------|
| Archivos | `<recurso>.<capa>.ts` | `order.service.ts` |
| Clases | `<Recurso><Capa>` | `OrderService`, `OrderRepository` |
| Métodos del service | verbo de la acción | `create`, `cancel`, `addCustomer` |
| Schemas | `<Acción><Recurso>Schema` | `CreateOrderSchema` |
| Error | describe el caso + `Error` | `OrderNotFoundError` |
<!-- /si -->

<!-- si: architecture=ddd|modular -->
## Use case

```ts
const schema = z.object({
  orderId: z.uuid()
});

type OrderRemoverInput = z.output<typeof schema>;

export class OrderRemover extends UseCase<typeof schema> {
  private orderFinder: OrderFinder;

  constructor(private readonly ctx: UowContext) {
    super(schema);

    this.orderFinder = new OrderFinder(ctx);
  }

  async run(input: OrderRemoverInput) {
    try {
      const order = await this.orderFinder.findById(input.orderId);

      if (order instanceof {{BaseError}}) return order;

      return this.ctx.repositories.order.softRemove({ where: { id: order.id } });
    } catch (error) {
      if (error instanceof {{BaseError}}) return error;

      throw error;
    }
  }
}
```

- El schema de zod (`const schema`) va arriba, en el mismo archivo.
- Validaciones entre campos con `.refine()`; formas dependientes de un tipo con `z.discriminatedUnion()`.
<!-- /si -->
<!-- si: architecture=ddd|modular y errors=return -->
- Errores con `if (x instanceof {{BaseError}}) return x;`.
<!-- /si -->
<!-- si: architecture=ddd|modular y errors=throw -->
- Sin `try/catch` en el `run`: el error se lanza y lo traduce el adapter. El ejemplo de arriba queda con `const order = await this.orderFinder.findById(...)` y el `return` directo.
<!-- /si -->
<!-- si: architecture=ddd -->

## Value object

```ts
type Props = { definitionId: string; value: unknown };

export class CustomField extends ValueObject<Props> {
  private constructor(props: Props) {
    CustomField.validate(props);

    super(props);
  }

  static create(props: Props) {
    return new CustomField(props);
  }

  get definitionId(): string {
    return this.props.definitionId;
  }
}
```
<!-- /si -->
<!-- si: architecture=layered -->
## Service

```ts
export class OrderService {
  constructor(private readonly orderRepository: OrderRepository) {}

  async cancel(input: CancelOrderInput) {
    const order = await this.orderRepository.findById(input.orderId);

    if (!order) throw new OrderNotFoundError(input.orderId);
    if (order.state === 'shipped') throw new ShippedOrderCannotBeCanceledError(order.id);

    return this.orderRepository.update(order.id, { state: 'canceled' });
  }
}
```

## Controller

```ts
export const cancelOrder = async (req: Request, res: Response) => {
  const input = CancelOrderSchema.parse({ orderId: req.params.id });
  const order = await req.ctx.services.order.cancel(input);

  res.json(order);
};
```
<!-- /si -->

## Errores

```ts
export class OrderNotFoundError extends {{BaseError}} {
  constructor(id: string) {
    super(`Order not found with id ${id}`);
  }
}
```
<!-- si: architecture=ddd|modular -->

## Barrels

<!-- /si -->
<!-- si: architecture=ddd -->
Aggregates, entidades, value objects, services y repos tienen `index.ts` con `export * from './<archivo>'`. Los use cases no: se importan por su ruta completa.
<!-- /si -->
<!-- si: architecture=modular -->
Services y repos tienen `index.ts` con `export * from './<archivo>'`. Los use cases no: se importan por su ruta completa. El `index.ts` del módulo exporta solo lo que usan otros módulos.
<!-- /si -->
