/**
 * Responsive SVG Handler for PCT Labs
 * Adds viewBox attributes to SVG elements on mobile for proper scaling
 */

(function() {
  'use strict';

  function makeSimulationSVGsResponsive() {
    // Check if we're on mobile viewport
    const isMobile = window.matchMedia('(max-width: 767px)').matches;

    if (!isMobile) {
      return; // Only apply on mobile
    }

    // Find all SVG elements within simulation containers AND all plot SVGs
    const simulationSVGs = document.querySelectorAll('.simulation-container svg, svg[id$="-plot"], svg[id$="-plot1"], svg[id$="-plot2"], svg[id$="-plot3"]');

    simulationSVGs.forEach(function(svg) {
      // Skip if viewBox already exists
      if (svg.hasAttribute('viewBox')) {
        return;
      }

      // Get the current width and height from inline styles
      const style = svg.getAttribute('style');
      if (!style) {
        return;
      }

      // Extract width and height values (e.g., "width:405px; height:70px;")
      const widthMatch = style.match(/width:\s*(\d+)px/);
      const heightMatch = style.match(/height:\s*(\d+)px/);

      if (!widthMatch || !heightMatch) {
        return;
      }

      const width = parseInt(widthMatch[1], 10);
      const height = parseInt(heightMatch[1], 10);

      // Add viewBox attribute to maintain internal coordinate system
      svg.setAttribute('viewBox', '0 0 ' + width + ' ' + height);

      // Make the SVG responsive while preserving aspect ratio
      // Update the style to use 100% width with max-width as original size
      const newStyle = style
        .replace(/width:\s*\d+px/, 'width: 100%; max-width: ' + width + 'px')
        .replace(/height:\s*\d+px/, 'height: auto');

      svg.setAttribute('style', newStyle);

      // Set width and height attributes (not style) for SVG intrinsic dimensions
      // This is crucial - the viewBox defines the coordinate system,
      // but width/height attributes define intrinsic size for aspect ratio calculation
      svg.setAttribute('width', width);
      svg.setAttribute('height', height);

      // Also set preserveAspectRatio to ensure proper scaling
      svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    });
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', makeSimulationSVGsResponsive);
  } else {
    // DOM already loaded
    makeSimulationSVGsResponsive();
  }

  // Re-run on window resize (debounced) in case orientation changes
  let resizeTimer;
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(makeSimulationSVGsResponsive, 250);
  });

})();
