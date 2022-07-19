import JSZip from "jszip";
import { merge } from "lodash";
import ejs from "ejs/ejs.min.js";

import content_types from "./assets/content_types.xml";
import rels from "./assets/rels.xml";
import doc_rels from "./assets/document.xml.rels";

import documentTemplate from "./templates/document.tpl";
import mhtDocumentTemplate from "./templates/mht_document.tpl";
import mhtPartTemplate from "./templates/mht_part.tpl";

declare const global: any;
const win = typeof global === "undefined" ? window : global;

type PageOrientation = "landscape" | "portrait";
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

function _prepareImageParts(htmlSource: string) {
  const imageContentParts: string[] = [];
  const inlinedSrcPattern = /"data:(\w+\/\w+);(\w+),(\S+)"/g;
  const inlinedReplacer = function (
    match: string,
    contentType: string,
    contentEncoding: string,
    encodedContent: string
  ) {
    const index = imageContentParts.length;
    const extension = contentType.split("/")[1];
    const contentLocation = "file:///C:/fake/image" + index + "." + extension;

    imageContentParts.push(
      ejs.render(mhtPartTemplate, {
        contentType,
        contentEncoding,
        contentLocation,
        encodedContent,
      })
    );
		return `"${contentLocation}"`;
  };
  
	if (typeof htmlSource === "string") {
    return {
      htmlSource: !/<img/g.test(htmlSource)
        ? htmlSource
        : htmlSource.replace(inlinedSrcPattern, inlinedReplacer),
      imageContentParts,
    };
  } else {
    throw new Error("Not a valid source provided!");
  }
}

function getMHTdocument(source: string) {
  //take care of images
  const { htmlSource, imageContentParts } = _prepareImageParts(source);
  return ejs.render(mhtDocumentTemplate, {
    htmlSource: htmlSource.replace(/\=/g, "=3D"), //for proper MHT parsing all '=' signs in html need to be replaced with '=3D'
    contentParts: imageContentParts.join("\n"),
  });
}

async function generateDocument(zip: JSZip, format?: "blob" | "buffer") {
  const buffer = await zip.generateAsync({ type: "arraybuffer" });
  const doctype = "vnd.openxmlformats-officedocument.wordprocessingml.document";
  const err = `Neither Blob nor Buffer are accessible in this environment. Consider adding Blob.js shim`;

  if (format === "blob")
    return new Blob([buffer], { type: `application/${doctype}` });
  else if (format === "buffer") return new win.Buffer(new Uint8Array(buffer));
  else if (win.Blob)
    return new Blob([buffer], { type: `application/${doctype}` });
  else if (win.Buffer) return new win.Buffer(new Uint8Array(buffer));
  else throw new Error(err);
}

function renderDocumentFile(documentOptions: Partial<DocumentMargins>) {
  const orientation = documentOptions.orientation ?? "portrait";
  const base = {
    width: orientation == "landscape" ? 15840 : 12240,
    height: orientation == "landscape" ? 12240 : 15840,
    orient: orientation,
    margins: {
      top: 1440,
      right: 1440,
      bottom: 1440,
      left: 1440,
      header: 720,
      footer: 720,
      gutter: 0,
    },
  };

  return ejs.render(documentTemplate, merge(base, documentOptions));
}

export function asBlob(
  html: string,
  options: Partial<DocumentMargins>,
  format: "blob"
): Promise<Blob>;
export function asBlob(
  html: string,
  options: Partial<DocumentMargins>,
  format: "buffer"
): Promise<Buffer>;
export function asBlob(
  html: string,
  options: Partial<DocumentMargins>,
  format: undefined
): Promise<Blob | Buffer>;
export function asBlob(
  html: string,
  options: Partial<DocumentMargins>,
  format?: "blob" | "buffer"
) {
  const zip = new JSZip();
  zip.file("[Content_Types].xml", content_types);
  zip.folder("_rels")!.file(".rels", rels);
  zip
    .folder("word")!
    .file("document.xml", renderDocumentFile(options))
    .file("afchunk.mht", getMHTdocument(html))
    .folder("_rels")!
    .file("document.xml.rels", doc_rels);

  return generateDocument(zip, format);
}
