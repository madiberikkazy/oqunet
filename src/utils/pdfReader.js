// Thin wrapper around pdfjs-dist for browser PDF text extraction.
// We lazy-import so the worker isn't pulled into the main bundle.

let pdfjsLib = null;

async function loadPdfJs() {
  if (pdfjsLib) return pdfjsLib;
  const mod = await import("pdfjs-dist/build/pdf");
  const worker = await import("pdfjs-dist/build/pdf.worker.min?url");
  mod.GlobalWorkerOptions.workerSrc = worker.default;
  pdfjsLib = mod;
  return mod;
}

export async function extractPdfPages(fileOrUrl, onProgress) {
  const pdfjs = await loadPdfJs();

  const data =
    fileOrUrl instanceof Blob
      ? new Uint8Array(await fileOrUrl.arrayBuffer())
      : fileOrUrl;

  const doc = await pdfjs.getDocument({ data }).promise;
  const pages = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((it) => ("str" in it ? it.str : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    pages.push(text);
    if (onProgress) onProgress(i, doc.numPages);
  }
  return pages;
}
