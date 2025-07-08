type Constructor<T = {}> = new (...args: any[]) => T;

interface SingletonEntry<T> {
  constructor: Constructor<T>;
  instance?: T;
  args?: any[];
}

export class SingletonRegistry {
  private static registry = new Map<Constructor<any>, SingletonEntry<any>>();

  static register<T>(
    constructor: Constructor<T>,
    ...args: any[]
  ): void {
    if (this.registry.has(constructor)) {
      throw new Error(`Singleton ${constructor.name} is already registered`);
    }

    this.registry.set(constructor, {
      constructor,
      args,
    });
  }

  static get<T>(constructor: Constructor<T>): T {
    const entry = this.registry.get(constructor);
    
    if (!entry) {
      throw new Error(`Singleton ${constructor.name} is not registered`);
    }

    if (!entry.instance) {
      entry.instance = new entry.constructor(...(entry.args || []));
    }

    return entry.instance;
  }

  static clear(): void {
    this.registry.clear();
  }

  static isRegistered<T>(constructor: Constructor<T>): boolean {
    return this.registry.has(constructor);
  }
}

export const Singletons = SingletonRegistry;
