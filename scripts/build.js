import * as fs from 'fs'
import { execa } from 'execa'

// 获取目录，注意只打包packages下边的文件夹
const dirs = fs.readdirSync('packages').filter(p => {
    // 判断是否是文件,只打包文件夹
    if (!fs.statSync(`packages/${p}`).isDirectory()) {
        return false
    }
    return true
})
// (2)进行打包 并行打包
async function build(target) {
    console.log(target);
    // execa第一个参数是打包的形式，第二个是一个数组
    // -c 执行rullup配置， --environment环境变量  TARGET依赖
    await execa('rollup', ['-c', '--environment', `TARGET:${target}`], { stdio: "inherit" })//子进程的输出在父进程里边出现
}

async function runParaller(dirs,itemfn) {
    let result = []
    dirs.forEach(item => {
        result.push(itemfn(item))
    })
    return Promise.all(result)
}
runParaller(dirs, build).then(() => {
    console.log('success');
}).catch((err) => {
    console.log('error', err);
})