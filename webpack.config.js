const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = [
  // Main Electron process
  {
    mode: 'development',
    entry: './electron/main.ts',
    target: 'electron-main',
    module: {
      rules: [
        {
          test: /\.ts$/,
          include: /electron/,
          use: [{ loader: 'ts-loader' }]
        }
      ]
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'electron/main.js'
    },
    resolve: {
      extensions: ['.ts', '.js']
    }
  },
  // Preload script
  {
    mode: 'development',
    entry: './electron/preload.ts',
    target: 'electron-preload',
    module: {
      rules: [
        {
          test: /\.ts$/,
          include: /electron/,
          use: [{ loader: 'ts-loader' }]
        }
      ]
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'electron/preload.js'
    },
    resolve: {
      extensions: ['.ts', '.js']
    }
  },
  // React renderer process
  {
    mode: 'development',
    entry: './src/index.tsx',
    target: 'electron-renderer',
    devtool: 'source-map',
    module: {
      rules: [
        {
          test: /\.(ts|tsx)$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                '@babel/preset-env',
                '@babel/preset-react',
                '@babel/preset-typescript'
              ]
            }
          }
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader']
        },
        {
          test: /\.(png|svg|jpg|jpeg|gif)$/i,
          type: 'asset/resource',
        }
      ]
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js', '.jsx'],
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@components': path.resolve(__dirname, 'src/components'),
        '@services': path.resolve(__dirname, 'src/services'),
        '@utils': path.resolve(__dirname, 'src/utils'),
        '@styles': path.resolve(__dirname, 'src/styles'),
        '@assets': path.resolve(__dirname, 'assets')
      }
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'renderer.js'
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './src/index.html'
      })
    ]
  }
];