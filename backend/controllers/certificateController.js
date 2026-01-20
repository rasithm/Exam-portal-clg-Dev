import PDFDocument from "pdfkit";
import path from "path";
import QRCode from "qrcode";
import https from "https";

const fetchImageBuffer = (url) =>
  new Promise((resolve, reject) => {
    https.get(url, (res) => {
      const data = [];
      res.on("data", (chunk) => data.push(chunk));
      res.on("end", () => resolve(Buffer.concat(data)));
    }).on("error", reject);
  });

export const generateCertificatePDF = async (req, res) => {
  let doc;

  try {
    const { certificateId } = req.params;

    const baseUrl =
      process.env.BASE_URL ||
      `http://localhost:${process.env.PORT || 5000}`;

    const response = await fetch(
      `${baseUrl}/api/public/certificate/${certificateId}`
    );

    const { student, exam, result } = await response.json();

    doc = new PDFDocument({ size: "A4", margin: 0 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${certificateId}.pdf"`
    );

    doc.pipe(res);

    // ===== TEMPLATE =====
    doc.image(
      path.resolve("assets/certificates/certificate-template.png"),
      0,
      0,
      { width: 595 }
    );

    // ===== PAGE CONSTANTS =====
    const PAGE_WIDTH = 595;
    const CENTER_X = PAGE_WIDTH / 2;

    // ===== STUDENT NAME =====
    const NAME_CENTER_Y = 175;

    doc
    .font(path.resolve("assets/fonts/NameFont.ttf"))
    .fontSize(44)
    .fillColor("#000");

    // Measure text height FIRST
    const nameHeight = doc.heightOfString(student.name, {
    width: PAGE_WIDTH,
    align: "center",
    });

    // Center vertically around NAME_CENTER_Y
    doc.text(student.name, 0, NAME_CENTER_Y - nameHeight / 2, {
    width: PAGE_WIDTH,
    align: "center",
    ellipsis: true,
    });


    // ===== EXAM TITLE =====
    const EXAM_CENTER_Y = 245;

    doc
    .font(path.resolve("assets/fonts/Montserrat-Bold.ttf"))
    .fontSize(11)
    .fillColor("#000");

    const examHeight = doc.heightOfString(exam.title.toUpperCase(), {
    width: PAGE_WIDTH - 140,
    align: "center",
    });

    doc.text(exam.title.toUpperCase(), 70, EXAM_CENTER_Y - examHeight / 2, {
    width: PAGE_WIDTH - 140,
    align: "center",
    ellipsis: true,
    });


    // ===== CERTIFICATE ID =====
    const META_X = 360;
    const META_WIDTH = 200;
    let metaY = 255;

    doc
    .fontSize(10)
    .fillColor("#000")
    .text(`Certificate ID: ${certificateId}`, META_X, metaY, {
        width: META_WIDTH,
        align: "left",
    });

    metaY = doc.y + 4;


    // ===== ISSUE DATE =====
    doc.text(
    `Issued on: ${new Date(result.submittedAt || Date.now()).toLocaleDateString(
        "en-IN",
        {
        day: "2-digit",
        month: "long",
        year: "numeric",
        }
    )}`,
    META_X,
    metaY,
    {
        width: META_WIDTH,
        align: "left",
    }
    );


    // ===== STUDENT PHOTO =====
    const PHOTO_X = 430;
    const PHOTO_Y = 295;
    const PHOTO_SIZE = 70;

    if (student.avatarUrl?.startsWith("http")) {
    try {
        const img = await fetchImageBuffer(student.avatarUrl);
        doc.image(img, PHOTO_X, PHOTO_Y, {
        width: PHOTO_SIZE,
        height: PHOTO_SIZE,
        });
    } catch {
        console.warn("Student photo skipped");
    }
    }


    // ===== QR CODE =====
    const QR_X = 515;
    const QR_Y = 295;
    const QR_SIZE = 70;

    const qrUrl = `${process.env.FRONTEND_URL}/exam/completed/${certificateId}`;
    const qr = await QRCode.toDataURL(qrUrl);

    doc.image(qr, QR_X, QR_Y, {
    width: QR_SIZE,
    height: QR_SIZE,
    });


    doc.end();
  } catch (err) {
    console.error("Certificate PDF error:", err);
    if (doc) doc.end();
  }
};
