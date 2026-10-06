export async function demoLicense(signal: AbortSignal): Promise<string> {
  signal.throwIfAborted();
  return "";
}
