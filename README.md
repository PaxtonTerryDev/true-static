# TrueStatic

A TypeScript framework for managing singleton instances with type safety and zero boilerplate. Inspired by Godot's Autoload system, TrueStatic eliminates the traditional `getInstance()` pattern and provides clean, type-safe global access to your services.

## Why TrueStatic?

Traditional singleton patterns in TypeScript are verbose and error-prone:

```typescript
// Traditional approach - verbose and error-prone
class ConfigService {
  private static instance: ConfigService;
  
  private constructor(private apiUrl: string) {}
  
  static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService('default-url');
    }
    return ConfigService.instance;
  }
}

// Usage requires remembering getInstance() everywhere
const config = ConfigService.getInstance();
```

TrueStatic eliminates this boilerplate entirely:

```typescript
// Clean class definition
class ConfigService {
  constructor(private apiUrl: string) {}
}

// One-time registration
initializeGlobalAccess();
registerGlobalSingleton('ConfigService', ConfigService, 'https://api.example.com');

// Access anywhere without imports!
const config = Global.ConfigService;
```

## Features

- **Zero Boilerplate**: No more `getInstance()` calls or static methods
- **Global Access**: Access singletons from anywhere without imports (like Godot's Autoload)
- **Type Safe**: Full TypeScript support with autocomplete and type checking
- **Dependency Injection**: Automatic resolution of singleton dependencies
- **Lazy Initialization**: Singletons are only created when first accessed
- **Constructor Arguments**: Support for singletons that need configuration
- **Testing Friendly**: Easy to mock and reset between tests
- **Circular Dependency Detection**: Helpful error messages for dependency cycles

## Important Limitations

**TrueStatic is not a traditional singleton enforcer.** It acts as a convenient access point and registry for managing single instances, but does not prevent additional instantiations of registered classes.

- **Direct instantiation is still possible**: You can still create new instances with `new YourService()` even after registering it as a singleton
- **Access point pattern**: TrueStatic provides a centralized way to access shared instances, similar to a service locator
- **Developer responsibility**: It's up to you to use the singleton registry consistently rather than creating new instances directly
- **Testing flexibility**: This design actually makes testing easier since you can create isolated instances when needed

If you need strict singleton enforcement that prevents all direct instantiation, consider using traditional private constructor patterns alongside TrueStatic.

## Installation

```bash
npm install true-static
# or
pnpm add true-static
# or
yarn add true-static
```

## Quick Start

TrueStatic offers two patterns for managing singletons:

### Global Access Pattern (Recommended)

```typescript
import { initializeGlobalAccess, registerGlobalSingleton } from 'true-static';

// 1. Initialize global access (call once in your app)
initializeGlobalAccess();

// 2. Define your service classes
class ConfigService {
  constructor(public apiUrl: string, public timeout: number) {}
}

class DatabaseService {
  constructor(public connectionString: string) {}
}

// 3. Register singletons globally
registerGlobalSingleton('ConfigService', ConfigService, 'https://api.example.com', 5000);
registerGlobalSingleton('DatabaseService', DatabaseService, 'postgresql://localhost:5432/mydb');

// 4. Access singletons anywhere in your app without imports!
const config = Global.ConfigService;
const db = Global.DatabaseService;

console.log(config.apiUrl); // 'https://api.example.com'
console.log(db.connectionString); // 'postgresql://localhost:5432/mydb'
```

### Traditional Registry Pattern

```typescript
import { Singletons } from 'true-static';

// Define your service classes
class ConfigService {
  constructor(public apiUrl: string, public timeout: number) {}
}

class DatabaseService {
  constructor(public connectionString: string) {}
}

// Register singletons with their constructor arguments
Singletons.register(ConfigService, 'https://api.example.com', 5000);
Singletons.register(DatabaseService, 'postgresql://localhost:5432/mydb');

// Access singletons anywhere in your app with full type safety
const config = Singletons.get(ConfigService);
const db = Singletons.get(DatabaseService);

console.log(config.apiUrl); // 'https://api.example.com'
console.log(db.connectionString); // 'postgresql://localhost:5432/mydb'
```

## Usage Examples

### TypeScript Integration

For full type safety with global access, extend the `GlobalSingletons` interface:

```typescript
// types.ts - Define your global singletons interface
declare module 'true-static' {
  interface GlobalSingletons {
    ConfigService: ConfigService;
    DatabaseService: DatabaseService;
    LoggerService: LoggerService;
  }
}

// Now you get full autocomplete and type checking!
const config = Global.ConfigService; // ✅ Fully typed
const db = Global.DatabaseService;   // ✅ Fully typed
const logger = Global.LoggerService; // ✅ Fully typed
```

### Dependency Injection

TrueStatic automatically resolves dependencies between singletons:

```typescript
class ConfigService {
  constructor(public apiUrl: string, public timeout: number) {}
}

class ApiService {
  constructor(
    private config: ConfigService,
    private retryCount: number = 3
  ) {}

  async fetchData(endpoint: string) {
    // Use this.config.apiUrl and this.config.timeout
  }
}

// Register with dependency injection
registerGlobalSingleton('ConfigService', ConfigService, 'https://api.example.com', 5000);
registerGlobalSingleton('ApiService', ApiService, ConfigService, 5);

// Dependencies are automatically resolved
const api = Global.ApiService;
console.log(api.config.apiUrl); // 'https://api.example.com'
```

### Services Without Constructor Arguments

```typescript
class LoggerService {
  log(message: string) {
    console.log(`[LOG] ${message}`);
  }
}

// Register without arguments
registerGlobalSingleton('LoggerService', LoggerService);

// Use anywhere
const logger = Global.LoggerService;
logger.log('Hello world!');
```

### Testing

TrueStatic provides easy testing utilities for isolating singleton instances:

```typescript
import { Singletons, initializeGlobalAccess, registerGlobalSingleton } from 'true-static';

describe('MyService', () => {
  beforeEach(() => {
    // Clear all singletons before each test
    Singletons.clear();
    
    // Reinitialize global access for each test
    initializeGlobalAccess();
  });

  it('should work with fresh singleton instances', () => {
    // Register test-specific configuration
    registerGlobalSingleton('ConfigService', ConfigService, 'http://test-api.com', 1000);
    
    const config = Global.ConfigService;
    expect(config.apiUrl).toBe('http://test-api.com');
  });

  it('should work with traditional registry pattern', () => {
    // You can still use the traditional pattern in tests
    Singletons.register(ConfigService, 'http://test-api.com', 1000);
    
    const config = Singletons.get(ConfigService);
    expect(config.apiUrl).toBe('http://test-api.com');
  });
});
```

## API Reference

### Global Access API

#### `initializeGlobalAccess(): void`

Initialize the global access system. Call this once in your application entry point.

#### `registerGlobalSingleton<T>(name: string, constructor: Constructor<T>, ...args: any[]): void`

Register a singleton class with a global name for easy access.

**Parameters:**
- `name`: The global name for the singleton (used in `Global.{name}`)
- `constructor`: The class to register as a singleton
- `...args`: Arguments to pass to the constructor (including other singleton classes for dependency injection)

**Throws:**
- `Error` if the class is already registered

#### `Global.{name}`

Access any registered singleton globally. Returns the singleton instance, creating it on first access.

**Type Safety:**
To get full TypeScript support, extend the `GlobalSingletons` interface:

```typescript
declare module 'true-static' {
  interface GlobalSingletons {
    YourService: YourService;
  }
}
```

### Traditional Registry API

#### `Singletons.register<T>(constructor: Constructor<T>, ...args: any[]): void`

Register a singleton class with optional constructor arguments.

**Parameters:**
- `constructor`: The class to register as a singleton
- `...args`: Arguments to pass to the constructor when the instance is created

**Throws:**
- `Error` if the class is already registered

#### `Singletons.get<T>(constructor: Constructor<T>): T`

Get the singleton instance of a class. Creates the instance on first access.

**Parameters:**
- `constructor`: The class to get the singleton instance of

**Returns:**
- The singleton instance

**Throws:**
- `Error` if the class is not registered

#### `Singletons.clear(): void`

Clear all registered singletons. Useful for testing.

#### `Singletons.isRegistered<T>(constructor: Constructor<T>): boolean`

Check if a class is registered as a singleton.

**Parameters:**
- `constructor`: The class to check

**Returns:**
- `true` if the class is registered, `false` otherwise

## Contributing

We welcome contributions! Please feel free to submit issues and enhancement requests.

## License

This project is licensed under the ISC License.
