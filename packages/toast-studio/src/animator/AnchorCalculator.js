/**
 * AnchorCalculator - Core module for element anchoring calculations
 * Handles viewport anchoring and element-to-element anchoring with circular reference detection
 */

// Viewport anchor positions (1920x1080 coordinate system)
const VIEWPORT_ANCHORS = {
  "top-left": { x: 0, y: 0 },
  "top-center": { x: 960, y: 0 },
  "top-right": { x: 1920, y: 0 },
  "center-left": { x: 0, y: 540 },
  "center": { x: 960, y: 540 },
  "center-right": { x: 1920, y: 540 },
  "bottom-left": { x: 0, y: 1080 },
  "bottom-center": { x: 960, y: 1080 },
  "bottom-right": { x: 1920, y: 1080 }
};

// Default anchor configuration
export const DEFAULT_ANCHOR = {
  type: "none",
  viewportPosition: "top-left",
  targetElementId: null,
  sourceAnchorPoint: "center",
  targetAnchorPoint: "center"
};

export class AnchorCalculator {
  /**
   * Calculate the final position of an element based on its anchor settings
   * @param {Object} element - The element to position
   * @param {Array} allElements - All elements (for element-to-element anchoring)
   * @param {number} canvasWidth - Canvas width (usually 1920)
   * @param {number} canvasHeight - Canvas height (usually 1080)
   * @returns {Object} - { x, y } final position
   */
  static calculatePosition(element, allElements, canvasWidth, canvasHeight) {
    const props = element.keyframes?.[0]?.properties || {};
    const anchor = props.anchor || DEFAULT_ANCHOR;

    // No anchoring - return absolute position (backward compatible)
    if (!anchor || anchor.type === "none") {
      return { x: props.x || 0, y: props.y || 0 };
    }

    let baseX = 0;
    let baseY = 0;

    // Calculate base anchor position
    if (anchor.type === "viewport") {
      const viewportPos = this.calculateViewportAnchor(
        anchor.viewportPosition || "top-left",
        canvasWidth,
        canvasHeight
      );
      baseX = viewportPos.x;
      baseY = viewportPos.y;
    } else if (anchor.type === "element") {
      const elementPos = this.calculateElementAnchor(
        element,
        anchor,
        allElements,
        canvasWidth,
        canvasHeight
      );
      baseX = elementPos.x;
      baseY = elementPos.y;
    }

    // Get element dimensions
    const dimensions = this.getElementDimensions(element);

    // Get source anchor point offset (offset from element's center)
    const sourceAnchorPoint = anchor.sourceAnchorPoint || "center";
    const sourceOffset = this.getAnchorPointOffset(
      sourceAnchorPoint,
      dimensions.width,
      dimensions.height
    );

    // Final position = base anchor position + user offset - source anchor offset
    const finalX = baseX + (props.x || 0) - sourceOffset.x;
    const finalY = baseY + (props.y || 0) - sourceOffset.y;

    return { x: finalX, y: finalY };
  }

  /**
   * Calculate viewport anchor position
   * @param {string} position - Viewport position (e.g., "top-center")
   * @param {number} canvasWidth - Canvas width
   * @param {number} canvasHeight - Canvas height
   * @returns {Object} - { x, y } anchor position
   */
  static calculateViewportAnchor(position, canvasWidth, canvasHeight) {
    const anchor = VIEWPORT_ANCHORS[position];
    if (!anchor) {
      console.warn(`Unknown viewport anchor position: ${position}, defaulting to top-left`);
      return { x: 0, y: 0 };
    }
    return { x: anchor.x, y: anchor.y };
  }

