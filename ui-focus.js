const controls='button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]';
export function focusIdentity(element){
 if(!element)return null;
 return {id:element.id||'',tag:element.tagName,dataset:{...element.dataset}};
}
export function findFocusedControl(scope,identity){
 if(!scope||!identity)return null;
 return [...scope.querySelectorAll(controls)].find(element=>identity.id?element.id===identity.id:
  identity.dataset.act&&element.tagName===identity.tag&&Object.entries(identity.dataset).every(([key,value])=>element.dataset[key]===value))||null;
}
export function modalControls(scope){return scope?[...scope.querySelectorAll(controls)].filter(element=>element.offsetParent!==null):[];}
export function focusModalControl(scope,preferred){
 const target=findFocusedControl(scope,preferred)||modalControls(scope)[0];
 target?.focus({preventScroll:true});return target||null;
}
export function trapModalTab(event,scope,active){
 const elements=modalControls(scope);if(!elements.length)return false;
 const first=elements[0],last=elements.at(-1),outside=!elements.includes(active);
 if(outside||(event.shiftKey?active===first:active===last)){
  event.preventDefault();(event.shiftKey?last:first).focus({preventScroll:true});return true;
 }
 return false;
}
export function nativeActivation(event,active){
 if(!['Enter',' '].includes(event.key))return false;
 return !!(event.target||active)?.closest?.('button,a[href],input,select,textarea,[role="button"],[role="switch"],[contenteditable="true"]');
}
