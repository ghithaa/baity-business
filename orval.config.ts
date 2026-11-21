// The Baity backend owns openapi.yaml; this site generates its client from it,
// keeping only the marketplace (/biz) and auth endpoints.
//
// Generate with orval 8.27.0 — the version the Baity frontend uses; others
// rewrite the whole output. orval 8.27 needs Node >= 22.
//   API_SPEC=../Home-Helper-Backend/openapi.yaml npm run codegen
const specTarget = process.env.API_SPEC ?? "../Home-Helper-Backend/openapi.yaml";

export default {
  api: {
    input: {
      target: specTarget,
      filters: { tags: ["biz", "biz-provider", "biz-orders", "biz-admin"] },
      override: {
        // Exports assume the API title is "Api" (generated output is `api.ts`).
        transformer: (config: { info?: { title?: string } }) => {
          config.info ??= {};
          config.info.title = "Api";
          return config;
        },
      },
    },
    output: {
      client: "react-query",
      target: "./src/api-client/generated/api.ts",
      mode: "split",
      baseUrl: "/api",
      clean: true,
      override: {
        mutator: { path: "./src/api-client/custom-fetch.ts", name: "customFetch" },
        // customFetch already unwraps the body.
        fetch: { includeHttpResponseReturnType: false },
      },
    },
  },
};
