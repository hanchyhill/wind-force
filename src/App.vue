<template>
  <div id="app">
    <div class="show-control" v-show="showControl">
      <Row>
        <Col span="3">
          <Input v-model="lon" style="width: 100px">
            <span slot="prepend">经度</span>
          </Input>
        </Col>
        <Col span="3">
          <Input v-model="lat" style="width: 100px">
            <span slot="prepend">纬度</span>
          </Input>
        </Col>
        <Col span="8">
          模式起报时间
          <DatePicker
            type="date"
            @on-change="(date) => changeDate(date, 'modelDate')"
            format="yyyy-MM-dd"
            :value="modelInitDate"
            placeholder="选择日期"
            style="width: 200px"
          ></DatePicker>
        </Col>
        <Col span="2">
          <Select v-model="modelFcHour" style="width: 50px">
            <Option
              v-for="item in hourList"
              :value="item.value"
              :key="item.value"
              >{{ item.label }}</Option
            >
          </Select>
        </Col>
        <Col span="3">
          <Select v-model="selectedModel" style="width: 150px">
            <Option
              v-for="item in modelList"
              :value="item.value"
              :key="item.value"
              >{{ item.label }}</Option
            >
          </Select>
        </Col>
        <Col span="3">
          <Button type="primary" icon="ios-search" @click="searchData"
            >搜索模式</Button
          >
        </Col>
      </Row>
      <Row>
        <Col span="8">
          当前预报时间
          <DatePicker
            type="date"
            @on-change="(date) => changeDate(date, 'fcDate')"
            format="yyyy-MM-dd"
            :value="initTime"
            placeholder="选择日期"
            style="width: 200px"
          ></DatePicker>
        </Col>
        <Col span="2">
          <Select v-model="fcHour" style="width: 50px">
            <Option
              v-for="item in hourList"
              :value="item.value"
              :key="item.value"
              >{{ item.label }}</Option
            >
          </Select>
        </Col>
        <!-- <Col span="2">
          <Button @click="convert2pdf" type="info">导出pdf</Button>
        </Col>
        <Col span="2">
          <Button @click="readFromFile" type="primary">读取本地</Button>
        </Col> -->
      </Row>
      <Row>
        <Col span="4">
          最小风速:
          <InputNumber
            v-model="windMinThreshold"
            :max="windAmpThreshold"
            :min="0"
            placeholder="最小风速"
          />
        </Col>
        <Col span="5">
          风速增幅上限:
          <InputNumber
            v-model="windAmpThreshold"
            :min="0"
            placeholder="风速增幅阈值"
          />
        </Col>
        <Col span="4">
          最小涌高:
          <InputNumber
            v-model="swellMinThreshold"
            :max="swellAmpThreshold"
            :min="0"
            placeholder="最小风速"
            :step="0.1"
          />
        </Col>
        <Col span="6">
          涌高增幅上限:
          <InputNumber
            v-model="swellAmpThreshold"
            :min="0"
            placeholder="风速增幅阈值"
            :step="0.1"
          />
        </Col>
      </Row>
      <Row>
        <Input v-model="desCoast" type="textarea" placeholder="沿海天气描述" />
        <Input v-model="desTY" type="textarea" placeholder="中文台风描述" />
        <Input v-model="galeWarning" type="textarea" placeholder="大风预警" />
      </Row>
    </div>

    <div id="main-content" contenteditable="true">
      <div class="page-frame">
        <div class="header" @click="showControl = !showControl">
          <hr />
          <img src="/logocact.gif" id="logo" />

          <div class="email-to">
            <h1>南鹏岛附近海域海洋气象预报</h1>
            传送： 中节能（阳江）风力发电有限公司<br />
            <!--（ 北纬21度26分49秒，东经112度10分05秒）<br>
            
            112.167 21.444（东经112度20分, 北纬21度30分）21°15'15''N 115°09'33''E<br>
            ; 发布时间: {{localTime[1]}}-->
            起报时间: {{ localTime[0] }}
            <br />
          </div>
          广东省气象台, 广州市越秀区福今路6号, 邮政编码：510080, 电话:
          020-87300282
          <br />
          <hr />
        </div>
        <div class="align-left a4-paper">
          <div class="description" v-show="desCoast">
            沿海天气描述:
            <br />
            {{ desCoast }}
            <br />
          </div>
          <div class="description" v-show="desTY">
            <br />台风警报:
            <br />
            {{ desTY }}
            <br />
          </div>
          <div class="description galeWarning" v-show="galeWarning">
            <br />大风警报:
            <br />
            {{ galeWarning }}
            <br />
          </div>
        </div>
        <div class="a4-paper" contenteditable="true">
          <h2>要素预报</h2>
          <Table
            :columns="columns1"
            :data="tableData"
            :border="true"
            :stripe="true"
            :size="'small'"
          ></Table
          >&nbsp;
          <hr />
        </div>
      </div>
      <div class="a4-paper page-frame">
        <Row>
          <Col span="20">
            <!--<div id="e-chart" style="width: 1000px;height:400px;">
            </div>-->
            <div id="e-chart2" style="width: 22cm; height: 350px"></div>
            <br />
            <div id="e-chart3" style="width: 22cm; height: 350px"></div>
            <br />
          </Col>
          <Col span="2">&nbsp;</Col>
        </Row>
      </div>
    </div>
  </div>
