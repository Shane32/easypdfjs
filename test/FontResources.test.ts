import { decodePDFRawStream, PDFArray, PDFDict, PDFDocument, PDFName, PDFRawStream, PDFRef } from "pdf-lib";
import * as fontkit from "@pdf-lib/fontkit";
import * as fs from "fs";
import * as path from "path";
import { EasyPdf, Font } from "../src/index";
import { StandardFonts } from "../src/StandardFonts";

function pageFontRuns(document: PDFDocument, pageIndex: number): { name: string; reference: string }[] {
  const page = document.getPage(pageIndex);
  const fonts = page.node.Resources()!.lookup(PDFName.of("Font"), PDFDict);
  const contents = page.node.lookup(PDFName.of("Contents"), PDFArray);
  const operators = contents
    .asArray()
    .map((reference) => {
      const stream = document.context.lookup(reference);
      if (!(stream instanceof PDFRawStream)) throw new Error("Expected a saved page content stream");
      return Buffer.from(decodePDFRawStream(stream).decode()).toString("latin1");
    })
    .join("\n");
  const runs: { name: string; reference: string }[] = [];
  const fontOperator = /\/([^\s]+)\s+[\d.]+\s+Tf/g;
  let match: RegExpExecArray | null;
  while ((match = fontOperator.exec(operators))) {
    const reference = fonts.get(PDFName.of(match[1]));
    expect(reference).toBeInstanceOf(PDFRef);
    const font = document.context.lookup(reference, PDFDict);
    runs.push({
      name: font.lookup(PDFName.of("BaseFont"), PDFName).decodeText(),
      reference: reference!.toString(),
    });
  }
  return runs;
}

describe("Page font resources", () => {
  test.each([
    {
      family: StandardFonts.Helvetica,
      names: ["Helvetica", "Helvetica-Bold", "Helvetica-Oblique", "Helvetica-BoldOblique"],
    },
    {
      family: StandardFonts.Times,
      names: ["Times-Roman", "Times-Bold", "Times-Italic", "Times-BoldItalic"],
    },
    {
      family: StandardFonts.Courier,
      names: ["Courier", "Courier-Bold", "Courier-Oblique", "Courier-BoldOblique"],
    },
  ])("registers every $family style on each page without embedding it again", async ({ family, names }) => {
    const pdf = await EasyPdf.create();
    const fonts = [new Font(family, 12), new Font(family, 12, true), new Font(family, 12, false, true), new Font(family, 12, true, true)];
    const pageStyles = [
      [0, 1, 2, 3, 1, 0],
      [3, 1, 0, 2, 3],
      [2, 0, 3, 1, 2],
    ];
    for (const styles of pageStyles) {
      pdf.newPage({ width: 612, height: 792 });
      for (const style of styles) {
        pdf.font = fonts[style];
        pdf.writeLine("Header or view label");
      }
    }

    const document = await PDFDocument.load(await pdf.save());
    expect(document.getPageCount()).toBe(pageStyles.length);
    const references = new Map<string, string>();
    pageStyles.forEach((styles, pageIndex) => {
      const runs = pageFontRuns(document, pageIndex);
      expect(runs.map((run) => run.name)).toEqual(styles.map((style) => names[style]));
      for (const run of runs) {
        if (!references.has(run.name)) references.set(run.name, run.reference);
        expect(run.reference).toBe(references.get(run.name));
      }
    });
  });

  test("registers a custom font first used on a later page and reuses its embedded font", async () => {
    const pdf = await EasyPdf.create();
    pdf.pdfDocument.registerFontkit(fontkit);
    const fontBytes = fs.readFileSync(path.join(__dirname, "righteous-font", "Righteous-Regular.ttf"));
    const embeddedFont = await pdf.pdfDocument.embedFont(fontBytes, { customName: "Righteous" });
    const standard = new Font(StandardFonts.Helvetica, 12);
    const custom = new Font("Righteous", 12);
    const pageFonts = [[standard], [custom, standard], [standard, custom, custom]];
    for (const fonts of pageFonts) {
      pdf.newPage({ width: 612, height: 792 });
      for (const font of fonts) {
        pdf.font = font;
        pdf.writeLine("Standard or custom text");
      }
    }

    const document = await PDFDocument.load(await pdf.save());
    expect(document.getPageCount()).toBe(pageFonts.length);
    const standardReference = pageFontRuns(document, 0)[0].reference;
    pageFonts.forEach((fonts, pageIndex) => {
      const runs = pageFontRuns(document, pageIndex);
      expect(runs.map((run) => run.reference)).toEqual(
        fonts.map((font) => (font === custom ? embeddedFont.ref.toString() : standardReference)),
      );
    });
  });
});
