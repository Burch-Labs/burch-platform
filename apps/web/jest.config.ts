import type { Config } from "jest";

const config: Config = {
  projects: [
    {
      displayName: "api",
      testEnvironment: "node",
      testMatch: ["**/__tests__/api/**/*.test.ts"],
      transform: {
        "^.+\\.tsx?$": ["ts-jest", { tsconfig: { module: "commonjs" } }],
      },
      moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/src/$1",
      },
    },
    {
      displayName: "ui",
      testEnvironment: "jsdom",
      testMatch: ["**/__tests__/ui/**/*.test.tsx"],
      transform: {
        "^.+\\.tsx?$": ["ts-jest", { tsconfig: { module: "commonjs", jsx: "react-jsx" } }],
      },
      moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/src/$1",
      },
      setupFilesAfterEnv: ["<rootDir>/src/__tests__/ui/setup.ts"],
    },
  ],
};

export default config;
