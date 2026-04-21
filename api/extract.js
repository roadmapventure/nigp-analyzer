import { Buffer } from "buffer";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "20mb",
    },
  },
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { fileData, fileType, fileName } = req.body;

    if (!fileData) {
      return res.status(400).json({ error: "fileData is required" });
    }

    // fileData is base64-encoded file content from the browser
    const buffer = Buffer.from(fileData, "base64");

    let extractedText = "";
    let wordCount = 0;

    if (fileType === "application/pdf" || fileName?.toLowerCase().endsWith(".pdf")) {
      // ── PDF extraction using pdf-parse ──────────────────────────────────
      // pdf-parse handles FlateDecode, font encoding, and all PDF internals
      // It returns only the actual readable text content
      const pdfParse = (await import("pdf-parse/lib/pdf-parse.js")).default;

      const data = await pdfParse(buffer, {
        // Normalise whitespace — join hyphenated line breaks
        pagerender: function(pageData) {
          return pageData.getTextContent({
            normalizeWhitespace: true,
            disableCombineTextItems: false,
          }).then(function(textContent) {
            let lastY, text = "";
            for (const item of textContent.items) {
              if (lastY === item.transform[5] || !lastY) {
                text += item.str;
              } else {
                text += "\n" + item.str;
              }
              lastY = item.transform[5];
            }
            return text;
          });
        }
      });

      // Clean up extracted text
      extractedText = data.text
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
        // Remove lines that are purely numbers/coordinates (PDF artifacts)
        .replace(/^\s*[\d\.\-]+\s*$/gm, "")
        // Collapse 3+ blank lines to 2
        .replace(/\n{3,}/g, "\n\n")
        // Remove lines shorter than 3 chars (usually noise)
        .split("\n")
        .filter(line => line.trim().length > 2 || line.trim() === "")
        .join("\n")
        .trim();

    } else if (fileName?.toLowerCase().endsWith(".docx")) {
      // ── DOCX extraction ─────────────────────────────────────────────────
      // For DOCX, extract the XML content from the zip
      const JSZip = (await import("jszip")).default;
      const zip = await JSZip.loadAsync(buffer);
      const wordDoc = zip.file("word/document.xml");

      if (wordDoc) {
        const xml = await wordDoc.async("string");
        // Strip XML tags, keep text content
        extractedText = xml
          .replace(/<w:br[^>]*\/>/g, "\n")
          .replace(/<w:p[ >]/g, "\n")
          .replace(/<[^>]+>/g, " ")
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&quot;/g, '"')
          .replace(/&#x[0-9A-Fa-f]+;/g, " ")
          .replace(/\s{3,}/g, "  ")
          .trim();
      } else {
        return res.status(400).json({ error: "Could not find document content in DOCX file" });
      }

    } else {
      // ── Plain text (TXT) ─────────────────────────────────────────────────
      extractedText = buffer.toString("utf-8");
    }

    if (!extractedText || extractedText.length < 10) {
      return res.status(400).json({ error: "Could not extract readable text from this file. The document may be scanned or image-based." });
    }

    // Final clean pass — ensure only printable characters
    const cleaned = extractedText
      .replace(/[^\x20-\x7E\n\r\t]/g, " ")
      .replace(/[ \t]{3,}/g, "  ")
      .trim();

    const words = cleaned.split(/\s+/).filter(w => w.length > 0);
    wordCount = words.length;

    return res.status(200).json({
      text: cleaned,
      wordCount,
      preview: words.slice(0, 200).join(" "), // first 200 words for the UI preview
    });

  } catch (err) {
    console.error("Extract error:", err);
    return res.status(500).json({
      error: "Extraction failed: " + err.message,
      hint: "If this is a scanned PDF, text extraction is not supported — use a text-based PDF or DOCX instead."
    });
  }
}
