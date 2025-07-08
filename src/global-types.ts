type Constructor<T = {}> = new (...args: any[]) => T;

export interface GlobalSingletonRegistration<T> {
  name: string;
  constructor: Constructor<T>;
  args: any[];
}

export function extendGlobalSingletons<T extends Record<string, any>>(): void {
  // This function serves as a type-only helper to extend GlobalSingletons interface
  // Usage in user code:
  // declare module 'true-static' {
  //   interface GlobalSingletons {
  //     MyService: MyService;
  //   }
  // }
}