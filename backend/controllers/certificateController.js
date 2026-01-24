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
      225,
      { width: 595 }
    );

    // ===== PAGE CONSTANTS =====
    const PAGE_WIDTH = 595;
    const CENTER_X = PAGE_WIDTH / 2;

    // ===== TEMPLATE SLOT ANCHORS =====
    const NAME_SLOT_CENTER_Y = 410;      // visually between "certify that" & line
    const EXAM_SLOT_CENTER_Y = 465;      // reserved exam title white space

    const META_X = 180;
    const META_START_Y = 520;

    const PHOTO_X = 430;
    const PHOTO_Y = 575;

    const QR_X = 500;
    const QR_Y = 565;


    doc
  .font(path.resolve("assets/fonts/NameFont.ttf"))
  .fontSize(44)
  .fillColor("#000");

const nameHeight = doc.heightOfString(student.name, {
  width: PAGE_WIDTH,
  align: "center",
});

doc.text(student.name, 35, NAME_SLOT_CENTER_Y - nameHeight / 2, {
  width: PAGE_WIDTH,
  align: "center",
  ellipsis: true,
});



    doc
  .font(path.resolve("assets/fonts/Montserrat-Bold.ttf"))
  .fontSize(11)
  .fillColor("#000");

const examText = exam.title.toUpperCase();

const examHeight = doc.heightOfString(examText, {
  width: PAGE_WIDTH - 140,
  align: "center",
});

doc.text(examText, 90, EXAM_SLOT_CENTER_Y - examHeight / 2, {
  width: PAGE_WIDTH - 140,
  align: "center",
  ellipsis: true,
});



    let metaY = META_START_Y;

doc
  .fontSize(10)
  .fillColor("#000")
  .text(`Certificate ID: ${certificateId}`, META_X, metaY, {
    width: 300,
    align: 'center',
  });

metaY = doc.y + 6;

doc.text(
  `Issued on: ${new Date(result.submittedAt || Date.now()).toLocaleDateString(
    "en-IN",
    { day: "2-digit", month: "long", year: "numeric" }
  )}`,
  META_X,
  metaY,
  {
    width: 300,
    align: "center",
  }
);



    if (student.avatarUrl?.startsWith("http")) {
  const img = await fetchImageBuffer(student.avatarUrl);
  doc.image(img, PHOTO_X, PHOTO_Y, {
    width: 60,
    height: 60,
  });
}


    


    const qrUrl = `${process.env.FRONTEND_URL}/exam/completed/${certificateId}`;
const qr = await QRCode.toDataURL(qrUrl);

doc.image(qr, QR_X, QR_Y, {
  width: 80,
  height: 80,
});



    doc.end();
  } catch (err) {
    console.error("Certificate PDF error:", err);
    if (doc) doc.end();
  }
};
