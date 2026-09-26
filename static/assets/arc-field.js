/* An original parametric filament sculpture. Static buffers and batched draws
   follow the geometry layout used by Three.js TorusGeometry; no runtime library. */
(() => {
  const canvas = document.querySelector('[data-arc-canvas]');
  if (!canvas) return;
  const art = canvas.parentElement;
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let gl;
  try { gl = canvas.getContext('webgl', { alpha: true, antialias: true, powerPreference: 'low-power' }); } catch { return; }
  if (!gl) return;

  const segments = 320;
  const strands = 88;
  const vertices = new Float32Array((segments + 1) * (strands + 1) * 8);
  const faces = new Uint16Array(segments * strands * 6);
  const lines = new Uint16Array(segments * (strands + 1) * 2);
  let vertexOffset = 0, faceOffset = 0, lineOffset = 0;
  for (let j = 0; j <= strands; j++) {
    const v = j / strands * Math.PI * 2;
    for (let i = 0; i <= segments; i++) {
      const u = .2 + i / segments * (Math.PI * 2 - .48);
      const twist = v + 1.5 * u;
      const tube = .39 + .1 * Math.sin(u * 2);
      const radius = 1.24 + .11 * Math.cos(u * 3);
      const nx = Math.cos(twist) * Math.cos(u);
      const ny = Math.cos(twist) * Math.sin(u);
      const nz = Math.sin(twist);
      vertices[vertexOffset++] = radius * Math.cos(u) + tube * nx;
      vertices[vertexOffset++] = radius * Math.sin(u) + tube * ny;
      vertices[vertexOffset++] = tube * nz + .16 * Math.sin(2 * u);
      vertices[vertexOffset++] = nx;
      vertices[vertexOffset++] = ny;
      vertices[vertexOffset++] = nz;
      vertices[vertexOffset++] = i / segments;
      vertices[vertexOffset++] = j / strands;
      const index = j * (segments + 1) + i;
      if (i < segments) { lines[lineOffset++] = index; lines[lineOffset++] = index + 1; }
      if (j < strands && i < segments) {
        const next = index + segments + 1;
        faces[faceOffset++] = index; faces[faceOffset++] = next; faces[faceOffset++] = index + 1;
        faces[faceOffset++] = next; faces[faceOffset++] = next + 1; faces[faceOffset++] = index + 1;
      }
    }
  }

  const vertexSource = `
    precision mediump float;
    attribute vec3 aPosition;
    attribute vec3 aNormal;
    attribute vec2 aUV;
    uniform vec2 uResolution;
    uniform vec2 uPointer;
    uniform float uTime;
    uniform float uScroll;
    varying vec3 vNormal;
    varying vec2 vUV;
    varying float vDepth;
    mat3 rx(float a) { float s=sin(a),c=cos(a); return mat3(1.,0.,0.,0.,c,s,0.,-s,c); }
    mat3 ry(float a) { float s=sin(a),c=cos(a); return mat3(c,0.,-s,0.,1.,0.,s,0.,c); }
    mat3 rz(float a) { float s=sin(a),c=cos(a); return mat3(c,s,0.,-s,c,0.,0.,0.,1.); }
    void main() {
      mat3 rotation = rz(-.46 + sin(uTime*.09)*.11 + uScroll*.24)
        * ry(-.44 + sin(uTime*.13)*.18 + uPointer.x*.22)
        * rx(.42 + uPointer.y*.16 + uScroll*.18);
      vec3 p = aPosition + aNormal * sin(aUV.x*18. + uTime*.48) * .017;
      p = rotation * p;
      float perspective = 4.8 / (4.8 - p.z);
      float aspect = uResolution.x / uResolution.y;
      vec2 scale = vec2(2.15*max(aspect,1.), 2.15*max(1./aspect,1.));
      gl_Position = vec4(p.xy * perspective / scale, -p.z*.2, 1.);
      vNormal = rotation * aNormal;
      vUV = aUV;
      vDepth = p.z;
    }
  `;
  const fragmentSource = `
    precision mediump float;
    uniform float uTime;
    uniform float uLight;
    uniform float uPass;
    varying vec3 vNormal;
    varying vec2 vUV;
    varying float vDepth;
    void main() {
      vec3 n = normalize(vNormal);
      float light = max(0., dot(n,normalize(vec3(-.65,.85,1.4))));
      float rim = pow(1.-abs(n.z), 2.);
      float spec = pow(max(0.,dot(n,normalize(vec3(-.5,.7,2.)))), 16.);
      vec3 silver = mix(vec3(.79,.84,.73), vec3(.12,.17,.09), uLight);
      vec3 ink = mix(vec3(.063,.071,.063), vec3(.941,.945,.914), uLight);
      vec3 accent = mix(vec3(.835,.957,.471), vec3(.20,.36,.065), uLight);
      float stripe = pow(max(0.,cos(vUV.y*6.283185*4.)),30.);
      float wave = pow(max(0.,cos(vUV.x*6.283185-uTime*.36)),26.);
      if (uPass < .5) {
        vec3 color = mix(ink, silver, .018 + light*.05 + spec*.075 + rim*.026);
        gl_FragColor = vec4(color,1.);
      } else {
        float strength = .2 + light*.46 + spec*.30 + rim*.22;
        strength *= .78 + .22*clamp(vDepth+.5,0.,1.);
        vec3 color = mix(silver,accent,stripe*(.16+wave*.84));
        gl_FragColor = vec4(mix(ink,color,strength),1.);
      }
    }
  `;
  let program, geometryBuffer, faceBuffer, lineBuffer, uniforms;
  function initialize() {
    const shaders = [];
    for (const [type, source] of [[gl.VERTEX_SHADER, vertexSource], [gl.FRAGMENT_SHADER, fragmentSource]]) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      shaders.push(shader);
    }
    program = gl.createProgram();
    shaders.forEach((shader) => gl.attachShader(program, shader));
    gl.linkProgram(program);
    shaders.forEach((shader) => gl.deleteShader(shader));
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) { gl.deleteProgram(program); program = null; return false; }
    gl.useProgram(program);
    geometryBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, geometryBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    for (const [name, size, offset] of [['aPosition',3,0], ['aNormal',3,12], ['aUV',2,24]]) {
      const location = gl.getAttribLocation(program, name);
      gl.enableVertexAttribArray(location);
      gl.vertexAttribPointer(location, size, gl.FLOAT, false, 32, offset);
    }
    faceBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, faceBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, faces, gl.STATIC_DRAW);
    lineBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, lineBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, lines, gl.STATIC_DRAW);
    uniforms = Object.fromEntries(['uResolution','uPointer','uTime','uScroll','uLight','uPass'].map((name) => [name,gl.getUniformLocation(program,name)]));
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clearColor(0,0,0,0);
    return true;
  }
  if (!initialize()) return;

  let frame = 0, lastTime = 0, elapsed = 0;
  let visible = true, lost = false, disposed = false;
  let pointerX = 0, pointerY = 0, targetX = 0, targetY = 0;
  let scroll = 0;
  const paused = () => reduced.matches || root.dataset.motion === 'paused';
  const active = () => visible && !document.hidden && !lost && !disposed;
  const resize = () => {
    const ratio = Math.min(devicePixelRatio || 1, 1.75);
    const width = Math.max(1, Math.round(art.clientWidth * ratio));
    const height = Math.max(1, Math.round(art.clientHeight * ratio));
    if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
    wake();
  };
  function draw(now) {
    frame = 0;
    if (!active()) { lastTime = 0; return; }
    const delta = lastTime ? Math.min((now-lastTime)/1000,.05) : 0;
    lastTime = now;
    if (!paused()) elapsed += delta;
    const smooth = 1-Math.exp(-delta*4);
    pointerX += (targetX-pointerX)*smooth;
    pointerY += (targetY-pointerY)*smooth;
    gl.viewport(0,0,canvas.width,canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    gl.uniform2f(uniforms.uResolution,canvas.width,canvas.height);
    gl.uniform2f(uniforms.uPointer,paused() ? 0 : pointerX,paused() ? 0 : pointerY);
    gl.uniform1f(uniforms.uTime,elapsed);
    gl.uniform1f(uniforms.uScroll,paused() ? 0 : scroll);
    gl.uniform1f(uniforms.uLight,root.dataset.theme === 'light' ? 1 : 0);
    gl.uniform1f(uniforms.uPass,0);
    gl.enable(gl.POLYGON_OFFSET_FILL);
    gl.polygonOffset(1,1);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,faceBuffer);
    gl.drawElements(gl.TRIANGLES,faces.length,gl.UNSIGNED_SHORT,0);
    gl.disable(gl.POLYGON_OFFSET_FILL);
    gl.uniform1f(uniforms.uPass,1);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,lineBuffer);
    gl.drawElements(gl.LINES,lines.length,gl.UNSIGNED_SHORT,0);
    art.classList.add('is-rendered');
    if (!paused()) frame = requestAnimationFrame(draw);
  }
  function wake() {
    if (!active() || frame) return;
    lastTime = 0;
    frame = requestAnimationFrame(draw);
  }
  function suspend() { cancelAnimationFrame(frame); frame = 0; lastTime = 0; }
  const onPointer = (event) => {
    if (paused() || event.pointerType === 'touch') return;
    targetX = (event.clientX / innerWidth - .5)*2;
    targetY = (event.clientY / innerHeight - .5)*2;
  };
  const onScroll = () => { scroll = Math.min(1, Math.max(0, scrollY / innerHeight)); };
  addEventListener('pointermove',onPointer,{ passive: true });
  addEventListener('scroll',onScroll,{ passive: true });
  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) wake(); else suspend();
  });
  observer.observe(art);
  const resizer = new ResizeObserver(resize);
  resizer.observe(art);
  const visibility = () => { if (document.hidden) suspend(); else wake(); };
  document.addEventListener('visibilitychange',visibility);
  document.addEventListener('licoarc:motion',wake);
  document.addEventListener('licoarc:theme',wake);
  reduced.addEventListener('change',wake);
  canvas.addEventListener('webglcontextlost',(event) => {
    event.preventDefault(); lost = true; suspend(); art.classList.remove('is-rendered');
  });
  canvas.addEventListener('webglcontextrestored',() => {
    lost = false;
    if (initialize()) { resize(); wake(); }
    else { lost = true; art.classList.remove('is-rendered'); }
  });
  addEventListener('pagehide',(event) => {
    suspend();
    if (event.persisted) return;
    disposed = true;
    observer.disconnect(); resizer.disconnect();
    gl.deleteBuffer(geometryBuffer); gl.deleteBuffer(faceBuffer); gl.deleteBuffer(lineBuffer); gl.deleteProgram(program);
  });
  addEventListener('pageshow',() => { onScroll(); wake(); });
  resize(); onScroll(); wake();
})();
