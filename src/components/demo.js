'ust strict'
export { getPie3D }

// 生成模拟 3D 饼图的配置项
function getPie3D(pieData, simple) {
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
  return Object.assign(option, simple)
}

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