</template>
<script>
//http://image.nmc.cn/product/2018/12/26/WESA/medium/SEVP_NMC_WESA_SFER_EGH_ACWP_L00_P9_20181226060000000.jpg width="1450px"
import axios from "axios";
import echarts from "echarts";
import moment from "moment";
import windConfig from "./config/windwavelist.json";

const waveCfg = windConfig.Config.WindWaveListParam.WindWave;
// console.log(waveCfg);
var arrowSize = 12;
function findWindWave(knots) {
  // let intKnots = Math.ceil(knots)//向上取整;
  let fitItem;
  for (let item of waveCfg) {
    if (Math.abs(Number.parseInt(item.Knot) - knots) <= 0.5) {
      fitItem = item;
      break;
    } else {
      continue;
    }
  }
  return fitItem;
}

function renderArrow(param, api) {
  var point = api.coord([
    api.value(3),
    api.value(dims.maxValue) / 12, //5//api.value(dims.windSpeed)
  ]);

  return {
    type: "path",
    shape: {
      //pathData: 'M31 16l-15-15v9h-26v12h26v9z',
      pathData: "M250 0 L140 350 L250 250 L360 350 Z",
      x: -arrowSize / 2,
      y: -arrowSize / 2,
      width: arrowSize,
      height: arrowSize,
    },
    rotation: api.value(dims.R), //Math.PI / 8 * index;
    position: point,
    style: api.style({
      stroke: "#555",
      lineWidth: 1,
      fill: "green",
    }),
  };
}

var dims = {
  time: 1,
  windSpeed: 0,
  R: 2,
  waveHeight: 3,
  weatherIcon: 2,
  minTemp: 3,
  maxValue: 4,
};

