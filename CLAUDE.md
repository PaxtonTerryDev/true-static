# Singleton Manager - TypeScript NPM Package

## Project Overview

A TypeScript framework for managing singleton instances with a focus on developer experience and type safety. The goal is to eliminate the boilerplate and awkwardness of traditional singleton patterns while providing Godot Autoload-style convenience for accessing singletons throughout an application.

**This project is designed to be published as an NPM package** for use in TypeScript/JavaScript projects.

## Problem Statement

Current TypeScript singleton implementations suffer from several issues:

- **Verbose boilerplate**: Constant `getInstance()` calls and static method patterns
- **Poor developer experience**: Manual dependency management and initialization order
- **Testing difficulties**: Hard to mock or reset singletons between tests
- **Type safety gaps**: Weak typing around singleton access and dependencies
- **Initialization complexity**: Manual handling of lazy loading and dependency resolution

The project aims to provide a clean, type-safe alternative that makes singletons feel like a natural part of the language.

## Core Requirements

### 1. Simple Registration & Access

- **One-liner registration** of singleton classes without boilerplate
- **Global access pattern** that doesn't require imports or getInstance() calls
- **Full type safety** with proper TypeScript intellisense and autocomplete
- **Runtime type checking** to catch configuration errors early

### 2. Automatic Initialization

- **Lazy initialization** - singletons created only when first accessed
- **Constructor parameter handling** for singletons that need configuration
- **Deterministic initialization order** when singletons have dependencies
- **Clear error handling** for initialization failures

### 3. Dependency Resolution

- **Automatic dependency injection** between singletons
- **Dependency graph resolution** with proper ordering
- **Circular dependency detection** with helpful error messages
- **Optional vs required dependencies** with different handling strategies

### 4. Clean API Design

- **Intuitive syntax** that feels natural to TypeScript developers
- **Minimal setup** required to get started
- **Consistent patterns** across all framework features
- **Good documentation** with clear examples

## Nice-to-Have Features

### 5. Decorator Support (High Priority)

```typescript
@Singleton()
class GameManager {
  constructor(private config: Config) {}
}

@Singleton()
class AudioManager {
  @Inject() gameManager!: GameManager;
}
```

### 6. Lifecycle Management (Medium Priority)

- **Initialization hooks** (beforeInit, afterInit)
- **Graceful shutdown** handling with cleanup
- **Reset functionality** for development and testing
- **Lifecycle event system** for inter-singleton communication

### 7. Development & Debugging Tools (Medium Priority)

- **Debug mode** showing initialization order and timing
- **Dependency graph visualization** for complex applications
- **Runtime inspection** of singleton state and relationships
- **Performance monitoring** of singleton access patterns

### 8. Testing Support (High Priority)

- **Easy mocking/stubbing** of singleton instances
- **Test isolation** with automatic reset between tests
- **Dependency override** system for test configurations
- **Mock singleton registration** for unit testing

### 9. Advanced Features (Low Priority)

- **Scoped singletons** (per-request, per-session, per-module)
- **Conditional registration** based on environment or feature flags
- **Hot-reloading support** for development workflows
- **Plugin system** for extending framework functionality

## Technical Considerations

### Type Safety

- Leverage TypeScript's advanced type system (generics, conditional types, mapped types)
- Provide compile-time guarantees about singleton availability
- Ensure proper type inference for dependency injection

### Performance

- Minimize runtime overhead for singleton access
- Efficient dependency resolution algorithms
- Lazy loading to avoid unnecessary initialization

### Bundle Size

- Keep core framework lightweight
- Optional features should be tree-shakeable
- Minimal external dependencies

### Developer Experience

- Clear error messages with actionable guidance
- Good IDE integration with autocomplete
- Comprehensive documentation with practical examples

## Success Criteria

### Core Functionality

- [ ] Register singletons with minimal boilerplate
- [ ] Access singletons globally with full type safety
- [ ] Automatic dependency resolution without manual ordering
- [ ] Clear error handling for common misconfigurations

### Developer Experience

- [ ] Intuitive API that feels "TypeScript native"
- [ ] Excellent IDE support with autocomplete and type checking
- [ ] Comprehensive documentation with real-world examples
- [ ] Easy integration into existing TypeScript projects

### Portfolio Value

- [ ] Demonstrates advanced TypeScript skills (generics, decorators, type manipulation)
- [ ] Shows architectural thinking and design pattern knowledge
- [ ] Solves real developer pain points
- [ ] Clean, maintainable codebase suitable for showcasing

## Implementation Notes

### Phase 1: Core Framework

Focus on basic registration, access, and dependency resolution without decorators.

### Phase 2: Enhanced DX

Add decorator support, better error messages, and basic debugging tools.

### Phase 3: Testing & Polish

Implement testing utilities, documentation, and advanced features.

## Inspiration

This project draws inspiration from:

- **Godot's Autoload system** - Global singleton access pattern
- **Angular's Dependency Injection** - Decorator-based registration and injection
- **Spring Framework** - Lifecycle management and scoping concepts
- **InversifyJS** - TypeScript-first dependency injection patterns

The goal is to combine the best aspects of these systems while maintaining simplicity and focusing on the singleton use case specifically.
