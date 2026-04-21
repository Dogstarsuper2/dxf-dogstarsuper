export default (type, value) => {
  switch (type) {
    case 5: {
      return {
        handle: value,
      }
    }
    case 6:
      return {
        lineTypeName: value,
      }
    case 8:
      return {
        layer: value,
      }
    case 48:
      return {
        lineTypeScale: value,
      }
    case 60:
      return {
        visible: value === 0,
      }
    case 62:
      return {
        colorNumber: value,
      }
    case 67:
      return value === 0
        ? {}
        : {
            paperSpace: value,
          }
    case 68:
      return {
        viewportOn: value,
      }
    case 69:
      return {
        viewport: value,
      }
    case 210:
      return {
        extrusionX: value,
      }
    case 220:
      return {
        extrusionY: value,
      }
    case 230:
      return {
        extrusionZ: value,
      }
    case 370:
      return {
        lineWeightEnum: value,
      }
    case 410:
      return {
        layout: value,
      }
    default:
      return {}
  }
}