export default {
  name: "wind-fc",
  data() {
    let nowDate = moment(new Date());
    let nowHour = nowDate.hour();
    let fitDate;
    let fitHour;
    let modelInitDate, modelFcHour;
    //nowHour = 4;
    if (nowHour >= 14 && nowHour < 21) {
      // 下午预报用前一天模式12时预报
      fitDate = moment(nowDate).hour(12).format("YYYY-MM-DD");
      fitHour = "12:00:00";
      modelInitDate = moment(nowDate).add(-1, "days").format("YYYY-MM-DD");
      modelFcHour = "12:00:00";
    } else if (nowHour >= 21) {
      // 晚上用今天08时预报
      fitDate = moment(nowDate).add(1, "days").format("YYYY-MM-DD");
      fitHour = "00:00:00";
      modelInitDate = moment(nowDate).format("YYYY-MM-DD");
      modelFcHour = "00:00:00";
    } else if (nowHour < 9) {
      // 早晨用昨天12时预报
      fitDate = moment(nowDate).format("YYYY-MM-DD");
      fitHour = "00:00:00";
      modelInitDate = moment(nowDate).add(-1, "days").format("YYYY-MM-DD");
      modelFcHour = "12:00:00";
    } else if (nowHour < 14 && nowHour >= 9) {
      // 上午用昨天12时起报
      fitDate = moment(nowDate).hour(6).format("YYYY-MM-DD");
      fitHour = "06:00:00"; //'06:00:00';
      modelInitDate = moment(nowDate).add(-1, "days").format("YYYY-MM-DD");
      modelFcHour = "12:00:00";
    } else {
      ("");
    }
    console.log(fitDate, fitHour);
    return {
      showControl: false,
      isCollapsed: true,
      isShift: true,
      windMinThreshold: 4,
      windAmpThreshold: 7,
      swellMinThreshold: 0.4,
      swellAmpThreshold: 0.8,
      u10m: [],
      v10m: [],
      t2m: [],
      vis: [],
      rainHr: [],
      cloud: [],
      desEN: "",
      desTY: "",
      desCoast: "",
      galeWarning: "",
      columns1: [
        {
          title: "北京时",
          align: "center",
          children: [
            {
              title: "月-日 时",
              key: "tableDate",
              width: 80,
              align: "center",
              //"width": 70,
            },
          ],
        },
        {
          title: "风(米/秒)",
          align: "center",
          children: [
            {
              title: "风向",
              key: "dir",
              align: "center",
              //"width": 70,
            },
            {
              title: "风速",
              align: "center",
              key: "ws10m",
            },
            {
              title: "阵风",
              align: "center",
              key: "wg10m",
            },
          ],
        },
        {
          title: "风浪(米)",
          align: "center",
          children: [
            {
              title: "浪高",
              width: 32,
              key: "waveH",
              align: "center",
            },
            {
              title: "最大浪高",
              width: 55,
              key: "hmax",
              align: "center",
            },
            {
              title: "周期",
              key: "waveT",
              align: "center",
            },
          ],
        },
        {
          title: "涌浪(米)",
          align: "center",
          children: [
            {
              title: "涌向(角度)",
              width: 68,
              key: "swellDir",
              align: "center",
            },
            {
              title: "涌高",
              key: "swellH",
              align: "center",
            },
            {
              title: "周期",
              key: "swellT",
              align: "center",
              //"width": 70,
            },
          ],
        },
        {
          title: "合成浪",
          align: "center",
          children: [
            {
              title: "浪高",
              width: 48,
              key: "mixWave",
              align: "center",
            },
          ],
        },
        {
          title: "天气",
          align: "center",
          children: [
            {
              title: "气温",
              key: "t2m",
              align: "center",
            },
            {
              title: "能见度",
              key: "modVis",
              align: "center",
              //"width": 70,
            },
            {
              title: "天况",
              key: "weather",
              align: "center",
              width: 70,
            },
          ],
        },
      ],
      fcHour: fitHour, //'12:00:00',
      hourList: [
        { label: "08", value: "00:00:00" },
        { label: "14", value: "06:00:00" },
        { label: "20", value: "12:00:00" },
      ],
      lon: 112.25,
      lat: 21.5,
      initTime: fitDate, //'2018-12-26',
      modelInitDate,
      modelFcHour,
      selectedModel: "ecmwf_s2s",
      modelList: [
        { label: "GIFT海洋", value: "giftoceanzd" },
        { label: "EC逐小时", value: "ecmwf_s2s" },
        { label: "EC三小时", value: "ecmwfthin" },
        // { label: "CMA-GD-cnec", value: "gtrams3km_cnec" },
        { label: "CMA-GD-ec", value: "gtrams3km_ec" },
        { label: "CMA-GD-cngragfs", value: "gtrams3km_cngragfs" },
        { label: "CMA-GD-ncep", value: "gtrams3km_ncep" },
      ],
      modelParams: {
        giftoceanzd: { u10m: "u10m", v10m: "v10m", vis: "visi", t2m: "t2mm" },
        ocbu_scmoc: { u10m: "u10m", v10m: "v10m" },
        ecmwfthin: { u10m: "u10m", v10m: "v10m" },
        ecmwf_s2s: { u10m: "u10m", v10m: "v10m", vis: "visi", t2m: "t2mm" },
      },
      visCompressRatio: new Map([
        [19, 0.1],
        [20, 0.2],
        [21, 0.3],
        [22, 0.4],
        [23, 0.5],
        [0, 0.55],
        [1, 0.6],
        [2, 0.65],
        [3, 0.7],
        [4, 0.75],
        [5, 0.8],
        [6, 0.6],
        [7, 0.4],
        [8, 0.3],
        [9, 0.1],
      ]),
    };
  },
  mounted() {
    //this.getWind();
    this.searchData();
    // this.readFromFile();
    this.changeTitle();
  },
  beforeDestroy() {},
  methods: {
    drawData2() {
      console.log(this.initTime + " " + this.fcHour);
      const timeString = this.initTime + " " + this.fcHour; //'2017-08-22 12:00:00';
      let iTime = moment(timeString, "YYYY-MM-DD HH:mm:ss").add(8, "hours");
      this.speed.forEach(
        (v) => (v.time = moment(iTime).add(v.time, "hours").format("DD-HH"))
      );
      //const ySeries = this.speed.map(v=>v.speed);
      const xTime = this.tableData.map((v) => v.fTime.format("DD-HH"));
      // const ws50m = this.tableData.map(v=>v.ws50m);
      // const wg50m = this.tableData.map(v=>v.wg50m);
      // const ws100m = this.tableData.map(v=>v.ws100m);
      // const wg100m = this.tableData.map(v=>v.wg100m);
      // const knots = this.tableData.map(v=>v.knots);
      // const ws10m = this.tableData.map(v => v.ws10m);
      const ws10m = this.tableData.map((v) => v.speed.toFixed(2));
      const wg10m = this.tableData.map((v) => v.wg10m);
      const maxValue = Math.max(...wg10m);
      const data = this.speed.map((v, i) => [
        v.speed,
        v.time,
        v.rotation,
        i,
        maxValue,
      ]);
      // data.max = Math.max(...data.map(v=>v[0]));
      // console.log('绘制');
      // const myChart = echarts.init(document.getElementById('e-chart2'), null, {renderer: 'svg'});
      const myChart = echarts.init(document.getElementById("e-chart2"));
      var option = {
        grid: {
          show: true,
        },
        title: {
          text: "风速预报",
          // left: 'center'
        },
        tooltip: {
          trigger: "axis",
        },
        legend: {
          data: ["平均风", "阵风"],
          //orient:'vertical',
          //right:-10,
          //top:'20%',
        },
        xAxis: {
          type: "category",
          data: xTime,
          // boundaryGap : false,
          //splitArea : {show : true},
          splitLine: { show: true },
          axisLine: { onZero: true },
        },
        yAxis: {
          type: "value",
          axisLabel: {
            formatter: "{value} m/s",
          },
        },
        series: [
          {
            name: "平均风",
            type: "line",
            smooth: true,
            symbol: "roundRect",
            symbolSize: 8,
            lineStyle: { normal: { width: 2 } }, //type: 'dashed'
            itemStyle: {
              normal: { borderWidth: 1, borderColor: "red", color: "red" },
            },
            data: ws10m,
          },
          {
            name: "阵风",
            type: "line",
            smooth: true,
            symbol: "triangle",
            symbolSize: 8,
            lineStyle: { normal: { width: 2 } }, //type: 'dashed'
            itemStyle: {
              normal: { borderWidth: 1, borderColor: "blue", color: "blue" },
            },
            data: wg10m,
          },
          {
            type: "custom",
            name: "dir",
            renderItem: renderArrow,
            encode: {
              x: 3,
              y: dims.windSpeed,
            },
            data: data,
            z: 10,
          },
        ],
      };
      myChart.setOption(option);
    },
    drawData3() {
      console.log(this.initTime + " " + this.fcHour);

      const xTime = this.tableData.map((v) => v.fTime.format("DD-HH"));
      const hs = this.tableData.map((v) => v.hs);
      const hmax = this.tableData.map((v) => v.hmax);
      const swellH = this.tableData.map((v) => v.swellH);
      // const waveT = this.tableData.map(v => v.waveT);
      const maxValue = Math.max(...hmax);
      const data = this.tableData.map((v, i) => [
        v.hmax,
        this.speed[i].time,
        v.swellRotation,
        i,
        maxValue,
      ]);
      const myChart = echarts.init(document.getElementById("e-chart3"));
      var option = {
        title: {
          text: "海浪预报",
          // left: 'center'
        },
        tooltip: {
          trigger: "axis",
        },
        legend: {
          data: ["浪高", "最大浪高", "涌浪"], // "周期"]
        },
        xAxis: {
          type: "category",
          data: xTime,
          // boundaryGap : false,
          //splitArea : {show : true},
          splitLine: { show: true },
          axisLine: { onZero: true },
        },
        yAxis: [
          {
            name: "高度",
            type: "value",
            axisLabel: {
              formatter: "{value} m",
            },
          },
          // {
          //   name: "周期",
          //   type: "value",
          //   max: Math.max(...waveT) + 5,
          //   axisLabel: {
          //     formatter: "{value} s"
          //   }
          // }
        ],

        series: [
          {
            name: "浪高",
            smooth: true,
            symbol: "triangle",
            symbolSize: 10,
            lineStyle: { normal: { color: "green", width: 2 } }, //type: 'dashed'
            itemStyle: {
              normal: { borderWidth: 1, borderColor: "green", color: "green" },
            },
            type: "line",
            data: hs,
          },
          {
            symbol: "circle",
            smooth: true,
            symbolSize: 10,
            lineStyle: {
              normal: {
                color: "blue",
                width: 2,
                //type: 'dashed'
              },
            },
            itemStyle: {
              normal: {
                borderWidth: 1,
                borderColor: "blue",
                color: "blue",
              },
            },
            name: "最大浪高",
            type: "line",
            data: hmax,
          },
          {
            name: "涌浪",
            smooth: true,
            symbol: "rect", //'circle', 'rect', 'roundRect', 'triangle', 'diamond', 'pin', 'arrow', 'none'
            symbolSize: 10,
            lineStyle: { normal: { color: "red", width: 2 } }, //type: 'dashed'
            itemStyle: {
              normal: { borderWidth: 1, borderColor: "red", color: "red" },
            },
            type: "line",
            data: swellH,
          },
          // {
          //   name: "周期",
          //   yAxisIndex: 1,
          //   smooth: true,
          //   symbol: "diamond",
          //   symbolSize: 10,
          //   lineStyle: { normal: { color: "black", width: 2, type: "dashed" } }, //type: 'dashed'
          //   itemStyle: {
          //     normal: { borderWidth: 1, borderColor: "black", color: "black" }
          //   },
          //   type: "line",
          //   data: waveT
          // },
          {
            type: "custom",
            name: "涌向",
            renderItem: renderArrow,
            encode: {
              x: 3,
              y: dims.windSpeed,
            },
            data: data,
            z: 10,
          },
        ],
      };
      myChart.setOption(option);
    },
    /**时间位移
     * arr 数组
     * shiftStep 偏置多少小时
     */
    shiftData(arr, shiftStep = -6) {
      if (this.selectedModel !== "ecmwf_s2s") {
        arr.shift();
      }
      return arr.map((item) => [item[0], item[1] + shiftStep]);
    },
    readFromFile() {
      axios
        .get("/api?interface=getFromFile")
        .then((res) => {
          let data = res.data;
          if (this.isShift) {
            this.v10m = this.shiftData(data.v10m);
            this.u10m = this.shiftData(data.u10m);
            this.vis = this.shiftData(data.vis);
            this.t2m = this.shiftData(data.t2m);
          } else {
            this.v10m = data.v10m;
            this.u10m = data.u10m;
            this.vis = data.vis;
            this.t2m = data.t2m;
          }
          console.log(this.getGaleWarning());
          this.galeWarning = this.getGaleWarning();
          this.drawData2();
          this.drawData3();
        })
        .catch((err) => console.error(err));

      let sDate = this.initTime;
      let sTime = this.fcHour;
      let desTime = moment(sDate + sTime, "YYYY-MM-DDHH:mm:ss")
        .add(8, "hours")
        .format("YYYYMMDDHHmm");
      console.log(desTime);
      this.getDes(desTime);
    },
    searchData() {
      let sDate = this.modelInitDate;
      let sTime = this.modelFcHour;
      // let fcHrLenth = moment(`${this.modelInitDate} `)
      let eDate = moment(this.initTime, "YYYY-MM-DD")
        .add(1, "days")
        .format("YYYY-MM-DD");
      let eTime = this.fcHour;
      let iLon = this.lon;
      let iLat = this.lat;
      let iModel = this.selectedModel;
      let params = `starttime=${sDate}%20${sTime}&endtime=${eDate}%20${eTime}&lon=${iLon}&lat=${iLat}&modelid=${iModel}`;
      let urlGetHourlyFc = encodeURI(
        `/api?interface=getHourlyElems&elements=u10m v10m t2mm visi tppm tcco&${params}`
      );
      this.getElemsHourly(urlGetHourlyFc);
      let desTime = moment(this.initTime + this.fcHour, "YYYY-MM-DDHH:mm:ss")
        .add(8, "hours")
        .format("YYYYMMDDHHmm");
      console.log(desTime);
      this.getDes(desTime);
    },
    combineElems2Data(elems = [], series = []) {
      let newSeries = {};
      for (let i = 0; i < elems.length; i++) {
        newSeries[elems[i]] = series[i];
      }
      return newSeries;
    },
    decodeSeries(data = [], len = 241) {
      if (!data.length) return [];
      let splitData = [];
      let eles = data.length / len; //元素个数
      for (let ie = 0; ie < eles; ie++) {
        //看有几个要素
        splitData.push(data.slice(ie * len, (ie + 1) * len));
      }
      splitData = splitData.map((data) =>
        data.map((v, i) => [Number(v), i]).filter((v) => v[0] > -999)
      ); //分离出[数值,时效]//-999.900024
      // console.log(splitData);
      return splitData;
    },
    getElemsHourly(urlGetHourlyFc) {
      const elems = ["u10m", "v10m", "t2mm", "visi", "tppm", "tcco"];
      const diffHr = this.hourShift;
      axios
        .get(urlGetHourlyFc)
        .then((res) => {
          let data = res.data;
          if (data.DATA.length == 0) {
            // console.error("此时次数据为空,请等待更新");
            // showNotification('此时次数据为空,请等待更新');
            throw new Error("此时次数据为空,请等待更新");
          } else {
            const eleLenth = Number.parseInt(data.DATA.length / elems.length);
            let series = this.decodeSeries(data.DATA, eleLenth);
            series = series.map((data) => this.shiftData(data, diffHr)); // 转换为预报时次
            series[4] = series[4].reduce((acc, cV, i, arr) => {
              if (i != 0) {
                return acc.concat([[cV[0] - arr[i - 1][0], cV[1]]]);
              } else {
                return [cV];
              }
            }, []); // 雨量转换
            console.log(series[4]);
            series = series.map((data) =>
              data.filter((v) => v[1] > 0 && v[1] < 25)
            ); // 只保留24小时预报
            series = this.combineElems2Data(elems, series);

            return series;
          }
          // console.log(res);
        })
        .then((series) => {
          this.v10m = series.v10m;
          this.u10m = series.u10m;
          if(this.selectedModel == 'giftoceanzd'){
            this.t2m = series.t2mm.map((v) => [v[0], v[1]]);
            this.cloud = series.tcco.map((v) => [v[0]/100.0, v[1]]);
            this.vis = series.visi;
          }else{
            this.t2m = series.t2mm.map((v) => [v[0] - 273.15, v[1]]);
            this.cloud = series.tcco;
            this.vis = series.visi.map((v) => [v[0] / 1000.0, v[1]]);
          }
          this.rainHr = series.tppm.map((v) => [v[0] * 1000.0, v[1]]);
          this.drawData2();
          this.drawData3();
          this.galeWarning = this.getGaleWarning();
        })
        .catch((err) => {
          console.error(err);
          throw err;
        });
      // return urlGetHourlyFc;
    },
    getWind(
      url01 = "/u10.json",
      url02 = "/v10.json",
      url03 = "/v10.json",
      url04 = "/u10.json"
    ) {
      axios
        .all([
          axios.get(url01),
          axios.get(url02),
          axios.get(url03),
          axios.get(url04),
        ])
        .then(
          axios.spread(function (Ures, Vres, VISres, Tres) {
            //console.log('test');
            const Udata = Ures.data.DATA;
            const Vdata = Vres.data.DATA;
            const VISdata = VISres.data.DATA;
            const Tdata = Tres.data.DATA;
            const U = Udata.map((v, i) => [v, i]).filter(
              (v) => v[0] != -999.900024
            );
            const V = Vdata.map((v, i) => [v, i]).filter(
              (v) => v[0] != -999.900024
            );
            const VIS = VISdata.map((v, i) => [v, i]).filter(
              (v) => v[0] != -999.900024
            );
            const T = Tdata.map((v, i) => [v, i]).filter(
              (v) => v[0] != -999.900024
            );
            return [U, V, VIS, T];
          })
        )
        .then(([U, V, VIS, T]) => {
          if (this.isShift) {
            this.u10m = this.shiftData(U);
            this.v10m = this.shiftData(V);
            this.vis = this.shiftData(VIS);
            this.t2m = this.shiftData(T);
          } else {
            this.u10m = U;
            this.v10m = V;
            this.vis = VIS;
            this.t2m = T;
          }
          // this.drawData();
          this.drawData2();
          this.drawData3();
          this.galeWarning = this.getGaleWarning();
        })
        .catch(function (error) {
          console.log(error);
        });
    },
    getDes(dateString = "201812270800") {
      axios
        .get("/api?interface=getDes&dateString=" + dateString)
        .then((res) => {
          let desString = res.data;
          this.desTY = desString.tyString;
          // this.desEN = desString.enString;
          this.desCoast = desString.coastString;
        })
        .catch((err) => {
          console.error(err);
        });
    },
    changeDate(date, whichDate) {
      if (whichDate == "modelDate") {
        this.modelInitDate = date;
      } else {
        this.initTime = date;
      }
      console.log(date);
    },
    convert2pdf() {
      axios
        .get("/api?interface=convert2pdf")
        .then((res) => {
          console.log(res.data);
        })
        .catch((err) => {
          console.error(err);
        });
      /*         html2pdf()(document.getElementById('e-chart2'), {
        filename: 'test.pdf',
        margin: 10,
        smart: true // true: Smartly adjust content width
        }, () => { console.log('finish!'); }); */
    },
    changeTitle() {
      document.title = `GDMO ${this.initTime} ${this.fcHour} HZ25-10-1`;
    },
    getGaleWarning() {
      if (!this.tableData.length || this.tableData.length < 6) return "";
      let data = this.tableData.slice(0, 6);
      let config = {
        trigger: false,
        count: 0,
        init: undefined,
        index: undefined,
        findEnd: false,
        end: undefined,
      };
      config = data.reduce((config, cv, ci) => {
        if (cv.iknots >= 30 && config.trigger == false) {
          config.count += 1;
          if (config.count === 1) {
            config.init = cv;
            config.index = ci;
          }
          if (config.count === 2) {
            config.trigger = true;
            config.end = data[data.length - 1];
          }
        } else {
          if (cv.iknots < 29 && config.trigger === true && !config.findEnd) {
            // konts<29
            config.end = cv;
            config.endIndex = ci;
            config.findEnd = true;
          }
        }
        return config;
      }, config);
      // console.log(config);
      if (config.trigger) {
        return `WIND SPEED OVER ${config.init.iknots.toFixed(0)} KTS GUST ${
          findWindWave(config.init.iknots).GustKnots
        } KTS NEAR YOUR WELL SITE FORM ${config.init.tableDate}:00 L.T./${
          config.end.tableDate
        }:00 L.T.`;
      } else {
        return "";
      }
    },
    /**
     * base, 压缩基准,小于base不压缩;
     * ratio, 压缩比
     */
    Compressor(base = 10.0, ratio = 0.5) {
      return (input) => {
        let output = input;
        if (input < base) {
          output = input;
        } else {
          output = base + (input - base) * (1 - ratio);
        }
        return output;
      };
    },
  },
  computed: {
    speed() {
      let speed = [];
      for (let i = 0; i < this.v10m.length; i++) {
        let u10 = this.u10m[i][0];
        let v10 = this.v10m[i][0];
        let iSpeed = Math.sqrt(Math.pow(u10, 2) + Math.pow(v10, 2));
        let iR = Math.sign(v10) * Math.acos(u10 / iSpeed); // + Math.PI/2;
        let arrowR = iR - Math.PI / 2; //Math.sign(iR)*(Math.PI-Math.abs(iR)) - Math.PI/2;
        speed.push({
          speed: iSpeed,
          rotation: arrowR,
          time: this.v10m[i][1],
          degree: (arrowR / Math.PI) * 180,
        }); //([iSpeed,this.v10m[i][1]]);
      }
      return speed
        .filter((v) => v.speed !== 0)
        .map((v) => {
          v.speed = v.speed.toFixed(2);
          return v;
        });
    },
    tableData() {
      // console.log('test');
      const timeString = this.initTime + " " + this.fcHour; //'2017-08-22 12:00:00';
      let startTime = moment(timeString, "YYYY-MM-DD HH:mm:ss").add(8, "hours");
      let compressorsMap = new Map();
      this.visCompressRatio.forEach((ratio, time) => {
        compressorsMap.set(time, this.Compressor(10, ratio));
      }); // 设置压缩比
      let data = this.v10m.map((v, i) => {
        let fTime = moment(startTime).add(this.v10m[i][1], "hours");
        let fHour = fTime.hour();
        let u10 = this.u10m[i][0];
        let v10 = this.v10m[i][0];
        let rain = this.rainHr.length ? this.rainHr[i][0] : 0;
        let cloud = this.cloud.length ? this.cloud[i][0] : 0;
        let weather = this.weatherArr.length ? this.weatherArr[i][0] : 0;
        let iSpeed = Math.sqrt(Math.pow(u10, 2) + Math.pow(v10, 2));
        let iR = Math.sign(v10) * Math.acos(u10 / iSpeed);
        let arrowR = iR - Math.PI / 2;
        if (iSpeed < this.windAmpThreshold)
          iSpeed =
            ((this.windAmpThreshold - this.windMinThreshold) /
              this.windAmpThreshold) *
              iSpeed +
            this.windMinThreshold;

        let iknots = iSpeed * 1.944;
        let windDir = iR + Math.PI; //风的来向
        windDir = -(windDir - Math.PI / 2); //与北向的角度差
        if (windDir < 0) {
          windDir = windDir + Math.PI * 2;
        }
        let dir = (windDir / Math.PI) * 180;
        if (dir > 360) dir = dir - 360;
        // let wind10m = this.v10m[i][0];
        let waveFit = findWindWave(iknots);

        let iTime = fTime.format("MM-DD HH");
        // TODO 修改能见度
        let modVis = this.vis.length == 0 ? 0 : this.vis[i][0];
        // 如果在晚上
        if (fHour > 19 || fHour < 9) {
          modVis = compressorsMap.get(fHour)(modVis);
        }
        // let iV50 = iknots*Math.pow(5,0.12);
        // let fit50 = findWindWave(iV50);

        // let iV100 = iknots*Math.pow(10,0.12);
        // let fit100 = findWindWave(iV100);
        // console.log(iknots);
        // console.log(waveFit);
        //console.log(wind10m);
        let averageHeight = waveFit ? waveFit.AverageWaveHeight : 0;
        let averageHeightClassName = Number(averageHeight)>=1.5? 'red-cell':'green-cell';
        let swellDir = (windDir / Math.PI) * 180 + 15;
        if (swellDir > 360) swellDir = swellDir - 360;
        let swellH = waveFit ? Number(waveFit.SurgeHeight) : 0;
        if (swellH < this.swellAmpThreshold)
          swellH =
            ((this.swellAmpThreshold - this.swellMinThreshold) /
              this.swellAmpThreshold) *
              swellH +
            this.swellMinThreshold;
        let colo = {
          windDir: (windDir * 180) / Math.PI,
          interval: this.v10m[i][1],
          tableDate: iTime,
          dir: dir.toFixed(0),
          speed: iSpeed,
          ws10m: iSpeed < 1 ? 1 : iSpeed.toFixed(0),
          wg10m: waveFit
            ? Number.parseInt(waveFit.Gust) < 1
              ? 1
              : waveFit.Gust
            : 1,
          fTime,
          iknots,
          knots: iknots.toFixed(0),
          // ws50m: fit50?fit50.Knot:'',
          // wg50m: fit50?fit50.GustKnots:'',
          // wg100m: fit100?fit100.GustKnots:'',
          // ws100m: fit100?fit100.Knot:'',
          hs: waveFit ? waveFit.AverageWaveHeight : "",
          hmax: waveFit ? waveFit.MaxWaveHeight : "",
          tz: waveFit ? waveFit.WavePeriod : "",
          waveDir: dir.toFixed(0),
          waveH: waveFit ? waveFit.AverageWaveHeight : "",
          waveT: waveFit ? waveFit.WavePeriod : "",
          swellDir: swellDir.toFixed(0),
          swellH: swellH.toFixed(1), //: waveFit ? waveFit.SurgeHeight : "",
          swellT: waveFit ? waveFit.SurgePeriod : "",
          mixWave: waveFit ? waveFit.MixWave : "",
          t2m: this.t2m[i][0].toFixed(0),
          vis:
            this.vis[i][0] < 0.2
              ? 0.2
              : this.vis[i][0] < 1
              ? this.vis[i][0].toFixed(1)
              : this.vis[i][0].toFixed(1), // 雾最小0.2
          modVis:
            modVis.length == 0
              ? 15
              : modVis < 0.2
              ? 0.2
              : modVis < 1
              ? modVis.toFixed(1)
              : modVis.toFixed(0),
          swellArrow: swellDir - 90,
          swellRotation: arrowR - (15.0 / 180.0) * Math.PI,
          rain,
          cloud,
          weather,
          cellClassName: {
            'waveH': averageHeightClassName,
          },
        };
        // console.log(colo);
        return colo;
      });
      return data.filter((v) => v.speed !== 0);
    },
    localTime() {
      const timeString = this.initTime + " " + this.fcHour; //'2017-08-22 12:00:00';
      let iTime = moment(timeString, "YYYY-MM-DD HH:mm:ss").add(8, "hours");
      return [
        moment(iTime).format("北京时 YYYY年MM月DD日HH:mm"),
        moment(iTime.add(1, "hours")).format("YYYY年MM月DD日HH:mm"),
      ];
    },
    /**模式与预报时间的差值*/
    hourShift() {
      const modelInitTime = moment(
        this.modelInitDate + this.modelFcHour,
        "YYYY-MM-DDHH:mm:ss"
      );
      const fcInitTime = moment(
        this.initTime + this.fcHour,
        "YYYY-MM-DDHH:mm:ss"
      );
      const diffHr = modelInitTime.diff(fcInitTime, "hours");
      return diffHr;
    },
    weatherArr() {
      const rainState = this.rainHr.map((data) => {
        const iRain = data[0];
        let state;
        if (iRain < 0.5) {
          state = "无";
        } else if (iRain < 2.5) {
          state = "阵雨";
        } else if (iRain < 8) {
          state = "中雨";
        } else {
          state = "大雨";
        }
        return [state, data[1]];
      });
      const cloudState = this.cloud.map((data) => {
        const iCloud = data[0];
        let state;
        if (iCloud < 0.4) {
          state = "晴";
        } else if (iCloud < 0.8) {
          state = "多云";
        } else if (iCloud < 0.99) {
          state = "多云";
        } else {
          state = "阴";
        }
        return [state, data[1]];
      });
      const visState = this.vis.map((data) => {
        const iVis = data[0];
        let state;
        if (iVis < 0.5) {
          state = "大雾";
        } else if (iVis < 1) {
          state = "雾";
        } else if (iVis < 4) {
          state = "轻雾";
        } else {
          state = "无";
        }
        return [state, data[1]];
      });
      let length = cloudState.length;
      let weatherState = new Array(length).fill(0);
      for (let i = 0; i < length; i++) {
        let iState = cloudState[i][0];
        let iVis = visState[i][0];
        let iRain = rainState[i][0];
        if (iVis.indexOf("雾") !== -1) iState = iVis;
        if (iRain.indexOf("雨") !== -1) iState = iRain;
        weatherState[i] = [iState, cloudState[i][1]];
      }
      return weatherState;
    },
  },
  watch: {
    initTime() {
      this.changeTitle();
    },
    fcHour() {
      this.changeTitle();
    },
    tableData() {
      this.drawData2();
      this.drawData3();
    },
  },
};
</script>
<style>
.header {
  text-align: left;
  margin-top: 10px;
  margin-bottom: 10px;
  font-size: 15px;
  font-weight: bold;
  cursor: pointer;
}
#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-left: 10px;
}
#nav {
  padding: 30px;
}

