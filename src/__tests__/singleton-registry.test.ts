import { SingletonRegistry, Singletons } from '../index';

class TestService {
  constructor(public name: string = 'default') {}
}

class ConfigService {
  constructor(public port: number, public host: string) {}
}

class NoArgsService {
  public id = Math.random();
}

class DatabaseService {
  constructor(public config: ConfigService) {}
}

class ApiService {
  constructor(public config: ConfigService, public database: DatabaseService, public timeout: number) {}
}

class LoggerService {
  public logs: string[] = [];
  log(message: string) {
    this.logs.push(message);
  }
}

class ServiceWithLogger {
  constructor(public logger: LoggerService, public name: string) {}
}

class CircularA {
  constructor(public b: CircularB) {}
}

class CircularB {
  constructor(public a: CircularA) {}
}

describe('SingletonRegistry', () => {
  beforeEach(() => {
    SingletonRegistry.clear();
  });

  describe('register()', () => {
    it('should register a singleton with no arguments', () => {
      SingletonRegistry.register(NoArgsService);
      expect(SingletonRegistry.isRegistered(NoArgsService)).toBe(true);
    });

    it('should register a singleton with arguments', () => {
      SingletonRegistry.register(TestService, 'test-name');
      expect(SingletonRegistry.isRegistered(TestService)).toBe(true);
    });

    it('should register a singleton with multiple arguments', () => {
      SingletonRegistry.register(ConfigService, 3000, 'localhost');
      expect(SingletonRegistry.isRegistered(ConfigService)).toBe(true);
    });

    it('should throw error when registering same class twice', () => {
      SingletonRegistry.register(TestService, 'first');
      expect(() => {
        SingletonRegistry.register(TestService, 'second');
      }).toThrow('Singleton TestService is already registered');
    });
  });

  describe('get()', () => {
    it('should return singleton instance with no arguments', () => {
      SingletonRegistry.register(NoArgsService);
      const instance1 = SingletonRegistry.get(NoArgsService);
      const instance2 = SingletonRegistry.get(NoArgsService);
      
      expect(instance1).toBeInstanceOf(NoArgsService);
      expect(instance1).toBe(instance2);
    });

    it('should return singleton instance with arguments', () => {
      SingletonRegistry.register(TestService, 'test-name');
      const instance1 = SingletonRegistry.get(TestService);
      const instance2 = SingletonRegistry.get(TestService);
      
      expect(instance1).toBeInstanceOf(TestService);
      expect(instance1.name).toBe('test-name');
      expect(instance1).toBe(instance2);
    });

    it('should return singleton instance with multiple arguments', () => {
      SingletonRegistry.register(ConfigService, 3000, 'localhost');
      const instance1 = SingletonRegistry.get(ConfigService);
      const instance2 = SingletonRegistry.get(ConfigService);
      
      expect(instance1).toBeInstanceOf(ConfigService);
      expect(instance1.port).toBe(3000);
      expect(instance1.host).toBe('localhost');
      expect(instance1).toBe(instance2);
    });

    it('should throw error when getting unregistered singleton', () => {
      expect(() => {
        SingletonRegistry.get(TestService);
      }).toThrow('Singleton TestService is not registered');
    });

    it('should create instance lazily on first access', () => {
      const originalConstructor = NoArgsService;
      let constructorCallCount = 0;
      
      class SpyNoArgsService {
        public id = Math.random();
        constructor() {
          constructorCallCount++;
        }
      }
      
      SingletonRegistry.register(SpyNoArgsService);
      
      expect(constructorCallCount).toBe(0);
      
      SingletonRegistry.get(SpyNoArgsService);
      expect(constructorCallCount).toBe(1);
      
      SingletonRegistry.get(SpyNoArgsService);
      expect(constructorCallCount).toBe(1);
    });
  });

  describe('clear()', () => {
    it('should clear all registered singletons', () => {
      SingletonRegistry.register(TestService, 'test');
      SingletonRegistry.register(NoArgsService);
      
      expect(SingletonRegistry.isRegistered(TestService)).toBe(true);
      expect(SingletonRegistry.isRegistered(NoArgsService)).toBe(true);
      
      SingletonRegistry.clear();
      
      expect(SingletonRegistry.isRegistered(TestService)).toBe(false);
      expect(SingletonRegistry.isRegistered(NoArgsService)).toBe(false);
    });
  });

  describe('isRegistered()', () => {
    it('should return true for registered singletons', () => {
      SingletonRegistry.register(TestService, 'test');
      expect(SingletonRegistry.isRegistered(TestService)).toBe(true);
    });

    it('should return false for unregistered singletons', () => {
      expect(SingletonRegistry.isRegistered(TestService)).toBe(false);
    });
  });
});

