# CHANGELOG

## 5.1.0 (14.01.2026)

- Update peer dependency `@azure/functions` to `^4.11.0`

## 5.0.0 (08.01.2026)

- Remove middleware functions for application insights. We recommend to switch to Open Telementry (
  see https://learn.microsoft.com/en-us/azure/azure-monitor/app/classic-api
  and https://learn.microsoft.com/en-us/azure/azure-monitor/app/opentelemetry-enable).

## 4.0.2 (04.12.2025)
- `requestBodyValidation` returns now 400 error response if request body contains invalid json

## 4.0.1 (06.11.2025)
- Fix missing removal of TelemetryClient to prevent memory leaks

## 4.0.0 (08.10.2025)

- Upgrade to Joi v18 (see https://github.com/hapijs/joi/issues/2926)
- Exclude `code` query parameter by default from `requestQueryParamsValidation` to prevent unintended leakage of function keys

## 3.5.1 (28.07.2025)

- Exported `type ValidationFunction` (thank you, @adityamatt, for the PR)

## 3.5.0 (29.05.2025)

- Add Joi `ValidationOptions as optional parameter to the request and response validation functions (thank you, @adityamatt, for the suggestion)

## 3.4.0 (29.05.2025)

- Change return type of `validateUsingHeaderFn` from `headerAuthentication` to `boolean | Promise<boolean>`

## 3.3.0 (25.04.2025)

- Disable logging of url query parameters for http requests

## 3.2.2 (16.04.2025)

- Fix logging in `requestBodyValidation`

## 3.2.1 (03.02.2025)

- Change `@azure/functions` to peer dependency

## 3.2.0 (16.12.2024)

- Added new validation methods: `requestBodyValidation`, `requestQueryParamsValidation` and `responseBodyValidation`
- Updated documentation and example project

## 3.1.2 (13.12.2024)

- Use default limits for array length, object depth or string length for logging (reverts change from version 3.1.1) as this could cause a huge memory consumption in some cases
- Use `JSON.stringify` to log objects that have a `toJSON` method

## 3.1.1 (15.11.2024)

- Do not limit array length, object depth or string length for logging

## 3.1.0 (11.10.2024)

- Switched to `inspect` from `node:util` to stringify values for logging
- Changed `debug` and `trace` logs to severity level verbose

## 3.0.4 (02.10.2024)

- Fix logging of errors throw by the handler

## 3.0.3 (05.09.2024)

- Remove check for empty result

## 3.0.2 (22.08.2024)

- Disable Application Insights internal debug logging

## 3.0.1 (07.08.2024)

- Fix type of middleware function

## 3.0.0 (04.07.2024)

~ Upgraded to Programming Model v4 (https://techcommunity.microsoft.com/t5/apps-on-azure-blog/azure-functions-node-js-v4-programming-model-is-generally/ba-p/3929217)

- Removed Node16 from the CI/CD Pipeline

## 2.3.1 (26.02.2024)

~ Bump the version of jwt-decode

## 2.3.0 (15.01.2024)

- Do not add the full content of `context.bindingData` to `customDimensions` for app insights logging anymore as it contains i.e. the request body.

* Add `AppInsightForHttpTrigger.finalizeWithConfig` which allows you to configure when the request and response body should be logged and allows you to use a body sanitizer to remove sensitive data.

## 2.2.2 (03.11.2023)

- Added the `context` as a parameter for the `errorResponseHandler` function to enhance error handling capabilities.

## 2.2.1 (31.10.2023)

~ Resolve "\_a.substring is not a function" error with applicationInsights. Issue was found in applicationinsights Library's TelemetryClient.trackTrace and EnvelopeFactory.createTraceData methods. This fix targets the compatibility issue observed in version 2.5.1 or higher.

## 2.2.0 (31.10.2023)

- Introduced responseValidation functionality in the middleware. This new feature enhances the robustness of your applications by enabling schema validation for handlers' responses.
- Implemented the capability to dynamically enable or disable middleware functions within the execution flow. This addition brings conditional processing to your middleware stack, allowing greater control based on runtime conditions or application logic. Functions can now be seamlessly included or excluded from the execution process by resolving to true or false through a new integration pattern. This feature ensures that your application maintains high efficiency and adaptability in handling requests and processing logic.

## 2.1.0 (19.09.2023)

- Post-Execution-Functions will now be executed, even if the handler failed

* The middlewareWithErrorHandling was removed. To regain the same functionality you can now pass an option-flag, called disableErrorHandling

## 2.0.0 (01.04.2023)

- Added auto-logging functionality to the library that enhances searchability of saved log statements in Azure AppInsights by storing context properties in commonProperties.
- Removed the MiddlewareFunction-Type in favor for the azure-built-in one
- There are now two types of middleware available: one with error handling and one without. This is helpful because durable functions must throw their errors, otherwise the orchestrator will not restart a failed function.

## 1.5.0 (27.03.2023)

- Added additional helper function to authentication requests by header parameters
- Updated multiple dependencies

## 1.4.0 (04.02.2023)

- Updated axios dependency
- Updated test and build dependencies

## 1.3.0 (20.8.2022)

- Updated production relevant dependency "@azure/functions" to 3.2.0
- Updated test and build dependencies

## 1.2.0 (04.04.2022)

- Updated production relevant dependency "axios" to version 0.26.0

## 1.1.0 (29.01.2022)

- Updated Azure Function dependency to 3.0.0

## 1.0.0 (16.01.2022)

Features:

- add middleware for azure function to use generic functionality across multiple azure functions
- add [joi](https://github.com/sideway/joi) validation as integration for the middleware to validate incoming requests against a schema
- add JWT authorization as integration for the middleware to authorize requests against a passed JWT
