<template>
  <div id="app">
    <Row>
      <Button @click="drawData" type="info">1714帕卡</Button>
      <Button @click="drawData" type="info">1713天鸽</Button>
      <Button @click="drawData" type="info">59488</Button>
    </Row>
    <Row>
      <Col span="2">
        <Input v-model="lon" style="width: 100px">
           <span slot="prepend">经度</span>
        </Input>
      </Col>
      <Col span="2">
        <Input v-model="lat" style="width: 100px">
          <span slot="prepend">纬度</span>
        </Input>
      </Col>
      <Col span="4">
        <DatePicker type="date" @on-change="changeDate" format="yyyy-MM-dd" :value="initTime" placeholder="选择日期" style="width: 200px"></DatePicker>
      </Col>
      <Col span="1">
        <Select v-model="fcHour" style="width:50px">
          <Option v-for="item in hourList" :value="item.value" :key="item.value">{{item.label}}</Option>
        </Select>
      </Col>
      <Col span="2">
        <Select v-model="selectedModel" style="width:100px">
          <Option v-for="item in modelList" :value="item.value" :key="item.value">{{item.label}}</Option>
        </Select>
      </Col>
      <Col span="2">
        <Button type="primary" icon="ios-search" @click="searchData">搜索</Button>
      </Col>
      <Col span="1">
        <Button @click="drawData" type="info">绘图</Button>
      </Col>
    </Row>
    <Row>
      <Col span="2">&nbsp;</Col>
      <Col span="20">
        <div id="e-chart" style="width: 1000px;height:400px;">
        </div>
      </Col>
      <Col span="2">&nbsp;</Col>
    </Row>
    <Row>
      <Col span="2">&nbsp;</Col>
      <Col span="20">
        <Table :columns="columns1" :data="tableData" :border="true" :stripe="true"></Table>
      </Col>
      <Col span="2">&nbsp;</Col>
    </Row>
  </div>
