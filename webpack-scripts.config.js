const fs = require('fs');
const path = require('path');

const sourcePath = 'src/scripts';
const buildPath = 'build/scripts';
const scriptFiles = fs.readdirSync(path.resolve(__dirname, sourcePath));

module.exports = {
  mode: 'production',
  entry: scriptFiles.reduce(
    (acc, filename) => ({
      ...acc,
      [path.parse(filename).name]: path.resolve(__dirname, sourcePath, filename),
    }),
    {}
  ),
  output: {
    path: path.join(__dirname, buildPath),
    filename: '[name].js',
  },
  resolve: {
    extensions: ['.ts'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
};
