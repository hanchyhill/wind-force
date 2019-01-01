<template>
  <div id="app">
    <Row v-show="showControl">
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
      <Col span="5">
        <DatePicker type="date" @on-change="changeDate" format="yyyy-MM-dd" :value="initTime" placeholder="选择日期" style="width: 200px"></DatePicker>
      </Col>
      <Col span="2">
        <Select v-model="fcHour" style="width:50px">
          <Option v-for="item in hourList" :value="item.value" :key="item.value">{{item.label}}</Option>
        </Select>
      </Col>
      <Col span="3">
        <Select v-model="selectedModel" style="width:100px">
          <Option v-for="item in modelList" :value="item.value" :key="item.value">{{item.label}}</Option>
        </Select>
      </Col>
      <Col span="3">
        <Button type="primary" icon="ios-search" @click="searchData">搜索</Button>
      </Col>
      <Col span="2">
        <Button @click="convert2pdf" type="info">导出pdf</Button>
      </Col>
      <Col span="2">
        <Button @click="readFromFile" type="primary">读取本地</Button>
      </Col>
      <Input v-model="desEN" type="textarea" placeholder="英文天气描述" />
      <Input v-model="desTY" type="textarea" placeholder="英文台风描述" />
      <Input v-model="galeWarning" type="textarea" placeholder="Gale Warning" />
      
  </Row>
    <!--<Row>
      <Button @click="drawData" type="info">1714帕卡</Button>
      <Button @click="drawData" type="info">1713天鸽</Button>
      <Button @click="drawData" type="info">59488</Button>
    </Row>-->
    <div id="main-content" contenteditable="true">
    <div class="page-frame">
      <div class="header" @click="showControl=!showControl">
        <hr>
        <img src="/logocact.gif" id="logo">
        METEOROLOGICAL SERVICE CO. OF SCSOJSC GUANGDONG METEOROLOGICAL OBSERVATORY<br>
        GUANGDONG METEOROLOGICAL OBSERVATORY NO.6 FUJIN ROAD YUEXIU, GUANGZHOU<br>
        GUANGDONG, CHINA 510080 PHONE: +86 20 87751755 EMAIL: nymsc@tom.com<br>
        <div class="email-to">
        TO: ENI CHINA B.V.; ATTN: Mr. OPERATIONS MANAGER<br>
        Subject: MARINE WEATHER FORECAST FOR LOCATION HZ25-10-1<br>
        <!--21°15'15''N 115°09'33''E<br>-->
        Base Time: {{localTime[0]}}; Issued Time: {{localTime[1]}}<br>
        </div>
        <hr>
      </div>
      <div class="align-left a4-paper" >
        <div class="description" v-show="desEN">
          Dominant Weather Situation:<br>
          {{desEN}}
          <br>
        </div>
        <div class="description" v-show="desTY">
          <br>
          TC WARNING:<br>
          {{desTY}}
          <br>
        </div>
        <div class="description galeWarning" v-show="galeWarning">
          <br>
          Gale Warning:<br>
          {{galeWarning}}
          <br>
        </div>
      </div>
      <div class="a4-paper" contenteditable="true">
        <h2>Elemental Forecast</h2>
        <Table :columns="columns1" :data="tableData" :border="true" :stripe="true" :size="'small'"></Table>
        &nbsp;
        <hr>
      </div>
    </div>
    <div class="a4-paper page-frame">
      <Row>
        <Col span="20">
          <!--<div id="e-chart" style="width: 1000px;height:400px;">
          </div>-->
          <div id="e-chart2" style="width: 20cm;height:350px;">
          </div>
          <br>
          <div id="e-chart3" style="width: 20cm;height:350px;">
          </div>
          <br>
        </Col>
        <Col span="2">&nbsp;</Col>
        
      </Row>
    </div>
    <div class="a4-paper page-frame">
      <h2>Weather Chart</h2>
      <br>
      <img style="width: 14cm;" :src="imgTime[0]"></img>
      <img style="width: 14cm;" :src="imgTime[1]"></img>
    </div>
    </div>
  </div>
