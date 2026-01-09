# Azure Function Middleware

The Azure Function Middleware introduces a middleware pattern for [Azure Functions in Node.js](https://learn.microsoft.com/en-us/azure/azure-functions/functions-overview?pivots=programming-language-javascript), 
enhancing the development experience by simplifying the integration of cross-cutting concerns such as schema validation, authorization, and error handling.

## Installation

Before you integrate this middleware into your project, ensure you have Node.js installed, and you're familiar with Azure Functions. Follow these steps to set up:

```bash
npm install @senacor/azure-function-middleware
```

## Usage
The middleware interface is intuitive, designed for expansion, and integrates seamlessly with Azure Functions. Here's a quick example to get you started:

```typescript
import { HttpRequest, InvocationContext, app } from '@azure/functions';
import { middleware, requestBodyValidation } from '@senacor/azure-function-middleware';
import * as Joi from 'joi';

const httpHandler = async (request: HttpRequest, context: InvocationContext) => {
  context.info('function called');
  return { status: 201 };
};

const requestBodySchema = Joi.object().keys({
  name: Joi.string().min(3).max(30).required(),
});

app.http('example-function', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'example',
  handler: middleware(
    [requestBodyValidation(requestBodySchema)], 
    httpHandler, 
    []
  ),
});

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

Here is an example how you can write your own before and post execution functions:

```typescript
import { HttpHandler, app } from '@azure/functions';
import { BeforeExecutionFunction, PostExecutionFunction, middleware } from '@senacor/azure-function-middleware';

export const httpHandler: HttpHandler = async (request, context) => {
  context.info('Function called');
  return { status: 201 };
};

const beforeFunction: BeforeExecutionFunction = (request, context, result) => {
  context.info('Called before httpHandler');
};

const postFunction: PostExecutionFunction = (request, context, result) => {
  context.log('Called after httpHandler');
};

app.http('test-validation-function', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'validation',
  handler: middleware([beforeFunction], httpHandler, [postFunction]),
});
```

First all `beforeExecution` functions are executed in the given order. Then the `httpHandler` is called and afterwards all `postExecution` are executed in the given order.

The Azure Function Middleware provides some useful before and post execution functions which are described in the following sections.

### Request Body Validation

The function validates the request body based on a [Joi Schema](https://www.npmjs.com/package/joi).

```typescript
import { HttpHandler, app } from '@azure/functions';
import { middleware, requestBodyValidation } from '@senacor/azure-function-middleware';
import { ObjectSchema } from 'joi';
import * as Joi from 'joi';

export const httpHandler: HttpHandler = async (req, context) => {
  context.info('Function called');
  return { status: 201 };
};

const requestBodySchema: ObjectSchema = Joi.object({
  name: Joi.string().min(3).max(30).required(),
}).required();

app.http('example-function', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'example',
  handler: middleware([requestBodyValidation(requestBodySchema)], httpHandler, []),
});
```

By default, an `ApplicationError` with status 400 will be thrown and the `httpHandler` is not executed if the request body does not match the provided schema.
There is an additional parameter to customize the behavior of `requestBodyValidation` (see [requestBodyValidation.ts](src/validation/requestBodyValidation.ts)).

### Request Query Params Validation

The function validates the request query parameters based on a [Joi Schema](https://www.npmjs.com/package/joi).

```typescript
import { HttpHandler, app } from '@azure/functions';
import { middleware, requestQueryParamsValidation } from '@senacor/azure-function-middleware';
import { ObjectSchema } from 'joi';
import * as Joi from 'joi';

export const httpHandler: HttpHandler = async (req, context) => {
    context.info('Function called');
    return { status: 201 };
};

const queryParamsSchema: ObjectSchema = Joi.object({
  name: Joi.string().valid('active', 'expired').optional(),
});

app.http('example-function', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'example',
  handler: middleware([requestQueryParamsValidation(queryParamsSchema)], httpHandler, []),
});
```

By default, an `ApplicationError` with status 400 will be thrown and the `httpHandler` is not executed if the query params do not match the provided schema.
There is an additional parameter to customize the behavior of `requestQueryParamsValidation` (see [requestQueryParamsValidation.ts](src/validation/requestQueryParamsValidation.ts)).

### Response Body Validation

The function validates the response body based on a [Joi Schema](https://www.npmjs.com/package/joi).

```typescript
import { HttpHandler, app } from '@azure/functions';
import { middleware, responseBodyValidation } from '@senacor/azure-function-middleware';
import { ObjectSchema } from 'joi';
import * as Joi from 'joi';

export const httpHandler: HttpHandler = async (req, context) => {
    context.info('Function called');
    return {
        status: 200,
        jsonBody: {
            name: 'John Doe',
        },
    };
};

const responseSchema: ObjectSchema = Joi.object({
    name: Joi.string().required(),
});

app.http('example-function', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'example',
    handler: middleware([], httpHandler, [responseBodyValidation(responseSchema)]),
});
```

By default, an error is logged if the response body does not match the provided schema.
There is an additional parameter to customize the behavior of `responseBodyValidation` (see [responseBodyValidation.ts](src/validation/responseBodyValidation.ts)).

### Authorization

The authorization function verifies request parameters against JWT Bearer Tokens, employing customizable extraction functions for flexible security checks.

**IMPORTANT**: The signature of the JWT is not validated. Any well-formed JWT can be decoded (see [jwt-decode](https://www.npmjs.com/package/jwt-decode)).

```typescript
import { HttpHandler, HttpRequestParams, app } from '@azure/functions';
import { jwtAuthorization, middleware } from '@senacor/azure-function-middleware';

export const handler: HttpHandler = async (req, context) => {
  context.log(`Function called by ${context.extraInputs.get('jwt')}`);
  return { status: 204 };
};

app.http('test-jwt-authorization-function', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'account/{accountId}',
  handler: middleware<HttpHandler>(
    [
      jwtAuthorization([
        {
          parameterExtractor: (parameters: HttpRequestParams) => parameters.accountId,
          jwtExtractor: (jwt: { sub: string }) => jwt.sub,
        },
      ]),
    ],
    handler,
    [],
  ),
});
```

The passed values in the array needs to be defined based on the following structure:  

```typescript
export type Rule<T> = {
    parameterExtractor: (parameters: HttpRequestParams) => string;
    jwtExtractor: (jwt: T) => string;
};
```

### Header Authentication

To authenticate requests against a rule, the header could be used. Therefore, the `headerAuthentication` pre-function is available.

```typescript
import { HttpHandler, app } from '@azure/functions';
import { headerAuthentication, middleware } from '@senacor/azure-function-middleware';

export const httpHandler: HttpHandler = async (req, context) => {
  context.info('Function called');
  return { status: 201 };
};

app.http('example-function', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'example',
  handler: middleware([headerAuthentication()], httpHandler, []),
});
```

When no parameter is passed to the `headerAuthentication` the header `x-ms-client-principal-id` is checked, if present or not. This header is added to a request by the Azure plattform when e.g. a JWT Token is successfully validated.
The `x-ms-client-principal-id` and `x-ms-client-principal-name` header could only be set by the Azure plattform (https://learn.microsoft.com/en-us/azure/app-service/configure-authentication-user-identities).

It is also possible to pass a function to validate a specific header, like checking for basic authentication credentials. 
This could be done in the following manner `headerAuthentication((headers: Headers) => boolean)`.

## Support and Contact

If you encounter any issues or have questions about using this middleware, please file an issue in this repository or contact the maintainers at <florian.rudisch@senacor.com> or <manuel.kniep@senacor.com>.