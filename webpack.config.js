var webpack = require('webpack');
var path = require('path');
let CircularDependencyPlugin = require('circular-dependency-plugin')

module.exports = {
    entry: "./console-miner/sharkpool.js",
    target: "node",
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'sharkpool.js'
  },
    module: {
        loaders: [
               {test: /\.json$/, loader: "json-loader"},
            {
               test: /\.js$/,
               exclude: /(node_modules|bower_components)/,
               loader: 'babel-loader',
               	query: {
               		presets: ['babel-preset-latest'],
					comments: false
				},
			}
        ]
    },
	node: {
		console: true,
		fs: 'empty'
	},
  plugins: [
    new CircularDependencyPlugin({
      // exclude detection of files based on a RegExp 
      exclude: /a\.js|node_modules/,
      // add errors to webpack instead of warnings 
      failOnError: true
    })
  ]

};