describe('Dependency Injection', () => {
  beforeEach(() => {
    SingletonRegistry.clear();
  });

  describe('Basic dependency injection', () => {
    it('should inject singleton dependencies into constructor', () => {
      SingletonRegistry.register(ConfigService, 3000, 'localhost');
      SingletonRegistry.register(DatabaseService, ConfigService);

      const database = SingletonRegistry.get(DatabaseService);
      const config = SingletonRegistry.get(ConfigService);

      expect(database).toBeInstanceOf(DatabaseService);
      expect(database.config).toBe(config);
      expect(database.config.port).toBe(3000);
      expect(database.config.host).toBe('localhost');
    });

    it('should handle mixed dependencies and regular args', () => {
      SingletonRegistry.register(LoggerService);
      SingletonRegistry.register(ServiceWithLogger, LoggerService, 'test-service');

      const service = SingletonRegistry.get(ServiceWithLogger);
      const logger = SingletonRegistry.get(LoggerService);

      expect(service).toBeInstanceOf(ServiceWithLogger);
      expect(service.logger).toBe(logger);
      expect(service.name).toBe('test-service');
    });
  });

  describe('Multiple dependencies', () => {
    it('should inject multiple singleton dependencies', () => {
      SingletonRegistry.register(ConfigService, 8080, 'api.example.com');
      SingletonRegistry.register(DatabaseService, ConfigService);
      SingletonRegistry.register(ApiService, ConfigService, DatabaseService, 5000);

      const api = SingletonRegistry.get(ApiService);
      const config = SingletonRegistry.get(ConfigService);
      const database = SingletonRegistry.get(DatabaseService);

      expect(api).toBeInstanceOf(ApiService);
      expect(api.config).toBe(config);
      expect(api.database).toBe(database);
      expect(api.timeout).toBe(5000);
    });
  });

  describe('Nested dependencies', () => {
    it('should resolve nested dependency chains', () => {
      SingletonRegistry.register(ConfigService, 9000, 'nested.example.com');
      SingletonRegistry.register(DatabaseService, ConfigService);
      SingletonRegistry.register(ApiService, ConfigService, DatabaseService, 2000);

      const api = SingletonRegistry.get(ApiService);

      expect(api.config.port).toBe(9000);
      expect(api.config.host).toBe('nested.example.com');
      expect(api.database.config).toBe(api.config);
      expect(api.timeout).toBe(2000);
    });

    it('should initialize dependencies in correct order', () => {
      const initOrder: string[] = [];

      class TrackingConfig {
        constructor(public value: string) {
          initOrder.push('Config');
        }
      }

      class TrackingDatabase {
        constructor(public config: TrackingConfig) {
          initOrder.push('Database');
        }
      }

      class TrackingApi {
        constructor(public database: TrackingDatabase) {
          initOrder.push('Api');
        }
      }

      SingletonRegistry.register(TrackingConfig, 'test-value');
      SingletonRegistry.register(TrackingDatabase, TrackingConfig);
      SingletonRegistry.register(TrackingApi, TrackingDatabase);

      SingletonRegistry.get(TrackingApi);

      expect(initOrder).toEqual(['Config', 'Database', 'Api']);
    });
  });

  describe('Circular dependency detection', () => {
    it('should detect and throw error for circular dependencies', () => {
      SingletonRegistry.register(CircularA, CircularB);
      SingletonRegistry.register(CircularB, CircularA);

      expect(() => {
        SingletonRegistry.get(CircularA);
      }).toThrow('Circular dependency detected: CircularA -> CircularB -> CircularA');
    });

    it('should detect self-referencing circular dependencies', () => {
      class SelfReferencing {
        constructor(public self: SelfReferencing) {}
      }

      SingletonRegistry.register(SelfReferencing, SelfReferencing);

      expect(() => {
        SingletonRegistry.get(SelfReferencing);
      }).toThrow('Circular dependency detected: SelfReferencing -> SelfReferencing');
    });
  });

  describe('Error handling', () => {
    it('should throw error for unregistered dependencies', () => {
      class UnregisteredDep {
        constructor() {}
      }

      class ServiceWithUnregisteredDep {
        constructor(public dep: UnregisteredDep) {}
      }

      SingletonRegistry.register(ServiceWithUnregisteredDep, UnregisteredDep);

      expect(() => {
        SingletonRegistry.get(ServiceWithUnregisteredDep);
      }).toThrow('Dependency UnregisteredDep is not registered for singleton ServiceWithUnregisteredDep');
    });

    it('should provide helpful error messages', () => {
      expect(() => {
        SingletonRegistry.get(TestService);
      }).toThrow('Singleton TestService is not registered');
    });
  });

  describe('Singleton behavior with dependencies', () => {
    it('should maintain singleton behavior for dependencies', () => {
      SingletonRegistry.register(ConfigService, 4000, 'singleton.test');
      SingletonRegistry.register(DatabaseService, ConfigService);

      const database1 = SingletonRegistry.get(DatabaseService);
      const database2 = SingletonRegistry.get(DatabaseService);
      const config1 = SingletonRegistry.get(ConfigService);
      const config2 = database1.config;

      expect(database1).toBe(database2);
      expect(config1).toBe(config2);
    });
  });
});

describe('Singletons alias', () => {
  beforeEach(() => {
    Singletons.clear();
  });

  it('should work the same as SingletonRegistry', () => {
    Singletons.register(TestService, 'alias-test');
    const instance = Singletons.get(TestService);
    
    expect(instance).toBeInstanceOf(TestService);
    expect(instance.name).toBe('alias-test');
    expect(Singletons.isRegistered(TestService)).toBe(true);
  });
});