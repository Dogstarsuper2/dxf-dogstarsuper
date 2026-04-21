import { Box2 } from 'vecks'

import entityToPolyline from './entityToPolyline'
import denormalise from './denormalise'
import getRGBForEntity from './getRGBForEntity'
import logger from './util/logger'
import rotate from './util/rotate'
import rgbToColorAttribute from './util/rgbToColorAttribute'
import toPiecewiseBezier, { multiplicity } from './util/toPiecewiseBezier'
import transformBoundingBoxAndElement from './util/transformBoundingBoxAndElement'

const DEFAULT_OPTIONS = {
  scale: undefined,
  layers: null,
  fitToContent: true,
  padding: 0,
  useSourceLineweight: true,
  defaultStrokeWidth: 1,
}

const INSUNITS_TO_MM = {
  1: 25.4,
  2: 304.8,
  4: 1,
  5: 10,
  6: 1000,
  7: 1000000,
  8: 0.0000254,
  9: 0.0254,
  10: 914.4,
  13: 0.001,
  14: 100,
  15: 10000,
  16: 100000,
  17: 1000000000000,
  20: 30856775814913673000,
}

const addFlipXIfApplicable = (entity, { bbox, element }) => {
  if (entity.extrusionZ === -1) {
    return {
      bbox: new Box2()
        .expandByPoint({ x: -bbox.min.x, y: bbox.min.y })
        .expandByPoint({ x: -bbox.max.x, y: bbox.max.y }),
      element: `<g transform="matrix(-1 0 0 1 0 0)">${element}</g>`,
    }
  }
  return { bbox, element }
}

const polyline = (entity) => {
  const vertices = entityToPolyline(entity)
  const bbox = vertices.reduce(
    (acc, [x, y]) => acc.expandByPoint({ x, y }),
    new Box2(),
  )
  const d = vertices.reduce((acc, point, i) => {
    acc += i === 0 ? 'M' : 'L'
    acc += point[0] + ',' + point[1]
    return acc
  }, '')
  return transformBoundingBoxAndElement(
    bbox,
    `<path d="${d}" />`,
    entity.transforms,
  )
}

const lwpolyline = (entity) => {
  const vertices = entityToPolyline(entity)
  const bbox0 = vertices.reduce(
    (acc, [x, y]) => acc.expandByPoint({ x, y }),
    new Box2(),
  )
  const d = vertices.reduce((acc, point, i) => {
    acc += i === 0 ? 'M' : 'L'
    acc += point[0] + ',' + point[1]
    return acc
  }, '')
  const element0 = `<path d="${d}" />`
  const { bbox, element } = addFlipXIfApplicable(entity, {
    bbox: bbox0,
    element: element0,
  })
  return transformBoundingBoxAndElement(bbox, element, entity.transforms)
}

const circle = (entity) => {
  const bbox0 = new Box2()
    .expandByPoint({ x: entity.x + entity.r, y: entity.y + entity.r })
    .expandByPoint({ x: entity.x - entity.r, y: entity.y - entity.r })
  const element0 = `<circle cx="${entity.x}" cy="${entity.y}" r="${entity.r}" />`
  const { bbox, element } = addFlipXIfApplicable(entity, {
    bbox: bbox0,
    element: element0,
  })
  return transformBoundingBoxAndElement(bbox, element, entity.transforms)
}

const ellipseOrArc = (
  cx,
  cy,
  majorX,
  majorY,
  axisRatio,
  startAngle,
  endAngle,
  flipX,
) => {
  const rx = Math.sqrt(majorX * majorX + majorY * majorY)
  const ry = axisRatio * rx
  const rotationAngle = -Math.atan2(-majorY, majorX)
  const bbox = bboxEllipseOrArc(
    cx,
    cy,
    majorX,
    majorY,
    axisRatio,
    startAngle,
    endAngle,
    flipX,
  )

  if (
    Math.abs(startAngle - endAngle) < 1e-9 ||
    Math.abs(startAngle - endAngle + Math.PI * 2) < 1e-9
  ) {
    const element = `<g transform="rotate(${(rotationAngle / Math.PI) * 180} ${cx}, ${cy})"><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" /></g>`
    return { bbox, element }
  }

  const startOffset = rotate(
    { x: Math.cos(startAngle) * rx, y: Math.sin(startAngle) * ry },
    rotationAngle,
  )
  const startPoint = { x: cx + startOffset.x, y: cy + startOffset.y }
  const endOffset = rotate(
    { x: Math.cos(endAngle) * rx, y: Math.sin(endAngle) * ry },
    rotationAngle,
  )
  const endPoint = { x: cx + endOffset.x, y: cy + endOffset.y }
  const adjustedEndAngle = endAngle < startAngle ? endAngle + Math.PI * 2 : endAngle
  const largeArcFlag = adjustedEndAngle - startAngle < Math.PI ? 0 : 1
  const d = `M ${startPoint.x} ${startPoint.y} A ${rx} ${ry} ${(rotationAngle / Math.PI) * 180} ${largeArcFlag} 1 ${endPoint.x} ${endPoint.y}`
  return { bbox, element: `<path d="${d}" />` }
}

