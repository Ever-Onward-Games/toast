/**
 * Studio Canvas Renderer
 * Renders animation elements on a canvas at a specific frame
 *
 * Phase 1: Static rendering at frame 0
 * Future: Interpolation, transform controls, timeline integration
 */

import { AnchorCalculator } from './AnchorCalculator.js';

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

    // Interaction state
    this.interactionMode = 'SELECT';
    this.dragState = {
      isActive: false,
      handle: null,  // 'nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w', 'rotate', 'move'
      startX: 0,
      startY: 0,
      startProps: null,
      element: null
    };
    this.hoveredHandle = null;

    // Callbacks
    this.onElementsChanged = null;  // Callback for element property changes
    this.onSelectionChanged = null;  // Callback for selection changes

    // Set canvas logical size (1920x1080)
    this.canvas.width = width;
    this.canvas.height = height;

    // Let CSS handle display size - canvas will scale to fit container
    // CSS uses max-width/max-height: 100% with width/height: auto to maintain aspect ratio

    // Attach mouse event listeners
    this.canvas.addEventListener('mousedown', this._onMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this._onMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this._onMouseUp.bind(this));
    this.canvas.addEventListener('mouseleave', this._onMouseLeave.bind(this));
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

    // Render selection handles and anchor indicators for selected elements
    this.selectedElements.forEach(elementId => {
      const element = this.elements.find(el => el.id === elementId);
      if (element) {
        this.renderAnchorIndicators(element);
        this.renderSelectionHandles(element);
      }
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
    let props = defaults;
    if (element.keyframes && element.keyframes.length > 0) {
      const firstKeyframe = element.keyframes[0];
      props = { ...defaults, ...firstKeyframe.properties };
    }

    // Apply anchor calculations if anchored
    if (props.anchor && props.anchor.type !== "none") {
      const anchoredPos = AnchorCalculator.calculatePosition(
        element,
        this.elements,
        this.width,
        this.height
      );
      props.x = anchoredPos.x;
      props.y = anchoredPos.y;
    }

    return props;
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

  // ==========================================
  // Hit Detection & Selection Handles
  // ==========================================

  /**
   * Get element bounds in canvas space (accounting for transforms)
   * @param {Object} element - Element
   * @returns {Object} {minX, minY, maxX, maxY, centerX, centerY, width, height}
   */
  getElementBounds(element) {
    const props = this.getElementProperties(element, this.currentFrame);

    let width, height;

    if (element.type === 'text') {
      // Measure text
      this.ctx.save();
      this.ctx.font = `${props.fontWeight || 'normal'} ${props.fontSize}px Arial`;
      const metrics = this.ctx.measureText(element.text || 'Text');
      width = metrics.width;
      height = props.fontSize;
      this.ctx.restore();
    } else if (element.type === 'image') {
      width = props.width || 200;
      height = props.height || 200;
    } else {
      // Sound or unknown type
      width = 100;
      height = 100;
    }

    // Calculate bounds with transforms
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    const angle = (props.rotation || 0) * Math.PI / 180;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const scale = props.scale || 1.0;

    // Four corners of the element (before rotation)
    const corners = [
      { x: -halfWidth * scale, y: -halfHeight * scale },
      { x: halfWidth * scale, y: -halfHeight * scale },
      { x: halfWidth * scale, y: halfHeight * scale },
      { x: -halfWidth * scale, y: halfHeight * scale }
    ];

    // Rotate and translate corners
    const transformedCorners = corners.map(corner => ({
      x: props.x + (corner.x * cos - corner.y * sin),
      y: props.y + (corner.x * sin + corner.y * cos)
    }));

    // Find bounds
    const xs = transformedCorners.map(c => c.x);
    const ys = transformedCorners.map(c => c.y);

    return {
      minX: Math.min(...xs),
      minY: Math.min(...ys),
      maxX: Math.max(...xs),
      maxY: Math.max(...ys),
      centerX: props.x,
      centerY: props.y,
      width: width * scale,
      height: height * scale
    };
  }

  /**
   * Test if a point hits an element
   * @param {Object} element - Element to test
   * @param {number} canvasX - X coordinate in canvas space
   * @param {number} canvasY - Y coordinate in canvas space
   * @returns {boolean} True if hit
   */
  hitTest(element, canvasX, canvasY) {
    const props = this.getElementProperties(element, this.currentFrame);

    // Transform point to local space
    const dx = canvasX - props.x;
    const dy = canvasY - props.y;
    const angle = -(props.rotation || 0) * Math.PI / 180;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    const localX = dx * cos - dy * sin;
    const localY = dx * sin + dy * cos;

    // Get element dimensions
    let width, height;
    if (element.type === 'text') {
      this.ctx.save();
      this.ctx.font = `${props.fontWeight || 'normal'} ${props.fontSize}px Arial`;
      const metrics = this.ctx.measureText(element.text || 'Text');
      width = metrics.width;
      height = props.fontSize;
      this.ctx.restore();
    } else if (element.type === 'image') {
      width = props.width || 200;
      height = props.height || 200;
    } else {
      width = 100;
      height = 100;
    }

    const scale = props.scale || 1.0;
    const halfWidth = (width * scale) / 2;
    const halfHeight = (height * scale) / 2;

    return Math.abs(localX) <= halfWidth && Math.abs(localY) <= halfHeight;
  }

  /**
   * Get element at canvas coordinates (for selection)
   * @param {number} canvasX - X coordinate
   * @param {number} canvasY - Y coordinate
   * @returns {Object|null} Element or null
   */
  getElementAtPoint(canvasX, canvasY) {
    // Test in reverse order (top to bottom in z-order)
    for (let i = this.elements.length - 1; i >= 0; i--) {
      if (this.hitTest(this.elements[i], canvasX, canvasY)) {
        return this.elements[i];
      }
    }
    return null;
  }

  /**
   * Get all handle positions for an element
   * @param {Object} element - Element
   * @returns {Array<Object>} Array of {type, x, y, cursor}
   */
  getHandlePositions(element) {
    const bounds = this.getElementBounds(element);
    const props = this.getElementProperties(element, this.currentFrame);

    const handles = [];
    const halfWidth = bounds.width / 2;
    const halfHeight = bounds.height / 2;
    const angle = (props.rotation || 0) * Math.PI / 180;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    // Helper to rotate a point around center
    const rotate = (localX, localY) => ({
      x: bounds.centerX + (localX * cos - localY * sin),
      y: bounds.centerY + (localX * sin + localY * cos)
    });

    // 8 resize handles
    const resizeHandles = [
      { type: 'nw', lx: -halfWidth, ly: -halfHeight, cursor: 'nw-resize' },
      { type: 'n',  lx: 0,          ly: -halfHeight, cursor: 'n-resize' },
      { type: 'ne', lx: halfWidth,  ly: -halfHeight, cursor: 'ne-resize' },
      { type: 'e',  lx: halfWidth,  ly: 0,           cursor: 'e-resize' },
      { type: 'se', lx: halfWidth,  ly: halfHeight,  cursor: 'se-resize' },
      { type: 's',  lx: 0,          ly: halfHeight,  cursor: 's-resize' },
      { type: 'sw', lx: -halfWidth, ly: halfHeight,  cursor: 'sw-resize' },
      { type: 'w',  lx: -halfWidth, ly: 0,           cursor: 'w-resize' }
    ];

    resizeHandles.forEach(h => {
      const pos = rotate(h.lx, h.ly);
      handles.push({ type: h.type, x: pos.x, y: pos.y, cursor: h.cursor });
    });

    // Rotation handle (30px above top center)
    const rotatePos = rotate(0, -halfHeight - 30);
    handles.push({ type: 'rotate', x: rotatePos.x, y: rotatePos.y, cursor: 'crosshair' });

    // Move handle (center)
    handles.push({ type: 'move', x: bounds.centerX, y: bounds.centerY, cursor: 'move' });

    return handles;
  }

  /**
   * Get handle at a specific point
   * @param {Object} element - Element to test
   * @param {number} canvasX - X coordinate
   * @param {number} canvasY - Y coordinate
   * @returns {Object|null} Handle object or null
   */
  getHandleAtPoint(element, canvasX, canvasY) {
    const handles = this.getHandlePositions(element);
    const tolerance = 10; // pixels

    // Test rotation handle first (priority)
    const rotateHandle = handles.find(h => h.type === 'rotate');
    if (rotateHandle) {
      const dist = Math.sqrt(Math.pow(canvasX - rotateHandle.x, 2) + Math.pow(canvasY - rotateHandle.y, 2));
      if (dist <= tolerance) {
        return rotateHandle;
      }
    }

    // Test resize handles
    for (const handle of handles) {
      if (handle.type !== 'rotate' && handle.type !== 'move') {
        const dist = Math.sqrt(Math.pow(canvasX - handle.x, 2) + Math.pow(canvasY - handle.y, 2));
        if (dist <= tolerance) {
          return handle;
        }
      }
    }

    // Finally test if point is on element body (for move)
    if (this.hitTest(element, canvasX, canvasY)) {
      return handles.find(h => h.type === 'move');
    }

    return null;
  }

  /**
   * Render selection handles for an element
   * @param {Object} element - Selected element
   */
  renderSelectionHandles(element) {
    const bounds = this.getElementBounds(element);
    const handles = this.getHandlePositions(element);
    const props = this.getElementProperties(element, this.currentFrame);

    this.ctx.save();

    // Draw bounding box
    this.ctx.strokeStyle = 'rgba(74, 144, 226, 0.8)';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([5, 5]);

    this.ctx.translate(bounds.centerX, bounds.centerY);
    this.ctx.rotate((props.rotation || 0) * Math.PI / 180);

    const halfWidth = bounds.width / 2;
    const halfHeight = bounds.height / 2;
    this.ctx.strokeRect(-halfWidth, -halfHeight, bounds.width, bounds.height);

    this.ctx.restore();

    // Draw resize handles
    handles.forEach(handle => {
      if (handle.type !== 'move') {
        this.ctx.save();

        if (handle.type === 'rotate') {
          // Rotation handle (circle)
          this.ctx.beginPath();
          this.ctx.arc(handle.x, handle.y, 6, 0, Math.PI * 2);
          this.ctx.fillStyle = 'rgba(74, 144, 226, 0.9)';
          this.ctx.fill();
          this.ctx.strokeStyle = '#ffffff';
          this.ctx.lineWidth = 2;
          this.ctx.stroke();
        } else {
          // Resize handle (square)
          this.ctx.fillStyle = '#ffffff';
          this.ctx.fillRect(handle.x - 4, handle.y - 4, 8, 8);
          this.ctx.strokeStyle = 'rgba(74, 144, 226, 0.9)';
          this.ctx.lineWidth = 1;
          this.ctx.strokeRect(handle.x - 4, handle.y - 4, 8, 8);
        }

        this.ctx.restore();
      }
    });

    this.ctx.setLineDash([]);
  }

  /**
   * Render anchor indicators for an element
   * Shows visual connection between element and its anchor point
   * @param {Object} element - Element with anchor
   */
  renderAnchorIndicators(element) {
    const props = this.getElementProperties(element, this.currentFrame);
    const anchor = props.anchor;

    // Only show for anchored elements
    if (!anchor || anchor.type === "none") return;

    this.ctx.save();

    // Get element's actual position (from keyframes, before anchor calculation)
    const rawProps = element.keyframes?.[0]?.properties || {};
    let anchorBaseX = 0;
    let anchorBaseY = 0;

    // Get anchor base position
    if (anchor.type === "viewport") {
      const viewportPos = AnchorCalculator.calculateViewportAnchor(
        anchor.viewportPosition || "top-left",
        this.width,
        this.height
      );
      anchorBaseX = viewportPos.x;
      anchorBaseY = viewportPos.y;
    } else if (anchor.type === "element") {
      // Get target element position
      const targetElement = this.elements?.find(el => el.id === anchor.targetElementId);
      if (targetElement) {
        const targetProps = this.getElementProperties(targetElement, this.currentFrame);
        const targetDimensions = AnchorCalculator.getElementDimensions(targetElement);
        const targetOffset = AnchorCalculator.getAnchorPointOffset(
          anchor.targetAnchorPoint || "center",
          targetDimensions.width,
          targetDimensions.height
        );
        anchorBaseX = targetProps.x + targetOffset.x;
        anchorBaseY = targetProps.y + targetOffset.y;
      }
    }

    // Draw dashed line from element center to anchor point
    this.ctx.strokeStyle = 'rgba(255, 165, 0, 0.8)'; // Orange
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([5, 5]);

    this.ctx.beginPath();
    this.ctx.moveTo(props.x, props.y);
    this.ctx.lineTo(anchorBaseX, anchorBaseY);
    this.ctx.stroke();

    this.ctx.setLineDash([]);

    // Draw anchor point marker
    if (anchor.type === "viewport") {
      // Orange circle for viewport anchor
      this.ctx.beginPath();
      this.ctx.arc(anchorBaseX, anchorBaseY, 8, 0, Math.PI * 2);
      this.ctx.fillStyle = 'rgba(255, 165, 0, 0.3)';
      this.ctx.fill();
      this.ctx.strokeStyle = 'rgba(255, 165, 0, 0.9)';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    } else if (anchor.type === "element") {
      // Orange square for element anchor
      this.ctx.fillStyle = 'rgba(255, 165, 0, 0.5)';
      this.ctx.fillRect(anchorBaseX - 6, anchorBaseY - 6, 12, 12);
      this.ctx.strokeStyle = 'rgba(255, 165, 0, 0.9)';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(anchorBaseX - 6, anchorBaseY - 6, 12, 12);

      // Draw arrowhead pointing to anchor
      const dx = anchorBaseX - props.x;
      const dy = anchorBaseY - props.y;
      const angle = Math.atan2(dy, dx);
      const arrowSize = 10;

      this.ctx.fillStyle = 'rgba(255, 165, 0, 0.9)';
      this.ctx.beginPath();
      this.ctx.moveTo(anchorBaseX, anchorBaseY);
      this.ctx.lineTo(
        anchorBaseX - arrowSize * Math.cos(angle - Math.PI / 6),
        anchorBaseY - arrowSize * Math.sin(angle - Math.PI / 6)
      );
      this.ctx.lineTo(
        anchorBaseX - arrowSize * Math.cos(angle + Math.PI / 6),
        anchorBaseY - arrowSize * Math.sin(angle + Math.PI / 6)
      );
      this.ctx.closePath();
      this.ctx.fill();
    }

    this.ctx.restore();
  }

  // ==========================================
  // Mouse Event Handlers
  // ==========================================

  /**
   * Handle mouse down on canvas
   * @param {MouseEvent} event
   */
  _onMouseDown(event) {
    const coords = this.getCanvasCoordinates(event);

    // Check if we clicked on a selected element's handle
    if (this.selectedElements.length > 0) {
      const selectedElement = this.elements.find(el => el.id === this.selectedElements[0]);
      if (selectedElement) {
        const handle = this.getHandleAtPoint(selectedElement, coords.x, coords.y);
        if (handle) {
          // Start drag operation
          this.dragState = {
            isActive: true,
            handle: handle.type,
            startX: coords.x,
            startY: coords.y,
            startProps: foundry.utils.deepClone(this.getElementProperties(selectedElement, this.currentFrame)),
            element: selectedElement
          };
          this._updateCursor(handle);
          return;
        }
      }
    }

    // Check if we clicked on an element (for selection)
    const element = this.getElementAtPoint(coords.x, coords.y);
    if (element) {
      // Select the element
      this.selectedElements = [element.id];

      // Emit selection changed callback
      if (this.onSelectionChanged) {
        this.onSelectionChanged(element.id);
      }

      // Start move drag
      const handle = this.getHandleAtPoint(element, coords.x, coords.y);
      this.dragState = {
        isActive: true,
        handle: handle ? handle.type : 'move',
        startX: coords.x,
        startY: coords.y,
        startProps: foundry.utils.deepClone(this.getElementProperties(element, this.currentFrame)),
        element: element
      };

      this.render();
    } else {
      // Clicked on empty space - deselect
      this.selectedElements = [];
      if (this.onSelectionChanged) {
        this.onSelectionChanged(null);
      }
      this.render();
    }
  }

  /**
   * Handle mouse move on canvas
   * @param {MouseEvent} event
   */
  _onMouseMove(event) {
    const coords = this.getCanvasCoordinates(event);

    if (this.dragState.isActive) {
      // Handle active drag
      const deltaX = coords.x - this.dragState.startX;
      const deltaY = coords.y - this.dragState.startY;

      if (this.dragState.handle === 'move') {
        this._handleMoveDrag(deltaX, deltaY);
      } else if (this.dragState.handle === 'rotate') {
        this._handleRotationDrag(coords.x, coords.y);
      } else {
        // Resize handle
        this._handleResizeDrag(this.dragState.handle, coords.x, coords.y);
      }

      // Emit elements changed callback (with isDragging=true)
      if (this.onElementsChanged) {
        this.onElementsChanged(this.elements, true);
      }
    } else {
      // Handle hover (cursor feedback)
      if (this.selectedElements.length > 0) {
        const selectedElement = this.elements.find(el => el.id === this.selectedElements[0]);
        if (selectedElement) {
          const handle = this.getHandleAtPoint(selectedElement, coords.x, coords.y);
          this._updateCursor(handle);
        }
      }
    }
  }

  /**
   * Handle mouse up on canvas
   * @param {MouseEvent} event
   */
  _onMouseUp(event) {
    if (this.dragState.isActive) {
      this.dragState.isActive = false;

      // Emit elements changed callback (with isDragging=false to trigger properties sync)
      if (this.onElementsChanged) {
        this.onElementsChanged(this.elements, false);
      }
    }

    this._updateCursor(null);
  }

  /**
   * Handle mouse leaving canvas
   * @param {MouseEvent} event
   */
  _onMouseLeave(event) {
    if (this.dragState.isActive) {
      this.dragState.isActive = false;

      // Emit elements changed callback
      if (this.onElementsChanged) {
        this.onElementsChanged(this.elements, false);
      }
    }

    this._updateCursor(null);
  }

  // ==========================================
  // Drag Operations
  // ==========================================

  /**
   * Handle move/translate drag operation
   * @param {number} deltaX - Change in X
   * @param {number} deltaY - Change in Y
   */
  _handleMoveDrag(deltaX, deltaY) {
    if (!this.dragState.element) return;

    const element = this.dragState.element;
    if (!element.keyframes || element.keyframes.length === 0) {
      element.keyframes = [{frame: 0, properties: {}, interpolation: 'ease-in-out'}];
    }

    element.keyframes[0].properties.x = this.dragState.startProps.x + deltaX;
    element.keyframes[0].properties.y = this.dragState.startProps.y + deltaY;

    this.render();
  }

  /**
   * Handle resize drag operation
   * @param {string} handle - Handle type (nw, n, ne, etc.)
   * @param {number} currentX - Current mouse X
   * @param {number} currentY - Current mouse Y
   */
  _handleResizeDrag(handle, currentX, currentY) {
    if (!this.dragState.element) return;

    const element = this.dragState.element;
    const startProps = this.dragState.startProps;

    if (!element.keyframes || element.keyframes.length === 0) {
      element.keyframes = [{frame: 0, properties: {}, interpolation: 'ease-in-out'}];
    }

    // Calculate delta in local space
    const dx = currentX - this.dragState.startX;
    const dy = currentY - this.dragState.startY;
    const angle = -(startProps.rotation || 0) * Math.PI / 180;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const localDX = dx * cos - dy * sin;
    const localDY = dx * sin + dy * cos;

    // Determine scale factor based on handle
    let scaleX = 1, scaleY = 1;
    let offsetX = 0, offsetY = 0;

    if (element.type === 'text') {
      // For text, resize by changing fontSize
      const avgDelta = (localDX + localDY) / 2;
      const newFontSize = Math.max(8, startProps.fontSize + avgDelta * 0.5);
      element.keyframes[0].properties.fontSize = Math.round(newFontSize);
    } else if (element.type === 'image') {
      // For images, resize width/height
      const startWidth = startProps.width || 200;
      const startHeight = startProps.height || 200;

      switch(handle) {
        case 'nw':
          scaleX = 1 - (localDX / startWidth);
          scaleY = 1 - (localDY / startHeight);
          offsetX = localDX / 2;
          offsetY = localDY / 2;
          break;
        case 'ne':
          scaleX = 1 + (localDX / startWidth);
          scaleY = 1 - (localDY / startHeight);
          offsetX = localDX / 2;
          offsetY = localDY / 2;
          break;
        case 'se':
          scaleX = 1 + (localDX / startWidth);
          scaleY = 1 + (localDY / startHeight);
          offsetX = localDX / 2;
          offsetY = localDY / 2;
          break;
        case 'sw':
          scaleX = 1 - (localDX / startWidth);
          scaleY = 1 + (localDY / startHeight);
          offsetX = localDX / 2;
          offsetY = localDY / 2;
          break;
        case 'n':
          scaleY = 1 - (localDY / startHeight);
          offsetY = localDY / 2;
          break;
        case 's':
          scaleY = 1 + (localDY / startHeight);
          offsetY = localDY / 2;
          break;
        case 'e':
          scaleX = 1 + (localDX / startWidth);
          offsetX = localDX / 2;
          break;
        case 'w':
          scaleX = 1 - (localDX / startWidth);
          offsetX = localDX / 2;
          break;
      }

      // Maintain aspect ratio for corner handles
      if (['nw', 'ne', 'se', 'sw'].includes(handle)) {
        const avgScale = (scaleX + scaleY) / 2;
        scaleX = scaleY = avgScale;
      }

      const newWidth = Math.max(10, startWidth * scaleX);
      const newHeight = Math.max(10, startHeight * scaleY);

      element.keyframes[0].properties.width = Math.round(newWidth);
      element.keyframes[0].properties.height = Math.round(newHeight);

      // Adjust position to keep opposite corner fixed
      const rotCos = Math.cos((startProps.rotation || 0) * Math.PI / 180);
      const rotSin = Math.sin((startProps.rotation || 0) * Math.PI / 180);
      element.keyframes[0].properties.x = startProps.x + (offsetX * rotCos - offsetY * rotSin);
      element.keyframes[0].properties.y = startProps.y + (offsetX * rotSin + offsetY * rotCos);
    }

    this.render();
  }

  /**
   * Handle rotation drag operation
   * @param {number} currentX - Current mouse X
   * @param {number} currentY - Current mouse Y
   */
  _handleRotationDrag(currentX, currentY) {
    if (!this.dragState.element) return;

    const element = this.dragState.element;
    const startProps = this.dragState.startProps;

    if (!element.keyframes || element.keyframes.length === 0) {
      element.keyframes = [{frame: 0, properties: {}, interpolation: 'ease-in-out'}];
    }

    // Calculate angle from center to current mouse position
    const dx = currentX - startProps.x;
    const dy = currentY - startProps.y;
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);

    // Add 90 degrees because 0 degrees should point up, not right
    const rotation = angle + 90;

    element.keyframes[0].properties.rotation = rotation;

    this.render();
  }

  /**
   * Update cursor based on interaction state
   * @param {Object|null} handle - Handle under cursor
   */
  _updateCursor(handle) {
    if (!handle) {
      this.canvas.style.cursor = 'default';
    } else if (this.dragState.isActive) {
      this.canvas.style.cursor = 'grabbing';
    } else {
      this.canvas.style.cursor = handle.cursor || 'default';
    }
  }
}
