// 操作属性
import {patchClass} from './modules/class'
import { patchStyle } from './modules/style'; 
import { pathAttr } from './modules/attr';
import { pathEvent } from './modules/event';
export const patchProp = (el:Element,key:any,prevValue:any,nextValue:any) => {
    switch(key) {
        case 'class':
            patchClass(el,prevValue)
        break;
        case 'style':
            patchStyle(el,prevValue,nextValue)
        break;
        default:
            if(/^on[^a-z]/.test(key)) { // 是不是事件
                pathEvent(el,key,nextValue)
            } else {
                pathAttr(el,key,nextValue)
            }
            break;
    }
}