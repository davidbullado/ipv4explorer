var path = require('path');

module.exports = {
  entry: './src/javascripts/main.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js'
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
  devtool: 'source-map'
};