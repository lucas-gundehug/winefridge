/** Browser-local OCR. The image is not uploaded by this function. */
export async function readLabelText(image: Blob, signal: AbortSignal): Promise<string> {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng+dan");
  const cancel = () => {
    void worker.terminate();
  };
  signal.addEventListener("abort", cancel, { once: true });
  try {
    if (signal.aborted) return "";
    const { data } = await worker.recognize(image);
    return data.text.replace(/\s+/g, " ").trim();
  } finally {
    signal.removeEventListener("abort", cancel);
    if (!signal.aborted) await worker.terminate();
  }
}
