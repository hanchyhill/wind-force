# wind-force

海洋单点风浪预报

## Project setup

```
npm install
```

### Compiles and hot-reloads for development

```
npm run serve
```

### Compiles and minifies for production

```
npm run build
```

## 前端代码主程序
./src/App.vue
### 主要函数说明
searchData 检索数据
getElemsHourly 获取逐小时数据
getGaleWarning 判断是否提示大风预警
drawData2 绘制图像
drawData3 绘制图像
outputJson 输出json
speed 风速换算
tableData 生成表格数据
weatherArr 天气现象转换


## 后端API
./service/koa-index.js
### 接口：
1. getHourlyElems
获取IDEA接口数据，并插值成逐小时数据
2. getDes
获取词条描述

## 生成PDF
./service/*_printPDF.js *代表不同站点的PDF

### 小时降水量换算

* 0-1 无降水
* 1-2.5 阵雨
* 2.5-8 中雨
* 8-15 中到大雨
* 15以上 大雨

### 总云量换算

0-4 晴
4-7 晴到多云
7-9.5 多云
9.5-9.8 多云到阴天
9.9-10 阴天

### 深水区风浪关系表
./src/windwavelist.json
