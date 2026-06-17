import { useEffect, useRef } from 'react';

export default function NebulaBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let gl: WebGLRenderingContext | null = null;
    const contextOptions: WebGLContextAttributes = {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: 'low-power',
    };

    try {
      gl = canvas.getContext('webgl', contextOptions) || (canvas.getContext('experimental-webgl', contextOptions) as WebGLRenderingContext);
    } catch {
      // Ignore
    }

    if (!gl) {
      // Fallback is automatically supported by standard dark background CSS
      return;
    }

    const vs = `
      attribute vec2 a_position;
      varying vec2 v_texCoord;
      void main() {
        v_texCoord = a_position * 0.5 + 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    const fs = `
      precision highp float;
      uniform float u_time;
      uniform vec2 u_resolution;
      uniform vec2 u_mouse;
      varying vec2 v_texCoord;

      void main() {
        vec2 uv = v_texCoord;
        vec2 mouse = u_mouse / u_resolution;
        
        vec3 color1 = vec3(0.04, 0.05, 0.12); // Deep Navy
        vec3 color2 = vec3(0.1, 0.04, 0.18);  // Deep Purple
        vec3 accent = vec3(0.0, 0.82, 1.0);   // Electric Blue
        
        float t = u_time * 0.15;
        vec2 p = uv * 2.0 - 1.0;
        p.x *= u_resolution.x / u_resolution.y;
        
        float swirl = sin(length(p) * 2.5 - t) * 0.5 + 0.5;
        vec3 base = mix(color1, color2, swirl);
        
        float energy = sin(uv.x * 8.0 + t) * cos(uv.y * 8.0 - t);
        base += accent * pow(energy * 0.5 + 0.5, 4.0) * 0.18;
        
        float d = length(uv - mouse);
        base += accent * (1.0 - smoothstep(0.0, 0.4, d)) * 0.12;

        gl_FragColor = vec4(base, 1.0);
      }
    `;

    const compileShader = (type: number, source: string) => {
      const shader = gl!.createShader(type);
      if (!shader) return null;
      gl!.shaderSource(shader, source);
      gl!.compileShader(shader);
      if (!gl!.getShaderParameter(shader, gl!.COMPILE_STATUS)) {
        console.error(gl!.getShaderInfoLog(shader));
        gl!.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertexShader = compileShader(gl.VERTEX_SHADER, vs);
    const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fs);
    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    const posAttr = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(posAttr);
    gl.vertexAttribPointer(posAttr, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(program, 'u_time');
    const uRes = gl.getUniformLocation(program, 'u_resolution');
    const uMouse = gl.getUniformLocation(program, 'u_mouse');

    let mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    let touchMoveFrameId: number | null = null;
    let pendingTouchPoint: { x: number; y: number } | null = null;
    let minFrameInterval = 0;

    const updateFrameBudget = () => {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const isCoarseTablet = window.matchMedia('(pointer: coarse)').matches && Math.min(window.innerWidth, window.innerHeight) >= 700;
      minFrameInterval = prefersReducedMotion ? 1000 : isCoarseTablet ? 1000 / 30 : 0;
    };

    const updateMouseFromClientPoint = (clientX: number, clientY: number) => {
      const width = canvas.clientWidth || window.innerWidth;
      const height = canvas.clientHeight || window.innerHeight;

      if (width && height) {
        mouse.x = (clientX / width) * canvas.width;
        mouse.y = (1.0 - clientY / height) * canvas.height;
      }
    };

    const handleMouseMove = (event: MouseEvent) => {
      updateMouseFromClientPoint(event.clientX, event.clientY);
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (event.touches.length > 0) {
        const touch = event.touches[0];
        pendingTouchPoint = { x: touch.clientX, y: touch.clientY };

        if (touchMoveFrameId === null) {
          touchMoveFrameId = requestAnimationFrame(() => {
            if (pendingTouchPoint) {
              updateMouseFromClientPoint(pendingTouchPoint.x, pendingTouchPoint.y);
              pendingTouchPoint = null;
            }

            touchMoveFrameId = null;
          });
        }
      }
    };

    const touchMoveOptions: AddEventListenerOptions = { passive: true };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove, touchMoveOptions);

    const resize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      updateFrameBudget();
    };

    window.addEventListener('resize', resize);
    updateFrameBudget();
    resize();

    let animationFrameId: number;
    let lastRenderTime = 0;
    const render = (time: number) => {
      if (!canvas || !gl) return;
      animationFrameId = requestAnimationFrame(render);

      if (document.hidden || (minFrameInterval > 0 && time - lastRenderTime < minFrameInterval)) {
        return;
      }

      lastRenderTime = time;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.useProgram(program);
      gl.uniform1f(uTime, time * 0.001);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform2f(uMouse, mouse.x, mouse.y);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove, touchMoveOptions);
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
      if (touchMoveFrameId !== null) {
        cancelAnimationFrame(touchMoveFrameId);
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-60" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/20 to-background/80" />
    </div>
  );
}
