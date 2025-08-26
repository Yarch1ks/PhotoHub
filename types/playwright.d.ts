declare module '@playwright/test' {
  export interface TestOptions {
    headless?: boolean;
    timeout?: number;
    slowMo?: number;
    viewport?: { width: number; height: number };
    userAgent?: string;
    bypassCSP?: boolean;
    ignoreHTTPSErrors?: boolean;
    javaScriptEnabled?: boolean;
    ignoreDefaultArgs?: boolean | string[];
    devtools?: boolean;
    channel?: string;
    launchOptions?: any;
  }

  export interface Browser {
    newPage(): Promise<Page>;
    close(): Promise<void>;
  }

  export interface Page {
    goto(url: string): Promise<Response>;
    click(selector: string): Promise<void>;
    fill(selector: string, value: string): Promise<void>;
    screenshot(options?: { path?: string; fullPage?: boolean }): Promise<Buffer>;
    waitForSelector(selector: string): Promise<void>;
    waitForLoadState(state?: 'load' | 'domcontentloaded' | 'networkidle'): Promise<void>;
  }

  export function defineConfig(config: any): any;
  export const devices: any;
  export function test(options?: TestOptions): any;
  export function expect(actual: any): any;
  export function chromium(): Promise<Browser>;
  export function firefox(): Promise<Browser>;
  export function webkit(): Promise<Browser>;
}