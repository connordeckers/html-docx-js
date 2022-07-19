/// <reference types="node" />
declare type PageOrientation = "landscape" | "portrait";
interface DocumentMargins {
    orientation: PageOrientation;
    width?: number;
    height?: number;
    margins: {
        top?: number;
        bottom?: number;
        left?: number;
        right?: number;
        header?: number;
        footer?: number;
        gutter?: number;
    };
}
export declare function asBlob(html: string, options: Partial<DocumentMargins>, format: "blob"): Promise<Blob>;
export declare function asBlob(html: string, options: Partial<DocumentMargins>, format: "buffer"): Promise<Buffer>;
export declare function asBlob(html: string, options: Partial<DocumentMargins>, format: undefined): Promise<Blob | Buffer>;
export {};
