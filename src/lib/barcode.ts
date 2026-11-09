type DetectedBarcode = { rawValue?: string };
type BarcodeDetectorLike = {
  detect: (source: ImageBitmap) => Promise<DetectedBarcode[]>;
};

function detector(): BarcodeDetectorLike | null {
  const ctor = (globalThis as { BarcodeDetector?: new (options: { formats: string[] }) => BarcodeDetectorLike })
    .BarcodeDetector;
  if (!ctor) return null;
  return new ctor({ formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128"] });
}

/** Native BarcodeDetector where the phone has it, otherwise ZXing on the same still image. */
export async function readBarcode(file: Blob): Promise<string | null> {
  const bitmap = await createImageBitmap(file);
  try {
    const native = detector();
    if (native) {
      const codes = await native.detect(bitmap);
      const value = codes.find((code) => code.rawValue)?.rawValue?.replace(/\s/g, "");
      if (value) return value;
    }
  } catch {
    // Fall through to ZXing. Safari often has no BarcodeDetector.
  } finally {
    bitmap.close();
  }

  const { BrowserMultiFormatReader } = await import("@zxing/browser");
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const result = await new BrowserMultiFormatReader().decodeFromImageElement(image);
    return result.getText().replace(/\s/g, "") || null;
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}
