/**
 * Constructor type for creating instances of class T
 * @template T - The type of the class instance
 */
type Constructor<T = {}> = new (...args: any[]) => T;

/**
 * Internal registry entry for a singleton instance
 * @template T - The type of the singleton instance
 */
interface SingletonEntry<T> {
  /** The constructor function for the singleton */
  constructor: Constructor<T>;
  /** The cached singleton instance (undefined until first access) */
  instance?: T;
  /** Original constructor arguments provided during registration */
  args: any[];
  /** List of constructor dependencies that need to be resolved */
  dependencies: Constructor<any>[];
  /** Constructor arguments with dependencies resolved to instances */
  resolvedArgs?: any[];
}

/**
 * Core singleton registry that manages singleton instances with dependency injection
 * and lazy initialization. Provides both traditional class-based access and global
 * access patterns.
 */
export class SingletonRegistry {
  /** Map of constructor functions to their singleton entries */
  private static registry = new Map<Constructor<any>, SingletonEntry<any>>();
  /** Stack tracking current initialization chain to detect circular dependencies */
  private static initializationStack = new Set<Constructor<any>>();

  /**
   * Register a singleton class with its constructor arguments
   * 
   * @template T - The type of the singleton class
   * @param constructor - The class constructor to register as a singleton
   * @param args - Arguments to pass to the constructor, including other singleton classes for dependency injection
   * @throws {Error} If the class is already registered
   * 
   * @example
   * ```typescript
   * class ConfigService {
   *   constructor(public apiUrl: string) {}
   * }
   * 
   * SingletonRegistry.register(ConfigService, 'https://api.example.com');
   * ```
   */
  static register<T>(
    constructor: Constructor<T>,
    ...args: any[]
  ): void {
    if (this.registry.has(constructor)) {
      throw new Error(`Singleton ${constructor.name} is already registered`);
    }

    const dependencies: Constructor<any>[] = [];
    const processedArgs: any[] = [];

    for (const arg of args) {
      if (typeof arg === 'function' && arg.prototype && arg.prototype.constructor === arg) {
        dependencies.push(arg);
        processedArgs.push(arg);
      } else {
        processedArgs.push(arg);
      }
    }

    this.registry.set(constructor, {
      constructor,
      args: processedArgs,
      dependencies,
    });
  }

  /**
   * Get the singleton instance of a registered class, creating it on first access
   * 
   * @template T - The type of the singleton class
   * @param constructor - The class constructor to get the singleton instance of
   * @returns The singleton instance
   * @throws {Error} If the class is not registered
   * @throws {Error} If a circular dependency is detected
   * 
   * @example
   * ```typescript
   * const config = SingletonRegistry.get(ConfigService);
   * ```
   */
  static get<T>(constructor: Constructor<T>): T {
    const entry = this.registry.get(constructor);
    
    if (!entry) {
      throw new Error(`Singleton ${constructor.name} is not registered`);
    }

    if (entry.instance) {
      return entry.instance;
    }

    if (this.initializationStack.has(constructor)) {
      const stackArray = Array.from(this.initializationStack);
      const cycle = stackArray.slice(stackArray.indexOf(constructor));
      cycle.push(constructor);
      const cycleNames = cycle.map(c => c.name).join(' -> ');
      throw new Error(`Circular dependency detected: ${cycleNames}`);
    }

    this.initializationStack.add(constructor);
    
    try {
      if (!entry.resolvedArgs) {
        entry.resolvedArgs = [];
        
        for (const arg of entry.args) {
          if (entry.dependencies.includes(arg)) {
            if (!this.registry.has(arg)) {
              throw new Error(`Dependency ${arg.name} is not registered for singleton ${constructor.name}`);
            }
            entry.resolvedArgs.push(this.get(arg));
          } else {
            entry.resolvedArgs.push(arg);
          }
        }
      }

      entry.instance = new entry.constructor(...entry.resolvedArgs);
      return entry.instance;
    } finally {
      this.initializationStack.delete(constructor);
    }
  }

  /**
   * Clear all registered singletons and reset the registry
   * Useful for testing to ensure clean state between tests
   * 
   * @example
   * ```typescript
   * // In test setup
   * beforeEach(() => {
   *   SingletonRegistry.clear();
   * });
   * ```
   */
  static clear(): void {
    this.registry.clear();
    this.initializationStack.clear();
  }

