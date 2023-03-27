# Azure Function Middleware

Azure Function Middleware provides a simple way to use the middleware pattern for Azure Functions with NodeJS in order to define cross-cutting functionality such as schema validation, authorization and error handling. 

## Usage
The interface is simple to use and could be easily expanded: 

```typescript
const schema = Joi.object().keys({
    name: Joi.string().min(3).max(30).required(),
});

const functionHandler = async (context: Context, req: HttpRequest): Promise<void> => {
    context.res = { status: 201 };
};

export default middleware(functionHandler, [validation(schema)]);
```

The goal is to provide a minimal feature set with generic functionality and an easy interface to create other middleware functions, which could be used for an Azure function.

## Error Handling

The middleware provides a central way to handle errors occurring in the control flow of the function. Every error thrown within the function gets caught by the middleware and processed. To define the correct response to a specific error the following structure can be thrown:

```typescript
export class ApplicationError<T> extends Error {
    status: number;
    body?: T;
}
```

Any error thrown in the function with this signature is getting returned to the caller with the defined status and body.

## Generic Functions

For additional generic functionality like request validation or authorization functions could be defined. The functions need to have the following structure:

```typescript
export type MiddlewareFunction = (context: Context, request: HttpRequest) => Promise<void>;
```

The function receives the Azure Function context and request to operate. The function needs to be passed when the middleware is configured. 

```typescript
export default middleware(functionHandler, [validation(schema)]);
```

In the above example a `validation` function is passed with a schema. All passed functions are called before the in the defined order before the handler function containing the logic for the request is called.

### Validation

The function to validate requests is based on [Joi](https://www.npmjs.com/package/joi). The usage is fairly simply:

```typescript
export default middleware(functionHandler, [validation(schema)]);
```

The passed schema is a Joi ObjectSchema to check the passed request against. When the request is valid against the schema, the next middleware function gets called. In case the check of the request against the schema is invalid, the middleware function throws an error, canceling the request and returning aan `400 - Bad Request` with the Joi error message.

The body of the response could be customized by adding a transformer like in the following example. The passed message is the Joi error message.

```typescript
export default middleware(handler, [
  validation(schema, (message) => ({
    type: 'Invalid  request object',
    detail: message,
  })),
])
```

By default, the request body is getting validated. To validate other parts of the request or context the `extractValidationContentFromRequest` function could be used, when initializing the middleware.

```typescript
export default middleware(handler, [
  validation(schema, undefined, (req, context) => req.query.name)),
])
```

In this example the `name` contained in the query is getting validated against the passed request.

### Authorization

To authorize a request the middleware function `authorization` could be used. The function is verifying a request parameter against a JWT Bearer Token. The information get extracted using two functions for the correct parameter and token counterpart.

```typescript
export default middleware(functionHandler, [authorization([])]);
```

The passed values in the array needs to be defined based on the following structure:  

```typescript
export type Rule<T> = {
    parameterExtractor: (parameters: ContextBindingData) => string;
    jwtExtractor: (jwt: T) => string;
};
```

### Header authentication

To authenticate requests against a rule, the header could be used. Therefore, the `headerAuthentication` pre-function is available.

```typescript
export default middleware(functionHandler, [headerAuthentication()]);
```

When no parameter is passed to the `headerAuthentication` the header `x-ms-client-principal-id` is checked, if present or not. This header is added to a request by the Azure plattform when e.g. a JWT Token is successfully validated.
The `x-ms-client-principal-id` and `x-ms-client-principal-name` header could only be set by the Azure plattform (https://learn.microsoft.com/en-us/azure/app-service/configure-authentication-user-identities).

It is also possible to pass a function to validate a specific header, like checking for basic authentication credentials. 
This could be done in the following manner `headerAuthentication((context, request) => {...})`.

### Post function execution

To execute a function after the handler is called, a post function execution could be defined. The post function could be used to close for example a database connection or something similar.

```typescript
const afterFunction = (context: Context, request: HttpRequest): Promise<void> => {
    context.log("Called after function")
    return;
}

export default middleware(functionHandler, [], [afterFunction]);
```
