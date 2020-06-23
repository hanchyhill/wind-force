const fcJson = require('./s2s.json');
const elems = ['u10m', 'v10m', 't2mm', 'visi', 'tppm', 'tcco'];

if(fcJson.DATA.length==0){
  console.error('此时次数据为空,请等待更新');
  // showNotification('此时次数据为空,请等待更新');
  return;
}
const eleLenth = Number.parseInt(fcJson.DATA.length/elems.length);
let series = decodeSeries(fcJson.DATA, eleLenth);
series = combineElems2Data(elems, series);
console.log(series);


function combineElems2Data(elems=[], series=[]){
  let newSeries = {};
  for(let i = 0; i<elems.length; i++){
    newSeries[elems[i]] = series[i];
  }
  return newSeries;
}
// TODO 修复缺失数据

/**解析数据 */
function decodeSeries(data=[], len=241){
  if(!data.length) return [];
  let splitData = [];
  let eles = data.length/len;//元素个数
  for(let ie=0;ie<eles;ie++){//看有几个要素
    splitData.push(data.slice(ie*len,(ie+1)*len));
  }
  splitData = splitData.map(data=>data.map((v,i)=>[Number(v),i]).filter(v=>v[0]>-999));//分离出[数值,时效]//-999.900024
  // console.log(splitData);
  return splitData;
}