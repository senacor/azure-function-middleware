# Azure Function Middleware

Introduction

The Azure Function Middleware introduces a middleware pattern for Azure Functions in Node.js, enhancing the development 
experience by simplifying the integration of cross-cutting concerns such as schema validation, authorization, and error handling.

## Installation

Before you integrate this middleware into your project, ensure you have Node.js installed, and you're familiar with Azure Functions. Follow these steps to set up:


```bash
npm install @senacor/azure-function-middleware
```

## Usage
The middleware interface is intuitive, designed for expansion, and integrates seamlessly with Azure Functions. Here's a quick example to get you started:

```typescript
const schema = Joi.object().keys({
    name: Joi.string().min(3).max(30).required(),
});

const functionHandler = async (context: Context, req: HttpRequest): Promise<void> => {
    context.res = { status: 201 };
};

export default middleware([validation(schema), functionHandler, []]);
```

This pattern aims to deliver a core set of features and a simplified interface for creating additional middleware functions tailored for Azure Functions.

## Error Handling

Centralized error management is a key feature, ensuring all errors within the function's flow are intercepted and appropriately handled. 
Specific error responses can be defined by throwing errors in the following format:

```typescript
export class ApplicationError<T> extends Error {
    status: number;
    body?: T;
}
```

Any error thrown in the function with this signature is getting returned to the caller with the defined status and body.

## Generic Functions

The middleware supports the integration of generic functions like request validation or authorization. 
These functions must comply with the 'AzureFunction' type from the '@azure/functions' package. 
They are crucial for extending the middleware's capabilities while adhering to Azure's function signature requirements.

```typescript
import { AzureFunction } from '@azure/functions';

// 'AzureFunction' type signature
export type AzureFunction = (context: Context, ...args: any[]) => Promise<any> | void;

// Configuring middleware with generic functions
export default middleware([validation(schema)], functionHandler, []);
```

Such generic functions are executed in sequence before the main handler function. 
If a post-execution function is necessary, it can be included in the postExecution array, the third argument in the middleware function.

### Validation

The function to validate requests is based on [Joi](https://www.npmjs.com/package/joi). The usage is fairly simply:

```typescript
export default middleware([validation(schema)], functionHandler, []);
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
export default middleware([
    validation(schema, undefined, (req, context) => req.query.name)],
    handler, 
    []
)

```

In this example the `name` contained in the query is getting validated against the passed request.

### Authorization

The authorization function verifies request parameters against JWT Bearer Tokens, employing customizable extraction functions for flexible security checks.

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

Post-execution functions, ideal for tasks like closing database connections, can be defined to run after the main handler execution.

```typescript
const postFunction = (context: Context, request: HttpRequest): Promise<void> => {
    context.log("Called after function")
    return;
}

export default middleware(functionHandler, [], [postFunction]);
```

### Logging and Tracing with appInsights

To enhance the logging and tracing with appInsights you can wrap your function with the appInsightWrapper. Currently, this will log the query-parameter
and binding-context of request into the customProperties, which will make your logs more searchable.

Use the `AppInsightForHttpTrigger` for your http-functions:
```typescript
import {AppInsightForHttpTrigger} from "./appInsightsWrapper";

export default middleware([AppInsightForHttpTrigger.setup], handler, [AppInsightForHttpTrigger.finalizeAppInsight])
```

and the `AppInsightForNonHttpTrigger` for functions with different kinds of trigger (e.g. `activityTrigger` or `timerTrigger`).

## Support and Contact

If you encounter any issues or have questions about using this middleware, please file an issue in this repository or contact the maintainers at <florian.rudisch@senacor.com> or <manuel.kniep@senacor.com>.