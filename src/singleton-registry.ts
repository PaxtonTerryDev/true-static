type Constructor<T = {}> = new (...args: any[]) => T;

interface SingletonEntry<T> {
  constructor: Constructor<T>;
  instance?: T;
  args: any[];
  dependencies: Constructor<any>[];
  resolvedArgs?: any[];
}

export class SingletonRegistry {
  private static registry = new Map<Constructor<any>, SingletonEntry<any>>();
  private static initializationStack = new Set<Constructor<any>>();

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

  static clear(): void {
    this.registry.clear();
    this.initializationStack.clear();
  }

  static isRegistered<T>(constructor: Constructor<T>): boolean {
    return this.registry.has(constructor);
  }
}

export const Singletons = SingletonRegistry;
