import typescript from "@rollup/plugin-typescript";

export default {
  input: "src/index.ts", // Your main entry point
  output: {
    dir: "dist", // Output directory
    format: "esm", // Or 'cjs', 'umd', etc.
    sourcemap: true,
  },
  plugins: [
    typescript({
      tsconfig: "./tsconfig.json", // Specify your tsconfig file
    }),
  ],
};
