const arr = [2,3,1,5,6,8,7,9,4]

function getSequence(arr) {
    let len = arr.length
    let start ,end,mid
    let result = [0]
    let p = arr.slice(0)
    for(let i =0;i<len;i++) {
        const arrI  = arr[i]
        if(arrI!==0) {
            let resultLastIndex =result[result.length-1] 
            if(arrI> arr[resultLastIndex]) {
                p[i] = resultLastIndex
                result.push(i)
                continue
            }
            // 二分查找
            start =0
            end = result.length-1
            while (start < end) {
                mid = (start + end)/2 |0
               if(arr[result[mid]]<arrI) {
                start = mid + 1
               } else {
                end =mid
               }
            } 
            if(arrI<arr[result[start]]) {
                if(start > 0) {
                    p[i] = result[start-1]  
                }
                result[start] = i
            }

        }
    }

    // 驱节点 向前查找
    start =result.length
    end = result[start-1]
    while (start-- > 0) {
        result[start] = end
        end = p[end]
      }
    return result
}
console.log(getSequence(arr));