</template>
<script>
//http://image.nmc.cn/product/2018/12/26/WESA/medium/SEVP_NMC_WESA_SFER_EGH_ACWP_L00_P9_20181226060000000.jpg width="1450px"
  import axios from 'axios';
  import echarts from 'echarts';
  import moment from 'moment';
  import windConfig from './config/windwavelist.json';

  const waveCfg = windConfig.Config.WindWaveListParam.WindWave;
  // console.log(waveCfg);
  var arrowSize = 12;
  function findWindWave(knots){
    // let intKnots = Math.ceil(knots)//向上取整;
    let fitItem;
    for(let item of waveCfg){
      if(Math.abs(Number.parseInt(item.Knot)-knots)<=0.5){
        fitItem = item;
        break;
      }else{
        continue;
      }
    }
    return fitItem;
  }

  function renderArrow(param, api) {
    var point = api.coord([
        api.value(3),
        api.value(dims.maxValue)/12//5//api.value(dims.windSpeed)
    ]);

    return {
      type: 'path',
      shape: {
        //pathData: 'M31 16l-15-15v9h-26v12h26v9z',
        pathData:'M250 0 L140 350 L250 250 L360 350 Z',
        x: -arrowSize / 2,
        y: -arrowSize / 2,
        width: arrowSize,
        height: arrowSize
      },
      rotation: api.value(dims.R),//Math.PI / 8 * index;
      position: point,
      style: api.style({
        stroke: '#555',
        lineWidth: 1,
        fill:'green',
      })
    };
  }

  var dims = {
        time: 1,
        windSpeed: 0,
        R: 2,
        waveHeight: 3,
        weatherIcon: 2,
        minTemp: 3,
        maxValue: 4
  };

  export default {
    name:'wind-fc',
    data() {
      let nowDate = moment(new Date());
      let nowHour = nowDate.hour();
      let fitDate;
      let fitHour;
      //nowHour = 4;
      if(nowHour>=14&&nowHour<21){
        
        fitDate = nowDate.hour(12).format('YYYY-MM-DD');
        fitHour = '12:00:00';
      }
      else if(nowHour>=21){
        fitDate = nowDate.add(1,'days').format('YYYY-MM-DD');
        fitHour = '00:00:00';
      }
      else if(nowHour<9){
        fitDate = nowDate.format('YYYY-MM-DD');
        fitHour = '00:00:00';
      }
      else if(nowHour<14&&nowHour>=9){
        fitDate = nowDate.hour(6).format('YYYY-MM-DD');
        fitHour = '06:00:00';
      }
      else{
        '';
      }
      console.log(fitDate,fitHour);
      return {
        showControl: false,
        isCollapsed: true,
        isShift: true,
        u10m:[],
        v10m:[],
        t2m:[],
        vis:[],
        desEN:'',
        desTY:'',
        galeWarning:'',
        columns1: [
          {
            title: 'Date',
            //key: 'tableDate',
            children:[
              {
                title: 'MM-DD HH',
                key: 'tableDate',
                 "width": 80,
                align: 'center',
                //"width": 70,
              }],
          },
          {
            title:'WINDS(KTS)',
            align: 'center',
            children:[
              {
                title: 'Dir',
                key: 'dir',
                align: 'center',
                //"width": 70,
              },
              {
                title: 'Ws',
                align: 'center',
                children:[
                  {
                    title:'10m',
                    key: 'knots',
                    align: 'center',
                    
                  }
                ],
              },
              {
                title: 'Ws',
                align: 'center',
                children:[
                  {
                    title:'50m',
                    key: 'ws50m',
                    align: 'center',
                  }
                ],
              },
              {
                title: 'Wg',
                align: 'center',
                children:[
                  {
                    title:'50m',
                    key: 'wg50m',
                    align: 'center',
                  }
                ],
              },
              {
                title: 'Ws',
                align: 'center',
                children:[
                  {
                    title:'100m',
                    key: 'ws100m',
                    align: 'center',
                  }
                ],
              },
              {
                title: 'Wg',
                align: 'center',
                children:[
                  {
                    title:'100m',
                    key: 'wg100m',
                    align: 'center',
                  }
                ],
              },
              ],
          },
          {
            title:'WIND WAVES (M)',
            align: 'center',
            children:[
              {
                title: 'Hs',
                width:32,
                key: 'waveH',
                align: 'center',
              },
              {
                title: 'Hmax',
                width:45,
                key: 'hmax',
                align: 'center',
              },
              {
                title: 'PER',
                key: 'waveT',
                align: 'center',
              },
            ],
          },
          {
            title:'SWELL',
            align:'center',
            children:[
              {
                title: 'Dir',
                key: 'swellDir',
                align: 'center',
              },
              {
                title: 'H',
                key: 'swellH',
                align: 'center',
              },
              {
                title: 'PER',
                key: 'swellT',
                align: 'center',
                //"width": 70,
              },
            ],
          },
          {
            title:'COMB',
            align:'center',
            children:[
              {
                title: 'HT',
                width:48,
                key: 'mixWave',
                align: 'center',
              },
            ],
          },
          {
            title:'WEATHER',
            align:'center',
            children:[
              {
                title: 'T2m',
                key: 't2m',
                align: 'center',
              },
              {
                title: 'VIS',
                key: 'vis',
                align: 'center',
                //"width": 70,
              },
            ]
          },
        ],
        fcHour:fitHour,//'12:00:00',
        hourList:[{label:'08',value:'00:00:00'},
                   {label:'14',value:'06:00:00'},
                   {label:'20',value:'12:00:00'},
                  ],
        lon:115.2,
        lat:21.3,
        initTime:fitDate,//'2018-12-26',
        selectedModel:'giftoceanzd',
        modelList:[{label:'GIFT海洋',value:'giftoceanzd'},
                   {label:'国家局海洋',value:'ocbu_scmoc'},
                   {label:'欧洲',value:'ecmwfthin'},
                  ],
        modelParams:{
          giftoceanzd:{u10m:'u10m',v10m:'v10m',vis:'visi',t2m:'t2mm'},
          ocbu_scmoc:{u10m:'u10m',v10m:'v10m'},
          ecmwfthin:{u10m:'u10m',v10m:'v10m'},
        }
      };
    },
    mounted() {
      //this.getWind();
      //this.searchData();
      this.readFromFile();
      this.changeTitle();
    },
    beforeDestroy() {

    },
    methods: {
      drawData2(){
        console.log(this.initTime+' '+this.fcHour);
        const timeString = this.initTime+' '+this.fcHour;//'2017-08-22 12:00:00';
        let iTime = moment(timeString,'YYYY-MM-DD HH:mm:ss').add(8,'hours');
        this.speed.forEach(v=>v.time=moment(iTime).add(v.time,'hours').format('DD-HH'));
        //const ySeries = this.speed.map(v=>v.speed);
        const xTime = this.speed.map(v=>v.time);
        const ws50m = this.tableData.map(v=>v.ws50m);
        const wg50m = this.tableData.map(v=>v.wg50m);
        const ws100m = this.tableData.map(v=>v.ws100m);
        const wg100m = this.tableData.map(v=>v.wg100m);
        const knots = this.tableData.map(v=>v.knots);
        const maxValue = Math.max(...wg100m);
        const data = this.speed.map((v,i)=>[v.speed,v.time,v.rotation,i,maxValue]);
        // data.max = Math.max(...data.map(v=>v[0]));
        // console.log('绘制');
        // const myChart = echarts.init(document.getElementById('e-chart2'), null, {renderer: 'svg'});
        const myChart = echarts.init(document.getElementById('e-chart2'));
        var option = {
            grid: {
            show:true,
            },
            title: {
              text: 'Wind Forecast',
              // left: 'center'
            },
            tooltip: {
              trigger: 'axis',
              
            },
            legend: {
                data:['Wg100m','Ws100m','Wg50m','Ws50m','Ws10m',],
                //orient:'vertical',
                //right:-10,
                //top:'20%',
            },
            xAxis: {
              type : 'category',
              data: xTime,
              // boundaryGap : false,
              //splitArea : {show : true},
              splitLine:{show: true},
              axisLine: {onZero: true},
            },
            yAxis: {
              type: 'value',
              axisLabel: {
                formatter: '{value} KTS'
              },
            },
            series: [
              {
                name: 'Ws10m',
                type: 'line',
                smooth: true,
                //symbol: 'roundRect',
                //symbolSize: 8,
                lineStyle: {normal: {width: 2,}},//type: 'dashed'
                itemStyle: {normal: {borderWidth: 1,borderColor: 'black',color: 'black'}},
                data: knots,
              },
              {
                name: 'Ws50m',
                type: 'line',
                smooth: true,
                symbol: 'triangle',
                symbolSize: 8,
                lineStyle: {normal: {width: 2,}},//type: 'dashed'
                itemStyle: {normal: {borderWidth: 1,borderColor: 'blue',color: 'blue'}},
                data: ws50m,
              },
            {
              name: 'Wg50m',
              type: 'line',
              smooth: true,
              symbol: 'rect',
              symbolSize: 8,
              lineStyle: {normal: {width: 2,type: 'dashed'}},//type: 'dashed'
              itemStyle: {normal: {borderWidth: 2,borderColor: 'green',color: 'green'}},
              data: wg50m,
            },
            {
              name: 'Ws100m',
              type: 'line',
              smooth: true,
              symbol: 'diamond',
              symbolSize: 8,
              lineStyle: {normal: {width: 2,color:'orange'}},//type: 'dashed'
              itemStyle: {normal: {borderWidth: 2,borderColor: 'orange',color: 'orange'}},
              data: ws100m,
            },
            {
              name: 'Wg100m',
              type: 'line',
              smooth: true,
              symbol: 'circle',
              symbolSize: 8,
              //color:'orange',
              lineStyle: {normal: {width: 2,type: 'dashed'}},//type: 'dashed'
              itemStyle: {normal: {borderWidth: 2,borderColor: 'red',color: 'red'}},
              data: wg100m,
            },
            {
            type: 'custom',
            name:'dir',
            renderItem: renderArrow,
            encode: {
              x: 3,
              y: dims.windSpeed,
            },
              data: data,
              z: 10
            },]
        };
        myChart.setOption(option);
      },
      drawData3(){
        console.log(this.initTime+' '+this.fcHour);
        // const timeString = this.initTime+' '+this.fcHour;//'2017-08-22 12:00:00';
        // let iTime = moment(timeString,'YYYY-MM-DD HH:mm:ss').add(8,'hours');
        // this.speed.forEach(v=>v.time=moment(iTime).add(v.time,'hours').format('DD-HH'));
        //const ySeries = this.speed.map(v=>v.speed);
        const xTime = this.tableData.map(v=>v.fTime.format('DD-HH'));
        const hs = this.tableData.map(v=>v.hs);
        const hmax = this.tableData.map(v=>v.hmax);
        const swellH = this.tableData.map(v=>v.swellH);
        const waveT = this.tableData.map(v=>v.waveT);
        //const mixWave = this.tableData.map(v=>v.mixWave);
        
        //const swellArrow = this.tableData.map(v=>v.swellArrow);
        //const knots = this.tableData.map(v=>v.knots);
        const maxValue = Math.max(...hmax);
        const data = this.tableData.map((v,i)=>[v.hmax,this.speed[i].time,v.swellRotation,i,maxValue]);
        
        // console.log(this.speed);
        //const myChart = echarts.init(document.getElementById('e-chart3'), null, {renderer: 'svg'});
        const myChart = echarts.init(document.getElementById('e-chart3'));
        var option = {
            title: {
              text: 'Wave Forecast',
              // left: 'center'
            },
            tooltip: {
              trigger: 'axis',
              
            },
            legend: {
                data:['Hs','Hmax','H-swell','Period']
            },
            xAxis: {
              type : 'category',
              data: xTime,
              // boundaryGap : false,
              //splitArea : {show : true},
              splitLine:{show: true},
              axisLine: {onZero: true},
            },
            yAxis: [{
              name:'HEIGHT',
              type: 'value',
              axisLabel: {
                formatter: '{value} m'
              },
            },
              {
              name:'PERIOD',
              type: 'value',
              max:Math.max(...waveT)+5,
              axisLabel: {
                formatter: '{value} s'
                },
              },
            ],
            //visualMap: {
            //top: 10,
           // right: 10,
            //},
            series: [
            {
              name: 'Hs',
              smooth: true,
              symbol: 'triangle',
              symbolSize: 10,
              lineStyle: {normal: {color: 'green',width: 2,}},//type: 'dashed'
              itemStyle: {normal: {borderWidth: 1,borderColor: 'green',color: 'green'}},
              type: 'line',
              data: hs,
            },
            {
              symbol: 'circle',
              smooth: true,
              symbolSize: 10,
              lineStyle: {
                normal: {
                color: 'blue',
                width: 2,
                //type: 'dashed'
                }
              },
              itemStyle: {
              normal: {
                borderWidth: 1,
                borderColor: 'blue',
                color: 'blue'
                }
              },
              name: 'Hmax',
              type: 'line',
              data: hmax,
            },
            {
              name: 'H-swell',
              smooth: true,
              symbol: 'rect',//'circle', 'rect', 'roundRect', 'triangle', 'diamond', 'pin', 'arrow', 'none'
              symbolSize: 10,
              lineStyle: {normal: {color: 'red',width: 2,}},//type: 'dashed'
              itemStyle: {normal: {borderWidth: 1,borderColor: 'red',color: 'red'}},
              type: 'line',
              data: swellH,
            },
            {
              name: 'Period',
              yAxisIndex:1,
              smooth: true,
              symbol: 'diamond',
              symbolSize: 10,
              lineStyle: {normal: {color: 'black',width: 2,type: 'dashed'}},//type: 'dashed'
              itemStyle: {normal: {borderWidth: 1,borderColor: 'black',color: 'black'}},
              type: 'line',
              data: waveT,
            },
            {
            type: 'custom',
            name:'dir',
            renderItem: renderArrow,
            encode: {
              x: 3,
              y: dims.windSpeed,
            },
              data: data,
              z: 10
            },
            ]
        };
        myChart.setOption(option);
      },
      shiftData(arr){
        arr.shift();
        return arr.map(item=>[item[0],item[1]-6]);
      },
      readFromFile(){
        axios.get('/api?interface=getFromFile')
        .then(res=>{
          let data = res.data;
          if(this.isShift){
            this.v10m = this.shiftData(data.v10m);
            this.u10m = this.shiftData(data.u10m);
            this.vis = this.shiftData(data.vis);
            this.t2m = this.shiftData(data.t2m);
            
          }else{
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
        .catch(err=>console.error(err));

        let sDate = this.initTime;
        let sTime = this.fcHour;
        let desTime = moment(sDate+sTime,'YYYY-MM-DDHH:mm:ss').add(8,'hours').format('YYYYMMDDHHmm');
        console.log(desTime);
        this.getDes(desTime);
      },
      searchData(){
        let sDate = this.initTime;
        let sTime = this.fcHour;
        let eDate = moment(sDate,'YYYY-MM-DD').add(7,'days').format('YYYY-MM-DD');
        let iLon = this.lon;
        let iLat = this.lat;
        let iModel = this.selectedModel;
        let params = `starttime=${sDate}%20${sTime}&endtime=${eDate}%20${sTime}&lon=${iLon}&lat=${iLat}&modelid=${iModel}`;
        let urlU = `/api?interface=getWind&element=${this.modelParams[this.selectedModel].u10m}&${params}`;
        let urlV = `/api?interface=getWind&element=${this.modelParams[this.selectedModel].v10m}&${params}`;
        let urlVIS = `/api?interface=getWind&element=visi&${params}`;
        let urlT2m = `/api?interface=getWind&element=t2mm&${params}`;
        this.getWind(urlU,urlV,urlVIS,urlT2m);
        let desTime = moment(sDate+sTime,'YYYY-MM-DDHH:mm:ss').add(8,'hours').format('YYYYMMDDHHmm');
        console.log(desTime);
        this.getDes(desTime);
      },
      getWind(url01='/u10.json',url02='/v10.json',url03='/v10.json',url04='/u10.json'){
        axios.all([axios.get(url01), axios.get(url02),axios.get(url03), axios.get(url04)])
        .then(axios.spread(function (Ures, Vres, VISres, Tres){
          //console.log('test');
          const Udata = Ures.data.DATA;
          const Vdata = Vres.data.DATA;
          const VISdata = VISres.data.DATA;
          const Tdata = Tres.data.DATA;
          const U = Udata.map((v,i)=>[v,i]).filter(v=>v[0]!=-999.900024);
          const V = Vdata.map((v,i)=>[v,i]).filter(v=>v[0]!=-999.900024);
          const VIS = VISdata.map((v,i)=>[v,i]).filter(v=>v[0]!=-999.900024);
          const T = Tdata.map((v,i)=>[v,i]).filter(v=>v[0]!=-999.900024);
          return [U,V,VIS,T]
        }))
        .then(([U,V,VIS,T])=>{
          if(this.isShift){
            this.u10m = this.shiftData(U);
            this.v10m = this.shiftData(V);
            this.vis = this.shiftData(VIS);
            this.t2m = this.shiftData(T);
          }else{
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
      getDes(dateString='201812270800'){
        axios.get('/api?interface=getDes&dateString='+dateString)
        .then(res=>{
          let desString = res.data;
          this.desTY = desString.tyString;
          this.desEN = desString.enString;
        })
        .catch(err=>{
          console.error(err)
        })
      },
      changeDate(date){
        this.initTime = date;
        console.log(date);
      },
      convert2pdf(){
        axios.get('/api?interface=convert2pdf')
        .then(res=>{
          console.log(res.data);
        })
        .catch(err=>{
          console.error(err);
        })
/*         html2pdf()(document.getElementById('e-chart2'), {
        filename: 'test.pdf',
        margin: 10,
        smart: true // true: Smartly adjust content width
        }, () => { console.log('finish!'); }); */
      },
      changeTitle(){
        document.title = `GDMO ${this.initTime} ${this.fcHour} HZ25-10-1`;
      },
      getGaleWarning(){
        
        
        if(!this.tableData.length||this.tableData.length<6) return '';
        let data = this.tableData.slice(0,6);
        let config={
          trigger:false,
          count:0,
          init:undefined,
          index:undefined,
        }
        config = data.reduce((config,cv,ci)=>{
          if(cv.iknots>30&&config.trigger==false){
            config.count += 1;
            if(config.count===1){
              config.init = cv;
              config.index= ci;
            }
            if(config.count===2){
              config.trigger = true;
            }
          }
          return config;
        },config);
        // console.log(config);
        if(config.trigger){
           return `WIND SPEED OVER ${config.init.iknots.toFixed(0)} KTS GUST ${findWindWave(config.init.iknots).GustKnots} KTS NEAR YOUR WELL SITE FORM ${config.init.tableDate}:00 L.T.`;
        }else{
          return '';
        }
      
      },
    },
    computed:{
      speed(){
        let speed = [];
        for(let i = 0; i < this.v10m.length; i++){
          let u10 = this.u10m[i][0];
          let v10 = this.v10m[i][0];
          let iSpeed = Math.sqrt(Math.pow(u10,2)+Math.pow(v10,2));
          let iR = Math.sign(v10)*Math.acos(u10/iSpeed);// + Math.PI/2;
          let arrowR = iR - Math.PI/2;//Math.sign(iR)*(Math.PI-Math.abs(iR)) - Math.PI/2;
          speed.push({speed:iSpeed,rotation:arrowR,time:this.v10m[i][1],degree:arrowR/Math.PI*180});//([iSpeed,this.v10m[i][1]]);
        }
        return speed.filter(v=>v.speed!==0).map(v=>{
          v.speed = v.speed.toFixed(2);
          return v;
        });
      },
      tableData(){
        // console.log('test');
        const timeString = this.initTime+' '+this.fcHour;//'2017-08-22 12:00:00';
        let startTime = moment(timeString,'YYYY-MM-DD HH:mm:ss').add(8,'hours');
        
        let data = this.v10m.map((v,i)=>{
          let fTime = moment(startTime).add(this.v10m[i][1],'hours');
          let u10 = this.u10m[i][0];
          let v10 = this.v10m[i][0];
          let iSpeed = Math.sqrt(Math.pow(u10,2)+Math.pow(v10,2));
          let iR = Math.sign(v10)*Math.acos(u10/iSpeed);
          let arrowR = iR - Math.PI/2;
          let iknots = iSpeed * 1.944;
          let windDir = iR + Math.PI;//风的来向
          windDir = -(windDir - Math.PI/2);//与北向的角度差
          if(windDir<0){
            windDir = windDir + Math.PI*2;
          }
          let dir = windDir/Math.PI*180;
          if(dir>360) dir = dir - 360;
          // let wind10m = this.v10m[i][0];
          let waveFit = findWindWave(iknots);
          
          let iTime = fTime.format('MM-DD HH');
          let iV50 = iknots*Math.pow(5,0.12);
          let fit50 = findWindWave(iV50);

          let iV100 = iknots*Math.pow(10,0.12);
          let fit100 = findWindWave(iV100);
          
          // console.log(iknots);
          // console.log(waveFit);
          //console.log(wind10m);
          let swellDir = (windDir/Math.PI*180 + 15);
          if(swellDir>360) swellDir = swellDir - 360;
          //if(waveDir)
          let colo = {
            windDir:windDir*180/Math.PI,
            interval: this.v10m[i][1],
            tableDate: iTime,
            dir: dir.toFixed(0),
            speed:iSpeed,
            fTime,
            iknots,
            knots:iknots.toFixed(0),
            ws50m: fit50?fit50.Knot:'',
            wg50m: fit50?fit50.GustKnots:'',
            wg100m: fit100?fit100.GustKnots:'',
            ws100m: fit100?fit100.Knot:'',
            hs: waveFit?waveFit.AverageWaveHeight:'',
            hmax: waveFit?waveFit.MaxWaveHeight:'',
            tz: waveFit?waveFit.WavePeriod:'',
            waveDir:dir.toFixed(0),
            waveH: waveFit?waveFit.AverageWaveHeight:'',
            waveT: waveFit?waveFit.WavePeriod:'',
            swellDir: swellDir.toFixed(0),
            swellH: waveFit?waveFit.SurgeHeight:'',
            swellT: waveFit?waveFit.SurgePeriod:'',
            mixWave: waveFit?waveFit.MixWave:'',
            t2m:this.t2m[i][0].toFixed(0),
            vis:this.vis[i][0]==0?10:this.vis[i][0].toFixed(0),
            swellArrow:swellDir - 90,
            swellRotation:arrowR - 15.0/180.0*Math.PI,
          };
          // console.log(colo);
          return colo;
        }
        );
        return data.filter(v=>v.speed!==0);
      },
      localTime(){
        const timeString = this.initTime+' '+this.fcHour;//'2017-08-22 12:00:00';
        let iTime = moment(timeString,'YYYY-MM-DD HH:mm:ss').add(8-6,'hours');
        return [moment(iTime).format('DD/HH:mm') + ' L.T. ' + moment(iTime).format('MMM YYYY'),
                moment(iTime.add(2,'hours')).format('DD/HH:mm')  + ' L.T. ' + moment(iTime).format('MMM YYYY')];
      },
      imgTime(){
        const timeString = this.initTime+' '+this.fcHour;//'2017-08-22 12:00:00';
        let p1Time = moment(timeString,'YYYY-MM-DD HH:mm:ss').add(-6,'hours');
        let p2Time = moment(timeString,'YYYY-MM-DD HH:mm:ss').add(-9,'hours');
        let p1Src = 'http://image.nmc.cn/product/' + 
                     moment(p1Time).format('YYYY/MM/DD') + 
                     '/WESA/medium/SEVP_NMC_WESA_SFER_EGH_ACWP_L00_P9_' +
                     moment(p1Time).format('YYYYMMDDHH') + 
                     '0000000.jpg';
        let p2Src = 'http://image.nmc.cn/product/' + 
                     moment(p2Time).format('YYYY/MM/DD') + 
                     '/WESA/medium/SEVP_NMC_WESA_SFER_EGH_ACWP_L00_P9_' +
                     moment(p2Time).format('YYYYMMDDHH') + 
                     '0000000.jpg';
        return [p2Src, p1Src];
      },
    },
    watch:{
      initTime(){
        this.changeTitle();
      },
      fcHour(){
        this.changeTitle();
      }
    }
  };
</script>
<style>
.header{
  text-align: left;
  margin-top:10px;
  margin-bottom: 10px;
  font-size:12px;
  font-weight: bold;
  cursor:pointer;
}
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-left:10px;
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

.a4-paper{
  width: 20cm;
  margin-top:10px;
  margin-bottom: 10px;
}

.ivu-table-body{
  font-size: 15px;
}
.ivu-table-header{
  font-size: 13px;
  overflow: visible !important;
  text-overflow:clip !important;
  min-width: 120px !important;
}

.ivu-table-header .ivu-table-cell{
  white-space: nowrap !important;
} 

.ivu-table-cell{
  padding-left: 3px !important;
  padding-right: 3px !important;
  padding-bottom: 0px !important;
}
#logo{
  position: absolute;
  float:left;
  left:17cm;
}
.email-to{
  color:red;
  font-size: 12px;
  text-align: left;
}
td{
  height:25px !important;

}
th, th{
  overflow: visible !important;
  word-wrap:break-word !important;
}
body{
  width:23cm;
}
h2{
  text-align: left;
}
.align-left{
  text-align:left;
}
.page-frame{
  page-break-after: always;
  page-break-inside: avoid;
}
.galeWarning{
  color:red;
}

</style>