</template>
<script>
  import axios from 'axios';
  import echarts from 'echarts';
  import moment from 'moment';
  import windConfig from './config/windwavelist.json';
  const waveCfg = windConfig.Config.WindWaveListParam.WindWave;
  // console.log(waveCfg);
  var arrowSize = 12;
  function findWindWave(knots){
    let intKnots = Math.ceil(knots)//向上取整;
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
        api.value(dims.windSpeed)
    ]);

    return {
      type: 'path',
      shape: {
        //pathData: 'M31 16l-15-15v9h-26v12h26v9z',
        pathData:'M250 0 L150 350 L350 350 Z',
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
        maxTemp: 4
  };

  export default {
    name:'wind-force',
    data() {
      return {
        isCollapsed: true,
        u10m:[],
        v10m:[],
        t2m:[],
        vis:[],
        data1:[
          {
            name: 'John Brown',
            age: 18,
            address: 'New York No. 1 Lake Park',
            date: '2016-10-03'
          },
          {
            name: 'Jim Green',
            age: 24,
            address: 'London No. 1 Lake Park',
            date: '2016-10-01'
          },
          {
            name: 'Joe Black',
            age: 30,
            address: 'Sydney No. 1 Lake Park',
            date: '2016-10-02'
          },
          {
            name: 'Jon Snow',
            age: 26,
            address: 'Ottawa No. 2 Lake Park',
            date: '2016-10-04'
          }
        ],
        columns1: [
          {
            title: 'Date',
            key: 'tableDate'
          },
          {
            title:'WINDS',
            align: 'center',
            children:[
              {
                title: 'Dir',
                key: 'dir'
              },
              {
                title: 'Ws50m',
                key: 'ws50m'
              },
              {
                title: 'Wg100m',
                key: 'wg100m'
              },
              {
                title: 'Ws100m',
                key: 'ws100m'
              },
              ],
          },
          {
            title:'TOTAL SEA',
            align: 'center',
            children:[
              {
                title: 'Hs',//有效波高
                key: 'hs'
              },
              {
                title: 'Hmax',
                key: 'hmax'
              },
              {
                title: 'Tp',
                key: 'tp'
              },
            ],
          },
          {
            title:'WIND WAVES',
            align: 'center',
            children:[
              {
                title: 'Dir',
                key: 'waveDir'
              },
              {
                title: 'H',
                key: 'waveH'
              },
              {
                title: 'T',
                key: 'waveT'
              },
            ],
          },
          {
            title:'SWELL',
            align:'center',
            children:[
              {
                title: 'Dir',
                key: 'swellDir'
              },
              {
                title: 'H',
                key: 'swellDir'
              },
              {
                title: 'T',
                key: 'swellT'
              },
            ],
          },
          {
            title:'WEATHER',
            align:'center',
            children:[
              {
                title: 'T2m',
                key: 't2m'
              },
              {
                title: 'VIS',
                key: 'vis'
              },
            ]
          },
        ],
        fcHour:'12:00:00',
        hourList:[{label:'08',value:'00:00:00'},
                   {label:'14',value:'06:00:00'},
                   {label:'20',value:'12:00:00'},
                  ],
        lon:115.1,
        lat:21.1,
        initTime:'2018-12-25',
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
      this.searchData();
    },
    beforeDestroy() {

    },
    methods: {
      drawData(){
        console.log(this.initTime+' '+this.fcHour);
        const timeString = this.initTime+' '+this.fcHour;//'2017-08-22 12:00:00';
        let iTime = moment(timeString,'YYYY-MM-DD HH:mm:ss').add(8,'hours');
        this.speed.forEach(v=>v.time=moment(iTime).add(v.time,'hours').format('DD-HH'));
        const ySeries = this.speed.map(v=>v.speed);
        const xTime = this.speed.map(v=>v.time);
        const data = this.speed.map((v,i)=>[v.speed,v.time,v.rotation,i]);
        console.log('绘制');
        const myChart = echarts.init(document.getElementById('e-chart'));
        var option = {
            title: {
              text: '单点风速图',
              // left: 'center'
            },
            tooltip: {
              trigger: 'axis',
              
            },
            legend: {
                data:['风速']
            },
            xAxis: {
              type : 'category',
              data: xTime,
              boundaryGap : false,
              axisLine: {onZero: true},
            },
            yAxis: {
              type: 'value',
              axisLabel: {
                formatter: '{value} m/s'
              },
            },
            visualMap: {
            top: 10,
            right: 10,
            pieces: [{
                gt: 0,
                lt: 10.8,
                color: '#999',
                label: '6级以下',
            }, {
                gte: 10.8,
                lt: 17.2,
                color: '#096',
                label: '6-7级',
            }, {
                gte: 17.2,
                lt: 24.5,
                color: '#0000FF',
                label: '8-9级',
            }, {
                gte: 24.5,
                lt: 32.7,
                color: '#F0A425',
                label: '10-11级',
            },{
                gte: 32.7,
                lte: 61.2,
                color: '#C30E21',
                label: '12级及以上',
            },],
            outOfRange: {
                color: '#999'
            }
            },
            series: [{
              name: '风速',
              type: 'line',
              data: ySeries,
              markPoint: {
                data: [
                  {type: 'max', name: '最大值'},
                ]
              },
              markLine: {
                data: [
                  {
                    name:'6级',
                    yAxis: 10.8
                  },
                ],
              },
            },
            {
            type: 'custom',
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
          this.u10m = U;
          this.v10m = V;
          this.vis = VIS;
          this.t2m = T;
          this.drawData();
        })
        .catch(function (error) {
          console.log(error);
        });
      },
      changeDate(date){
        this.initTime = date;
        console.log(date);
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
        let data = this.v10m.map((v,i)=>{
          let u10 = this.u10m[i][0];
          let v10 = this.v10m[i][0];
          let iSpeed = Math.sqrt(Math.pow(u10,2)+Math.pow(v10,2));
          let iR = Math.sign(v10)*Math.acos(u10/iSpeed);
          let iknots = iSpeed * 1.944;
          let windDir = iR + Math.PI;
          if(windDir<0) winDir = winDir + windDir*2
          let wind10m = this.v10m[i][0];
          let waveFit = findWindWave(iknots);
          console.log(iknots);
          console.log(waveFit);
          //console.log(wind10m);
          let colo = {
            tableDate:this.v10m[i][1],
            dir:(windDir/Math.PI*180).toFixed(0),
            speed:iSpeed,
            iknots,
            knots:iknots.toFixed(0),
            ws50m:wind10m,
            wg100m:wind10m,
            ws100m:wind10m,
            hs:wind10m,
            hmax:wind10m,
            tp:wind10m,
            waveDir:wind10m,
            waveH:wind10m,
            waveT:wind10m,
            swellDir:wind10m,
            swellT:wind10m,
            t2m:this.t2m[i][0].toFixed(1),
            vis:this.vis[i][0],
          };
          // console.log(colo);
          return colo;
        }
        );
        return data.filter(v=>v.knots!==0);
      },
    },
  };
</script>
<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
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
</style>
