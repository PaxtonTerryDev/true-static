# TrueStatic

A TypeScript framework for managing singleton instances with type safety and zero boilerplate.

## Features

- **Zero Boilerplate**: No more `getInstance()` calls or static methods
- **Type Safe**: Full TypeScript support with autocomplete and type checking
- **Lazy Initialization**: Singletons are only created when first accessed
- **Constructor Arguments**: Support for singletons that need configuration
- **Testing Friendly**: Easy to mock and reset between tests

## Installation

```bash
npm install true-static
# or
pnpm add true-static
# or
yarn add true-static
```

## Quick Start

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

### Simple Service (No Constructor Arguments)

```typescript
class LoggerService {
  log(message: string) {
    console.log(`[LOG] ${message}`);
  }
}

// Register without arguments
Singletons.register(LoggerService);

// Use anywhere
const logger = Singletons.get(LoggerService);
logger.log('Hello world!');
```

### Service with Configuration

```typescript
class ApiService {
  constructor(
    private baseUrl: string,
    private apiKey: string,
    private retryCount: number = 3
  ) {}

  async fetchData(endpoint: string) {
    // Implementation here
  }
}

// Register with configuration
Singletons.register(ApiService, 'https://api.example.com', 'your-api-key', 5);

// Use the configured singleton
const api = Singletons.get(ApiService);
api.fetchData('/users');
```

### Testing

```typescript
import { Singletons } from 'true-static';

describe('MyService', () => {
  beforeEach(() => {
    // Clear all singletons before each test
    Singletons.clear();
  });

  it('should work with fresh singleton instances', () => {
    // Register test-specific configuration
    Singletons.register(ConfigService, 'http://test-api.com', 1000);
    
    const config = Singletons.get(ConfigService);
    expect(config.apiUrl).toBe('http://test-api.com');
  });
});
```

## API Reference

### `Singletons.register<T>(constructor: Constructor<T>, ...args: any[]): void`

Register a singleton class with optional constructor arguments.

**Parameters:**
- `constructor`: The class to register as a singleton
- `...args`: Arguments to pass to the constructor when the instance is created

**Throws:**
- `Error` if the class is already registered

### `Singletons.get<T>(constructor: Constructor<T>): T`

Get the singleton instance of a class. Creates the instance on first access.

**Parameters:**
- `constructor`: The class to get the singleton instance of

**Returns:**
- The singleton instance

**Throws:**
- `Error` if the class is not registered

### `Singletons.clear(): void`

Clear all registered singletons. Useful for testing.

### `Singletons.isRegistered<T>(constructor: Constructor<T>): boolean`

Check if a class is registered as a singleton.

**Parameters:**
- `constructor`: The class to check

**Returns:**
- `true` if the class is registered, `false` otherwise

## Why TrueStatic?

Traditional singleton patterns in TypeScript are verbose and awkward:

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

// Usage requires remembering getInstance()
const config = ConfigService.getInstance();
```

TrueStatic eliminates this boilerplate:

```typescript
// TrueStatic approach - clean and simple
class ConfigService {
  constructor(private apiUrl: string) {}
}

Singletons.register(ConfigService, 'https://api.example.com');
const config = Singletons.get(ConfigService);
```

## License

ISC
