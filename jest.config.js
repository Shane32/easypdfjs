module.exports = {
  roots: ["<rootDir>/test", "<rootDir>/src"],
  testMatch: ["**/__tests__/**/*.+(ts|js)", "**/?(*.)+(spec|test).+(ts|js)"],
  testEnvironment: "node",
  transform: {
    "^.+\\.(ts)$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.json",
      },
    ],
    "\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$": "<rootDir>/config/fileTransformer.js",
  },
  globals: {
    fetch: global.fetch,
    Request: global.Request,
    Response: global.Response,
    AbortController: global.AbortController,
    AbortSignal: global.AbortSignal,
  },
};
