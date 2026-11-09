const path = require("path");

module.exports = (_env, argv) => ({
  entry: "./src/index.ts",
  target: "es2020",
  devtool: argv.mode !== "production" ? "inline-source-map" : false,
  module: {
    rules: [
      {
        test: /\.html$/,
        type: "asset/inline",
        // ct/UI.create expects raw base64, without a data URL prefix.
        generator: { dataUrl: (content) => content.toString("base64") },
      },
      {
        test: /\.ts$/,
        loader: "ts-loader",
        exclude: /node_modules/,
        options: { compilerOptions: { noEmit: false } },
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".js"],
    alias: { buffer: "@frida/buffer" },
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "agent.js",
    iife: true,
    globalObject: "globalThis",
    chunkFormat: false,
    chunkLoading: false,
    wasmLoading: false,
    environment: {
      arrowFunction: true,
      const: true,
      destructuring: true,
      forOf: true,
      optionalChaining: true,
      templateLiteral: true,
    },
  },
  optimization: { minimize: false, splitChunks: false, runtimeChunk: false },
  performance: false,
});
