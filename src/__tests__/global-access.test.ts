import { SingletonRegistry, initializeGlobalAccess, registerGlobalSingleton } from '../index';

declare global {
  interface GlobalSingletons {
    TestService: TestService;
    ConfigService: ConfigService;
    DatabaseService: DatabaseService;
  }
}

class TestService {
  constructor(public name: string = 'default') {}
}

class ConfigService {
  constructor(public port: number, public host: string) {}
}

class DatabaseService {
  constructor(public config: ConfigService) {}
}

describe('Global Access Pattern', () => {
  beforeEach(() => {
    SingletonRegistry.clear();
    delete (globalThis as any).Global;
    delete (globalThis as any).__singletonConstructorMap;
  });

  describe('initializeGlobalAccess()', () => {
    it('should create Global object on globalThis', () => {
      initializeGlobalAccess();
      
      expect(globalThis.Global).toBeDefined();
      expect(typeof globalThis.Global).toBe('object');
    });

    it('should not recreate Global if it already exists', () => {
      initializeGlobalAccess();
      const firstGlobal = globalThis.Global;
      
      initializeGlobalAccess();
      const secondGlobal = globalThis.Global;
      
      expect(firstGlobal).toBe(secondGlobal);
    });

    it('should create constructor map on globalThis', () => {
      initializeGlobalAccess();
      
      expect((globalThis as any).__singletonConstructorMap).toBeDefined();
      expect((globalThis as any).__singletonConstructorMap).toBeInstanceOf(Map);
    });
  });

  describe('registerGlobalSingleton()', () => {
    beforeEach(() => {
      initializeGlobalAccess();
    });

    it('should register singleton with global name', () => {
      registerGlobalSingleton('TestService', TestService, 'global-test');
      
      expect(SingletonRegistry.isRegistered(TestService)).toBe(true);
      expect((globalThis as any).__singletonConstructorMap.has('TestService')).toBe(true);
    });

    it('should allow access via Global object', () => {
      registerGlobalSingleton('TestService', TestService, 'global-access');
      
      const instance = globalThis.Global.TestService;
      
      expect(instance).toBeInstanceOf(TestService);
      expect(instance.name).toBe('global-access');
    });

    it('should maintain singleton behavior via global access', () => {
      registerGlobalSingleton('TestService', TestService, 'singleton-test');
      
      const instance1 = globalThis.Global.TestService;
      const instance2 = globalThis.Global.TestService;
      const instance3 = SingletonRegistry.get(TestService);
      
      expect(instance1).toBe(instance2);
      expect(instance1).toBe(instance3);
    });

    it('should work with multiple singletons', () => {
      registerGlobalSingleton('ConfigService', ConfigService, 8080, 'global.test');
      registerGlobalSingleton('TestService', TestService, 'multi-test');
      
      const config = globalThis.Global.ConfigService;
      const test = globalThis.Global.TestService;
      
      expect(config).toBeInstanceOf(ConfigService);
      expect(config.port).toBe(8080);
      expect(config.host).toBe('global.test');
      
      expect(test).toBeInstanceOf(TestService);
      expect(test.name).toBe('multi-test');
    });

    it('should work with dependency injection', () => {
      registerGlobalSingleton('ConfigService', ConfigService, 9090, 'dep.test');
      registerGlobalSingleton('DatabaseService', DatabaseService, ConfigService);
      
      const database = globalThis.Global.DatabaseService;
      const config = globalThis.Global.ConfigService;
      
      expect(database).toBeInstanceOf(DatabaseService);
      expect(database.config).toBe(config);
      expect(database.config.port).toBe(9090);
      expect(database.config.host).toBe('dep.test');
    });

    it('should return undefined for unregistered singletons', () => {
      const result = globalThis.Global.TestService;
      
      expect(result).toBeUndefined();
    });

    it('should handle symbol properties gracefully', () => {
      const symbolProp = Symbol('test');
      const result = (globalThis.Global as any)[symbolProp];
      
      expect(result).toBeUndefined();
    });
  });

  describe('Integration with existing SingletonRegistry', () => {
    beforeEach(() => {
      initializeGlobalAccess();
    });

    it('should work alongside manual SingletonRegistry usage', () => {
      SingletonRegistry.register(TestService, 'manual-registration');
      registerGlobalSingleton('ConfigService', ConfigService, 3000, 'localhost');
      
      const manualInstance = SingletonRegistry.get(TestService);
      const globalInstance = globalThis.Global.ConfigService;
      
      expect(manualInstance).toBeInstanceOf(TestService);
      expect(manualInstance.name).toBe('manual-registration');
      
      expect(globalInstance).toBeInstanceOf(ConfigService);
      expect(globalInstance.port).toBe(3000);
      expect(globalInstance.host).toBe('localhost');
    });

    it('should throw error when accessing manually registered singleton globally', () => {
      SingletonRegistry.register(TestService, 'manual-only');
      
      const result = globalThis.Global.TestService;
      
      expect(result).toBeUndefined();
    });
  });

  describe('Error handling', () => {
    beforeEach(() => {
      initializeGlobalAccess();
    });

    it('should propagate SingletonRegistry errors', () => {
      registerGlobalSingleton('TestService', TestService, 'error-test');
      
      expect(() => {
        registerGlobalSingleton('TestService', TestService, 'duplicate');
      }).toThrow('Singleton TestService is already registered');
    });

    it('should handle missing dependencies in global access', () => {
      class UnregisteredDep {
        constructor() {}
      }
      
      class ServiceWithDep {
        constructor(public dep: UnregisteredDep) {}
      }
      
      registerGlobalSingleton('ServiceWithDep', ServiceWithDep, UnregisteredDep);
      
      expect(() => {
        const instance = (globalThis.Global as any).ServiceWithDep;
      }).toThrow('Dependency UnregisteredDep is not registered');
    });
  });

  describe('Environment compatibility', () => {
    it('should handle environments without globalThis gracefully', () => {
      Object.defineProperty(globalThis, 'Global', {
        value: undefined,
        writable: true,
        configurable: true
      });
      
      expect(() => {
        initializeGlobalAccess();
      }).not.toThrow();
      
      expect(() => {
        registerGlobalSingleton('TestService', TestService, 'env-test');
      }).not.toThrow();
    });
  });
});