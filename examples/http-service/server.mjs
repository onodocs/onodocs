import { createServer } from "node:http";
import { timingSafeEqual } from "node:crypto";
import { createRenderer } from "@onodocs/sdk/server";
import { createHttpService } from "@onodocs/sdk/http";

const token = process.env.ONODOCS_SERVICE_TOKEN;
if (!token) throw new Error("Set ONODOCS_SERVICE_TOKEN before starting the service.");
const expected = Buffer.from(`Bearer ${token}`);
const renderer = await createRenderer(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : { channel: "chrome" });
const service = createHttpService({ renderer, document: { ...(process.env.ONODOCS_LICENSE_KEY ? { licenseKey: process.env.ONODOCS_LICENSE_KEY } : {}) }, authorize(request) {
  const supplied = Buffer.from(request.headers.authorization ?? "");
  return supplied.length === expected.length && timingSafeEqual(supplied, expected) ? "application" : undefined;
}, onError: console.error });
const server = createServer((request, response) => { void service.handle(request, response); });
try {
  await new Promise((resolve, reject) => { server.once("error", reject); server.listen(Number(process.env.PORT ?? 5191), process.env.HOST ?? "127.0.0.1", resolve); });
  console.log(`OnoDocs HTTP service listening on port ${server.address().port}`);
  await new Promise(resolve => { process.once("SIGINT", resolve); process.once("SIGTERM", resolve); });
} finally {
  server.closeAllConnections();
  await new Promise(resolve => server.close(resolve));
  await service.dispose();
  await renderer.dispose();
}