const bboxEllipseOrArc = (
  cx,
  cy,
  majorX,
  majorY,
  axisRatio,
  startAngle,
  endAngle,
  flipX,
) => {
  while (startAngle < 0) startAngle += Math.PI * 2
  while (endAngle <= startAngle) endAngle += Math.PI * 2

  const angles = []
  if (Math.abs(majorX) < 1e-12 || Math.abs(majorY) < 1e-12) {
    for (let i = 0; i < 4; i++) {
      angles.push((i / 2) * Math.PI)
    }
  } else {
    angles[0] = Math.atan((-majorY * axisRatio) / majorX) - Math.PI
    angles[1] = Math.atan((majorX * axisRatio) / majorY) - Math.PI
    angles[2] = angles[0] - Math.PI
    angles[3] = angles[1] - Math.PI
  }

  for (let i = 4; i >= 0; i--) {
    while (angles[i] < startAngle) angles[i] += Math.PI * 2
    if (angles[i] > endAngle) {
      angles.splice(i, 1)
    }
  }

  angles.push(startAngle)
  angles.push(endAngle)

  const pts = angles.map((a) => ({ x: Math.cos(a), y: Math.sin(a) }))
  const matrix = [
    [majorX, -majorY * axisRatio],
    [majorY, majorX * axisRatio],
  ]

  return pts
    .map((p) => ({
      x: p.x * matrix[0][0] + p.y * matrix[0][1] + cx,
      y: p.x * matrix[1][0] + p.y * matrix[1][1] + cy,
    }))
    .reduce((acc, p) => acc.expandByPoint(p), new Box2())
}

const ellipse = (entity) => {
  const { bbox: bbox0, element: element0 } = ellipseOrArc(
    entity.x,
    entity.y,
    entity.majorX,
    entity.majorY,
    entity.axisRatio,
    entity.startAngle,
    entity.endAngle,
  )
  const { bbox, element } = addFlipXIfApplicable(entity, {
    bbox: bbox0,
    element: element0,
  })
  return transformBoundingBoxAndElement(bbox, element, entity.transforms)
}

const arc = (entity) => {
  const { bbox: bbox0, element: element0 } = ellipseOrArc(
    entity.x,
    entity.y,
    entity.r,
    0,
    1,
    entity.startAngle,
    entity.endAngle,
    entity.extrusionZ === -1,
  )
  const { bbox, element } = addFlipXIfApplicable(entity, {
    bbox: bbox0,
    element: element0,
  })
  return transformBoundingBoxAndElement(bbox, element, entity.transforms)
}

export const piecewiseToPaths = (k, knots, controlPoints) => {
  const paths = []
  let controlPointIndex = 0
  let knotIndex = k
  while (knotIndex < knots.length - k + 1) {
    const m = multiplicity(knots, knotIndex)
    const cp = controlPoints.slice(controlPointIndex, controlPointIndex + k)
    if (k === 4) {
      paths.push(
        `<path d="M ${cp[0].x} ${cp[0].y} C ${cp[1].x} ${cp[1].y} ${cp[2].x} ${cp[2].y} ${cp[3].x} ${cp[3].y}" />`,
      )
    } else if (k === 3) {
      paths.push(
        `<path d="M ${cp[0].x} ${cp[0].y} Q ${cp[1].x} ${cp[1].y} ${cp[2].x} ${cp[2].y}" />`,
      )
    }
    controlPointIndex += m
    knotIndex += m
  }
  return paths
}

const bezier = (entity) => {
  let bbox = new Box2()
  entity.controlPoints.forEach((p) => {
    bbox = bbox.expandByPoint(p)
  })
  const k = entity.degree + 1
  const piecewise = toPiecewiseBezier(k, entity.controlPoints, entity.knots)
  const paths = piecewiseToPaths(k, piecewise.knots, piecewise.controlPoints)
  return transformBoundingBoxAndElement(bbox, `<g>${paths.join('')}</g>`, entity.transforms)
}

const entityToBoundsAndElement = (entity) => {
  switch (entity.type) {
    case 'CIRCLE':
      return circle(entity)
    case 'ELLIPSE':
      return ellipse(entity)
    case 'ARC':
      return arc(entity)
    case 'SPLINE': {
      const hasWeights = entity.weights && entity.weights.some((w) => w !== 1)
      if ((entity.degree === 2 || entity.degree === 3) && !hasWeights) {
        try {
          return bezier(entity)
        } catch (err) {
          return polyline(entity)
        }
      }
      return polyline(entity)
    }
    case 'LINE':
    case 'POLYLINE':
      return polyline(entity)
    case 'LWPOLYLINE':
      return lwpolyline(entity)
    default:
      logger.warn('entity type not supported in SVG rendering:', entity.type)
      return null
  }
}