  /**
   * Check if a class is registered as a singleton
   * 
   * @template T - The type of the class to check
   * @param constructor - The class constructor to check
   * @returns True if the class is registered, false otherwise
   * 
   * @example
   * ```typescript
   * if (SingletonRegistry.isRegistered(ConfigService)) {
   *   const config = SingletonRegistry.get(ConfigService);
   * }
   * ```
   */
  static isRegistered<T>(constructor: Constructor<T>): boolean {
    return this.registry.has(constructor);
  }
}

/**
 * Convenient alias for SingletonRegistry for shorter usage
 * 
 * @example
 * ```typescript
 * Singletons.register(ConfigService, 'https://api.example.com');
 * const config = Singletons.get(ConfigService);
 * ```
 */
export const Singletons = SingletonRegistry;

/**
 * Global type declarations for the Global singleton access pattern
 */
declare global {
  /**
   * Interface for type-safe global singleton access
   * Extend this interface to add your singleton types:
   * 
   * @example
   * ```typescript
   * declare module 'true-static' {
   *   interface GlobalSingletons {
   *     ConfigService: ConfigService;
   *     DatabaseService: DatabaseService;
   *   }
   * }
   * ```
   */
  interface GlobalSingletons {}
  
  /**
   * Global singleton access object
   * Access registered singletons via Global.YourServiceName
   */
  var Global: GlobalSingletons;
}

/**
 * Internal proxy class that enables global singleton access via the Global object
 * Uses a Proxy to intercept property access and return singleton instances
 */
class GlobalSingletonProxy {
  /** Singleton instance of the proxy */
  private static instance: GlobalSingletonProxy;
  /** The proxy object that handles property access */
  private proxy: any;

  /**
   * Private constructor that creates the proxy handler
   * The proxy intercepts property access and returns singleton instances
   */
  private constructor() {
    this.proxy = new Proxy(this, {
      get: (target, prop: string | symbol) => {
        if (typeof prop === 'string') {
          const constructorMap = (globalThis as any).__singletonConstructorMap;
          if (constructorMap && constructorMap.has(prop)) {
            const constructor = constructorMap.get(prop);
            return SingletonRegistry.get(constructor);
          }
        }
        return undefined;
      }
    });
  }

  /**
   * Get the singleton instance of the proxy
   * @returns The singleton proxy instance
   */
  static getInstance(): GlobalSingletonProxy {
    if (!GlobalSingletonProxy.instance) {
      GlobalSingletonProxy.instance = new GlobalSingletonProxy();
    }
    return GlobalSingletonProxy.instance;
  }

  /**
   * Get the proxy object for global singleton access
   * @returns The proxy object
   */
  getProxy() {
    return this.proxy;
  }
}

/**
 * Initialize the global singleton access system
 * Call this once in your application entry point to enable Global.YourService access
 * 
 * @example
 * ```typescript
 * // In your main application file
 * import { initializeGlobalAccess } from 'true-static';
 * 
 * initializeGlobalAccess();
 * // Now you can use Global.YourService anywhere
 * ```
 */
export function initializeGlobalAccess() {
  if (typeof globalThis !== 'undefined' && !globalThis.Global) {
    if (!(globalThis as any).__singletonConstructorMap) {
      (globalThis as any).__singletonConstructorMap = new Map<string, Constructor<any>>();
    }
    
    const proxyInstance = GlobalSingletonProxy.getInstance();
    (globalThis as any).Global = proxyInstance.getProxy();
  }
}

/**
 * Register a singleton class for global access with a given name
 * 
 * @template T - The type of the singleton class
 * @param name - The global name for the singleton (used in Global.{name})
 * @param constructor - The class constructor to register as a singleton
 * @param args - Arguments to pass to the constructor, including other singleton classes for dependency injection
 * 
 * @example
 * ```typescript
 * class ConfigService {
 *   constructor(public apiUrl: string) {}
 * }
 * 
 * registerGlobalSingleton('ConfigService', ConfigService, 'https://api.example.com');
 * 
 * // Now accessible globally
 * const config = Global.ConfigService;
 * ```
 */
export function registerGlobalSingleton<T>(
  name: string,
  constructor: Constructor<T>,
  ...args: any[]
): void {
  SingletonRegistry.register(constructor, ...args);
  
  if (typeof globalThis !== 'undefined') {
    if (!(globalThis as any).__singletonConstructorMap) {
      (globalThis as any).__singletonConstructorMap = new Map<string, Constructor<any>>();
    }
    
    (globalThis as any).__singletonConstructorMap.set(name, constructor);
  }
}
