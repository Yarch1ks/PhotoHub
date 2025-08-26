declare module 'vitest' {
  export interface VitestRunner {
    start: () => Promise<void>;
    stop: () => Promise<void>;
  }

  export interface VitestOptions {
    root?: string;
    watch?: boolean;
    run?: boolean;
    config?: string;
    update?: boolean;
    environment?: 'jsdom' | 'node' | 'happy-dom';
    globals?: boolean;
    threads?: boolean;
    maxWorkers?: number;
    minWorkers?: number;
    isolate?: boolean;
    include?: string[];
    exclude?: string[];
    passWithNoTests?: boolean;
    testTimeout?: number;
    hookTimeout?: number;
    bail?: number;
    reporters?: string[];
    silent?: boolean;
    ui?: boolean;
    open?: boolean;
    api?: number;
    server?: {
      port?: number;
      strict?: boolean;
    };
  }

  export function createVitest(options: VitestOptions): VitestRunner;
}