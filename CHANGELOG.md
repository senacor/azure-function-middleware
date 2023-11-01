# CHANGELOG

## 2.2.0 (31.10.2023)
+ Introduced responseValidation functionality in the middleware. This new feature enhances the robustness of your applications by enabling schema validation for handlers' responses.
+ Implemented the capability to dynamically enable or disable middleware functions within the execution flow. This addition brings conditional processing to your middleware stack, allowing greater control based on runtime conditions or application logic. Functions can now be seamlessly included or excluded from the execution process by resolving to true or false through a new integration pattern. This feature ensures that your application maintains high efficiency and adaptability in handling requests and processing logic.

## 2.1.0 (19.09.2023)
+ Post-Execution-Functions will now be executed, even if the handler failed
- The middlewareWithErrorHandling was removed. To regain the same functionality you can now pass an option-flag, called disableErrorHandling

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
