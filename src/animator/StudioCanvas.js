/**
 * Studio Canvas Renderer
 * Renders animation elements on a canvas at a specific frame
 *
 * Phase 1: Static rendering at frame 0
 * Future: Interpolation, transform controls, timeline integration
 */
class StudioCanvas {
  /**
   * Create a studio canvas renderer
   * @param {HTMLCanvasElement} canvas - The canvas element to render to
   * @param {number} width - Logical canvas width (1920)
   * @param {number} height - Logical canvas height (1080)
   */
  constructor(canvas, width = 1920, height = 1080) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = width;
    this.height = height;

    // State
    this.currentFrame = 0;
    this.elements = [];
    this.selectedElements = [];

    // Set canvas size
    this.canvas.width = width;
    this.canvas.height = height;

    // Scale canvas to fit container (will be set by CSS)
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.objectFit = 'contain';
  }

  /**
   * Set the elements to render
   * @param {Array} elements - Array of animation elements
   */
  setElements(elements) {
    this.elements = elements || [];
    this.render();
  }

  /**
   * Set the current frame
   * @param {number} frame - Frame number
   */
  setFrame(frame) {
    this.currentFrame = frame;
    this.render();
  }

  /**
   * Set selected elements
   * @param {Array} elementIds - Array of selected element IDs
   */
  setSelection(elementIds) {
    this.selectedElements = elementIds || [];
    this.render();
  }

  /**
   * Render the canvas at the current frame
   */
  render() {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Black background
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Render each element
    this.elements.forEach((element, index) => {
      this.renderElement(element, this.currentFrame);
    });
  }

  /**
   * Render a single element at a specific frame
   * @param {Object} element - Element to render
   * @param {number} frame - Frame number
   */
  renderElement(element, frame) {
    // For Phase 1: Just render at default position (frame 0)
    // Future phases will interpolate keyframes

    this.ctx.save();

    // Get element properties (default values for now)
    const props = this.getElementProperties(element, frame);

    // Apply transforms
    this.ctx.translate(props.x, props.y);
    this.ctx.rotate((props.rotation * Math.PI) / 180);
    this.ctx.scale(props.scale, props.scale);
    this.ctx.globalAlpha = props.opacity;

    // Render based on element type
    switch (element.type) {
      case 'text':
        this.renderText(element, props);
        break;
      case 'image':
        this.renderImage(element, props);
        break;
      case 'sound':
        // Sounds don't render visually (only in timeline)
        break;
    }

    this.ctx.restore();
  }

  /**
   * Get element properties at a specific frame
   * Phase 1: Returns default properties
   * Future: Will interpolate keyframes
   *
   * @param {Object} element - Element object
   * @param {number} frame - Frame number
   * @returns {Object} Properties object
   */
  getElementProperties(element, frame) {
    // Default properties
    const defaults = {
      x: 960,        // Center X
      y: 540,        // Center Y
      rotation: 0,   // Degrees
      scale: 1.0,    // 100%
      opacity: 1.0,  // 100%
      fontSize: 72,
      color: '#ffffff',
      fontWeight: 'normal',
      width: 200,
      height: 200
    };

    // For Phase 1: If element has keyframes, use first keyframe
    // Otherwise use defaults
    if (element.keyframes && element.keyframes.length > 0) {
      const firstKeyframe = element.keyframes[0];
      return { ...defaults, ...firstKeyframe.properties };
    }

    return defaults;
  }

  /**
   * Render text element
   * @param {Object} element - Text element
   * @param {Object} props - Element properties
   */
  renderText(element, props) {
    // Set text style
    this.ctx.font = `${props.fontWeight || 'normal'} ${props.fontSize}px Arial`;
    this.ctx.fillStyle = props.color || '#ffffff';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    // Apply text shadow if specified
    if (props.textShadow) {
      // Parse text shadow: "2px 2px 4px #000000"
      const parts = props.textShadow.split(' ');
      if (parts.length >= 4) {
        this.ctx.shadowOffsetX = parseInt(parts[0]);
        this.ctx.shadowOffsetY = parseInt(parts[1]);
        this.ctx.shadowBlur = parseInt(parts[2]);
        this.ctx.shadowColor = parts[3];
      }
    }

    // Draw text at origin (transforms already applied)
    this.ctx.fillText(element.text || 'Text', 0, 0);

    // Reset shadow
    this.ctx.shadowOffsetX = 0;
    this.ctx.shadowOffsetY = 0;
    this.ctx.shadowBlur = 0;
  }

  /**
   * Render image element
   * @param {Object} element - Image element
   * @param {Object} props - Element properties
   */
  renderImage(element, props) {
    // Check if image is loaded
    if (!element._cachedImage) {
      element._cachedImage = new Image();
      element._cachedImage.src = element.src;

      // Re-render when image loads
      element._cachedImage.onload = () => {
        this.render();
      };

      element._cachedImage.onerror = () => {
        console.error(`StudioCanvas | Failed to load image: ${element.src}`);
      };
    }

    // Draw image if loaded
    if (element._cachedImage.complete && element._cachedImage.naturalWidth > 0) {
      const w = props.width || element._cachedImage.naturalWidth;
      const h = props.height || element._cachedImage.naturalHeight;

      // Apply filters if specified
      if (props.filter) {
        this.ctx.filter = props.filter;
      }

      // Draw from center
      this.ctx.drawImage(
        element._cachedImage,
        -w / 2,
        -h / 2,
        w,
        h
      );

      // Reset filter
      this.ctx.filter = 'none';
    } else {
      // Draw placeholder while loading
      this.ctx.fillStyle = '#333333';
      this.ctx.fillRect(-100, -100, 200, 200);
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = '16px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText('Loading...', 0, 0);
    }
  }

  /**
   * Clear the canvas
   */
  clear() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  /**
   * Get canvas coordinates from mouse event
   * @param {MouseEvent} event - Mouse event
   * @returns {Object} {x, y} canvas coordinates
   */
  getCanvasCoordinates(event) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.width / rect.width;
    const scaleY = this.height / rect.height;

    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY
    };
  }
}
