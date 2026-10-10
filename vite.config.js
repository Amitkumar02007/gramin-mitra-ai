import { loadEnv, defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import gemmaHandler from "./api/gemma.js";

const MAX_REQUEST_BYTES = 16 * 1024;

function localGemmaApi() {
  return {
    name: "local-gemma-api",
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        let pathname;
        try {
          pathname = new URL(request.url || "/", "http://localhost").pathname;
        } catch {
          next();
          return;
        }

        if (pathname !== "/api/gemma") {
          next();
          return;
        }

        const apiResponse = {
          setHeader: response.setHeader.bind(response),
          status(statusCode) {
            response.statusCode = statusCode;
            return this;
          },
          json(body) {
            response.setHeader("Content-Type", "application/json; charset=utf-8");
            response.end(JSON.stringify(body));
            return this;
          },
        };

        try {
          if (request.method !== "POST") {
            await gemmaHandler(request, apiResponse);
            return;
          }

          const chunks = [];
          let totalBytes = 0;
          for await (const chunk of request) {
            totalBytes += chunk.length;
            if (totalBytes > MAX_REQUEST_BYTES) {
              apiResponse.status(413).json({ error: "Request bahut bada hai." });
              return;
            }
            chunks.push(chunk);
          }

          try {
            request.body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
          } catch {
            apiResponse.status(400).json({ error: "Request JSON format valid nahi hai." });
            return;
          }

          await gemmaHandler(request, apiResponse);
        } catch (error) {
          console.error("Local /api/gemma request failed:", error);
          if (!response.writableEnded) {
            apiResponse.status(500).json({
              error: "Local AI service se jawab nahi mil saka. Server log jaanchein.",
            });
          }
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  if (!process.env.GEMINI_API_KEY && env.GEMINI_API_KEY) {
    process.env.GEMINI_API_KEY = env.GEMINI_API_KEY;
  }

  return {
    plugins: [react(), localGemmaApi()],
  };
});
