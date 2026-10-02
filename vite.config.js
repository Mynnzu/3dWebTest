import { defineConfig } from "vite";

export default defineConfig({
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: "three-renderer",
              test: /node_modules[\\/]three[\\/]build[\\/]three\.module\.js$/,
              priority: 20,
              includeDependenciesRecursively: false,
            },
            {
              name: "three-core",
              test: /node_modules[\\/]three[\\/]/,
              priority: 10,
            },
          ],
        },
      },
    },
  },
});