#nav a {
  font-weight: bold;
  color: #2c3e50;
}

#nav a.router-link-exact-active {
  color: #42b983;
}

.a4-paper {
  width: 20cm;
  margin-top: 10px;
  margin-bottom: 10px;
}

.ivu-table-body {
  font-size: 15px;
}
.ivu-table-header {
  font-size: 13px;
  overflow: visible !important;
  text-overflow: clip !important;
  min-width: 120px !important;
}

.ivu-table-header .ivu-table-cell {
  white-space: nowrap !important;
}

.ivu-table-cell {
  padding-left: 3px !important;
  padding-right: 3px !important;
  padding-bottom: 0px !important;
}
#logo {
  position: absolute;
  float: left;
  left: 17cm;
}
.email-to {
  color: red;
  font-size: 15px;
  text-align: left;
}
td {
  height: 25px !important;
}
th,
th {
  overflow: visible !important;
  word-wrap: break-word !important;
}
body {
  width: 23cm;
}
h2 {
  text-align: left;
}
.align-left {
  text-align: left;
}
.page-frame {
  page-break-after: always;
  page-break-inside: avoid;
}
.galeWarning {
  color: red;
}

.ivu-table .green-cell, .ivu-table .green-cell .ivu-table-cell{
  background-color: #13cf32;
  color: #fff;
}
.ivu-table .red-cell, .ivu-table .red-cell .ivu-table-cell{
  background-color: #b91c1c;
  color: #fff;
}
</style>
