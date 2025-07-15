---
description: Unified rules for building a modular, testable NestJS backend using TypeScript, using British English spelling and grammar
globs:
  - src/**/*.ts
alwaysApply: true
---

## 🎯 Project Purpose

This is a NestJS backend application written in TypeScript. Code must be modular, clean, testable, and production-ready.

---

## 🇬🇧 British English Guidelines

- **Use British English spelling and grammar** in all code, comments, documentation, and user-facing text.
  - For example: “authorise”, “optimise”, “organise”, “colour”, “favour”, “initialise”, “authorisation”, etc.
- Use British English in all test case descriptions and assertions.
- Avoid Americanisms such as “organize”, “authorize”, “initialize”, etc.

---

## 📐 Architecture

- Structure the app by feature: `Module`, `Controller`, `Service`, `DTO` per domain.
- Use `@Injectable` and constructor injection for services and providers.
- Follow NestJS standards for decorators like `@Controller`, `@Get`, `@Post`, etc.

---

## ⚙ Controllers

- Should only handle routing, validation, and delegating to services.
- Validate inputs with DTOs.
- Return `Promise<T>` responses.
- Set status codes explicitly using `@HttpCode`.

---

## 🧠 Services

- Place all business logic here.
- Use `async/await` and wrap logic in `try/catch`.
- Throw HTTP exceptions (e.g., `NotFoundException`, `BadRequestException`, `UnauthorisedException`).
- Inject dependencies via constructor.

---

## 📦 DTOs & Validation

- Define DTOs using class-validator decorators.
- Use: `@IsString`, `@IsEmail`, `@Length`, `@IsOptional`, etc.
- Place DTOs in a `dto/` subfolder per feature.

---

## 🚨 Error Handling

- Use `try/catch` in all async service logic.
- Throw `HttpException` subclasses: `BadRequestException`, `NotFoundException`, `UnauthorisedException`, etc.
- Avoid exposing internal errors to clients.
- Use `Logger` from `@nestjs/common` to log errors.
- Use clear, British English messages in exceptions.