# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **PCT Labs** - an interactive web-based educational platform for Perceptual Control Theory (PCT) developed by William T. Powers. The project ports classic Pascal/DOS tutorials and Delphi demos to JavaScript, making them accessible through modern web browsers.

## Architecture

### Repository Structure

The codebase is organized into three main sections:

1. **Tutorials** (`/tutorial1/`, `/tutorial2/`) - Educational stepping stones originally written by Bill Powers in the late 80s, teaching PCT fundamentals through interactive exercises
2. **Demos** (`/demos/`) - Advanced demonstrations originally written in Delphi by W.T. Powers and B.B. Abbott, ported from "Living Control Systems III: The Fact of Control"
3. **Shared Library** (`/js/lib.js`) - Core utilities and plotting functions used across all demos and tutorials

### Technology Stack

- **Snap.svg** (`/js/snap.svg.js`) - Vector graphics library for SVG manipulation
- **Three.js** (`/js/three.js`) - 3D graphics for Demo1 (Choose Control)
- **Vanilla JavaScript** - No build system; runs directly in browsers
- **Custom lib.js** - Helper functions for disturbances, plots, signals, and UI elements

### Key Library Components (`/js/lib.js`)

The `lib.js` file contains essential utilities used throughout the project:

- **`lib.make_disturbance(difficulty, range, data_length?)`** - Generates realistic disturbance signals
  - Without `data_length`: Returns continuous random disturbance function
  - With `data_length`: Returns pre-calculated array using algorithm from TrackAnalyze (LCSIII)
  - Uses frequency domain synthesis with exponential amplitude decay

- **`lib.make_signals()`** - Creates signal containers with `.add(key, name, color)` and `.reset()` methods for data collection

- **`lib.Plot(plot_area, signals)`** - Snap.svg-based plotting with `.update(signals)` method

- **`lib.svg_plot(area, signals, opts)`** - Alternative SVG plotter with configurable axes and ticks

- **Snap.svg Extensions** (lines 373-501):
  - `.drag_number(params)` - Draggable numeric parameter controls
  - `.wire_line(opts)` - Block diagram connection lines with directional arrows
  - `.signal_meter(opts)` - Real-time signal value displays

### Tutorial/Demo Pattern

Each tutorial step and demo follows a similar structure:

```javascript
(function StepX() {
  "use strict";

  // Setup: Initialize Snap canvas, signals, disturbances
  var p = Snap("#X-screen");
  var signals = lib.make_signals();
  var disturbance = lib.make_disturbance(difficulty, range);

  // Input handling: Mouse/slider for "handle" input
  handle.oninput = function() { /* update visualization */ };

  // Animation loop: Run simulation, collect data
  function animate() {
    if (running && counter < max_frames) {
      d = disturbance.next();
      h = Number(handle.value);
      c = h + d; // or more complex feedback equation

      // Record data after warm-up period (typically 300 frames)
      if (counter > 300) {
        signals.c.data.push(c);
      }

      counter++;
      lib.request_anim_frame(animate);
    } else {
      // Analysis: calculate correlations, RMS, etc.
    }
  }
}());
```

### GitHub Pages Deployment

The project uses path detection for dual deployment:

- **Localhost**: Base path is `/`
- **GitHub Pages**: Base path is `/pct-labs/`

This is implemented in `common/menu.html` (lines 18-31) and should be maintained for any new pages.

## Development Workflow

### Testing Locally

Since there's no build system, simply open HTML files in a browser:

```bash
# Start a local server (recommended for proper CORS handling)
python -m http.server 8000
# or
npx http-server
```

Then navigate to `http://localhost:8000/index.html`

### File Modification Guidelines

1. **Adding New Demos**: Follow the pattern in existing demos (`/demos/demo1/`, `/demos/demo2/`, etc.)
   - Each demo has: `index.html`, `demo*.js`, `style.css`
   - Include the common menu: `<div id="menulink"></div>` + menu script
   - Use responsive SVG wrapper if needed: `common/responsive-svg.js`

2. **Modifying `lib.js`**: This file is used by ALL tutorials and demos
   - Test changes across multiple demos before committing
   - The Snap.svg plugin section (lines 373+) extends `Element.prototype`

3. **Path References**: Always use relative paths compatible with GitHub Pages
   - Good: `href="./demos/demo1/index.html"`
   - Bad: `href="/demos/demo1/index.html"` (breaks on GitHub Pages)

### Common Patterns

**Correlation Analysis** (from `tutorial1.js` Step F):
```javascript
corr_ch.innerHTML = stat.pearson(signals.c.data, signals.h.data).toFixed(3);
```

**RMS Calculation** (from `lib.js`):
```javascript
lib.rms0(data_array)  // Root mean square distance from zero
lib.rmse(data_array, range)  // RMS as percentage of range
```

**Animation Timing**:
- Standard run: 2100 frames (~35 seconds at 60fps)
- Warm-up period: 300 frames (~5 seconds)
- Recording period: 1800 frames (~30 seconds)

## Important Notes

- **No Build Process**: All JavaScript is loaded directly via `<script>` tags
- **Legacy Code**: Tutorials contain verbatim text from Bill Powers' original 1980s programs
- **Handle Input**: Originally a physical device, now replaced with mouse/sliders
- **Mobile Debugging**: Eruda console is included on main pages for mobile testing
- **License**: MIT (specified in individual demo files)

## Common Tasks

### Adding a New Tutorial Step

1. Add section in tutorial HTML file with appropriate IDs
2. Add corresponding IIFE function in tutorial JS file
3. Use `lib.make_signals()` and `lib.Plot()` for data visualization
4. Follow the animate() pattern with 300-frame warmup

### Updating Shared Styles

Edit `common/style.css` - affects all pages that include it.

### Debugging SVG Issues

Check viewBox settings in `lib.js` Plot constructor (lines 262-268). The Snap.svg wrapper ensures responsive scaling.
