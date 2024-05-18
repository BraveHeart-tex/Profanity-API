import { Hono } from "hono";
import { cors } from "hono/cors";
import { env } from "hono/adapter";
import { Index } from "@upstash/vector";
import {
  HTTP_STATUS_CODES,
  MESSAGE_CHARACTER_LIMIT,
  PROFANITY_THRESHOLD,
  RATE_LIMIT,
  WHITELIST,
} from "./constants";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { Redis } from "@upstash/redis/cloudflare";
import { Ratelimit } from "@upstash/ratelimit";

const semanticSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 25,
  separators: [" "],
  chunkOverlap: 12,
});

const app = new Hono();

type Environment = {
  VECTOR_URL: string;
  VECTOR_TOKEN: string;
  UPSTASH_REDIS_REST_URL: string;
  UPSTASH_REDIS_REST_TOKEN: string;
};

app.use(cors());

app.post("/", async (c) => {
  if (c.req.header("Content-Type") !== "application/json") {
    return c.json(
      { error: "JSON body expected" },
      HTTP_STATUS_CODES.NOT_ACCEPTABLE
    );
  }

  try {
    const {
      VECTOR_TOKEN,
      VECTOR_URL,
      UPSTASH_REDIS_REST_TOKEN,
      UPSTASH_REDIS_REST_URL,
    } = env<Environment>(c);

    const redis = Redis.fromEnv({
      UPSTASH_REDIS_REST_TOKEN,
      UPSTASH_REDIS_REST_URL,
    });

    const rateLimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(RATE_LIMIT, "1 m"),
      prefix: "@upstash/ratelimit",
    });
    const ipAddress = c.req.raw.headers.get("CF-Connecting-IP");

    const { success } = await rateLimit.limit(ipAddress!);

    if (!success) {
      return c.json(
        { error: "Rate limit exceeded" },
        HTTP_STATUS_CODES.TOO_MANY_REQUESTS
      );
    }

    const index = new Index({
      url: VECTOR_URL,
      token: VECTOR_TOKEN,
      cache: false,
    });

    const body = await c.req.json();

    let { message } = body as { message: string };

    if (!message) {
      return c.json(
        { error: "Message is required" },
        HTTP_STATUS_CODES.BAD_REQUEST
      );
    }

    if (message.length > MESSAGE_CHARACTER_LIMIT) {
      return c.json(
        {
          error: `Message cannot exceed ${MESSAGE_CHARACTER_LIMIT} characters`,
        },
        HTTP_STATUS_CODES.REQUEST_ENTITY_TOO_LARGE
      );
    }

    message = message
      .split(/\s/)
      .filter((word) => !WHITELIST.includes(word.toLowerCase()))
      .join(" ");

    const [semanticChunks, wordChunks] = await Promise.all([
      splitTextIntoSemantics(message),
      splitTextIntoWords(message),
    ]);

    const flaggedFor = new Set<{ score: number; text: string }>();

    const vectorResponse = await Promise.all([
      ...wordChunks.map(async (wordChunk) => {
        const [vector] = await index.query({
          topK: 1,
          data: wordChunk,
          includeMetadata: true,
        });

        if (vector && vector.score > 0.95) {
          flaggedFor.add({
            text: vector.metadata!.text as string,
            score: vector.score,
          });
        }

        return { score: 0 };
      }),
      ...semanticChunks.map(async (semanticChunk) => {
        const [vector] = await index.query({
          topK: 1,
          data: semanticChunk,
          includeMetadata: true,
        });

        if (vector && vector.score > PROFANITY_THRESHOLD) {
          flaggedFor.add({
            text: vector.metadata!.text as string,
            score: vector.score,
          });
        }

        return vector;
      }),
    ]);

    if (flaggedFor.size === 0) {
      const mostProfaneChunk = vectorResponse.sort((a, b) =>
        a.score > b.score ? -1 : 1
      )[0];

      return c.json({
        isProfanity: false,
        score: mostProfaneChunk.score,
      });
    }

    const sortedFlagged = Array.from(flaggedFor).sort((a, b) =>
      a.score > b.score ? -1 : 1
    )[0];

    return c.json({
      isProfanity: true,
      score: sortedFlagged.score,
      flaggedFor: sortedFlagged.text,
    });
  } catch (error) {
    console.error("app.post ~ error", error);

    return c.json(
      { error: "Something went wrong." },
      HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR
    );
  }
});

function splitTextIntoWords(text: string) {
  return text.split(/\s/);
}

async function splitTextIntoSemantics(text: string) {
  if (text.split(/\s/).length === 1) return [];
  const documents = await semanticSplitter.createDocuments([text]);
  const chunks = documents.map((chunk) => chunk.pageContent);
  return chunks;
}

export default app;
