// style 的处理

export const patchStyle = (el: any, prev: any, next: any) => {
    const style = el.style
    if (next === null) {
        el.removeAttribute('style')
    } else {
        // 旧的有，新的没有
        if (prev) {
            for (let k in prev) {
                if (next[k]) {
                    style[k] = ''
                }
            }
        }
        // 新的有

        for (let k in next) {
            style[k] = next[k]
        }

    }
}