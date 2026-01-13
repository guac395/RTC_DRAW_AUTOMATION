const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: './src/main.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
    // Use IIFE format for browser-like UXP panel environment
    iife: true,
    // No library export needed - script runs directly
  },
  // UXP panels run in a browser-like environment
  target: 'web',
  externals: {
    // UXP modules are available via require() at runtime
    'uxp': 'commonjs2 uxp',
    'indesign': 'commonjs2 indesign'
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'index.html', to: 'index.html' },
        { from: 'manifest.json', to: 'manifest.json' },
        { from: 'styles', to: 'styles' },
        { from: 'icons', to: 'icons' }
      ]
    })
  ],
  resolve: {
    extensions: ['.js']
  }
};
