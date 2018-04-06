var path = require('path');

module.exports = {
  entry: './src/javascripts/main.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js'
  },
  module: {
    // your modules...
    rules: [{
      test: /\.pug/,
      loaders: ['html-loader', 'pug-html-loader']
    }]
  }
};