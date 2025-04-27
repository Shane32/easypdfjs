import { createCode128, EasyPdf } from "../src/index";
import { ScaleMode } from "../src/ScaleMode";
import { TextAlignment } from "../src/TextAlignment";
import { StandardFonts } from "../src/StandardFonts";
import { Font } from "../src/Font";
import { PictureAlignment } from "../src/PictureAlignment";
import { EmbedFontOptions, rgb } from "pdf-lib";
import * as fs from "fs";
import * as path from "path";
import * as fontkit from "@pdf-lib/fontkit";

// Ensure test-output directory exists
const TEST_OUTPUT_DIR = path.join(__dirname, "test-output");
if (!fs.existsSync(TEST_OUTPUT_DIR)) {
  fs.mkdirSync(TEST_OUTPUT_DIR);
}

// Mock QR Code Generator
class QRCodeGenerator {
  CreateQrCode(data: string, eccLevel: any) {
    return {
      ModuleMatrix: {
        Count: 25, // Simulating a 25x25 QR code
      },
    };
  }
}

const symbolTestPattern = `!	∀	#	∃	%	&	∋	(	)	\u2217	+	,	−	.	/
0	1	2	3	4	5	6	7	8	9	:	;	<	=	>	?
≅	Α	Β	Χ	Δ	Ε	Φ	Γ	Η	Ι	ϑ	Κ	Λ	Μ	Ν	Ο
Π	Θ	Ρ	Σ	Τ	Υ	ς	Ω	Ξ	Ψ	Ζ	[	∴	]	⊥	_
	α	β	χ	δ	ε	φ	γ	η	ι	ϕ	κ	λ	μ	ν	ο
π	θ	ρ	σ	τ	υ	ϖ	ω	ξ	ψ	ζ	{	|	}	\u223C	
                              
                              
€	ϒ	′	≤	⁄	∞	ƒ	♣	♦	♥	♠	↔	←	↑	→	↓
°	±	″	≥	×	∝	∂	•	÷	≠	≡	≈	…	\uF8E6		↵
ℵ	ℑ	ℜ	℘	⊗	⊕	∅	∩	∪	⊃	⊇	⊄	⊂	⊆	∈	∉
∠	∇				∏	√	⋅	¬	∧	∨	⇔	⇐	⇑	⇒	⇓
◊ 〈    ∑          
  〉 ∫ ⌠  ⌡         	`;

const ZapfDingbatsTestPattern = `
	✁	✂	✃	✄	☎	✆	✇	✈	✉	☛	☞	✌	✍	✎	✏
✐	✑	✒	✓	✔	✕	✖	✗	✘	✙	✚	✛	✜	✝	✞	✟
✠	✡	✢	✣	✤	✥	✦	✧	★	✩	✪	✫	✬	✭	✮	✯
✰	✱	✲	✳	✴	✵	✶	✷	✸	✹	✺	✻	✼	✽	✾	✿
❀	❁	❂	❃	❄	❅	❆	❇	❈	❉	❊	❋	●	❍	■	❏
❐	❑	❒	▲	▼	◆	❖	◗	❘	❙	❚	❛	❜	❝	❞	
\uF8D7	\uF8D8	\uF8D9	\uF8DA	\uF8DB	\uF8DC	\uF8DD	\uF8DE	\uF8DF	\uF8E0	\uF8E1	\uF8E2	\uF8E3	\uF8E4
															
	❡	❢	❣	❤	❥	❦	❧	♣	♦	♥	♠	①	②	③	④
⑤	⑥	⑦	⑧	⑨	⑩	❶	❷	❸	❹	❺	❻	❼	❽	❾	❿
➀	➁	➂	➃	➄	➅	➆	➇	➈	➉	➊	➋	➌	➍	➎	➏
➐	➑	➒	➓	➔	→	↔	↕	➘	➙	➚	➛	➜	➝	➞	➟
➠	➡	➢	➣	➤	➥	➦	➧	➨	➩	➪	➫	➬	➭	➮	➯
	➱	➲	➳	➴	➵	➶	➷	➸	➹	➺	➻	➼	➽	➾	`;

