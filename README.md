# wind-force

海洋单点风浪预报系统 - 提供精确的海洋气象数据和预报服务

## 项目简介

wind-force 是一个专注于海洋单点风浪预报的应用程序，为海上活动提供准确的气象数据支持。系统整合了多种气象数据源，提供风力、浪高、降水量、云量等关键海洋气象指标的预报。

## 主要功能

- 海洋单点风浪实时预报
- 多时段天气状况预测
- 降水量和云量可视化展示
- 风力和浪高趋势分析
- 移动端友好的响应式设计
- PDF 报告生成与导出

## 技术栈

- 前端：Vue.js
- 后端：Koa.js
- 数据处理：Node.js
- PDF生成：Puppeteer

## 项目结构

```bash
wind-force/
├── public/                 # 静态资源目录
├── src/                    # 前端源代码
│   ├── assets/            # 资源文件
│   ├── components/        # Vue组件
│   ├── views/             # 页面视图
│   ├── config/            # 前端配置文件
│   ├── App.vue            # 主应用组件
│   ├── main.js            # 入口文件
│   ├── router.js          # 路由配置
│   ├── store.js           # 状态管理
│   └── get-data.js        # 数据获取接口
├── service/               # 后端服务
│   ├── config/            # 后端配置
│   ├── html/             # HTML模板
│   ├── pdf/              # PDF输出目录
│   ├── koa-index.js      # Koa服务器入口
│   ├── readNetcdf.js     # 气象数据读取处理
│   ├── getDes.js         # 数据描述生成
│   ├── printPDF.js       # PDF报告生成
│   └── ejs-generator-promise.js  # 模板生成器
└── dist/                  # 生产环境构建文件
```

## 开发环境设置

```bash
# 安装依赖
yarn install

# 启动开发服务器
yarn run serve

# 启动后端服务
yarn run service

# 构建生产版本
yarn run build

# 代码检查
yarn run lint
```

## 数据指标说明

### 小时降水量换算

- 0-1 无降水
- 1-2.5 阵雨
- 2.5-8 中雨
- 8-15 中到大雨
- 15以上 大雨

### 总云量换算

- 0-4 晴
- 4-7 晴到多云
- 7-9.5 多云
- 9.5-9.8 多云到阴天
- 9.9-10 阴天

### 风力等级对照表

- 0-0.2 m/s：0级，无风
- 0.3-1.5 m/s：1级，软风
- 1.6-3.3 m/s：2级，轻风
- 3.4-5.4 m/s：3级，微风
- 5.5-7.9 m/s：4级，和风
- 8.0-10.7 m/s：5级，清风
- 10.8-13.8 m/s：6级，强风
- 13.9-17.1 m/s：7级，疾风
- 17.2-20.7 m/s：8级，大风
- 20.8-24.4 m/s：9级，烈风
- 24.5-28.4 m/s：10级，狂风
- 28.5-32.6 m/s：11级，暴风
- 32.7-36.9 m/s：12级，台风

## 后端服务说明

- **koa-index.js**: 后端主程序入口，负责启动Koa服务器和配置中间件
- **readNetcdf.js**: 读取和处理气象NetCDF数据文件
- **getDes.js**: 生成天气描述和数据分析
- **printPDF.js**: 生成PDF格式的预报报告
- **ejs-generator-promise.js**: 处理模板生成

### 后端服务执行流程

1. 启动后端服务：

```bash
# 进入service目录
cd service

# 启动Koa服务器
node koa-index.js
```

2. PDF报告生成服务：

```bash
# Windows环境下使用批处理文件启动
nodePrintPDF.bat

# 或直接执行
node printPDF.js
```

主要执行流程：

- `koa-index.js` 启动后会持续监听前端请求，提供API服务
- `printPDF.js` 作为独立服务运行，定时生成最新的预报PDF报告
- PDF报告生成后保存在 `service/pdf` 目录下

注意事项：

- 确保先启动 `koa-index.js` 再启动 PDF 生成服务
- PDF生成服务依赖于后端API服务的正常运行
- 生成的PDF文件会按日期时间命名并存档

## 使用说明

1. 在首页输入目标海域坐标或选择预设位置
2. 系统将自动生成未来24小时的气象预报
3. 通过图表查看风力、浪高等关键指标的变化趋势
4. 可导出PDF格式的预报报告

## 贡献指南

欢迎提交问题和功能建议，或直接提交代码改进。请确保遵循项目的代码规范。

## 许可证

[MIT License](LICENSE)
