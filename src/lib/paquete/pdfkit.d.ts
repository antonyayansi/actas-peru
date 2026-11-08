declare module "pdfkit" {
  import { EventEmitter } from "events";
  class PDFDocument extends EventEmitter {
    constructor(options?: { size?: string; margin?: number });
    fillColor(color: string): this;
    fontSize(size: number): this;
    text(text: string): this;
    moveDown(lines?: number): this;
    end(): void;
  }
  export default PDFDocument;
}
