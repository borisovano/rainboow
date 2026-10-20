(function(root){
  function question({a=7,b=5,operation='add'}={}){
    if(!Number.isInteger(a)||!Number.isInteger(b)||a<0||b<0||a>100||b>100)throw Error('Operands must be integers from 0 to 100.');
    const operations={add:[a+b,'+'],subtract:[a-b,'−'],multiply:[a*b,'×']};
    if(!Object.hasOwn(operations,operation))throw Error('Unknown operation.');
    const [answer,symbol]=operations[operation];
    return {text:`${a} ${symbol} ${b} = ?`,answer,itemId:`${operation}:${a}:${b}`,options:[answer+1,answer-1,answer,answer+2]};
  }
  root.Arithmetic={question};if(typeof module!=='undefined')module.exports=root.Arithmetic;
})(globalThis);
