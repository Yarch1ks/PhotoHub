declare module 'uuid' {
  export function v4(): string;
  export function v5(name: string, namespace: string): string;
  export namespace v4 {
    function parse(id: string): Uint8Array;
    function stringify(buffer: Uint8Array, offset?: number, bufferLength?: number): string;
    function validate(id: string): boolean;
  }
  export namespace v5 {
    function parse(id: string): Uint8Array;
    function stringify(buffer: Uint8Array, offset?: number, bufferLength?: number): string;
    function validate(id: string): boolean;
  }
}