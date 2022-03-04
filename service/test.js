let data = [-999.900024, -999.900024, -999.900024, -4.203201, -999.900024, -999.900024, -3.514267, -999.900024, -999.900024, -2.883362, -999.900024, -999.900024, -2.582809, -999.900024, -999.900024, -1.594955, -999.900024, -999.900024, -0.976608, -999.900024, -999.900024, -0.481812, -999.900024, -999.900024, -0.717697, -999.900024, -999.900024, 0.507919, -999.900024, -999.900024, 0.352722, -999.900024, -999.900024, -0.366272, -999.900024, -999.900024, -1.694244, -999.900024, -999.900024, -2.035156, -999.900024, -999.900024, -999.900024, -999.900024, -999.900024, -3.380661, -999.900024, -999.900024, -6.244797, -999.900024, -999.900024, -999.900024, -1.221024, -999.900024, -999.900024, 0.878418, -999.900024, -999.900024, 1.781128, -999.900024, -999.900024, 1.488632, -999.900024, -999.900024, -0.163422, -999.900024, -999.900024, -1.295090, -999.900024, -999.900024, -1.039185, -999.900024, -999.900024, -1.418381, -999.900024, -999.900024, -1.041168, -999.900024, -999.900024, -0.945175, -999.900024, -999.900024, 0.885300, -999.900024, -999.900024, 1.311386, -999.900024, -999.900024, 1.211990, -999.900024, -999.900024, -999.900024, -999.900024, -999.900024, -0.799210, -999.900024, -999.900024, 0.069427, -999.900024, -999.900024, -999.900024, 292.633484, -999.900024, -999.900024, 293.258453, -999.900024, -999.900024, 293.558472, -999.900024, -999.900024, 293.599518, -999.900024, -999.900024, 293.099060, -999.900024, -999.900024, 292.681458, -999.900024, -999.900024, 292.372375, -999.900024, -999.900024, 292.337402, -999.900024, -999.900024, 292.133179, -999.900024, -999.900024, 292.023285, -999.900024, -999.900024, 292.195923, -999.900024, -999.900024, 293.418152, -999.900024, -999.900024, 293.958282, -999.900024, -999.900024, -999.900024, -999.900024, -999.900024, 293.712036, -999.900024, -999.900024, 293.727966, -999.900024, -999.900024, -999.900024, 11131.351563, -999.900024, -999.900024, 11328.246094, -999.900024, -999.900024, 11347.418945, -999.900024, -999.900024, 11333.465820, -999.900024, -999.900024, 8238.026367, -999.900024, -999.900024, 8216.211914, -999.900024, -999.900024, 446.960327, -999.900024, -999.900024, 207.547913, -999.900024, -999.900024, 137.078659, -999.900024, -999.900024, 156.478683, -999.900024, -999.900024, 229.516144, -999.900024, -999.900024, 5738.099121, -999.900024, -999.900024, 8476.745117, -999.900024, -999.900024, -999.900024, -999.900024, -999.900024, 10284.672852, -999.900024, -999.900024, 10142.647461, -999.900024, -999.900024, -999.900024, 0.000000, -999.900024, -999.900024, 0.000000, -999.900024, -999.900024, 0.000000, -999.900024, -999.900024, 0.000000, -999.900024, -999.900024, 0.000000, -999.900024, -999.900024, 0.000000, -999.900024, -999.900024, 0.000000, -999.900024, -999.900024, 0.000015, -999.900024, -999.900024, 0.000031, -999.900024, -999.900024, 0.000031, -999.900024, -999.900024, 0.000031, -999.900024, -999.900024, 0.000046, -999.900024, -999.900024, 0.000046, -999.900024, -999.900024, -999.900024, -999.900024, -999.900024, 0.000046, -999.900024, -999.900024, 0.000137, -999.900024, -999.900024, -999.900024, 0.632813, -999.900024, -999.900024, 0.000000, -999.900024, -999.900024, 0.000000, -999.900024, -999.900024, 0.000000, -999.900024, -999.900024, 0.000000, -999.900024, -999.900024, 0.039063, -999.900024, -999.900024, 0.679688, -999.900024, -999.900024, 1.000000, -999.900024, -999.900024, 1.000000, -999.900024, -999.900024, 1.000000, -999.900024, -999.900024, 1.000000, -999.900024, -999.900024, 0.078125, -999.900024, -999.900024, 0.609375, -999.900024, -999.900024, -999.900024, -999.900024, -999.900024, 0.515625, -999.900024, -999.900024, 1.000000];
function interploteData(data) {
  if(data.length==0) return data;// 无数据直接返回原值

  let dataPair = [];
  for (let i = 0; i < data.length; i++) {
    if (data[i] > -999.0) {// 找出所有的有效数字
      dataPair.push({ index: i, value: data[i] });
    }
  }
  if(dataPair.length==0) return data;// 无数据直接返回原值

  for (let i = 1; i < data.length - 1; i++) {// 不处理第一个元素和最后一个元素，单独处理
    if (data[i] < -999.0) {
      let betweenIndex = dataPair.findIndex((pair, cIndex) => {
        if (cIndex + 1 < dataPair.length) {// 防止越界 
          return pair.index < i && dataPair[cIndex + 1].index > i;
        } else {
          return false;
        }
      });
      if (betweenIndex > -1) {
        data[i] = (dataPair[betweenIndex].value * (dataPair[betweenIndex + 1].index - i) + dataPair[betweenIndex + 1].value * (i - dataPair[betweenIndex].index)) / (dataPair[betweenIndex + 1].index - dataPair[betweenIndex].index);
      }else{
        i<dataPair[0].index? data[i] = dataPair[0].value:data[i] = dataPair[dataPair.length-1].value;// 头尾缺测找最近值补充
      }
    }
  }
  if(data[0] < -999.0) data[0] = dataPair[0].value;
  if(data[data.length-1] < -999.0) data[data.length-1] = dataPair[dataPair.length-1].value;
  return data;
}

let newData = interploteData(data);
console.log(newData);