  /**
   * Calculate element-to-element anchor position
   * @param {Object} element - The element being positioned
   * @param {Object} anchor - Anchor configuration
   * @param {Array} allElements - All elements
   * @param {number} canvasWidth - Canvas width
   * @param {number} canvasHeight - Canvas height
   * @returns {Object} - { x, y } anchor position
   */
  static calculateElementAnchor(element, anchor, allElements, canvasWidth, canvasHeight) {
    const targetElementId = anchor.targetElementId;

    // Validate target element exists
    if (!targetElementId) {
      console.warn("Element anchor has no target element ID, defaulting to center");
      return { x: canvasWidth / 2, y: canvasHeight / 2 };
    }

    const targetElement = allElements?.find(el => el.id === targetElementId);
    if (!targetElement) {
      console.warn(`Target element ${targetElementId} not found, defaulting to center`);
      return { x: canvasWidth / 2, y: canvasHeight / 2 };
    }

    // Detect circular references
    if (this.hasCircularAnchor(element, targetElement, allElements)) {
      console.error(`Circular anchor reference detected for element ${element.id}, defaulting to center`);
      return { x: canvasWidth / 2, y: canvasHeight / 2 };
    }

    // Get target element's position (recursively calculate if it's also anchored)
    const targetProps = targetElement.keyframes?.[0]?.properties || {};
    const targetAnchor = targetProps.anchor;

    let targetX, targetY;
    if (targetAnchor && targetAnchor.type !== "none") {
      // Recursively calculate target's position
      const targetPos = this.calculatePosition(targetElement, allElements, canvasWidth, canvasHeight);
      targetX = targetPos.x;
      targetY = targetPos.y;
    } else {
      // Target has absolute positioning
      targetX = targetProps.x || 0;
      targetY = targetProps.y || 0;
    }

    // Get target element dimensions
    const targetDimensions = this.getElementDimensions(targetElement);

    // Get target anchor point offset
    const targetAnchorPoint = anchor.targetAnchorPoint || "center";
    const targetOffset = this.getAnchorPointOffset(
      targetAnchorPoint,
      targetDimensions.width,
      targetDimensions.height
    );

    // Target anchor position = target's position + target anchor offset
    return {
      x: targetX + targetOffset.x,
      y: targetY + targetOffset.y
    };
  }

  /**
   * Get anchor point offset from element center
   * @param {string} anchorPoint - Anchor point (e.g., "top-left", "center")
   * @param {number} width - Element width
   * @param {number} height - Element height
   * @returns {Object} - { x, y } offset from center
   */
  static getAnchorPointOffset(anchorPoint, width, height) {
    const halfWidth = width / 2;
    const halfHeight = height / 2;

    const offsets = {
      "top-left": { x: -halfWidth, y: -halfHeight },
      "top-center": { x: 0, y: -halfHeight },
      "top-right": { x: halfWidth, y: -halfHeight },
      "center-left": { x: -halfWidth, y: 0 },
      "center": { x: 0, y: 0 },
      "center-right": { x: halfWidth, y: 0 },
      "bottom-left": { x: -halfWidth, y: halfHeight },
      "bottom-center": { x: 0, y: halfHeight },
      "bottom-right": { x: halfWidth, y: halfHeight }
    };

    return offsets[anchorPoint] || { x: 0, y: 0 };
  }

  /**
   * Get element dimensions based on element type
   * @param {Object} element - The element
   * @returns {Object} - { width, height }
   */
  static getElementDimensions(element) {
    const props = element.keyframes?.[0]?.properties || {};
    const type = element.type;

    // Text elements: use fontSize for approximate dimensions
    if (type === "text") {
      const fontSize = props.fontSize || 72;
      const text = props.text || "Text";
      // Approximate: 0.6 * fontSize per character width, fontSize for height
      const width = text.length * fontSize * 0.6;
      const height = fontSize;
      return { width, height };
    }

    // Image elements: use width/height properties
    if (type === "image") {
      const width = props.width || 200;
      const height = props.height || 200;
      return { width, height };
    }

    // Sound elements have no visual dimensions
    if (type === "sound") {
      return { width: 0, height: 0 };
    }

    // Default dimensions for unknown types
    return { width: 100, height: 100 };
  }

  /**
   * Check if anchoring creates a circular reference
   * @param {Object} element - The element being checked
   * @param {Object} targetElement - The target element
   * @param {Array} allElements - All elements
   * @returns {boolean} - True if circular reference exists
   */
  static hasCircularAnchor(element, targetElement, allElements) {
    const visited = new Set([element.id]);
    let current = targetElement;

    while (current) {
      // Check if we've seen this element before (circular reference)
      if (visited.has(current.id)) {
        return true;
      }

      visited.add(current.id);

      // Get current element's anchor
      const currentProps = current.keyframes?.[0]?.properties || {};
      const currentAnchor = currentProps.anchor;

      // If not anchored to an element, no circular reference possible
      if (!currentAnchor || currentAnchor.type !== "element") {
        return false;
      }

      // Get next element in chain
      const nextTargetId = currentAnchor.targetElementId;
      if (!nextTargetId) {
        return false;
      }

      current = allElements?.find(el => el.id === nextTargetId);

      // If target not found, chain ends (no circular reference)
      if (!current) {
        return false;
      }
    }

    return false;
  }
}
