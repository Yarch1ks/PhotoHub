declare module 'pino-pretty' {
  export interface Options {
    colorize?: boolean;
    crlf?: boolean;
    errorLikeObjectKeys?: string[];
    errorProps?: string;
    hideObject?: boolean;
    messageKey?: string;
    levelFirst?: boolean;
    levels?: { [key: string]: string };
    messageFormat?: string | false;
    timestamp?: boolean | string;
    translateTime?: string | boolean;
    useMetadata?: boolean;
    singleLine?: boolean;
  }

  export function stream(options?: Options): NodeJS.WritableStream;
}