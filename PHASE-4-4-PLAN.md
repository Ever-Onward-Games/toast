# Phase 4.4: Presentation Studio - Keyframe Animation System

> **Goal:** Build a professional keyframe animation studio for creating animated toast presentations with timeline-based editing, similar to After Effects or Adobe Animate

**Status:** Planning
**Started:** 2025-11-09
**Expected Duration:** 5-7 weeks
**Complexity:** High - Professional animation editor

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture: Player vs Studio](#architecture-player-vs-studio)
3. [Data Model](#data-model)
4. [Interactive Canvas](#interactive-canvas)
5. [Timeline & Keyframe System](#timeline--keyframe-system)
6. [Interpolation Engine](#interpolation-engine)
7. [Playback System](#playback-system)
8. [UI Layout](#ui-layout)
9. [Implementation Phases](#implementation-phases)
10. [Technical Specifications](#technical-specifications)

---

## Overview

### Vision

Transform Toast into a professional animation platform by adding a keyframe-based timeline editor. Users can:

- **Create animations visually** with no coding required
- **Manipulate elements** directly on canvas (drag, resize, rotate)
- **Set keyframes** at specific frames to define animation states
- **Preview animations** at 30fps with smooth interpolation
- **Toggle interpolation** between ease-in/out and linear
- **Export packages** that can be played back anywhere

### The Problem We're Solving

Currently, Toast requires users to:
- Write JavaScript code to create animations
- Manually specify animation properties
- Guess at timing and positioning values
- Test repeatedly to get desired effects

**Solution:** A visual editor where you see exactly what you're creating in real-time.

### Core Animation Principle

**Example:** If an element is at position (10,10) at Frame 7 and (100,10) at Frame 14, then (10,10) at Frame 16:
- Frames 7-14: Smoothly interpolates from (10,10) to (100,10) over 7 frames
- Frame 15: Snaps to (100,10)
- Frames 15-16: Snaps from (100,10) to (10,10) over 2 frames

This is keyframe-based animation - the system calculates all intermediate frames based on keyframe positions.

---

## Architecture: Player vs Studio

> **Note:** This describes the *eventual* architecture after Phase 8. For Phases 1-7, everything will be built in the existing Toast module.

### Module Split (Phase 8 - Optional)

Toast can eventually be split into two separate Foundry VTT modules:

#### **Toast Player** (Required)
- **Purpose:** Lightweight package playback only
- **Size:** Minimal - just rendering engine
- **Features:**
  - Play existing packages
  - Simple UI (play button, package selector)
  - Macro API for triggering toasts
  - Socket support for multiplayer
- **Users:** Everyone at the table
- **Performance:** Fast loading, minimal overhead

#### **Toast Studio** (Optional, requires Player)
- **Purpose:** Full animation creation and editing
- **Size:** Larger - includes editor UI and timeline system
- **Features:**
  - All Player features
  - Interactive canvas editor
  - Timeline with keyframe system
  - Property editors
  - Package management
  - Asset browser
- **Users:** GMs and content creators only
- **Performance:** Heavier, can be disabled during gameplay

### Why Split?

1. **Performance:** Players don't need the editor overhead
2. **Complexity:** Most users just want to play pre-made toasts
3. **Loading Times:** Editor UI adds significant load time
4. **Professional Use:** Content creators can enable full suite, players stay lightweight

### Module Dependencies

```
Toast Player (toast-player)
  └─ No dependencies
  └─ Contains: Core rendering, playback, simple UI, API

Toast Studio (toast-studio)
  └─ Requires: toast-player
  └─ Contains: Editor, timeline, canvas, animation tools
```

---

## Data Model

### Package Format with Keyframes

```javascript
{
  id: "critical-hit-animated",
  name: "Critical Hit (Animated)",
  description: "Animated critical hit celebration",
  author: "GM Name",
  category: "combat",
  scope: "world",
  tags: ["combat", "critical", "animated"],

  // Animation metadata
  animation: {
    duration: 90,        // Total frames (3 seconds at 30fps)
    fps: 30,             // Frame rate
    width: 1920,         // Canvas width
    height: 1080         // Canvas height
  },

  // Elements in the animation
  elements: [
    {
      id: "text-1",
      name: "Critical Hit Text",
      type: "text",
      text: "CRITICAL HIT!",

      // Keyframes define this element's animation
      keyframes: [
        {
          frame: 0,
          properties: {
            x: 960,           // Center X
            y: 540,           // Center Y
            rotation: 0,      // Degrees
            scale: 0.5,       // 50% size
            opacity: 0,       // Invisible
            fontSize: 120,
            color: "#ff0000"
          },
          interpolation: "ease-out"  // How to interpolate TO this keyframe
        },
        {
          frame: 15,
          properties: {
            x: 960,
            y: 540,
            rotation: 0,
            scale: 1.2,       // Overshoot
            opacity: 1,       // Fully visible
            fontSize: 120,
            color: "#ff0000"
          },
          interpolation: "ease-out"
        },
        {
          frame: 30,
          properties: {
            x: 960,
            y: 540,
            rotation: 0,
            scale: 1.0,       // Settle to normal
            opacity: 1,
            fontSize: 120,
            color: "#ff0000"
          },
          interpolation: "ease-in-out"
        },
        {
          frame: 75,
          properties: {
            x: 960,
            y: 540,
            rotation: 0,
            scale: 1.0,
            opacity: 1,       // Hold
            fontSize: 120,
            color: "#ff0000"
          },
          interpolation: "linear"
        },
        {
          frame: 90,
          properties: {
            x: 960,
            y: 300,           // Move up
            rotation: 0,
            scale: 0.8,       // Shrink
            opacity: 0,       // Fade out
            fontSize: 120,
            color: "#ff0000"
          },
          interpolation: "ease-in"
        }
      ]
    },
    {
      id: "image-1",
      name: "Explosion Background",
      type: "image",
      src: "modules/toast/assets/explosion.webp",

      keyframes: [
        {
          frame: 0,
          properties: {
            x: 960,
            y: 540,
            rotation: 0,
            scale: 0,
            opacity: 0,
            width: 800,
            height: 800
          },
          interpolation: "ease-out"
        },
        {
          frame: 10,
          properties: {
            x: 960,
            y: 540,
            rotation: 360,    // Spin
            scale: 1.5,
            opacity: 0.8,
            width: 800,
            height: 800
          },
          interpolation: "linear"
        },
        {
          frame: 60,
          properties: {
            x: 960,
            y: 540,
            rotation: 360,
            scale: 1.5,
            opacity: 0.8,
            width: 800,
            height: 800
          },
          interpolation: "ease-in"
        },
        {
          frame: 90,
          properties: {
            x: 960,
            y: 540,
            rotation: 360,
            scale: 2.0,
            opacity: 0,
            width: 800,
            height: 800
          },
          interpolation: "ease-in"
        }
      ]
    },
    {
      id: "sound-1",
      name: "Impact Sound",
      type: "sound",
      src: "modules/toast/assets/impact.wav",

      // Sounds use simpler keyframe structure
      keyframes: [
        {
          frame: 5,           // Play at frame 5
          properties: {
            volume: 0.8,
            play: true
          }
        }
      ]
    }
  ]
}
```

### Keyframe Structure

```typescript
interface Keyframe {
  frame: number;              // Frame number (0-based)
  properties: {
    // Universal properties (all visual elements)
    x?: number;               // Pixel position from left
    y?: number;               // Pixel position from top
    rotation?: number;        // Degrees (0-360)
    scale?: number;           // Scale multiplier (1.0 = 100%)
    opacity?: number;         // Opacity (0-1)

    // Text-specific properties
    fontSize?: number;        // Font size in pixels
    color?: string;           // CSS color (#rrggbb)
    fontWeight?: string;      // "normal" | "bold"
    textShadow?: string;      // CSS text-shadow
    letterSpacing?: number;   // Letter spacing in pixels

    // Image-specific properties
    width?: number;           // Image width in pixels
    height?: number;          // Image height in pixels
    filter?: string;          // CSS filters

    // Sound-specific properties
    volume?: number;          // Volume (0-1)
    play?: boolean;           // Trigger playback
  };
  interpolation: "linear" | "ease-in" | "ease-out" | "ease-in-out";
}
```

### Element Base Structure

```typescript
interface Element {
  id: string;                 // Unique element ID
  name: string;               // Display name in timeline
  type: "text" | "image" | "sound";
  keyframes: Keyframe[];      // Sorted by frame number

  // Type-specific static properties
  text?: string;              // For text elements
  src?: string;               // For image/sound elements

  // UI state (not saved to package)
  locked?: boolean;           // Prevent editing
  visible?: boolean;          // Show/hide in editor
  collapsed?: boolean;        // Collapse timeline track
}
```

### Animation Metadata

```typescript
interface AnimationConfig {
  duration: number;           // Total frames
  fps: number;                // Frame rate (30 recommended)
  width: number;              // Canvas width (1920 recommended)
  height: number;             // Canvas height (1080 recommended)
  backgroundColor?: string;   // Optional background color
}
```

---

## Interactive Canvas

### Canvas Features

The canvas is where users visually compose their animation. It provides:

1. **Direct manipulation** - Click and drag elements
2. **Transform controls** - Resize, rotate, move handles
3. **Selection feedback** - Highlight selected elements
4. **Multi-select** - Shift+click to select multiple
5. **Scrubbing** - See animation at any frame
6. **Grid/guides** - Optional alignment helpers

### Selection System

#### Single Selection
- Click element to select
- Show transform controls (bounding box with handles)
- Show element name tooltip
- Highlight element in timeline

#### Multi-Selection
- Shift+click to add to selection
- Ctrl+click to toggle selection
- Drag marquee to select area
- Transform all selected elements together

#### Selection Visual Feedback

```
┌─────────────────────────────────────────┐
│                                         │
│      ┌──────────────────────┐          │
│      │  ⬜ CRITICAL HIT! ⬜  │ ← Selected element
│      │         ⬛            │ ← Rotation handle
│      └──────────────────────┘          │
│        ↖                 ↗              │
│      Resize           Resize            │
│                                         │
│      [Explosion Image]  ← Unselected   │
│                                         │
└─────────────────────────────────────────┘
```

### Transform Controls

#### Move Handle (Entire Bounding Box)
- **Action:** Drag anywhere inside bounding box
- **Effect:** Translates element (changes x, y)
- **Cursor:** Move cursor (four arrows)
- **Constraint:** Hold Shift to lock to horizontal/vertical axis

#### Resize Handles (Corners and Edges)
- **Location:** 4 corners + 4 edge midpoints (8 handles total)
- **Action:** Drag handle
- **Effect:** Changes scale OR width/height depending on element type
  - Text: Changes scale (maintains aspect ratio)
  - Image: Can change width/height independently
- **Cursor:** Resize cursors (diagonal or horizontal/vertical)
- **Constraint:** Hold Shift to maintain aspect ratio

#### Rotation Handle (Top Center)
- **Location:** Above bounding box center
- **Action:** Drag in circular motion
- **Effect:** Rotates element around center point
- **Cursor:** Rotation cursor
- **Constraint:** Hold Shift to snap to 15° increments
- **Visual:** Shows rotation angle tooltip while dragging

### Transform Handle Implementation

```javascript
/**
 * Transform controls for selected element
 */
class TransformControls {
  constructor(element, canvas) {
    this.element = element;
    this.canvas = canvas;
    this.handles = [];

    this.createHandles();
  }

  /**
   * Create all transform handles
   */
  createHandles() {
    // 8 resize handles: 4 corners + 4 edges
    const positions = [
      { x: 0, y: 0, cursor: 'nw-resize', type: 'corner' },     // Top-left
      { x: 0.5, y: 0, cursor: 'n-resize', type: 'edge' },       // Top-middle
      { x: 1, y: 0, cursor: 'ne-resize', type: 'corner' },      // Top-right
      { x: 1, y: 0.5, cursor: 'e-resize', type: 'edge' },       // Middle-right
      { x: 1, y: 1, cursor: 'se-resize', type: 'corner' },      // Bottom-right
      { x: 0.5, y: 1, cursor: 's-resize', type: 'edge' },       // Bottom-middle
      { x: 0, y: 1, cursor: 'sw-resize', type: 'corner' },      // Bottom-left
      { x: 0, y: 0.5, cursor: 'w-resize', type: 'edge' }        // Middle-left
    ];

    positions.forEach(pos => {
      this.handles.push(new ResizeHandle(pos, this));
    });

    // Rotation handle (above top-middle)
    this.rotationHandle = new RotationHandle(this);
  }

  /**
   * Update handle positions based on element transform
   */
  update() {
    const bounds = this.element.getBounds();

    this.handles.forEach(handle => {
      handle.updatePosition(bounds);
    });

    this.rotationHandle.updatePosition(bounds);
  }

  /**
   * Render handles to canvas
   */
  render(ctx) {
    const bounds = this.element.getBounds();

    // Draw bounding box
    ctx.strokeStyle = '#00aaff';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
    ctx.setLineDash([]);

    // Draw handles
    this.handles.forEach(handle => handle.render(ctx));
    this.rotationHandle.render(ctx);
  }
}

/**
 * Resize handle
 */
class ResizeHandle {
  constructor(position, controls) {
    this.position = position;  // { x: 0-1, y: 0-1 }
    this.controls = controls;
    this.size = 8;  // Handle size in pixels
  }

  updatePosition(bounds) {
    this.x = bounds.x + bounds.width * this.position.x;
    this.y = bounds.y + bounds.height * this.position.y;
  }

  render(ctx) {
    ctx.fillStyle = '#00aaff';
    ctx.fillRect(
      this.x - this.size / 2,
      this.y - this.size / 2,
      this.size,
      this.size
    );
  }

  containsPoint(x, y) {
    return Math.abs(x - this.x) <= this.size / 2 &&
           Math.abs(y - this.y) <= this.size / 2;
  }

  onDrag(dx, dy, shiftKey) {
    // Calculate new size based on drag
    // Update element properties
    // Create/update keyframe at current frame
  }
}

/**
 * Rotation handle
 */
class RotationHandle {
  constructor(controls) {
    this.controls = controls;
    this.radius = 6;
    this.offset = 30;  // Distance above bounding box
  }

  updatePosition(bounds) {
    this.x = bounds.x + bounds.width / 2;
    this.y = bounds.y - this.offset;
    this.centerX = bounds.x + bounds.width / 2;
    this.centerY = bounds.y + bounds.height / 2;
  }

  render(ctx) {
    // Draw line from box to handle
    ctx.strokeStyle = '#00aaff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.centerX, this.centerY);
    ctx.lineTo(this.x, this.y);
    ctx.stroke();

    // Draw circular handle
    ctx.fillStyle = '#00ff00';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  containsPoint(x, y) {
    const dx = x - this.x;
    const dy = y - this.y;
    return Math.sqrt(dx * dx + dy * dy) <= this.radius;
  }

  onDrag(x, y, shiftKey) {
    // Calculate angle from center to cursor
    const angle = Math.atan2(y - this.centerY, x - this.centerX);
    let degrees = angle * 180 / Math.PI + 90;

    // Snap to 15° increments if shift held
    if (shiftKey) {
      degrees = Math.round(degrees / 15) * 15;
    }

    // Update element rotation
    // Create/update keyframe at current frame
  }
}
```

### Keyframe Creation on Transform

When user transforms an element on the canvas:

1. **Check current frame** - What frame is the playhead on?
2. **Check for existing keyframe** - Does element have keyframe at this frame?
3. **Create or update keyframe:**
   - If keyframe exists: Update its properties
   - If no keyframe: Create new keyframe with current properties
4. **Update timeline UI** - Show new keyframe marker

```javascript
/**
 * Update element property and create/update keyframe
 */
function updateElementProperty(element, property, value, currentFrame) {
  // Find or create keyframe at current frame
  let keyframe = element.keyframes.find(kf => kf.frame === currentFrame);

  if (!keyframe) {
    // Create new keyframe with current frame's interpolated values
    keyframe = {
      frame: currentFrame,
      properties: getInterpolatedProperties(element, currentFrame),
      interpolation: "ease-in-out"  // Default
    };
    element.keyframes.push(keyframe);
    element.keyframes.sort((a, b) => a.frame - b.frame);
  }

  // Update property
  keyframe.properties[property] = value;

  // Trigger timeline re-render
  timeline.render();
}
```

### Canvas Coordinate System

```
Canvas: 1920x1080 (logical pixels)

(0, 0) ──────────────────────────── (1920, 0)
  │                                     │
  │         (960, 540) Center          │
  │              ⊕                      │
  │                                     │
(0, 1080) ─────────────────────── (1920, 1080)
```

- **Origin:** Top-left corner (0, 0)
- **Units:** Pixels
- **Coordinate system:** Standard web (Y increases downward)
- **Element positioning:** By center point (x, y = element center)

### Canvas Rendering

The canvas needs to render at different states:

1. **At rest:** Show all elements at current frame
2. **While transforming:** Show transform with handles
3. **While scrubbing:** Update all elements as playhead moves
4. **While playing:** Render at 30fps

```javascript
/**
 * Canvas renderer
 */
class StudioCanvas {
  constructor(container, width, height) {
    this.container = container;
    this.width = width;
    this.height = height;

    // Create canvas element
    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx = this.canvas.getContext('2d');

    container.appendChild(this.canvas);

    // State
    this.currentFrame = 0;
    this.selectedElements = [];
    this.transformControls = null;
  }

  /**
   * Render canvas at current frame
   */
  render() {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Background
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Render all elements at current frame
    game.toast.studio.elements.forEach(element => {
      this.renderElement(element, this.currentFrame);
    });

    // Render transform controls if element selected
    if (this.selectedElements.length > 0) {
      this.selectedElements.forEach(element => {
        const controls = new TransformControls(element, this);
        controls.render(this.ctx);
      });
    }
  }

  /**
   * Render single element at specific frame
   */
  renderElement(element, frame) {
    // Get interpolated properties for this frame
    const props = interpolateProperties(element, frame);

    this.ctx.save();

    // Apply transforms
    this.ctx.translate(props.x, props.y);
    this.ctx.rotate(props.rotation * Math.PI / 180);
    this.ctx.scale(props.scale, props.scale);
    this.ctx.globalAlpha = props.opacity;

    // Render based on type
    if (element.type === 'text') {
      this.renderText(element, props);
    } else if (element.type === 'image') {
      this.renderImage(element, props);
    }

    this.ctx.restore();
  }

  /**
   * Render text element
   */
  renderText(element, props) {
    this.ctx.font = `${props.fontWeight || 'normal'} ${props.fontSize}px Arial`;
    this.ctx.fillStyle = props.color;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    if (props.textShadow) {
      // Parse and apply text shadow
      // Example: "2px 2px 4px #000000"
    }

    this.ctx.fillText(element.text, 0, 0);
  }

  /**
   * Render image element
   */
  renderImage(element, props) {
    if (!element.imageElement) {
      // Load image if not cached
      element.imageElement = new Image();
      element.imageElement.src = element.src;
    }

    if (element.imageElement.complete) {
      const w = props.width || element.imageElement.width;
      const h = props.height || element.imageElement.height;

      this.ctx.drawImage(
        element.imageElement,
        -w / 2,  // Draw from center
        -h / 2,
        w,
        h
      );
    }
  }
}
```

---

## Timeline & Keyframe System

### Timeline UI Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Timeline                                                 [30 FPS] [90 frames]│
├─────────────┬───────────────────────────────────────────────────────────────┤
│ Elements    │ Frame Markers (every 10 frames)                                │
│             │ 0    10   20   30   40   50   60   70   80   90                │
│             │ ├────┼────┼────┼────┼────┼────┼────┼────┼────┤                │
├─────────────┼───────────────────────────────────────────────────────────────┤
│ 📝 Text 1   │ ◆────────◆─────◆──────────────────◆──────◆     │ ← Keyframes  │
│             │ │████████│█████│                  │      │     │ ← Fill        │
├─────────────┼───────────────────────────────────────────────────────────────┤
│ 🖼️ Image 1  │ ◆─────◆──────────────────────────◆──────◆     │              │
│             │ │█████│                          │      │     │              │
├─────────────┼───────────────────────────────────────────────────────────────┤
│ 🔊 Sound 1  │ ────◆─────────────────────────────────────     │              │
│             │     ▶                                          │              │
├─────────────┼───────────────────────────────────────────────────────────────┤
│             │     ▲ ← Playhead (current frame)                               │
└─────────────┴───────────────────────────────────────────────────────────────┘
│ [◀◀] [◀] [▶] [▶▶] [●]  Frame: 15 / 90                                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Timeline Features

#### Playhead
- **Visual:** Vertical red line spanning all tracks
- **Interaction:** Drag to scrub through animation
- **Indicator:** Shows current frame number
- **Snap:** Holds Shift to snap to keyframes

#### Frame Ruler
- **Marks:** Show frame numbers every 10 frames
- **Sub-marks:** Tick marks every 5 frames
- **Current frame:** Highlighted
- **Click:** Jump playhead to frame

#### Element Tracks
- **One track per element**
- **Shows element name and icon**
- **Displays keyframe diamonds (◆)**
- **Fill between keyframes** to show interpolation span
- **Color-coded** based on element type

#### Keyframe Markers
- **Diamond shape (◆)**
- **Positioned at exact frame**
- **Color:** Based on interpolation type
  - Linear: Blue
  - Ease-in: Green
  - Ease-out: Yellow
  - Ease-in-out: Purple
- **Interaction:**
  - Click: Select keyframe
  - Drag: Move keyframe to different frame
  - Right-click: Keyframe menu (delete, change interpolation)

#### Transport Controls
- **Play/Pause:** Play animation from current frame
- **Step Forward/Back:** Move playhead by 1 frame
- **Jump to Start/End:** Move playhead to frame 0 or last frame
- **Record Mode:** Auto-create keyframes on any property change

### Timeline Data Structure

```javascript
/**
 * Timeline state
 */
class Timeline {
  constructor() {
    this.fps = 30;
    this.duration = 90;  // frames
    this.currentFrame = 0;
    this.playing = false;
    this.recordMode = false;

    this.zoom = 1.0;  // Zoom level (1.0 = normal)
    this.scrollOffset = 0;  // Horizontal scroll

    this.selectedKeyframes = [];  // Array of {elementId, frame}
  }

  /**
   * Get time in seconds for a frame
   */
  frameToTime(frame) {
    return frame / this.fps;
  }

  /**
   * Get frame for a time in seconds
   */
  timeToFrame(time) {
    return Math.floor(time * this.fps);
  }

  /**
   * Move playhead to frame
   */
  seekToFrame(frame) {
    this.currentFrame = Math.max(0, Math.min(frame, this.duration));

    // Update canvas
    game.toast.studio.canvas.currentFrame = this.currentFrame;
    game.toast.studio.canvas.render();
  }

  /**
   * Play animation
   */
  play() {
    if (this.playing) return;

    this.playing = true;
    const startFrame = this.currentFrame;
    const startTime = performance.now();

    const tick = () => {
      if (!this.playing) return;

      const elapsed = (performance.now() - startTime) / 1000;
      const newFrame = startFrame + this.timeToFrame(elapsed);

      if (newFrame >= this.duration) {
        this.playing = false;
        this.seekToFrame(this.duration);
      } else {
        this.seekToFrame(newFrame);
        requestAnimationFrame(tick);
      }
    };

    requestAnimationFrame(tick);
  }

  /**
   * Pause animation
   */
  pause() {
    this.playing = false;
  }

  /**
   * Step forward one frame
   */
  stepForward() {
    this.seekToFrame(this.currentFrame + 1);
  }

  /**
   * Step back one frame
   */
  stepBack() {
    this.seekToFrame(this.currentFrame - 1);
  }
}
```

### Keyframe Editing

#### Creating Keyframes

**Method 1: Transform on Canvas**
- Move/resize/rotate element on canvas
- System auto-creates keyframe at current frame

**Method 2: Timeline Click**
- Click on element track at desired frame
- Creates keyframe with current interpolated values

**Method 3: Property Panel**
- Change value in property panel
- If record mode on, creates keyframe automatically

#### Moving Keyframes

- **Drag horizontally:** Move to different frame
- **Snap to grid:** Hold Shift while dragging
- **Multi-select:** Drag multiple keyframes together
- **Validation:** Can't move keyframe past adjacent keyframes

#### Deleting Keyframes

- **Select keyframe:** Click diamond
- **Press Delete** or right-click → Delete
- **Validation:** Must keep at least 2 keyframes per element
- **Effect:** Interpolation extends from previous to next keyframe

#### Changing Interpolation

- **Right-click keyframe:** Show context menu
- **Select interpolation type:**
  - Linear
  - Ease-in
  - Ease-out
  - Ease-in-out
- **Visual feedback:** Keyframe color changes

### Timeline Rendering

```javascript
/**
 * Render timeline UI
 */
class TimelineRenderer {
  constructor(container, timeline) {
    this.container = container;
    this.timeline = timeline;

    // Create canvas for timeline
    this.canvas = document.createElement('canvas');
    this.canvas.width = 1200;
    this.canvas.height = 400;
    this.ctx = this.canvas.getContext('2d');

    container.appendChild(this.canvas);
  }

  render() {
    // Clear
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Render frame ruler
    this.renderFrameRuler();

    // Render element tracks
    game.toast.studio.elements.forEach((element, index) => {
      this.renderTrack(element, index);
    });

    // Render playhead
    this.renderPlayhead();
  }

  renderFrameRuler() {
    const rulerHeight = 30;
    const frameWidth = this.getFrameWidth();

    this.ctx.fillStyle = '#2a2a2a';
    this.ctx.fillRect(0, 0, this.canvas.width, rulerHeight);

    // Frame markers
    for (let frame = 0; frame <= this.timeline.duration; frame += 10) {
      const x = this.frameToX(frame);

      // Major tick
      this.ctx.strokeStyle = '#ffffff';
      this.ctx.beginPath();
      this.ctx.moveTo(x, rulerHeight - 10);
      this.ctx.lineTo(x, rulerHeight);
      this.ctx.stroke();

      // Frame number
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = '12px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(frame.toString(), x, 15);
    }

    // Minor ticks (every 5 frames)
    for (let frame = 5; frame <= this.timeline.duration; frame += 5) {
      if (frame % 10 === 0) continue;  // Skip major ticks

      const x = this.frameToX(frame);
      this.ctx.strokeStyle = '#888888';
      this.ctx.beginPath();
      this.ctx.moveTo(x, rulerHeight - 5);
      this.ctx.lineTo(x, rulerHeight);
      this.ctx.stroke();
    }
  }

  renderTrack(element, index) {
    const trackY = 30 + index * 50;  // 50px per track
    const trackHeight = 40;

    // Background
    this.ctx.fillStyle = index % 2 === 0 ? '#1a1a1a' : '#222222';
    this.ctx.fillRect(0, trackY, this.canvas.width, trackHeight);

    // Element name
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 14px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(element.name, 10, trackY + 20);

    // Render keyframe spans (fills between keyframes)
    for (let i = 0; i < element.keyframes.length - 1; i++) {
      const kf1 = element.keyframes[i];
      const kf2 = element.keyframes[i + 1];

      const x1 = this.frameToX(kf1.frame);
      const x2 = this.frameToX(kf2.frame);

      // Fill based on interpolation type
      const color = this.getInterpolationColor(kf2.interpolation);
      this.ctx.fillStyle = color + '33';  // Add alpha
      this.ctx.fillRect(x1, trackY + 5, x2 - x1, trackHeight - 10);
    }

    // Render keyframe markers
    element.keyframes.forEach(kf => {
      const x = this.frameToX(kf.frame);
      const color = this.getInterpolationColor(kf.interpolation);

      // Diamond shape
      this.ctx.fillStyle = color;
      this.ctx.beginPath();
      this.ctx.moveTo(x, trackY + 10);          // Top
      this.ctx.lineTo(x + 6, trackY + 20);      // Right
      this.ctx.lineTo(x, trackY + 30);          // Bottom
      this.ctx.lineTo(x - 6, trackY + 20);      // Left
      this.ctx.closePath();
      this.ctx.fill();

      // Outline if selected
      if (this.isKeyframeSelected(element.id, kf.frame)) {
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
      }
    });
  }

  renderPlayhead() {
    const x = this.frameToX(this.timeline.currentFrame);

    // Red vertical line
    this.ctx.strokeStyle = '#ff0000';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(x, 0);
    this.ctx.lineTo(x, this.canvas.height);
    this.ctx.stroke();

    // Playhead handle at top
    this.ctx.fillStyle = '#ff0000';
    this.ctx.beginPath();
    this.ctx.moveTo(x, 0);
    this.ctx.lineTo(x - 8, 15);
    this.ctx.lineTo(x + 8, 15);
    this.ctx.closePath();
    this.ctx.fill();
  }

  /**
   * Convert frame number to X coordinate
   */
  frameToX(frame) {
    const frameWidth = (this.canvas.width - 200) / this.timeline.duration;
    return 200 + frame * frameWidth * this.timeline.zoom - this.timeline.scrollOffset;
  }

  /**
   * Convert X coordinate to frame number
   */
  xToFrame(x) {
    const frameWidth = (this.canvas.width - 200) / this.timeline.duration;
    return Math.round((x - 200 + this.timeline.scrollOffset) / (frameWidth * this.timeline.zoom));
  }

  /**
   * Get color for interpolation type
   */
  getInterpolationColor(type) {
    switch (type) {
      case 'linear': return '#0088ff';
      case 'ease-in': return '#00ff88';
      case 'ease-out': return '#ffff00';
      case 'ease-in-out': return '#ff00ff';
      default: return '#888888';
    }
  }

  isKeyframeSelected(elementId, frame) {
    return this.timeline.selectedKeyframes.some(
      kf => kf.elementId === elementId && kf.frame === frame
    );
  }
}
```

---

## Interpolation Engine

### Overview

The interpolation engine calculates property values for any frame based on keyframes. This is the core of the animation system.

### Interpolation Types

#### 1. Linear
- **Formula:** `value = start + (end - start) * t`
- **Behavior:** Constant speed from start to end
- **Use case:** Mechanical movements, sliding text

#### 2. Ease-In
- **Formula:** `value = start + (end - start) * t²`
- **Behavior:** Starts slow, accelerates
- **Use case:** Falling objects, fading out

#### 3. Ease-Out
- **Formula:** `value = start + (end - start) * (1 - (1-t)²)`
- **Behavior:** Starts fast, decelerates
- **Use case:** Bouncing into place, fading in

#### 4. Ease-In-Out
- **Formula:** `value = start + (end - start) * smoothstep(t)`
  - Where `smoothstep(t) = 3t² - 2t³`
- **Behavior:** Starts slow, speeds up, slows down
- **Use case:** Natural motion, most animations

### Implementation

```javascript
/**
 * Interpolation functions
 */
const Interpolation = {
  /**
   * Linear interpolation
   */
  linear(t) {
    return t;
  },

  /**
   * Ease-in (quadratic)
   */
  easeIn(t) {
    return t * t;
  },

  /**
   * Ease-out (quadratic)
   */
  easeOut(t) {
    return 1 - (1 - t) * (1 - t);
  },

  /**
   * Ease-in-out (smoothstep)
   */
  easeInOut(t) {
    return t < 0.5
      ? 2 * t * t
      : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }
};

/**
 * Get interpolation function by name
 */
function getInterpolationFunction(type) {
  switch (type) {
    case 'ease-in': return Interpolation.easeIn;
    case 'ease-out': return Interpolation.easeOut;
    case 'ease-in-out': return Interpolation.easeInOut;
    default: return Interpolation.linear;
  }
}

/**
 * Interpolate single property value between two keyframes
 */
function interpolateValue(startValue, endValue, t, interpolationType) {
  const fn = getInterpolationFunction(interpolationType);
  const easedT = fn(t);

  return startValue + (endValue - startValue) * easedT;
}

/**
 * Get interpolated properties for an element at a specific frame
 */
function interpolateProperties(element, frame) {
  // Find surrounding keyframes
  const { before, after } = findSurroundingKeyframes(element.keyframes, frame);

  // If no keyframes, return defaults
  if (!before && !after) {
    return getDefaultProperties(element);
  }

  // If before frame, use first keyframe
  if (!before) {
    return { ...after.properties };
  }

  // If after last frame, use last keyframe
  if (!after) {
    return { ...before.properties };
  }

  // If exactly on keyframe, return its properties
  if (before.frame === frame) {
    return { ...before.properties };
  }

  // Interpolate between keyframes
  const totalFrames = after.frame - before.frame;
  const elapsed = frame - before.frame;
  const t = elapsed / totalFrames;  // 0 to 1

  const interpolationType = after.interpolation;

  // Interpolate each property
  const result = {};
  const allProps = new Set([
    ...Object.keys(before.properties),
    ...Object.keys(after.properties)
  ]);

  allProps.forEach(prop => {
    const startValue = before.properties[prop];
    const endValue = after.properties[prop];

    // Handle different property types
    if (typeof startValue === 'number' && typeof endValue === 'number') {
      // Numeric interpolation
      result[prop] = interpolateValue(startValue, endValue, t, interpolationType);
    } else if (prop === 'color') {
      // Color interpolation
      result[prop] = interpolateColor(startValue, endValue, t, interpolationType);
    } else {
      // Non-interpolatable (string, boolean) - use endpoint
      result[prop] = t < 1 ? startValue : endValue;
    }
  });

  return result;
}

/**
 * Find keyframes surrounding a frame
 */
function findSurroundingKeyframes(keyframes, frame) {
  let before = null;
  let after = null;

  for (let i = 0; i < keyframes.length; i++) {
    if (keyframes[i].frame <= frame) {
      before = keyframes[i];
    }
    if (keyframes[i].frame >= frame && !after) {
      after = keyframes[i];
    }
  }

  return { before, after };
}

/**
 * Interpolate between two colors
 */
function interpolateColor(startColor, endColor, t, interpolationType) {
  const fn = getInterpolationFunction(interpolationType);
  const easedT = fn(t);

  // Parse colors (assume #rrggbb format)
  const start = {
    r: parseInt(startColor.substr(1, 2), 16),
    g: parseInt(startColor.substr(3, 2), 16),
    b: parseInt(startColor.substr(5, 2), 16)
  };

  const end = {
    r: parseInt(endColor.substr(1, 2), 16),
    g: parseInt(endColor.substr(3, 2), 16),
    b: parseInt(endColor.substr(5, 2), 16)
  };

  // Interpolate each channel
  const r = Math.round(start.r + (end.r - start.r) * easedT);
  const g = Math.round(start.g + (end.g - start.g) * easedT);
  const b = Math.round(start.b + (end.b - start.b) * easedT);

  // Convert back to hex
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Get default properties for an element
 */
function getDefaultProperties(element) {
  return {
    x: 960,
    y: 540,
    rotation: 0,
    scale: 1,
    opacity: 1,
    fontSize: 72,
    color: '#ffffff',
    fontWeight: 'normal',
    width: 200,
    height: 200
  };
}
```

### Interpolation Example

Given keyframes:
```javascript
[
  { frame: 0, properties: { x: 10 }, interpolation: 'ease-out' },
  { frame: 7, properties: { x: 100 }, interpolation: 'linear' },
  { frame: 14, properties: { x: 10 }, interpolation: 'linear' }
]
```

At frame 3:
- Between frames 0 and 7
- t = 3 / 7 = 0.428
- interpolation = 'ease-out' (from frame 7 keyframe)
- easedT = 1 - (1 - 0.428)² = 0.673
- x = 10 + (100 - 10) * 0.673 = 70.5

At frame 10:
- Between frames 7 and 14
- t = 3 / 7 = 0.428
- interpolation = 'linear'
- easedT = 0.428
- x = 100 + (10 - 100) * 0.428 = 61.5

---

## Playback System

### Player Rendering (Toast Player Module)

The Toast Player is a lightweight module that just renders animations. It doesn't need the timeline editor, transform controls, or any editing features.

```javascript
/**
 * Toast Player - Minimal playback system
 */
class ToastPlayer {
  constructor() {
    this.activeToast = null;
    this.canvas = null;
    this.ctx = null;
    this.animationFrame = null;
  }

  /**
   * Play a toast package
   */
  async play(packageOrElements, options = {}) {
    // If already playing, queue or replace
    if (this.activeToast) {
      if (options.queue) {
        // TODO: Implement queue
      } else {
        this.stop();
      }
    }

    // Parse package
    let elements, config;
    if (Array.isArray(packageOrElements)) {
      // Legacy format: just elements
      elements = packageOrElements;
      config = {
        duration: 90,
        fps: 30,
        width: 1920,
        height: 1080
      };
    } else {
      // Package format
      elements = packageOrElements.elements;
      config = packageOrElements.animation;
    }

    // Create overlay
    this.createOverlay(config.width, config.height);

    // Start playback
    const startTime = performance.now();
    const frameDuration = 1000 / config.fps;

    const tick = () => {
      const elapsed = performance.now() - startTime;
      const currentFrame = Math.floor(elapsed / frameDuration);

      if (currentFrame >= config.duration) {
        this.stop();
        return;
      }

      this.renderFrame(elements, currentFrame);
      this.animationFrame = requestAnimationFrame(tick);
    };

    this.animationFrame = requestAnimationFrame(tick);
  }

  /**
   * Stop current toast
   */
  stop() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }

    this.canvas = null;
    this.ctx = null;
    this.activeToast = null;
  }

  /**
   * Create full-screen overlay
   */
  createOverlay(width, height) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.canvas.style.position = 'fixed';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.width = '100vw';
    this.canvas.style.height = '100vh';
    this.canvas.style.zIndex = '10000';
    this.canvas.style.pointerEvents = 'none';

    this.ctx = this.canvas.getContext('2d');

    // Scale factor for responsive rendering
    this.scaleX = window.innerWidth / width;
    this.scaleY = window.innerHeight / height;

    document.body.appendChild(this.canvas);
  }

  /**
   * Render single frame
   */
  renderFrame(elements, frame) {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Apply scaling
    this.ctx.save();
    this.ctx.scale(this.scaleX, this.scaleY);

    // Render each element
    elements.forEach(element => {
      this.renderElement(element, frame);
    });

    this.ctx.restore();
  }

  /**
   * Render single element at frame
   */
  renderElement(element, frame) {
    // Get interpolated properties
    const props = interpolateProperties(element, frame);

    this.ctx.save();

    // Apply transforms
    this.ctx.translate(props.x, props.y);
    this.ctx.rotate(props.rotation * Math.PI / 180);
    this.ctx.scale(props.scale, props.scale);
    this.ctx.globalAlpha = props.opacity;

    // Render based on type
    if (element.type === 'text') {
      this.renderText(element, props);
    } else if (element.type === 'image') {
      this.renderImage(element, props);
    } else if (element.type === 'sound') {
      this.renderSound(element, props, frame);
    }

    this.ctx.restore();
  }

  /**
   * Render text element
   */
  renderText(element, props) {
    this.ctx.font = `${props.fontWeight || 'normal'} ${props.fontSize}px Arial`;
    this.ctx.fillStyle = props.color;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    // Text shadow
    if (props.textShadow) {
      // Parse: "2px 2px 4px #000000"
      const parts = props.textShadow.split(' ');
      this.ctx.shadowOffsetX = parseInt(parts[0]);
      this.ctx.shadowOffsetY = parseInt(parts[1]);
      this.ctx.shadowBlur = parseInt(parts[2]);
      this.ctx.shadowColor = parts[3];
    }

    this.ctx.fillText(element.text, 0, 0);
  }

  /**
   * Render image element
   */
  renderImage(element, props) {
    if (!element._cachedImage) {
      element._cachedImage = new Image();
      element._cachedImage.src = element.src;
    }

    if (element._cachedImage.complete) {
      const w = props.width || element._cachedImage.width;
      const h = props.height || element._cachedImage.height;

      // Apply filters if specified
      if (props.filter) {
        this.ctx.filter = props.filter;
      }

      this.ctx.drawImage(
        element._cachedImage,
        -w / 2,
        -h / 2,
        w,
        h
      );

      this.ctx.filter = 'none';
    }
  }

  /**
   * Handle sound playback
   */
  renderSound(element, props, frame) {
    // Check if this frame has a 'play' trigger
    const keyframe = element.keyframes.find(kf => kf.frame === frame);

    if (keyframe && keyframe.properties.play) {
      if (!element._cachedAudio) {
        element._cachedAudio = new Audio(element.src);
      }

      element._cachedAudio.volume = props.volume || 0.8;
      element._cachedAudio.currentTime = 0;
      element._cachedAudio.play().catch(err => {
        console.error('Failed to play sound:', err);
      });
    }
  }
}

// Global instance
game.toast = new ToastPlayer();
```

### Studio Preview

The Studio has a similar playback system but renders to the editor canvas instead of full-screen:

```javascript
/**
 * Studio preview system
 */
class StudioPreview {
  constructor(canvas) {
    this.canvas = canvas;
    this.playing = false;
    this.loop = false;
  }

  /**
   * Play animation in preview
   */
  play() {
    if (this.playing) return;

    this.playing = true;
    game.toast.studio.timeline.play();
  }

  /**
   * Pause preview
   */
  pause() {
    this.playing = false;
    game.toast.studio.timeline.pause();
  }

  /**
   * Toggle play/pause
   */
  toggle() {
    if (this.playing) {
      this.pause();
    } else {
      this.play();
    }
  }
}
```

---

## UI Layout

### Studio Application Layout

```
┌───────────────────────────────────────────────────────────────────────────┐
│ Toast Studio                                                         [X]  │
├───────────────────────────────────────────────────────────────────────────┤
│ [Assets] [Packages] [Studio]                                             │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  Studio Tab:                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │ ┌──────────┬────────────────────────────┬─────────────────────────┐ │ │
│  │ │ Elements │      Canvas Preview        │    Properties          │ │ │
│  │ │          │                            │                         │ │ │
│  │ │ □ Text1  │  ┌──────────────────────┐  │  Element: Text 1        │ │ │
│  │ │ □ Image1 │  │                      │  │                         │ │ │
│  │ │ □ Sound1 │  │                      │  │  Text: [___________]    │ │ │
│  │ │          │  │    [CANVAS]          │  │                         │ │ │
│  │ │ [+ Text] │  │                      │  │  Frame: 15              │ │ │
│  │ │ [+ Img]  │  │                      │  │                         │ │ │
│  │ │ [+ Snd]  │  │                      │  │  Position:              │ │ │
│  │ │          │  └──────────────────────┘  │    X: [____] Y: [____]  │ │ │
│  │ │ [Delete] │                            │  Rotation: [____]°      │ │ │
│  │ │          │  [▶ Play] [■ Stop]         │  Scale: [____]%         │ │ │
│  │ └──────────┴────────────────────────────┴─────────────────────────┘ │ │
│  │                                                                     │ │
│  │ Timeline:                                                            │ │
│  │ ┌─────────────────────────────────────────────────────────────────┐ │ │
│  │ │ Frame: 0    10   20   30   40   50   60   70   80   90         │ │ │
│  │ │        ├────┼────┼────┼────┼────┼────┼────┼────┼────┤          │ │ │
│  │ ├─────────────────────────────────────────────────────────────────┤ │ │
│  │ │ Text1  ◆────────◆─────◆──────────────────◆──────◆              │ │ │
│  │ │ Image1 ◆─────◆──────────────────────────◆──────◆              │ │ │
│  │ │ Sound1 ────◆─────────────────────────────────────              │ │ │
│  │ │          ▲                                                      │ │ │
│  │ └─────────────────────────────────────────────────────────────────┘ │ │
│  │ [◀◀] [◀] [▶] [▶▶] [●Rec]  Frame: 15/90   [Linear/Ease Toggle]    │ │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  [Save Package] [Load Package] [Export]                                  │
└───────────────────────────────────────────────────────────────────────────┘
```

### Panel Breakdown

#### Top: Three-Column Layout

**Left Panel (200px): Elements**
- List of all elements
- Add element buttons
- Delete selected button
- Visibility toggles

**Center Panel (Flex 1): Canvas**
- Visual preview at current frame
- Transform controls when selected
- Play/stop controls
- Grid/guides (optional)

**Right Panel (250px): Properties**
- Properties for selected element
- Current frame indicator
- Transform values (x, y, rotation, scale)
- Element-specific properties (text, color, etc.)
- Keyframe indicator (shows if current frame has keyframe)

#### Bottom: Timeline (Full Width, 300px height)

- Frame ruler
- Element tracks with keyframes
- Playhead
- Transport controls
- Frame counter
- Record mode toggle
- Interpolation toggle

### Responsive Considerations

- Minimum width: 1200px (warn if smaller)
- Timeline can scroll horizontally
- Canvas scales to fit available space
- Panels can be collapsed/expanded (future)

---

## Implementation Phases

> **Note:** We'll build everything in the existing Toast module first, then split into Player/Studio modules at the end once everything works.

### Phase 1: Foundation (Week 1)

**Goal:** Basic animation editor structure with static canvas

#### Tasks:
1. Add new "Animator" tab to Toast Studio
   - Add tab to existing ToastStudioApp
   - Create animator-tab.hbs template
   - Basic three-panel layout (elements, canvas, properties)

2. Create studio state management
   - Add animator state to ToastStudioApp
   - Element array with keyframes
   - Current frame tracking
   - Selected element tracking

3. Create static canvas renderer
   - New StudioCanvas class
   - HTML5 canvas element (1920x1080 logical size)
   - Render elements at frame 0
   - Black background, scaled to fit container

4. Implement element list UI
   - Display elements in left panel
   - Add element buttons (text, image, sound)
   - Delete element button
   - Element selection

5. Create property panel UI
   - Right panel shows selected element properties
   - Display current frame number
   - Basic property display (no editing yet)

**Deliverable:** Can add elements, see them rendered on canvas at frame 0 (static)

---

### Phase 2: Transform Controls (Week 2)

**Goal:** Interactive canvas with drag/resize/rotate

#### Tasks:
1. Implement selection system
   - Click to select element
   - Visual selection feedback
   - Deselect on background click

2. Build transform controls
   - Bounding box rendering
   - 8 resize handles
   - 1 rotation handle
   - Handle hit detection

3. Implement transform interactions
   - Drag to move (update x, y)
   - Drag corner to resize (update scale or width/height)
   - Drag rotation handle (update rotation)
   - Shift key constraints

4. Property panel
   - Show current element properties
   - Manual input fields
   - Real-time updates

5. Basic keyframe creation
   - Create keyframe when transforming
   - Store in element.keyframes array
   - Show in console (timeline not ready yet)

**Deliverable:** Can move/resize/rotate elements on canvas

---

### Phase 3: Timeline UI (Week 3)

**Goal:** Visual timeline with keyframe markers

#### Tasks:
1. Create timeline renderer
   - Frame ruler with markers
   - Element tracks
   - Canvas-based rendering

2. Render keyframes
   - Diamond markers at keyframe positions
   - Color-coded by interpolation type
   - Selection state

3. Implement playhead
   - Vertical line at current frame
   - Drag to scrub
   - Snap to frames

4. Transport controls
   - Play/pause button
   - Step forward/back buttons
   - Jump to start/end buttons
   - Frame counter display

5. Connect timeline to canvas
   - Scrubbing updates canvas
   - Canvas shows current frame

**Deliverable:** Timeline shows keyframes, can scrub to see changes

---

### Phase 4: Keyframe Editing (Week 4)

**Goal:** Full keyframe manipulation

#### Tasks:
1. Keyframe selection
   - Click diamond to select
   - Visual selection feedback
   - Multi-select with Shift

2. Move keyframes
   - Drag to different frame
   - Snap to grid
   - Validation (can't overlap)

3. Delete keyframes
   - Delete key or context menu
   - Validation (keep at least 2)

4. Interpolation controls
   - Right-click keyframe menu
   - Change interpolation type
   - Visual feedback (color change)

5. Record mode
   - Toggle button
   - Auto-create keyframes on any change
   - Visual indicator when active

**Deliverable:** Full keyframe editing capability

---

### Phase 5: Interpolation Engine (Week 5)

**Goal:** Smooth animation between keyframes

#### Tasks:
1. Implement interpolation functions
   - Linear
   - Ease-in
   - Ease-out
   - Ease-in-out

2. Property interpolation
   - Numeric properties (x, y, rotation, scale, opacity)
   - Color interpolation
   - Non-interpolatable properties (strings, booleans)

3. Frame calculation
   - Find surrounding keyframes
   - Calculate t value
   - Apply interpolation function
   - Return interpolated properties

4. Connect to rendering
   - Canvas uses interpolated values
   - Update on every frame change

5. Interpolation toggle
   - Global toggle: Linear vs Ease-in-out
   - Per-keyframe override
   - UI control in timeline

**Deliverable:** Smooth animations when playing

---

### Phase 6: Playback System (Week 6)

**Goal:** 30fps playback in both preview and full-screen

#### Tasks:
1. Studio preview playback
   - Play button plays in canvas
   - 30fps rendering
   - Loop option
   - Stop button

2. Toast Player integration
   - Save package with keyframe data
   - Player reads and interpolates
   - Full-screen rendering

3. Performance optimization
   - Cache interpolated values
   - Optimize rendering
   - Preload images/sounds

4. Sound playback
   - Trigger sounds at keyframes
   - Volume control
   - Multiple sound handling

5. Export/save
   - Save package with keyframes
   - Validate data
   - Load existing packages into editor

**Deliverable:** Full playback at 30fps

---

### Phase 7: Polish & UX (Week 7)

**Goal:** Professional polish and usability

#### Tasks:
1. Keyboard shortcuts
   - Space: Play/pause
   - Arrow keys: Step frames
   - Delete: Delete selected
   - Ctrl+C/V: Copy/paste keyframes (future)

2. Visual polish
   - Smooth animations
   - Tooltips
   - Better icons
   - Color scheme refinement

3. Error handling
   - Validation messages
   - Graceful failures
   - User guidance

4. Documentation
   - User guide
   - Tutorial video
   - Example packages

5. Testing
   - Create multiple test animations
   - Performance testing
   - Cross-browser testing

**Deliverable:** Production-ready animation studio in single module

---

### Phase 8: Module Split (Week 8) - OPTIONAL

**Goal:** Split Toast into lightweight Player + full Studio modules for performance

> **Note:** This phase is optional and can be done later. Everything will work in the single Toast module. Only do this when you're ready to optimize for production deployment.

#### Tasks:
1. Create toast-player repository
   - New GitHub repo for Toast Player
   - Copy core rendering code
   - Remove all editor/studio code
   - Create minimal module.json

2. Create toast-studio repository
   - New GitHub repo for Toast Studio
   - Depend on toast-player module
   - Move all editor/animator code
   - Update module.json with dependency

3. Refactor code organization
   - Split ToastManager (keep playback, remove editor)
   - Move StudioCanvas, Timeline, etc to Studio
   - Move interpolation engine to Player (needed for playback)
   - Update all imports and references

4. Test both modules
   - Verify Player works standalone
   - Verify Studio requires Player
   - Test package playback in Player-only setup
   - Test full editor in Player+Studio setup

5. Migration path
   - Document how to upgrade from monolithic Toast
   - Provide migration scripts if needed
   - Update all documentation
   - Update manifest URLs

**Deliverable:** Two separate, optimized modules ready for distribution

**Benefits of Split:**
- Players load ~70% less code (just playback)
- Faster initial load times during gameplay
- GMs can disable Studio for performance
- Cleaner code separation

**Drawbacks:**
- More complex deployment
- Two repos to maintain
- Potential version compatibility issues

**Recommendation:** Defer this phase until Toast is mature and user feedback indicates performance is an issue.

---

## Technical Specifications

### Performance Targets

- **30fps playback:** Must maintain 30fps during playback
- **60fps editing:** Editor UI should respond at 60fps
- **Interpolation:** < 1ms per element per frame
- **Timeline rendering:** < 16ms full render
- **Canvas rendering:** < 16ms full render

### Browser Support

- **Chrome:** Latest 2 versions
- **Firefox:** Latest 2 versions
- **Edge:** Latest 2 versions
- **Safari:** Latest version (best effort)

### Data Limits

- **Max elements:** 50 per package
- **Max keyframes:** 100 per element
- **Max duration:** 600 frames (20 seconds at 30fps)
- **Max package size:** 1MB JSON

### File Structure

**Phases 1-7: Single Module (Current)**

```
toast/
├── module.json
├── scripts/
│   ├── toast.js              (Main entry)
│   ├── core/
│   │   ├── ToastManager.js   (Playback + Studio)
│   │   └── SocketHandler.js
│   ├── packages/
│   │   ├── PackageManager.js
│   │   └── Package.js
│   ├── assets/
│   │   └── AssetBrowser.js
│   ├── animator/             (NEW - Animation studio)
│   │   ├── StudioCanvas.js   (Canvas renderer)
│   │   ├── TransformControls.js
│   │   ├── Timeline.js       (Timeline system)
│   │   ├── TimelineRenderer.js
│   │   ├── Interpolation.js  (Interpolation engine)
│   │   └── KeyframeEditor.js
│   └── ui/
│       ├── ToastStudioApp.js (Main UI)
│       └── ...
├── templates/
│   ├── toast-studio.hbs
│   ├── partials/
│   │   ├── assets-tab.hbs
│   │   ├── packages-tab.hbs
│   │   ├── animator-tab.hbs  (NEW)
│   │   └── ...
└── styles/
    └── toast.css
```

**Phase 8: Split Modules (Optional Future)**

```
toast-player/                 (Lightweight playback only)
├── module.json
├── scripts/
│   ├── toast.js
│   ├── core/
│   │   ├── ToastPlayer.js    (Playback only)
│   │   └── SocketHandler.js
│   ├── animator/
│   │   └── Interpolation.js  (Needed for playback)
│   └── packages/
│       └── Package.js
└── styles/
    └── toast-player.css

toast-studio/                 (Full editor - requires toast-player)
├── module.json
├── scripts/
│   ├── studio.js
│   ├── packages/
│   │   ├── PackageManager.js
│   │   └── PackageEditor.js
│   ├── assets/
│   │   └── AssetBrowser.js
│   ├── animator/
│   │   ├── StudioCanvas.js
│   │   ├── TransformControls.js
│   │   ├── Timeline.js
│   │   ├── TimelineRenderer.js
│   │   └── KeyframeEditor.js
│   └── ui/
│       └── ToastStudioApp.js
├── templates/
│   └── ...
└── styles/
    └── toast-studio.css
```

### API Surface (Toast Player)

```javascript
// Play a package
await game.toast.play(package);

// Play custom elements
await game.toast.play(elements, config);

// Stop current toast
game.toast.stop();

// Check if playing
game.toast.isPlaying();
```

### API Surface (Toast Studio)

```javascript
// Open studio
game.toast.studio.show();

// Create new animation
game.toast.studio.new();

// Load package into editor
game.toast.studio.load(packageId);

// Save current animation
await game.toast.studio.save();

// Export package
await game.toast.studio.export();
```

---

## Success Criteria

### Must Have
- ✅ Can add text/image/sound elements
- ✅ Can drag/resize/rotate elements on canvas
- ✅ Can create keyframes by transforming
- ✅ Timeline shows all keyframes visually
- ✅ Can scrub timeline to any frame
- ✅ Smooth interpolation between keyframes
- ✅ 30fps playback in preview
- ✅ Can save packages with animations
- ✅ Toast Player can play saved packages
- ✅ Runs at 30fps full-screen

### Should Have
- ✅ Record mode (auto-keyframe)
- ✅ Move/delete keyframes in timeline
- ✅ Change interpolation per keyframe
- ✅ Multi-select elements
- ✅ Keyboard shortcuts
- ✅ Grid/guides on canvas

### Nice to Have
- Undo/redo
- Copy/paste keyframes
- Element duplication
- Animation templates
- Curve editor (advanced interpolation)
- Onion skinning (show previous/next frames)

---

## Future Enhancements

### Phase 4.5: Advanced Features
- Path animation (elements follow bezier curves)
- Particle effects
- Camera shake/zoom
- Audio waveform visualization
- Multi-track audio

### Phase 4.6: Templates & Presets
- Pre-made animation templates
- Element presets (common text styles)
- Animation presets (entrance/exit effects)
- Template marketplace

### Phase 4.7: Collaboration
- Share packages between users
- Package versioning
- Import/export to common formats
- Integration with animation libraries

---

## Questions & Decisions

### Resolved
- ✅ **Frame rate:** 30fps
- ✅ **Interpolation types:** Linear + 3 easing functions
- ✅ **Module split:** Player + Studio
- ✅ **Canvas size:** 1920x1080
- ✅ **Coordinate system:** Pixels from top-left, element positioned by center

### Open Questions
1. **Curve editor:** Should we support custom bezier curves for interpolation?
   - **Option A:** Just 4 preset types (simpler)
   - **Option B:** Visual bezier curve editor (more powerful)
   - **Recommendation:** Start with A, add B in phase 4.8

2. **Multi-select transform:** How should multi-select transforms work?
   - **Option A:** Transform all selected elements together (same delta)
   - **Option B:** Transform relative to bounding box center
   - **Recommendation:** Option A for MVP

3. **Sound timing:** Should sounds have duration or just trigger points?
   - **Option A:** Just trigger points (simpler)
   - **Option B:** Duration with fade in/out
   - **Recommendation:** Option A for MVP

4. **Package versioning:** How to handle backward compatibility?
   - **Option A:** Version field in package, migrate on load
   - **Option B:** Strict version matching
   - **Recommendation:** Option A

---

## Getting Started

### Step 1: Read This Plan
Understand the full scope and architecture. This is a 7-week project (+ optional 8th week for module split).

### Step 2: Understand Current State
You have a working Toast module with:
- Toast Studio UI (Assets, Packages tabs)
- Package management system
- Basic element rendering
- File structure already in place

### Step 3: Begin Phase 1
Start with foundation work in the existing Toast module:
1. Add new "Animator" tab to Toast Studio
2. Create `src/animator/` directory for new code
3. Build static canvas renderer
4. Add element list and property panels

### Step 4: Work Week by Week
Follow phases 1-7 sequentially. Each phase builds on the previous:
- **Weeks 1-3:** Build UI foundation (canvas, timeline, controls)
- **Weeks 4-5:** Add interactivity (keyframes, interpolation)
- **Weeks 6-7:** Add playback and polish

### Step 5: Test Incrementally
After each phase, create test animations to verify functionality. Each phase has clear deliverables.

### Step 6: (Optional) Split Modules
Only do Phase 8 if/when you need the performance optimization. Everything works in the single module.

---

**Ready to build a professional animation studio! 🎬**

**First Step:** Open Toast Studio and start planning where the "Animator" tab will go!
