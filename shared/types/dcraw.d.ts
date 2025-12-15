declare module "dcraw" {
  interface DcrawOptions {
    extractThumbnail?: boolean
    verbose?: boolean
    identify?: boolean
  }

  export default function dcraw(buffer: Uint8Array | import("buffer").Buffer, options?: DcrawOptions): import("buffer").Buffer | string
}
