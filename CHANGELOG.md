# CHANGELOG

## 1.2.0 (04.04.2022)

- Updated production relevant dependency "axios" to version 0.26.0

## 1.1.0 (29.01.2022)

- Updated Azure Function dependency to 3.0.0

## 1.0.0 (16.01.2022)

Features:

  - add middleware for azure function to use generic functionality across multiple azure functions
  - add [joi](https://github.com/sideway/joi) validation as integration for the middleware to validate incomming requests against a schema
  - add JWT authorization as integration for the middleware to authorize requests against a passed JWT
