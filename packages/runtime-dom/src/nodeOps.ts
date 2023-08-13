// 操作节点 增删改查
export const nodeOps ={
    // 操作元素
    // 创建元素
    createElement:(tagName:any) => document.createElement(tagName),
    // 删除元素
    remove:(child:any) => {
        let parent = child.parentNode
        if(parent) {
            parent.removeChild(child)
        }
    },
    // 插入元素
    insert:(child:any,parent:any,ancher=null) => {
        parent.insertBefore(child,ancher) //如果ancher为null的时候，就类似于appendChild追加子元素

    },
    //获取元素
    querySlecter:(select:any) => document.querySelector(select),
    // 获取元素文本
    setElementText:(el:any,text:any) => el.textContent = text,


    // 操作文本
    //创建文本
    createText:(text:any )=> document.createTextNode(text),
    //设置文本
    setText:(node:any,text:any) => node.nodevalue(text),

}