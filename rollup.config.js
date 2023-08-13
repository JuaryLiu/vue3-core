// 通过rollup进行打包
// (1) 引入相关依赖
import ts from 'rollup-plugin-typescript2' //解析 ts
import json from '@rollup/plugin-json' //解析json
import resolvePlugin from '@rollup/plugin-node-resolve' //解析 第三方插件
import path from 'path' //处理路径
import { fileURLToPath } from 'url';
import {dirname} from 'path'
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 将require转换为模块
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
// (2)获取文件路径
let packagesDir = path.resolve(__dirname, 'packages')

// 获取需要打包的包
let packageDir = path.resolve(packagesDir, process.env.TARGET)

// 打包获取到每个包的项目配置
let resolve = p => path.resolve(packageDir, p)
const pkg = require(resolve(`package.json`))//获取json配置
const packageOptions = pkg.buildOptions || {}
console.log(packageOptions);
// 获取文件名字
const name = path.basename(packageDir)

// 创建一个映射表
const outputOptions = {
    "esm-bundler":{
        file:resolve(`dist/${name}.esm-bundler.js`),
        format:'es'
    },
    "cjs":{
        file:resolve(`dist/${name}.cjs.js`),
        format:'cjs' 
    },
    "global":{
        file:resolve(`dist/${name}.global.js`),
        format:'iife' 
    }
}

// 获取需要打包的文件的自定义配置
const options =pkg.buildOptions
function createConfig (format,output) {
    output.name = options.name
    output.sourcemap = true

    return {
        input:resolve('src/index.ts'),
        output,
        plugins:[
            json(),
            ts({
                tsconfig:path.resolve(__dirname,'tsconfig.json')
            }),
            resolvePlugin()
        ]
    }
}
// rullup需要导出一个配置
export default options.formats.map(format =>createConfig(format,outputOptions[format]))