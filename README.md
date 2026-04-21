# dxf-dogstar

`dxf-dogstar` is a DXF parser and SVG exporter derived from the [`dxf`](https://github.com/skymakerolof/dxf) project v5.3.1., with a focus on practical SVG export controls for CAD workflows.


## What This Fork Adds

Compared with the upstream `dxf` package, this fork adds SVG export features that are useful when DXF files need to be rendered more predictably in web or document pipelines:

- Optional `scale` for fixed pixel output
- Responsive default SVG sizing when `scale` is omitted
- Layer filtering with a layer-name array
- UTF-8 / Chinese layer-name filtering support in normal Node.js string usage
- Fit-to-content export behavior
- Padding around exported content
- Source lineweight support from DXF data where available

## Install

```bash
npm install dxf-dogstar
```

## Basic Usage

```js
const fs = require('fs');
const { Helper } = require('dxf-dogstar');

const dxfText = fs.readFileSync('drawing.dxf', 'utf8');
const helper = new Helper(dxfText);

const svg = helper.toSVG();
fs.writeFileSync('drawing.svg', svg, 'utf8');
```

When `scale` is not provided, the generated SVG uses:

- `width="100%"`
- `height="100%"`

This is helpful when fixed pixel output makes thin horizontal or vertical strokes look too light in some renderers.

## SVG Export Options

`helper.toSVG(options)` accepts these options:

- `scale?: number`
  When provided, output SVG width and height are written in pixels.
  Example: `scale: 2` means the exported SVG dimensions are doubled from drawing units.
- `layers?: string[]`
  Export only entities whose layer is included in the array.
- `fitToContent?: boolean`
  Default: `true`
  When `true`, export is cropped to the rendered content bounds.
- `padding?: number | { top:number, right:number, bottom:number, left:number }`
  Padding in drawing units, applied around the exported content.
- `useSourceLineweight?: boolean`
  Default: `true`
  Uses DXF lineweight or polyline constant width when available.
- `defaultStrokeWidth?: number`
  Fallback stroke width when source lineweight is unavailable.

## Example: Fixed Pixel Export

```js
const fs = require('fs');
const { Helper } = require('dxf-dogstar');

const dxfText = fs.readFileSync('drawing.dxf', 'utf8');
const helper = new Helper(dxfText);

const svg = helper.toSVG({
  scale: 2,
  fitToContent: true,
  padding: { top: 10, right: 20, bottom: 10, left: 20 },
  useSourceLineweight: true,
});

fs.writeFileSync('drawing-2x.svg', svg, 'utf8');
```

## Example: Export Specific Layers

```js
const fs = require('fs');
const { Helper } = require('dxf-dogstar');

const dxfText = fs.readFileSync('drawing.dxf', 'utf8');
const helper = new Helper(dxfText);

const svg = helper.toSVG({
  layers: ['c-建筑轮廓', 'A-WALL'],
  fitToContent: true,
  padding: 0,
});

fs.writeFileSync('layers.svg', svg, 'utf8');
```

## Example: Responsive Default Sizing

```js
const fs = require('fs');
const { Helper } = require('dxf-dogstar');

const dxfText = fs.readFileSync('drawing.dxf', 'utf8');
const helper = new Helper(dxfText);

const svg = helper.toSVG({
  layers: ['c-建筑轮廓'],
  fitToContent: true,
  padding: 0,
});

fs.writeFileSync('responsive.svg', svg, 'utf8');
```

This output uses `width="100%" height="100%"` because `scale` is omitted.

## Notes

- This fork keeps the original project structure so existing `Helper`, `parseString`, `denormalise`, and related imports remain familiar.
- SVG rendering still depends on the entity types supported by the upstream renderer.
- The added lineweight logic is intended to improve practical SVG output, but exact print-style reproduction may still depend on DXF authoring conventions and external CAD print-style rules.

## Development Note

The added Dogstar SVG export enhancements in this fork were developed with Codex GPT-5.4 assistance.

## Upstream Project Attribution

This package is a derivative work based on the original `dxf` project:

- Upstream project: [`dxf`](https://github.com/skymakerolof/dxf)
- Original author listed in the packaged source: Ben Nortier
- Upstream license: MIT

## License

This fork is distributed under the MIT License.

The original upstream copyright notice and MIT license text are retained in [`LICENSE`](./LICENSE).
