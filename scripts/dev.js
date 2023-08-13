import { execa } from 'execa'


// (2)进行打包 并行打包
async function dev(target) {
    console.log(target);
    // execa第一个参数是打包的形式，第二个是一个数组
    // -c 执行rullup配置， --environment环境变量  TARGET依赖 w 自动检测打包
    await execa('rollup', ['-cw', '--environment', `TARGET:${target}`], { stdio: "inherit" })//子进程的输出在父进程里边出现
}
dev('runtime-dom')