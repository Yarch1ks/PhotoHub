declare module 'archiver' {
  export interface ArchiverOptions {
    statConcurrency?: number;
    user?: string;
    group?: string;
    readable?: boolean;
    writable?: boolean;
    follow?: boolean;
    mode?: number;
    uid?: number;
    gid?: number;
  }

  export interface ZipOptions extends ArchiverOptions {
    comment?: string;
    forceLocalTime?: boolean;
    store?: boolean;
    zlib?: any;
  }

  export class Archiver {
    static zip(options?: ZipOptions): Archiver;
    append(source: any, name: any): this;
    finalize(): Promise<Buffer>;
    on(event: string, listener: (...args: any[]) => void): this;
    once(event: string, listener: (...args: any[]) => void): this;
    emit(event: string, ...args: any[]): boolean;
  }

  export function create(format: string, options?: ArchiverOptions): Archiver;
  export function zip(options?: ZipOptions): Archiver;
}