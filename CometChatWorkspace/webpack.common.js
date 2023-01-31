const path = require('path');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyPlugin = require("copy-webpack-plugin");

const BUILD_CONSTANTS = require("./CONSTS");

let publicPath;
let bundleOutputDir = "../v3";

if (process.env.NODE_ENV && process.env.NODE_ENV === "custom") {
    
	bundleOutputDir = "build";
    publicPath = `${BUILD_CONSTANTS.URL}`;

} else if (process.env.NODE_ENV && process.env.NODE_ENV === "production") {

	publicPath = `https://widget-js.cometchat.io/v3`;

} else if (process.env.NODE_ENV && process.env.NODE_ENV === "development") {

    publicPath = `https://widget-js-dev.cometchat.io/v3`;

} else if (process.env.NODE_ENV && process.env.NODE_ENV === "local") {

    publicPath = ".";
}

module.exports = {
	entry: "./src/index.js",
	plugins: [
		new CleanWebpackPlugin(),
		new CopyPlugin({
			patterns: [{ from: "./src/public", to: path.resolve(__dirname, bundleOutputDir) }],
		}),
		new MiniCssExtractPlugin({
			filename: "[name].css",
			allChunks: true,
		}),
	],
	optimization: {
		chunkIds: "natural",
	},
	output: {
		filename: "cometchatwidget.js",
		chunkFilename: "[id].chunk.[chunkhash].js",
		path: path.resolve(__dirname, bundleOutputDir),
		publicPath: publicPath + "/",
		library: "CometChatWidget",
		libraryExport: "default",
		libraryTarget: "window",
	},
	// devServer: {
	// 	contentBase: path.resolve(__dirname, bundleOutputDir),
	// 	publicPath: path.resolve(__dirname, bundleOutputDir),
	// 	watchContentBase: true,
	// 	compress: true,
	// 	port: 9000,
	// },
	module: {
		rules: [
			{
				test: /\.(js|jsx)$/,
				exclude: /node_modules/,
				use: [
					{
						loader: "babel-loader",
						options: {
							presets: [
								[
									"@babel/preset-env",
									{
										targets: {
											browsers: ["IE 11, last 2 versions"],
										},
										// makes usage of @babel/polyfill because of IE11
										// there is at least async functions and for..of
										useBuiltIns: "usage",
									},
								],
							],
							plugins: [
								// syntax sugar found in React components
								"@babel/proposal-class-properties",
								"@babel/proposal-object-rest-spread",
								// transpile JSX/TSX to JS
								["@babel/plugin-transform-react-jsx"],
							],
						},
					},
				],
			},
			{
				test: /\.(scss|css)$/,
				use: ["css-loader", "sass-loader"],
			},
			{
				test: /\.(png|jpe?g|gif|svg|wav|mp3)$/i,
				use: [
					{
						loader: "file-loader",
						options: {
							name: "[name]-[hash].[ext]",
							outputPath: "resources/",
							esModule: false,
						},
					},
				],
			},
		],
	},
	resolve: {
		extensions: ["*", ".js", ".jsx"],
		alias: {
			UIKit: path.resolve(__dirname, "src/cometchat-pro-react-ui-kit/"),
		},
		fallback: {
			buffer: require.resolve("buffer/"),
		},
	},
};