# 🧠 GitHub Copilot Instructions — NestJS Backend (TypeScript)

## 🎯 Project Purpose

This is a **NestJS backend** project written in **TypeScript**, designed to be modular, testable, scalable, and maintainable.

---

## 🇬🇧 British English Guidelines

- **Use British English spelling and grammar** in all code comments, variable names, documentation, and user-facing messages.
  - Examples: “organise” (not “organize”), “authorise”, “colour”, “favour”, “initialise”, “optimise”, “authorisation”, “modularise”.
- Prefer British punctuation and date formats in documentation.
- Review all output for Americanisms and convert to British English.

---

## 📐 Architecture Guidelines

- Organise code by feature folders: each feature must include a `Module`, `Controller`, `Service`, and `DTO`.
- Follow NestJS dependency injection using `@Injectable` and constructor injection.
- Use standard NestJS decorators: `@Controller`, `@Get`, `@Post`, `@Put`, `@Delete`, `@Body`, `@Param`, `@Query`, `@HttpCode`, and `HttpStatus`.

---

## ⚙ Controller Rules

- Controllers should only handle routing — all logic goes to the service layer.
- Validate inputs using DTOs and `@Body()`.
- Return `Promise<T>` for all responses.
- Use `@HttpCode(HttpStatus.XYZ)` for explicit HTTP status codes.

---

## 🧠 Service Rules

- Services handle all business logic and data access.
- Use `async/await` and `try/catch` for error safety.
- Inject dependencies like repositories or other services using the constructor.
- Avoid logic duplication.

---

## 📦 DTO & Validation Rules

- Define DTOs using `class-validator` decorators:
  - `@IsString`, `@IsEmail`, `@IsOptional`, `@Length`, etc.
- Keep DTOs in a `dto/` folder under each feature module.
- Always validate user input in the controller.

---

## 🚨 Error Handling Guidelines

- Use `try/catch` in all async service methods.
- Throw exceptions using NestJS built-ins: `BadRequestException`, `NotFoundException`, `UnauthorisedException`, `InternalServerErrorException`.
- Use `@HttpCode` to manage status codes in controllers.
- Log server-side errors with `Logger` from `@nestjs/common`, not `console.log`.
- Avoid leaking internal details to the client.

```ts
async findById(id: string): Promise<User> {
  const user = await this.userRepo.findOne(id);
  if (!user) throw new NotFoundException(`User ${id} not found`);
  return user;
}
```

---

## 🧪 Testing Standards (Jest)

- Use `@nestjs/testing` and `Test.createTestingModule()` to test services/controllers.
- Mock injected services or repositories using `jest.fn()` or `jest.mock()`.
- Follow structure: `describe`, `beforeEach`, `it`, `expect()`.
- Test both success and failure paths.
- Use British English in all test names, descriptions, and assertions.

---

## 🧼 Style & Clean Code

- Avoid `any` type. Use DTOs and interfaces.
- Follow SOLID and DRY principles.
- Use PascalCase for classes and camelCase for functions/variables.
- Use British English consistently throughout the codebase.

---

## ✅ Folder Structure

```
src/
  └── users/
      ├── users.module.ts
      ├── users.controller.ts
      ├── users.service.ts
      ├── dto/
      │   ├── create-user.dto.ts
      │   └── update-user.dto.ts
      └── __tests__/
          ├── users.service.spec.ts
          └── users.controller.spec.ts
```