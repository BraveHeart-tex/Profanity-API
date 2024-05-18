export const MESSAGE_CHARACTER_LIMIT = 1000;

export const HTTP_STATUS_CODES = {
  OK: 200,
  BAD_REQUEST: 400,
  NOT_ACCEPTABLE: 406,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export const WHITELIST = ["swear"];
export const PROFANITY_THRESHOLD = 0.86;
