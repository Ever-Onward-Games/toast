# Advanced Animations - Multi-Stage Effects

This document covers the advanced animation features including multi-stage animations and shape elements.

## Multi-Stage CSS Animations

The module includes built-in CSS keyframe animations for complex multi-stage effects:

### Available CSS Animations

- `toast-slide-left-right` - Slide from left → pause in center → exit right
- `toast-slide-right-left` - Slide from right → pause in center → exit left
- `toast-slide-top-bottom` - Slide from top → pause in center → exit bottom
- `toast-slide-bottom-top` - Slide from bottom → pause in center → exit top

### Timing Breakdown (for 2 second duration)

All multi-stage animations follow this timing:
- **0-25% (0.5s)**: Slide in from offscreen
- **25-75% (1.0s)**: Stay in center
- **75-100% (0.5s)**: Slide out offscreen

You can adjust the total duration, and the proportions stay the same.

## Using CSS Animations

To use CSS animations instead of transition-based animations, use the `cssAnimation` property:

```javascript
{
  animation: {
    cssAnimation: "toast-slide-left-right",  // The CSS animation name
    centerX: window.innerWidth / 2 - 200,    // Where element centers during pause
    centerY: window.innerHeight / 2 - 50,
    duration: 2,                              // Total duration in seconds
    easing: "ease-in-out"                     // Optional easing
  }
}
```

## Shape Elements

New `shape` element type for creating colored rectangles, circles, and other geometric shapes.

### Basic Rectangle

```javascript
{
  type: "shape",
  width: "600px",
  height: "150px",
  backgroundColor: "#ff0000",
  animation: {
    // animation here
  }
}
```

### Rounded Rectangle

```javascript
{
  type: "shape",
  width: "500px",
  height: "200px",
  backgroundColor: "#0066cc",
  borderRadius: "25px",
  boxShadow: "0 0 30px rgba(0, 100, 200, 0.8)"
}
```

### Circle

```javascript
{
  type: "shape",
  width: "300px",
  height: "300px",
  backgroundColor: "#ffaa00",
  borderRadius: "50%"
}
```

### Shape Properties

- `width` - Width (CSS value)
- `height` - Height (CSS value)
- `backgroundColor` - Fill color (CSS color)
- `borderRadius` - Corner radius or "50%" for circle (CSS value)
- `border` - Border style (CSS value)
- `boxShadow` - Shadow effect (CSS value)
- `opacity` - Transparency 0-1

## Complete Examples

### Example 1: Critical Hit with Background

```javascript
game.toast.show([
  // Red rectangle background
  {
    type: "shape",
    width: "800px",
    height: "200px",
    backgroundColor: "#cc0000",
    borderRadius: "20px",
    boxShadow: "0 0 40px rgba(255, 0, 0, 0.8)",
    animation: {
      cssAnimation: "toast-slide-right-left",
      centerX: window.innerWidth / 2 - 400,
      centerY: window.innerHeight / 2 - 100,
      duration: 2
    }
  },
  // Green text
  {
    type: "text",
    text: "CRITICAL HIT!",
    color: "#00ff00",
    fontSize: "100px",
    fontFamily: "Impact, sans-serif",
    fontWeight: "bold",
    textShadow: "0 0 30px #00ff00, 4px 4px 8px rgba(0, 0, 0, 0.8)",
    animation: {
      cssAnimation: "toast-slide-left-right",
      centerX: window.innerWidth / 2 - 320,
      centerY: window.innerHeight / 2 - 50,
      duration: 2
    }
  }
]);
```

### Example 2: Level Up Announcement

```javascript
game.toast.show([
  // Gold circle behind
  {
    type: "shape",
    width: "400px",
    height: "400px",
    backgroundColor: "#FFD700",
    borderRadius: "50%",
    boxShadow: "0 0 60px rgba(255, 215, 0, 0.9)",
    animation: {
      cssAnimation: "toast-slide-top-bottom",
      centerX: window.innerWidth / 2 - 200,
      centerY: window.innerHeight / 2 - 200,
      duration: 3
    }
  },
  // Text
  {
    type: "text",
    text: "LEVEL UP!",
    color: "#ffffff",
    fontSize: "80px",
    fontFamily: "'Comic Sans MS', cursive",
    fontWeight: "bold",
    textShadow: "0 0 20px #FFD700, 3px 3px 6px rgba(0, 0, 0, 0.8)",
    animation: {
      cssAnimation: "toast-slide-top-bottom",
      centerX: window.innerWidth / 2 - 220,
      centerY: window.innerHeight / 2 - 40,
      duration: 3
    }
  }
]);
```

