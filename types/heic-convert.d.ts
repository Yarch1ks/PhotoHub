declare module 'heic-convert' {
  const heicConvert: (options: {
    buffer: Buffer;
    format: 'JPEG' | 'PNG';
    quality?: number;
  }) => Promise<Buffer>;
  
  export default heicConvert;
}