const normalizePadding = (padding) => {
  if (typeof padding === 'number') {
    return { top: padding, right: padding, bottom: padding, left: padding }
  }
  return {
    top: Number(padding?.top || 0),
    right: Number(padding?.right || 0),
    bottom: Number(padding?.bottom || 0),
    left: Number(padding?.left || 0),
  }
}

const normalizeOptions = (options = {}) => ({
  ...DEFAULT_OPTIONS,
  ...options,
  scale: options.scale === undefined ? undefined : Number(options.scale),
  padding: normalizePadding(options.padding ?? DEFAULT_OPTIONS.padding),
})

const hasValidBounds = (bbox) => bbox && bbox.valid && Number.isFinite(bbox.min.x)

const headerBounds = (parsed) => {
  const extMin = parsed?.header?.extMin
  const extMax = parsed?.header?.extMax
  if (!extMin || !extMax) {
    return null
  }
  const bbox = new Box2()
  bbox.expandByPoint({ x: extMin.x, y: extMin.y })
  bbox.expandByPoint({ x: extMax.x, y: extMax.y })
  return hasValidBounds(bbox) ? bbox : null
}

const filterEntitiesByLayers = (entities, layers) => {
  if (!Array.isArray(layers) || layers.length === 0) {
    return entities
  }
  const allowed = new Set(layers)
  return entities.filter((entity) => allowed.has(entity.layer))
}

const drawingUnitsPerMillimeter = (parsed) => {
  const insUnits = parsed?.header?.insUnits
  const millimetersPerUnit = INSUNITS_TO_MM[insUnits]
  if (!millimetersPerUnit) {
    return null
  }
  return 1 / millimetersPerUnit
}

const resolveStrokeWidth = (parsed, entity, options) => {
  if (options.useSourceLineweight) {
    if (typeof entity.constantWidth === 'number' && entity.constantWidth > 0) {
      return entity.constantWidth
    }

    const layerTable = parsed?.tables?.layers?.[entity.layer]
    const lineWeightEnum = entity.lineWeightEnum > 0 ? entity.lineWeightEnum : layerTable?.lineWeightEnum
    const unitsPerMillimeter = drawingUnitsPerMillimeter(parsed)
    if (lineWeightEnum > 0 && unitsPerMillimeter) {
      return (lineWeightEnum / 100) * unitsPerMillimeter
    }
  }

  return Number(options.defaultStrokeWidth) || 1
}

const makeStyleWrapper = (parsed, entity, options, element) => {
  const rgb = getRGBForEntity(parsed.tables.layers, entity)
  const stroke = rgbToColorAttribute(rgb)
  const strokeWidth = resolveStrokeWidth(parsed, entity, options)
  return `<g stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linejoin="round" stroke-linecap="round" data-layer="${entity.layer || ''}">${element}</g>`
}

export default (parsed, options = {}) => {
  const resolvedOptions = normalizeOptions(options)
  const denormalisedEntities = denormalise(parsed)
  const entities = filterEntitiesByLayers(denormalisedEntities, resolvedOptions.layers)
  const renderBounds = []
  const elements = []

  entities.forEach((entity) => {
    if (entity.visible === false) {
      return
    }

    const boundsAndElement = entityToBoundsAndElement(entity)
    if (!boundsAndElement) {
      return
    }

    const { bbox, element } = boundsAndElement
    if (hasValidBounds(bbox)) {
      renderBounds.push(bbox)
    }
    elements.push(makeStyleWrapper(parsed, entity, resolvedOptions, element))
  })

  const contentBBox = renderBounds.reduce((acc, bbox) => {
    acc.expandByPoint(bbox.min)
    acc.expandByPoint(bbox.max)
    return acc
  }, new Box2())

  const baseBBox = resolvedOptions.fitToContent || !hasValidBounds(headerBounds(parsed))
    ? contentBBox
    : headerBounds(parsed)

  const bbox = hasValidBounds(baseBBox) ? baseBBox : new Box2()
  const { top, right, bottom, left } = resolvedOptions.padding
  const minX = bbox.valid ? bbox.min.x - left : 0
  const maxX = bbox.valid ? bbox.max.x + right : 0
  const minY = bbox.valid ? bbox.min.y - bottom : 0
  const maxY = bbox.valid ? bbox.max.y + top : 0
  const widthUnits = Math.max(maxX - minX, 0)
  const heightUnits = Math.max(maxY - minY, 0)
  const width = widthUnits * resolvedOptions.scale
  const height = heightUnits * resolvedOptions.scale

  return `<?xml version="1.0"?>
<svg
  xmlns="http://www.w3.org/2000/svg"
  xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1"
  preserveAspectRatio="xMinYMin meet"
  viewBox="${minX} ${-maxY} ${widthUnits} ${heightUnits}"
  width="${svgWidth}" height="${svgHeight}"
>
  <g fill="none" transform="matrix(1,0,0,-1,0,0)">
    ${elements.join('\n')}
  </g>
</svg>`
}

