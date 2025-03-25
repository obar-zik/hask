const net = require("net");
const { Jimp } = require("jimp");
const QrCode = require("qrcode-reader");

const HOST = "question-response.challenges.pro.root-me.org";
const PORT = 6000;

console.log(`[INFO] Connecting to TCP server at ${HOST}:${PORT}`);

const client = new net.Socket();
client.connect(PORT, HOST, () => {
  console.log("[TCP CONNECTED] Connected to server");
});

let dataBuffer = "";
let debounceTimeout = null;

client.on("data", (data) => {
  console.log("[TCP RECEIVED] Chunk received");
  const chunkStr = data.toString();
  console.log("[TCP RESPONSE] " + chunkStr);
  dataBuffer += chunkStr;
  console.log(`[BUFFER LENGTH]: ${dataBuffer.length}`);

  // Reset the debounce timeout
  if (debounceTimeout) clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(processData, 100);
});

async function processData() {
  console.log("[INFO] No data for 100ms, processing...");

  const base64Match = dataBuffer.match(/(?:[A-Za-z0-9+/]{4}){10,}={0,2}/);
  if (!base64Match) {
    console.warn("[WARNING] No base64 image found in response");
    return;
  }

  const base64Image = base64Match[0];
  console.log("[INFO] Base64 image found, decoding and parsing QR code...");

  try {
    const imageBuffer = Buffer.from(base64Image, "base64");
    const image = await Jimp.read(imageBuffer);

    const qr = new QrCode();
    qr.callback = function (err, value) {
      if (err) {
        console.error("[ERROR] Failed to decode QR Code:", err);
        return;
      }

      console.log("[SUCCESS] QR Code content:", value.result);
      client.write(value.result + "\n");
      console.log("[TCP SENT] Response sent to server");
    };

    qr.decode(image.bitmap);
  } catch (error) {
    console.error("[ERROR] Error decoding image:", error);
  }
}

client.on("close", () => {
  console.log("[TCP CLOSED] Connection closed");
});

client.on("error", (err) => {
  console.error("[TCP ERROR]", err);
});
