var path = require('path');

module.exports = {
  entry: './src/javascripts/main.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    // Bundle absolute resource paths in the source-map,
    // so VSCode can match the source file.
    devtoolModuleFilenameTemplate: '[absolute-resource-path]'
  },
    resolve: {
        // Add '.ts' and '.tsx' as a resolvable extension.
        extensions: [".webpack.js", ".web.js", ".ts", ".tsx", ".js"]
    },
  module: {
    // your modules...
    rules: [{
      test: /\.pug/,
      loaders: ['html-loader', 'pug-html-loader']
    },{
      test: /\.tsx?$/, loader: "ts-loader"
    }]
  },
  devtool: 'cheap-source-map'
};