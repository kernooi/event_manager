import QRCode from "qrcode";

export async function generateQrPngBase64(payload: string) {
  const buffer = await QRCode.toBuffer(payload, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 320,
  });

  return buffer.toString("base64");
}
