declare module 'formidable' {
  export interface Options {
    maxFileSize?: number;
    maxFields?: number;
    maxFieldsSize?: number;
    keepExtensions?: boolean;
    multiples?: boolean;
    hashAlgorithm?: string;
    uploadDir?: string;
    enabledPlugins?: string[];
    filter?: any;
    onFile?: (field: string, file: any) => void;
    onPart?: (part: any) => void;
  }

  export class IncomingForm {
    constructor(options?: Options);
    parse(req: any, callback: (err: any, fields: any, files: any) => void): void;
    on(event: string, listener: (...args: any[]) => void): this;
    once(event: string, listener: (...args: any[]) => void): this;
    emit(event: string, ...args: any[]): boolean;
  }

  export function formidable(options?: Options): IncomingForm;
}