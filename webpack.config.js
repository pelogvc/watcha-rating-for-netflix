const { resolve } = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const ExtensionReloaderPlugin = require('webpack-extension-reloader');
const CleanWebpackPlugin = require('clean-webpack-plugin');

const mode = process.env.NODE_ENV;
module.exports = {
    mode,
    devtool: 'inline-source-map',
    entry: {
        'content-script': './src/content/netflix.ts',
        background: './src/background/index.ts',
        //popup: "./src/popup/popup.ts"
    },
    output: {
        publicPath: '.',
        path: resolve(__dirname, 'dist/'),
        filename: '[name].js',
        libraryTarget: 'umd',
    },
    plugins: [
        new MiniCssExtractPlugin({ filename: 'style.css' }),
        new CopyWebpackPlugin([
            {
                from: './src/manifest.json',
                to: 'manifest.json',
            },
            { from: './src/popup/popup.html' },
            { from: './src/icons', to: 'assets' },
        ]),
    ],
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.css$/,
                use: [
                    {
                        loader: MiniCssExtractPlugin.loader,
                    },
                    'css-loader',
                ],
            },
            {
                test: /\.scss$/,
                use: [
                    {
                        loader: MiniCssExtractPlugin.loader,
                    },
                    'css-loader',
                    'sass-loader',
                ],
            },
            {
                test: /\.txt$/,
                use: 'raw-loader',
            },
        ],
    },
};
