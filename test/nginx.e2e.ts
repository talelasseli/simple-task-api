import http from "node:http";
import https from "node:https";
import { describe, expect, it } from "vitest";

type ResponseData = {
  body: string;
  headers: http.IncomingHttpHeaders;
  statusCode: number;
};

function requestLocalhost({ protocol, path = "/" }: { protocol: "http" | "https"; path?: string }) {
  const client = protocol === "https" ? https : http;

  return new Promise<ResponseData>((resolve, reject) => {
    const req = client.request(
      {
        hostname: "localhost",
        method: "GET",
        path,
        port: protocol === "https" ? 443 : 80,
        rejectUnauthorized: false,
      },
      (res) => {
        const chunks: Buffer[] = [];

        res.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
        res.on("end", () => {
          resolve({
            body: Buffer.concat(chunks).toString("utf8"),
            headers: res.headers,
            statusCode: res.statusCode ?? 0,
          });
        });
      },
    );

    req.on("error", reject);
    req.end();
  });
}

describe("nginx HTTPS e2e", () => {
  it("redirects HTTP traffic to HTTPS", async () => {
    const response = await requestLocalhost({ protocol: "http" });

    expect(response.statusCode).toBe(301);
    expect(response.headers.location).toBe("https://localhost/");
    expect(response.headers.server).toMatch(/^nginx/);
  });

  it("serves the API through HTTPS via nginx", async () => {
    const response = await requestLocalhost({ protocol: "https" });

    expect(response.statusCode).toBe(200);
    expect(response.headers.server).toMatch(/^nginx/);
    expect(JSON.parse(response.body)).toEqual({ status: "ok" });
  });
});
