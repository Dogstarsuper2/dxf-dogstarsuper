"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.piecewiseToPaths = exports["default"] = void 0;
var _vecks = require("vecks");
var _entityToPolyline = _interopRequireDefault(require("./entityToPolyline"));
var _denormalise = _interopRequireDefault(require("./denormalise"));
var _getRGBForEntity = _interopRequireDefault(require("./getRGBForEntity"));
var _logger = _interopRequireDefault(require("./util/logger"));
var _rotate = _interopRequireDefault(require("./util/rotate"));
var _rgbToColorAttribute = _interopRequireDefault(require("./util/rgbToColorAttribute"));
var _toPiecewiseBezier = _interopRequireWildcard(require("./util/toPiecewiseBezier"));
var _transformBoundingBoxAndElement = _interopRequireDefault(require("./util/transformBoundingBoxAndElement"));
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { "default": e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && {}.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n["default"] = e, t && t.set(e, n), n; }
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
var DEFAULT_OPTIONS = {
  scale: undefined,
  layers: null,
  fitToContent: true,
  padding: 0,
  useSourceLineweight: true,
  defaultStrokeWidth: 1
};
var INSUNITS_TO_MM = {
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
  20: 30856775814913673000
};
var addFlipXIfApplicable = function addFlipXIfApplicable(entity, _ref) {
  var bbox = _ref.bbox,
    element = _ref.element;
  if (entity.extrusionZ === -1) {
    return {
      bbox: new _vecks.Box2().expandByPoint({ x: -bbox.min.x, y: bbox.min.y }).expandByPoint({ x: -bbox.max.x, y: bbox.max.y }),
      element: "<g transform=\"matrix(-1 0 0 1 0 0)\">".concat(element, "</g>")
    };
  }
  return { bbox: bbox, element: element };
};
var polyline = function polyline(entity) {
  var vertices = (0, _entityToPolyline["default"])(entity);
  var bbox = vertices.reduce(function (acc, _ref2) {
    var _ref3 = _slicedToArray(_ref2, 2), x = _ref3[0], y = _ref3[1];
    return acc.expandByPoint({ x: x, y: y });
  }, new _vecks.Box2());
  var d = vertices.reduce(function (acc, point, i) {
    acc += i === 0 ? 'M' : 'L';
    acc += point[0] + ',' + point[1];
    return acc;
  }, '');
  return (0, _transformBoundingBoxAndElement["default"])(bbox, "<path d=\"".concat(d, "\" />"), entity.transforms);
};
var lwpolyline = function lwpolyline(entity) {
  var vertices = (0, _entityToPolyline["default"])(entity);
  var bbox0 = vertices.reduce(function (acc, _ref4) {
    var _ref5 = _slicedToArray(_ref4, 2), x = _ref5[0], y = _ref5[1];
    return acc.expandByPoint({ x: x, y: y });
  }, new _vecks.Box2());
  var d = vertices.reduce(function (acc, point, i) {
    acc += i === 0 ? 'M' : 'L';
    acc += point[0] + ',' + point[1];
    return acc;
  }, '');
  var element0 = "<path d=\"".concat(d, "\" />");
  var _addFlipXIfApplicable = addFlipXIfApplicable(entity, { bbox: bbox0, element: element0 }), bbox = _addFlipXIfApplicable.bbox, element = _addFlipXIfApplicable.element;
  return (0, _transformBoundingBoxAndElement["default"])(bbox, element, entity.transforms);
};
var circle = function circle(entity) {
  var bbox0 = new _vecks.Box2().expandByPoint({ x: entity.x + entity.r, y: entity.y + entity.r }).expandByPoint({ x: entity.x - entity.r, y: entity.y - entity.r });
  var element0 = "<circle cx=\"".concat(entity.x, "\" cy=\"").concat(entity.y, "\" r=\"").concat(entity.r, "\" />");
  var _addFlipXIfApplicable2 = addFlipXIfApplicable(entity, { bbox: bbox0, element: element0 }), bbox = _addFlipXIfApplicable2.bbox, element = _addFlipXIfApplicable2.element;
  return (0, _transformBoundingBoxAndElement["default"])(bbox, element, entity.transforms);
};
var ellipseOrArc = function ellipseOrArc(cx, cy, majorX, majorY, axisRatio, startAngle, endAngle, flipX) {
  var rx = Math.sqrt(majorX * majorX + majorY * majorY);
  var ry = axisRatio * rx;
  var rotationAngle = -Math.atan2(-majorY, majorX);
  var bbox = bboxEllipseOrArc(cx, cy, majorX, majorY, axisRatio, startAngle, endAngle, flipX);
  if (Math.abs(startAngle - endAngle) < 1e-9 || Math.abs(startAngle - endAngle + Math.PI * 2) < 1e-9) {
    return {
      bbox: bbox,
      element: "<g transform=\"rotate(".concat(rotationAngle / Math.PI * 180, " ").concat(cx, ", ").concat(cy, ")\"><ellipse cx=\"").concat(cx, "\" cy=\"").concat(cy, "\" rx=\"").concat(rx, "\" ry=\"").concat(ry, "\" /></g>")
    };
  }
  var startOffset = (0, _rotate["default"])({ x: Math.cos(startAngle) * rx, y: Math.sin(startAngle) * ry }, rotationAngle);
  var startPoint = { x: cx + startOffset.x, y: cy + startOffset.y };
  var endOffset = (0, _rotate["default"])({ x: Math.cos(endAngle) * rx, y: Math.sin(endAngle) * ry }, rotationAngle);
  var endPoint = { x: cx + endOffset.x, y: cy + endOffset.y };
  var adjustedEndAngle = endAngle < startAngle ? endAngle + Math.PI * 2 : endAngle;
  var largeArcFlag = adjustedEndAngle - startAngle < Math.PI ? 0 : 1;
  var d = "M ".concat(startPoint.x, " ").concat(startPoint.y, " A ").concat(rx, " ").concat(ry, " ").concat(rotationAngle / Math.PI * 180, " ").concat(largeArcFlag, " 1 ").concat(endPoint.x, " ").concat(endPoint.y);
  return { bbox: bbox, element: "<path d=\"".concat(d, "\" />") };
};
var bboxEllipseOrArc = function bboxEllipseOrArc(cx, cy, majorX, majorY, axisRatio, startAngle, endAngle, flipX) {
  while (startAngle < 0) startAngle += Math.PI * 2;
  while (endAngle <= startAngle) endAngle += Math.PI * 2;
  var angles = [];
  if (Math.abs(majorX) < 1e-12 || Math.abs(majorY) < 1e-12) {
    for (var i = 0; i < 4; i++) {
      angles.push(i / 2 * Math.PI);
    }
  } else {
    angles[0] = Math.atan(-majorY * axisRatio / majorX) - Math.PI;
    angles[1] = Math.atan(majorX * axisRatio / majorY) - Math.PI;
    angles[2] = angles[0] - Math.PI;
    angles[3] = angles[1] - Math.PI;
  }
  for (var _i = 4; _i >= 0; _i--) {
    while (angles[_i] < startAngle) angles[_i] += Math.PI * 2;
    if (angles[_i] > endAngle) {
      angles.splice(_i, 1);
    }
  }
  angles.push(startAngle);
  angles.push(endAngle);
  var pts = angles.map(function (a) { return { x: Math.cos(a), y: Math.sin(a) }; });
  var matrix = [[majorX, -majorY * axisRatio], [majorY, majorX * axisRatio]];
  return pts.map(function (p) {
    return {
      x: p.x * matrix[0][0] + p.y * matrix[0][1] + cx,
      y: p.x * matrix[1][0] + p.y * matrix[1][1] + cy
    };
  }).reduce(function (acc, p) { return acc.expandByPoint(p); }, new _vecks.Box2());
};
var ellipse = function ellipse(entity) {
  var _ellipseOrArc = ellipseOrArc(entity.x, entity.y, entity.majorX, entity.majorY, entity.axisRatio, entity.startAngle, entity.endAngle), bbox0 = _ellipseOrArc.bbox, element0 = _ellipseOrArc.element;
  var _addFlipXIfApplicable3 = addFlipXIfApplicable(entity, { bbox: bbox0, element: element0 }), bbox = _addFlipXIfApplicable3.bbox, element = _addFlipXIfApplicable3.element;
  return (0, _transformBoundingBoxAndElement["default"])(bbox, element, entity.transforms);
};
var arc = function arc(entity) {
  var _ellipseOrArc2 = ellipseOrArc(entity.x, entity.y, entity.r, 0, 1, entity.startAngle, entity.endAngle, entity.extrusionZ === -1), bbox0 = _ellipseOrArc2.bbox, element0 = _ellipseOrArc2.element;
  var _addFlipXIfApplicable4 = addFlipXIfApplicable(entity, { bbox: bbox0, element: element0 }), bbox = _addFlipXIfApplicable4.bbox, element = _addFlipXIfApplicable4.element;
  return (0, _transformBoundingBoxAndElement["default"])(bbox, element, entity.transforms);
};
var piecewiseToPaths = exports.piecewiseToPaths = function piecewiseToPaths(k, knots, controlPoints) {
  var paths = [];
  var controlPointIndex = 0;
  var knotIndex = k;
  while (knotIndex < knots.length - k + 1) {
    var m = (0, _toPiecewiseBezier.multiplicity)(knots, knotIndex);
    var cp = controlPoints.slice(controlPointIndex, controlPointIndex + k);
    if (k === 4) {
      paths.push("<path d=\"M ".concat(cp[0].x, " ").concat(cp[0].y, " C ").concat(cp[1].x, " ").concat(cp[1].y, " ").concat(cp[2].x, " ").concat(cp[2].y, " ").concat(cp[3].x, " ").concat(cp[3].y, "\" />"));
    } else if (k === 3) {
      paths.push("<path d=\"M ".concat(cp[0].x, " ").concat(cp[0].y, " Q ").concat(cp[1].x, " ").concat(cp[1].y, " ").concat(cp[2].x, " ").concat(cp[2].y, "\" />"));
    }
    controlPointIndex += m;
    knotIndex += m;
  }
  return paths;
};
var bezier = function bezier(entity) {
  var bbox = new _vecks.Box2();
  entity.controlPoints.forEach(function (p) { bbox = bbox.expandByPoint(p); });
  var k = entity.degree + 1;
  var piecewise = (0, _toPiecewiseBezier["default"])(k, entity.controlPoints, entity.knots);
  var paths = piecewiseToPaths(k, piecewise.knots, piecewise.controlPoints);
  return (0, _transformBoundingBoxAndElement["default"])(bbox, "<g>".concat(paths.join(''), "</g>"), entity.transforms);
};
var entityToBoundsAndElement = function entityToBoundsAndElement(entity) {
  switch (entity.type) {
    case 'CIRCLE':
      return circle(entity);
    case 'ELLIPSE':
      return ellipse(entity);
    case 'ARC':
      return arc(entity);
    case 'SPLINE':
      {
        var hasWeights = entity.weights && entity.weights.some(function (w) { return w !== 1; });
        if ((entity.degree === 2 || entity.degree === 3) && !hasWeights) {
          try { return bezier(entity); } catch (err) { return polyline(entity); }
        }
        return polyline(entity);
      }
    case 'LINE':
    case 'POLYLINE':
      return polyline(entity);
    case 'LWPOLYLINE':
      return lwpolyline(entity);
    default:
      _logger["default"].warn('entity type not supported in SVG rendering:', entity.type);
      return null;
  }
};
var normalizePadding = function normalizePadding(padding) {
  if (typeof padding === 'number') {
    return { top: padding, right: padding, bottom: padding, left: padding };
  }
  return {
    top: Number((padding === null || padding === void 0 ? void 0 : padding.top) || 0),
    right: Number((padding === null || padding === void 0 ? void 0 : padding.right) || 0),
    bottom: Number((padding === null || padding === void 0 ? void 0 : padding.bottom) || 0),
    left: Number((padding === null || padding === void 0 ? void 0 : padding.left) || 0)
  };
};
var normalizeOptions = function normalizeOptions() {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  return Object.assign({}, DEFAULT_OPTIONS, options, {
    scale: options.scale === undefined ? undefined : Number(options.scale),
    padding: normalizePadding(options.padding !== undefined ? options.padding : DEFAULT_OPTIONS.padding)
  });
};
var hasValidBounds = function hasValidBounds(bbox) {
  return bbox && bbox.valid && Number.isFinite(bbox.min.x);
};
var headerBounds = function headerBounds(parsed) {
  var extMin = parsed && parsed.header && parsed.header.extMin;
  var extMax = parsed && parsed.header && parsed.header.extMax;
  if (!extMin || !extMax) {
    return null;
  }
  var bbox = new _vecks.Box2();
  bbox.expandByPoint({ x: extMin.x, y: extMin.y });
  bbox.expandByPoint({ x: extMax.x, y: extMax.y });
  return hasValidBounds(bbox) ? bbox : null;
};
var filterEntitiesByLayers = function filterEntitiesByLayers(entities, layers) {
  if (!Array.isArray(layers) || layers.length === 0) {
    return entities;
  }
  var allowed = new Set(layers);
  return entities.filter(function (entity) { return allowed.has(entity.layer); });
};
var drawingUnitsPerMillimeter = function drawingUnitsPerMillimeter(parsed) {
  var insUnits = parsed && parsed.header && parsed.header.insUnits;
  var millimetersPerUnit = INSUNITS_TO_MM[insUnits];
  if (!millimetersPerUnit) {
    return null;
  }
  return 1 / millimetersPerUnit;
};
var resolveStrokeWidth = function resolveStrokeWidth(parsed, entity, options) {
  if (options.useSourceLineweight) {
    if (typeof entity.constantWidth === 'number' && entity.constantWidth > 0) {
      return entity.constantWidth;
    }
    var layerTable = parsed && parsed.tables && parsed.tables.layers ? parsed.tables.layers[entity.layer] : null;
    var lineWeightEnum = entity.lineWeightEnum > 0 ? entity.lineWeightEnum : layerTable && layerTable.lineWeightEnum;
    var unitsPerMillimeter = drawingUnitsPerMillimeter(parsed);
    if (lineWeightEnum > 0 && unitsPerMillimeter) {
      return lineWeightEnum / 100 * unitsPerMillimeter;
    }
  }
  return Number(options.defaultStrokeWidth) || 1;
};
var makeStyleWrapper = function makeStyleWrapper(parsed, entity, options, element) {
  var rgb = (0, _getRGBForEntity["default"])(parsed.tables.layers, entity);
  var stroke = (0, _rgbToColorAttribute["default"])(rgb);
  var strokeWidth = resolveStrokeWidth(parsed, entity, options);
  return "<g stroke=\"".concat(stroke, "\" stroke-width=\"").concat(strokeWidth, "\" stroke-linejoin=\"round\" stroke-linecap=\"round\" data-layer=\"").concat(entity.layer || '', "\">").concat(element, "</g>");
};
var _default = exports["default"] = function _default(parsed) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var resolvedOptions = normalizeOptions(options);
  var denormalisedEntities = (0, _denormalise["default"])(parsed);
  var entities = filterEntitiesByLayers(denormalisedEntities, resolvedOptions.layers);
  var renderBounds = [];
  var elements = [];
  entities.forEach(function (entity) {
    if (entity.visible === false) {
      return;
    }
    var boundsAndElement = entityToBoundsAndElement(entity);
    if (!boundsAndElement) {
      return;
    }
    var bbox = boundsAndElement.bbox, element = boundsAndElement.element;
    if (hasValidBounds(bbox)) {
      renderBounds.push(bbox);
    }
    elements.push(makeStyleWrapper(parsed, entity, resolvedOptions, element));
  });
  var contentBBox = renderBounds.reduce(function (acc, bbox) {
    acc.expandByPoint(bbox.min);
    acc.expandByPoint(bbox.max);
    return acc;
  }, new _vecks.Box2());
  var headerBBox = headerBounds(parsed);
  var baseBBox = resolvedOptions.fitToContent || !hasValidBounds(headerBBox) ? contentBBox : headerBBox;
  var bbox = hasValidBounds(baseBBox) ? baseBBox : new _vecks.Box2();
  var top = resolvedOptions.padding.top, right = resolvedOptions.padding.right, bottom = resolvedOptions.padding.bottom, left = resolvedOptions.padding.left;
  var minX = bbox.valid ? bbox.min.x - left : 0;
  var maxX = bbox.valid ? bbox.max.x + right : 0;
  var minY = bbox.valid ? bbox.min.y - bottom : 0;
  var maxY = bbox.valid ? bbox.max.y + top : 0;
  var widthUnits = Math.max(maxX - minX, 0);
  var heightUnits = Math.max(maxY - minY, 0);
  var hasExplicitScale = Number.isFinite(resolvedOptions.scale);
  var width = hasExplicitScale ? widthUnits * resolvedOptions.scale : widthUnits;
  var height = hasExplicitScale ? heightUnits * resolvedOptions.scale : heightUnits;
  var svgWidth = hasExplicitScale ? "".concat(width, "px") : "100%";
  var svgHeight = hasExplicitScale ? "".concat(height, "px") : "100%";
  var width = hasExplicitScale ? widthUnits * resolvedOptions.scale : widthUnits;
  var height = hasExplicitScale ? heightUnits * resolvedOptions.scale : heightUnits;
  var svgWidth = hasExplicitScale ? "".concat(width, "px") : "100%";
  var svgHeight = hasExplicitScale ? "".concat(height, "px") : "100%";
  return "<?xml version=\"1.0\"?>\n<svg\n  xmlns=\"http://www.w3.org/2000/svg\"\n  xmlns:xlink=\"http://www.w3.org/1999/xlink\" version=\"1.1\"\n  preserveAspectRatio=\"xMinYMin meet\"\n  viewBox=\"".concat(minX, " ").concat(-maxY, " ").concat(widthUnits, " ").concat(heightUnits, "\"\n  width=\"").concat(svgWidth, "\" height=\"").concat(svgHeight, "\"\n>\n  <g fill=\"none\" transform=\"matrix(1,0,0,-1,0,0)\">\n    ").concat(elements.join('\n'), "\n  </g>\n</svg>");
};



