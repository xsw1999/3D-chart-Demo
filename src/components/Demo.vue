<template>
  <div class="chart-wrapper">
    <div ref="pieChart" id="myChart"></div>
  </div>
  <div v-for="(i, v) in data" :key="v">
    <input type="text" v-model="i.name" disabled />：
    <input type="number" v-model="i.value" />
    颜色：
    <input type="text" v-model="i.itemStyle.color" />
    透明度：
    <input type="number" v-model="i.itemStyle.opacity" />
    <button
      @click="add"
      v-if="v === data.length - 1"
      style="position: absolute; padding: 0px 10px; margin-left: 10px"
    >
      add
    </button>
  </div>
  <br />
  x轴长度：<input type="number" v-model="simple.grid3D.boxWidth" />
  y轴长度：<input type="number" v-model="simple.grid3D.boxDepth" />
  z轴高度：<input type="number" v-model="simple.grid3D.boxHeight" />
  光照颜色：<input type="text" v-model="simple.grid3D.light.main.color" /><br />
  显示坐标轴：<button @click="back(simple.grid3D, 'show')">
    {{ simple.grid3D.show }}
  </button>
  允许缩放：<button @click="back(simple.grid3D.viewControl, 'zoomSensitivity')">
    {{ simple.grid3D.viewControl.zoomSensitivity }}
  </button>
  允许拖拽：<button
    @click="back(simple.grid3D.viewControl, 'rotateSensitivity')"
  >
    {{ simple.grid3D.viewControl.rotateSensitivity }}
  </button>
  <br /><button @click="change" style="color: steelblue">加载配置</button
  ><button @click="exportPng">导出图片</button>
</template>

<script setup>
import { inject, ref, onMounted, nextTick } from 'vue'
import { getPie3D } from './demo.js'
let data = ref([
  {
    name: 'data1',
    value: 10,
    isShow: true,
    color: 'black',
    itemStyle: {
      opacity: 1,
      color: '#1B90FB',
    },
  },
  {
    name: 'data2',
    isShow: true,
    value: 20,
    itemStyle: {
      opacity: 1,
      color: '#2CCD7F',
    },
  },
  {
    name: 'data3',
    isShow: true,
    value: 30,
    itemStyle: {
      opacity: 1,
      color: '#D2D700',
    },
  },
])
let simple = ref({
  legend: {
    icon: 'circle',
    top: '3%',
    textStyle: {
      //文字样式
      color: 'black',
      fontSize: '12',
    },
    selected: {
      data1: true,
      data2: true,
      data3: true,
    },
  },
  xAxis3D: {
    name: 'X', // 坐标轴名称
    min: -1,
    max: 1,
  },
  yAxis3D: {
    name: 'Y',
    min: -1,
    max: 1,
  },
  zAxis3D: {
    name: 'Z',
    min: -1,
    max: 1,
  },
  grid3D: {
    show: true,
    boxHeight: 100,
    boxDepth: 100,
    boxWidth: 100,
    viewControl: {
      rotateSensitivity: true,
      zoomSensitivity: true,
    },
    axisLine: {
      show: true, //该参数需设为true
      // interval:200,//x,y坐标轴刻度标签的显示间隔，在类目轴中有效。
    },
    light: {
      main: {
        color: 'white',
      },
    },
  },
})
let myChart
let pieChart = ref(null)
let echarts = inject('ec')
let colors = ref([
  '#FBCB0A',
  '#C70A80',
  '#590696',
  '#37E2D5',
  '#94B3FD',
  '#49FF00',
])
let loading = ref(false)
onMounted(() => {
  initEcharts()
  window.addEventListener('resize', resize)
})

const resize = () => {
  if (myChart) {
    myChart.resize()
  }
}

const exportPng = () => {
  const base64Code = myChart.getDataURL('png')
  const a = document.createElement('a')
  a.href = base64Code
  a.setAttribute('download', 'demo')
  a.click()
}

const back = (obj, ele) => {
  if (!obj) return
  obj[ele] = !obj[ele]
}

const change = () => {
  // 虽然在代码中自定义了参数 isShow 控制图例对应的数据是否展示，但是E charts还是修改了原数据的 legend.selected 内的图例字段，所以当数据有变化时候需要手动将图例显示出来
  data.value.forEach(i => {
    i.isShow = true
    simple.value.legend.selected[i.name] = true
  })
  myChart = null
  initEcharts()
}

const add = () => {
  data.value.push({
    name: `data${data.value.length + 1}`,
    value: 10,
    isShow: true,
    itemStyle: {
      opacity: 1,
      color: `${colors.value[Math.floor(Math.random() * 6)]}`,
    },
  })
  simple.value.legend.selected[`data${data.value.length + 1}`] = true
}

// 渲染echarts图
const initEcharts = () => {
  if (!myChart) myChart = echarts.init(pieChart.value)
  let option = getPie3D(data.value, simple.value)
  myChart.on('legendselectchanged', function (obj) {
    if (!loading.value) {
      data.value.filter(i => i.name === obj.name)[0].isShow =
        !data.value.filter(i => i.name === obj.name)[0].isShow
      simple.value.legend.selected[obj.name] =
        !simple.value.legend.selected[obj.name]
      initEcharts()
    }
    loading.value = true
    setTimeout(() => {
      loading.value = false
    }, 0)
  })
  myChart.setOption(option)
  myChart.resize()
}
</script>

<style scoped>
.chart-wrapper {
  width: 800px;
  height: 400px;
  border: 2px solid gray;
}
#myChart {
  width: 100%;
  height: 100%;
}
button {
  border: 1px solid rgb(221, 220, 220);
  padding: 5px 10px;
  margin: 2px;
}
</style>
