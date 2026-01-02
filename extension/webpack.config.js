const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
    mode: 'production',
    devtool: 'cheap-module-source-map',
    entry: {
        background: './background.js',
        popup: './popup.js'
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'dist'),
        clean: true,
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: [
                            ['@babel/preset-env', {
                                targets: { chrome: '88' },
                                modules: 'commonjs'
                            }]
                        ]
                    }
                }
            }
        ]
    },
    resolve: {
        extensions: ['.js', '.json'],
    },
    plugins: [
        new CopyPlugin({
            patterns: [
                { from: "manifest.json", to: "manifest.json" },
                { from: "popup.html", to: "popup.html" },
                { from: "identity.wasm", to: "identity.wasm" },
                { from: "identity_final.zkey", to: "identity_final.zkey" },
                // Copy snarkjs for popup context
                { from: "node_modules/snarkjs/build/snarkjs.min.js", to: "snarkjs.min.js" },
                // Copy content script
                { from: "content.js", to: "content.js" },
                // Copy MAIN world script
                { from: "injected.js", to: "injected.js" },
                // Copy dashboard bridge
                { from: "dashboard-bridge.js", to: "dashboard-bridge.js" },
            ],
        }),
    ],
    experiments: {
        asyncWebAssembly: true,
    }
};