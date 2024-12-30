import QRCode from "qrcode";
import JSZip from "jszip";
import { createReadStream, createWriteStream } from "node:fs";
import path from "node:path";
import os from "node:os";
import { randomUUID } from "node:crypto";

export async function createQRCodes({
  items,
}: {
  items: { href: string; name: string; artists: string }[];
}) {
  // create a zip file with qr codes
  const zip = new JSZip();
  for (const item of items) {
    const fileName =
      `${item.name} - ${item.artists}`.replace(/[<>:"/\\|?*\x00-\x1F]/g, "_") +
      ".png";
    const filePath = path.join(os.tmpdir(), fileName);
    const fileStream = createWriteStream(filePath);
    await QRCode.toFileStream(fileStream, item.href, {
      errorCorrectionLevel: "high",
    });
    console.log("Created QR code for", item.name);
    zip.file(path.basename(filePath), createReadStream(filePath));
  }

  const zipFilePath = path.join(os.tmpdir(), `${randomUUID()}.zip`);
  console.log("Creating zip file at", zipFilePath);

  await new Promise((resolve, reject) => {
    zip
      .generateNodeStream({ type: "nodebuffer", streamFiles: true })
      .pipe(createWriteStream(zipFilePath))
      .on("finish", resolve.bind(null, zipFilePath))
      .on("error", reject);
  });

  return { zipFilePath };
}
