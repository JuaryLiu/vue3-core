// 处理 class样式

export const patchClass = (el:Element,value:any) => {
    if(value === '')  {
        value = ''
    }
    el.className = value
}