### Example 3: Dual Text with Background Bar

```javascript
game.toast.show([
  // Background bar
  {
    type: "shape",
    width: "1000px",
    height: "180px",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    borderRadius: "15px",
    border: "4px solid #FFD700",
    boxShadow: "0 0 40px rgba(255, 215, 0, 0.6)",
    animation: {
      cssAnimation: "toast-slide-left-right",
      centerX: window.innerWidth / 2 - 500,
      centerY: window.innerHeight / 2 - 90,
      duration: 2.5
    }
  },
  // First word
  {
    type: "text",
    text: "DOUBLE",
    color: "#ff6b6b",
    fontSize: "90px",
    fontFamily: "Impact, sans-serif",
    fontWeight: "bold",
    textShadow: "0 0 30px #ff6b6b, 3px 3px 6px rgba(0, 0, 0, 0.9)",
    animation: {
      cssAnimation: "toast-slide-left-right",
      centerX: window.innerWidth / 2 - 380,
      centerY: window.innerHeight / 2 - 45,
      duration: 2.5
    }
  },
  // Second word
  {
    type: "text",
    text: "KILL!",
    color: "#4ecdc4",
    fontSize: "90px",
    fontFamily: "Impact, sans-serif",
    fontWeight: "bold",
    textShadow: "0 0 30px #4ecdc4, 3px 3px 6px rgba(0, 0, 0, 0.9)",
    animation: {
      cssAnimation: "toast-slide-left-right",
      centerX: window.innerWidth / 2 + 50,
      centerY: window.innerHeight / 2 - 45,
      duration: 2.5
    }
  }
]);
```

### Example 4: Theater Style Announcement

```javascript
game.toast.show([
  // Top bar
  {
    type: "shape",
    width: "100vw",
    height: "120px",
    backgroundColor: "#1a1a1a",
    border: "3px solid #FFD700",
    animation: {
      cssAnimation: "toast-slide-top-bottom",
      centerX: 0,
      centerY: 100,
      duration: 2
    }
  },
  // Text
  {
    type: "text",
    text: "BOSS DEFEATED",
    color: "#FFD700",
    fontSize: "70px",
    fontFamily: "'Cinzel', serif",
    fontWeight: "bold",
    textShadow: "0 0 30px #FFD700, 2px 2px 4px rgba(0, 0, 0, 1)",
    animation: {
      cssAnimation: "toast-slide-top-bottom",
      centerX: window.innerWidth / 2 - 350,
      centerY: 145,
      duration: 2
    }
  }
]);
```

## Creating Custom CSS Animations

You can add your own CSS keyframe animations to `styles/toast.css`:

```css
@keyframes my-custom-animation {
  0% {
    transform: translateX(-100vw) scale(0.5);
    opacity: 0;
  }
  50% {
    transform: translateX(0) scale(1);
    opacity: 1;
  }
  100% {
    transform: translateX(100vw) scale(0.5);
    opacity: 0;
  }
}
```

Then use it in your macro:

```javascript
{
  animation: {
    cssAnimation: "my-custom-animation",
    centerX: window.innerWidth / 2 - 200,
    centerY: window.innerHeight / 2 - 50,
    duration: 3
  }
}
```

## Tips for Multi-Stage Animations

1. **Synchronize elements** - Use the same duration for elements that should move together
2. **Layer carefully** - Add background shapes first, then text on top
3. **Adjust center positions** - Use `centerX` and `centerY` to position where element pauses
4. **Test different durations** - 2-3 seconds works well for most effects
5. **Use contrasting colors** - Make sure text is readable against backgrounds
6. **Add glow effects** - Box shadows and text shadows add impact

## Font Recommendations

For dramatic text effects, try these fonts:

- **Impact** - Bold, attention-grabbing
- **'Arial Black'** - Heavy and readable
- **'Comic Sans MS'** - Fun and playful
- **'Brush Script MT'** - Handwritten style
- **'Cinzel'** - Elegant, theatrical (requires web font)
- **'Bangers'** - Comic book style (requires web font)

## Performance Notes

- Multi-stage CSS animations use GPU acceleration for smooth performance
- Keep total duration under 5 seconds for best user experience
- Limit to 3-4 elements per toast to avoid visual clutter
- Test on slower systems if using many simultaneous toasts