describe("EasyPdf Integration Test", () => {
  test("Comprehensive PDF Generation", async () => {
    const pdf = await EasyPdf.create();

    // Embed custom font
    const pdfDoc = pdf.pdfDocument;
    pdfDoc.registerFontkit(fontkit);

    const righteousFont = fs.readFileSync(path.join(__dirname, "righteous-font", "Righteous-Regular.ttf"));
    await pdfDoc.embedFont(righteousFont, { customName: "Righteous" });
    const robotoFont = fs.readFileSync(path.join(__dirname, "roboto-font", "RobotoSerif.ttf"));
    await pdfDoc.embedFont(robotoFont, { customName: "Roboto" });

    pdf.scaleMode = ScaleMode.Inches;
    pdf.newPage({
      width: 8.5,
      height: 11,
      landscape: false,
    });
    pdf.textAlignment = TextAlignment.LeftTop;

    // Simulate PrepForTests if needed
    pdf.moveTo(1, 1);
    pdf.circle(0.05);

    // Create fonts with explicit constructor
    let font = new Font(StandardFonts.Courier, 10);
    font.lineSpacing = 1.2;
    pdf.font = font;

    pdf.writeLine("testing\r\nline2 this is a very long long line of text\nnew line\r  some more text");
    pdf.writeLine();

    font = new Font(StandardFonts.Helvetica, 12);
    //font = new Font("Roboto", 12);
    font.lineSpacing = 1.2;
    font.stretchX = 2;
    font.characterSpacing = 1;
    font.justify = true;
    font.underline = true;
    pdf.font = font;

    pdf.writeLine("This is a very long line of text; the quick brown fox jumps over the lazy dog and hello world a few times over", 3);
    pdf.writeLine();

    //font = new Font(StandardFonts.Helvetica, 12);
    font = new Font("Roboto", 12);
    font.lineSpacing = 1.2;
    font.stretchX = 2;
    font.characterSpacing = 1;
    font.justify = true;
    font.underline = true;
    pdf.font = font;

    pdf.writeLine("This is a very long line of text; the quick brown fox jumps over the lazy dog and hello world a few times over", 3);

    pdf.writeLine();
    pdf.font = new Font("Roboto", 12);
    pdf.font.underline = true;
    pdf.writeLine("The quick brown fox jumps over the lazy dog and hello world a few times over");

    font = new Font("Righteous", 20);
    font.italic = true;
    pdf.font = font;
    pdf.writeLine("This is a test");

    font.stretchX = 3;
    font.stretchY = 3;
    pdf.font = font;
    pdf.writeLine("This is a test");

    // Times font variations
    pdf.font = new Font(StandardFonts.Times, 10);
    pdf.writeLine("Times Regular");
    pdf.font.underline = true;
    pdf.writeLine("Times Underline");
    pdf.font.strikeout = true;
    pdf.font.underline = false;
    pdf.writeLine("Times Strikeout");
    pdf.font = new Font(StandardFonts.Times, 10, true);
    pdf.writeLine("Times Bold");
    pdf.font = new Font(StandardFonts.Times, 10, false, true);
    pdf.writeLine("Times Italic");
    pdf.font = new Font(StandardFonts.Times, 10, true, true);
    pdf.writeLine("Times Bold Italic");

    // Helvetica font variations
    pdf.font = new Font(StandardFonts.Helvetica, 10);
    pdf.writeLine("Helvetica Regular");
    pdf.font = new Font(StandardFonts.Helvetica, 10, true);
    pdf.writeLine("Helvetica Bold");
    pdf.font = new Font(StandardFonts.Helvetica, 10, false, true);
    pdf.writeLine("Helvetica Italic");
    pdf.font = new Font(StandardFonts.Helvetica, 10, true, true);
    pdf.writeLine("Helvetica Bold Italic");

    // Courier font variations
    pdf.font = new Font(StandardFonts.Courier, 10);
    pdf.writeLine("Courier Regular");
    pdf.font = new Font(StandardFonts.Courier, 10, true);
    pdf.writeLine("Courier Bold");
    pdf.font = new Font(StandardFonts.Courier, 10, false, true);
    pdf.writeLine("Courier Italic");
    pdf.font = new Font(StandardFonts.Courier, 10, true, true);
    pdf.writeLine("Courier Bold Italic");

    // Symbol font
    pdf.font = new Font(StandardFonts.Symbol, 8);
    pdf.writeLine(symbolTestPattern.replace(/\t/g, "  "));

    pdf.font = new Font(StandardFonts.Times, 10);
    pdf.writeLine("------------------------------------");

    // ZapfDingbats font
    pdf.font = new Font(StandardFonts.ZapfDingbats, 8);
    pdf.writeLine(ZapfDingbatsTestPattern.replace(/\t/g, "  "));

    // Color and QR Code
    pdf.fillColor = rgb(1, 0, 0); // Red

    const qrCodeGenerator = new QRCodeGenerator();
    const qrData = qrCodeGenerator.CreateQrCode("www.zbox.com", null);

    pdf.moveTo(3, 3);
    pdf.foreColor = rgb(0, 0, 1); // Blue
    pdf.rectangle(qrData.ModuleMatrix.Count * 0.03, qrData.ModuleMatrix.Count * 0.03);
    pdf.offsetTo(qrData.ModuleMatrix.Count * 0.03, qrData.ModuleMatrix.Count * 0.03);
    pdf.foreColor = rgb(1, 0, 0); // Red

    pdf.moveTo(5, 3);
    pdf.pictureAlignment = PictureAlignment.LeftCenter;
    pdf.foreColor = rgb(0, 0, 1); // Blue
    pdf.moveTo(5, 2).rectangle(2, 2).offsetTo(2, 2);
    pdf.foreColor = rgb(1, 0, 0); // Red

    // Add barcode
    pdf.barcode(createCode128("Hello this is a test"), 1, 0.5);
    pdf.foreColor = rgb(0, 0, 1); // Blue
    pdf.moveTo(7, 3.75).rectangle(1, 0.5);

    // Save PDF
    const pdfBytes = await pdf.save();

    // Basic validation
    expect(pdfBytes).toBeDefined();
    expect(pdfBytes.length).toBeGreaterThan(0);

    // Save PDF to file
    const outputFilePath = path.join(TEST_OUTPUT_DIR, "Comprehensive_PDF_Generation.pdf");
    fs.writeFileSync(outputFilePath, pdfBytes);
    console.log(`PDF saved to: ${outputFilePath}`);
  });
});
