// 自定义属性
export const pathAttr = (el:any,key:any,value:any) => {
    if(value === null) {
        el.removeAttribute(key)
    } else {
        el.removeAttribute(key,value)
    }
}