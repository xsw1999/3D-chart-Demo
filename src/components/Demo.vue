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
    selected:{
      data1:true,
      data2:true,
      data3:true
    }
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

// 生成模拟3d饼图的配置项
// 生成模拟 3D 饼图的配置项
function getPie3D(pieData) {
  let series = []
  let sumValue = 0
  let startValue = 0
  let endValue = 0
  let legendData = []

  // 为每一个饼图数据，生成一个 series-surface 配置
  for (let i = 0; i < pieData.length; i++) {
    if (!pieData[i].isShow) continue
    sumValue += pieData[i].value

    let seriesItem = {
      name:
        typeof pieData[i].name === 'undefined' ? `series${i}` : pieData[i].name,
      type: 'surface',
      parametric: true,
      wireframe: {
        show: false,
      },
      pieData: pieData[i],
      pieStatus: {
        selected: false,
        hovered: false,
      },
    }

    if (typeof pieData[i].itemStyle != 'undefined') {
      let itemStyle = {}

      typeof pieData[i].itemStyle.color != 'undefined'
        ? (itemStyle.color = pieData[i].itemStyle.color)
        : null
      typeof pieData[i].itemStyle.opacity != 'undefined'
        ? (itemStyle.opacity = pieData[i].itemStyle.opacity)
        : null

      seriesItem.itemStyle = itemStyle
    }
    series.push(seriesItem)
  }

  // 使用上一次遍历时，计算出的数据和 sumValue，调用 getParametricEquation 函数，
  // 向每个 series-surface 传入不同的参数方程 series-surface.parametricEquation，也就是实现每一个扇形。
  for (let i = 0; i < series.length; i++) {
    endValue = startValue + series[i].pieData.value

    series[i].pieData.startRatio = startValue / sumValue
    series[i].pieData.endRatio = endValue / sumValue
    series[i].parametricEquation = getParametricEquation(
      series[i].pieData.startRatio,
      series[i].pieData.endRatio
    )

    startValue = endValue

    legendData.push(series[i].name)
  }

  // 准备待返回的配置项，把准备好的 legendData、series 传入。
  let option = {
    //animation: false,
    legend: {
      data: legendData,
    },
    tooltip: {
      formatter: params => {
        if (params.seriesName !== 'mouseoutSeries') {
          return `${
            params.seriesName
          }<br/><span style="display:inline-block;margin-right:5px;border-radius:10px;width:10px;height:10px;background-color:${
            params.color
          };"></span>${option.series[params.seriesIndex].pieData.value}`
        }
      },
      axisPointer: {
        type: 'none',
      },
    },
    series: series,
  }
  return Object.assign(option, simple.value)
}

// 渲染echarts图
const initEcharts = () => {
  if (!myChart) myChart = echarts.init(pieChart.value)
  let option = getPie3D(data.value)
  myChart.on('legendselectchanged', function (obj) {
    if (!loading.value) {
      data.value.filter(i => i.name === obj.name)[0].isShow =
        !data.value.filter(i => i.name === obj.name)[0].isShow
      simple.value.legend.selected[obj.name] = !simple.value.legend.selected[obj.name]
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

// 生成扇形的曲面参数方程，
// 生成扇形的曲面参数方程，用于 series-surface.parametricEquation
function getParametricEquation(startRatio, endRatio) {
  let tmp
  // 计算
  let midRatio = (startRatio + endRatio) / 2

  let startRadian = startRatio * Math.PI * 2
  let endRadian = endRatio * Math.PI * 2
  let midRadian = midRatio * Math.PI * 2

  //  x 轴、y 轴方向上的位移
  let offsetX = 0
  let offsetY = 0

  // 放大比例
  let hoverRate = 1

  // 返回曲面参数方程
  return {
    u: {
      min: 0,
      max: Math.PI * 2,
      step: Math.PI * 0.0025,
    },
    v: {
      min: 0,
      max: Math.PI,
      step: Math.PI * 0.03,
    },
    x: function (u, v) {
      if (midRatio - 0.5 < 0) {
        if (u < startRadian || u > midRadian + Math.PI) {
          tmp =
            u - Math.PI - midRadian < 0
              ? u + Math.PI - midRadian
              : u - Math.PI - midRadian
          return (
            offsetX +
            ((Math.sin(startRadian) * tmp) /
              (Math.PI - midRadian + startRadian)) *
              hoverRate
          )
        }
        if (u > endRadian && u < midRadian + Math.PI) {
          tmp = midRadian + Math.PI - u
          return (
            offsetX +
            ((Math.sin(endRadian) * tmp) /
              (Math.PI - midRadian + startRadian)) *
              hoverRate
          )
        }
      } else {
        if (u < startRadian && u > midRadian - Math.PI) {
          tmp = u + Math.PI - midRadian
          return (
            offsetX +
            ((Math.sin(startRadian) * tmp) /
              (Math.PI - midRadian + startRadian)) *
              hoverRate
          )
        }
        if (u > endRadian || u < midRadian - Math.PI) {
          tmp =
            midRadian - Math.PI - u < 0
              ? midRadian + Math.PI - u
              : midRadian - Math.PI - u
          return (
            offsetX +
            ((Math.sin(endRadian) * tmp) /
              (Math.PI - midRadian + startRadian)) *
              hoverRate
          )
        }
      }
      return offsetX + Math.sin(v) * Math.sin(u) * hoverRate
    },

    y: function (u, v) {
      if (midRatio - 0.5 < 0) {
        if (u < startRadian || u > midRadian + Math.PI) {
          tmp =
            u - Math.PI - midRadian < 0
              ? u + Math.PI - midRadian
              : u - Math.PI - midRadian
          return (
            offsetY +
            ((Math.cos(startRadian) * tmp) /
              (Math.PI - midRadian + startRadian)) *
              hoverRate
          )
        }
        if (u > endRadian && u < midRadian + Math.PI) {
          tmp = midRadian + Math.PI - u
          return (
            offsetY +
            ((Math.cos(endRadian) * tmp) /
              (Math.PI - midRadian + startRadian)) *
              hoverRate
          )
        }
      } else {
        if (u < startRadian && u > midRadian - Math.PI) {
          tmp = u + Math.PI - midRadian
          return (
            offsetY +
            ((Math.cos(startRadian) * tmp) /
              (Math.PI - midRadian + startRadian)) *
              hoverRate
          )
        }
        if (u > endRadian || u < midRadian - Math.PI) {
          tmp =
            midRadian - Math.PI - u < 0
              ? midRadian + Math.PI - u
              : midRadian - Math.PI - u
          return (
            offsetY +
            ((Math.cos(endRadian) * tmp) /
              (Math.PI - midRadian + startRadian)) *
              hoverRate
          )
        }
      }
      return offsetY + Math.sin(v) * Math.cos(u) * hoverRate
    },

    z: function (u, v) {
      return Math.cos(v) > 0 ? 0.1 : -0.1
    },
  }
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
