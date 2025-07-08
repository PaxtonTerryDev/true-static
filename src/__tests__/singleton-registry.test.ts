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