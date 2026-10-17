import * as THREE from "three";

type Options = { paused: boolean; mode: number };
export type LandscapeController = {
  setOptions: (options: Options) => void;
  dispose: () => void;
};

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uMode;
  varying vec3 vPosition;
  varying float vHeight;
  float hash(vec2 p) { return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
  float noise(vec2 p) {
    vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
    return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.)),f.x),f.y);
  }
  float fbm(vec2 p) { float a=.5, n=0.; for(int i=0;i<5;i++){n+=a*noise(p);p=p*2.03+7.1;a*=.48;} return n; }
  void main() {
    vec3 p=position;
    float r=length(p.xz)/4.3;
    float island=1.-smoothstep(.55,1.,r);
    float a=fbm(p.xz*.62+vec2(uMode*2.8,uTime*.028));
    float ridge=pow(1.-abs(a*2.-1.),3.);
    float peaks=exp(-pow(length(p.xz-vec2(-1.,-.8)),2.)*.5)*1.8 + exp(-pow(length(p.xz-vec2(1.4,.1)),2.)*.8)*1.2;
    float dunes=(sin(p.x*.9+p.z*.7+a*5.+uMode)+1.)*.48;
    float blend=smoothstep(1.,2.,uMode);
    float h=mix(ridge*1.85+peaks,dunes*1.8,blend);
    p.y=(h*island+.025*sin(p.x*2.+p.z*2.+uTime*.2))*.9;
    vHeight=p.y; vPosition=p;
    gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uMode;
  varying vec3 vPosition;
  varying float vHeight;
  void main() {
    float r=length(vPosition.xz)/4.3;
    if(r>1.) discard;
    vec3 normal=normalize(cross(dFdx(vPosition),dFdy(vPosition)));
    float light=.35+.65*abs(dot(normal,normalize(vec3(-.8,1.,.5))));
    float contour=vHeight*19.;
    float line=1.-smoothstep(.02, max(.04,fwidth(contour)*1.1),abs(fract(contour)-.5));
    float fine=1.-smoothstep(.005,.055,abs(fract(vPosition.x*8.)-.5));
    vec3 dark=vec3(0.047,0.055,0.078);
    vec3 jade=mix(vec3(0.365,0.392,0.467),vec3(0.655,0.675,0.725),clamp(vHeight*.3,0.,1.));
    vec3 copper=vec3(0.145,0.200,0.965);
    jade=mix(jade,copper,smoothstep(1.6,2.8,vHeight)*.65+smoothstep(1.,2.,uMode)*.5);
    vec3 colour=mix(dark*light,jade*light,line*.87);
    colour+=jade*fine*.055;
    float scan=pow(max(0.,1.-abs(vHeight-mod(uTime*.12,3.5))/.06),3.);
    colour+=vec3(0.447,0.467,0.522)*scan*.22;
    float rim=pow(r,12.);
    colour+=vec3(0.188,0.204,0.251)*rim*.3;
    gl_FragColor=vec4(colour,1.-smoothstep(.97,1.,r));
    #include <colorspace_fragment>
  }
`;

export function createLandscape(
  host: HTMLDivElement,
  initial: Options,
  onLost: () => void,
): LandscapeController {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("webgl2", {
    alpha: true,
    antialias: true,
    powerPreference: "low-power",
  });
  if (!context)
    throw new Error(
      "WebGL2 unavailable; the vector landscape remains visible.",
    );
  const renderer = new THREE.WebGLRenderer({
    canvas,
    context,
    alpha: true,
    antialias: true,
    powerPreference: "low-power",
  });
  const compact = window.innerWidth <= 760;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, compact ? 1.25 : 1.5));
  renderer.setClearColor(0x000000, 0);
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  const world = new THREE.Group();
  world.scale.setScalar(0.84);
  world.position.y = -0.65;
  world.rotation.y = -0.28;
  scene.add(world);
  const uniforms = { uTime: { value: 0 }, uMode: { value: initial.mode } };
  const segments = compact ? 128 : 160;
  const geometry = new THREE.PlaneGeometry(8.6, 8.6, segments, segments);
  geometry.rotateX(-Math.PI / 2);
  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
    side: THREE.DoubleSide,
    transparent: true,
  });
  world.add(new THREE.Mesh(geometry, material));

  // Engraved orbital instrument beneath the terrain.
  const objects: {
    geometry: THREE.BufferGeometry;
    material: THREE.Material;
  }[] = [{ geometry, material }];
  for (let j = 0; j < 5; j++) {
    const radius = 4.45 + j * 0.13;
    const points = Array.from(
      { length: 257 },
      (_, i) =>
        new THREE.Vector3(
          Math.cos((i / 256) * Math.PI * 2) * radius,
          -0.13 - j * 0.065,
          Math.sin((i / 256) * Math.PI * 2) * radius,
        ),
    );
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: j === 0 ? "#5862f6" : "#767c8d",
      transparent: true,
      opacity: j === 0 ? 0.65 : 0.16,
    });
    world.add(new THREE.Line(geometry, material));
    objects.push({ geometry, material });
  }
  const tickPositions: number[] = [];
  for (let i = 0; i < 120; i++) {
    const angle = (i / 120) * Math.PI * 2;
    const radius = i % 10 === 0 ? 4.82 : 4.65;
    tickPositions.push(
      Math.cos(angle) * 4.5,
      -0.12,
      Math.sin(angle) * 4.5,
      Math.cos(angle) * radius,
      -0.12,
      Math.sin(angle) * radius,
    );
  }
  const ticksGeo = new THREE.BufferGeometry();
  ticksGeo.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(tickPositions, 3),
  );
  const ticksMat = new THREE.LineBasicMaterial({
    color: "#5862ec",
    transparent: true,
    opacity: 0.5,
  });
  world.add(new THREE.LineSegments(ticksGeo, ticksMat));
  objects.push({ geometry: ticksGeo, material: ticksMat });

  // An amber eclipse, composed of a disc and fine concentric solar rings.
  const sun = new THREE.Group();
  sun.position.set(0.3, 1.95, -2.4);
  scene.add(sun);
  const sunGeo = new THREE.CircleGeometry(1.17, 100);
  const sunMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {},
    vertexShader:
      "varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
    fragmentShader:
      "varying vec2 vUv; void main(){float r=length(vUv-.5)*2.;float lines=.985+.015*sin(vUv.y*300.); vec3 c=mix(vec3(0.290,0.310,0.900),vec3(0.300,0.800,0.940),vUv.y);gl_FragColor=vec4(c*lines,(1.-smoothstep(.98,1.,r))*.95);}",
  });
  sun.add(new THREE.Mesh(sunGeo, sunMat));
  objects.push({ geometry: sunGeo, material: sunMat });
  for (let i = 0; i < 3; i++) {
    const g = new THREE.RingGeometry(1.24 + i * 0.09, 1.244 + i * 0.09, 120);
    const m = new THREE.MeshBasicMaterial({
      color: "#4b56e8",
      transparent: true,
      opacity: 0.3 - i * 0.08,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    sun.add(new THREE.Mesh(g, m));
    objects.push({ geometry: g, material: m });
  }

  // Deterministic motes: no assets, no network, stable on first paint.
  const dust = new Float32Array(210 * 3);
  let seed = 417;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  for (let i = 0; i < dust.length; i += 3) {
    dust[i] = (random() - 0.5) * 14;
    dust[i + 1] = random() * 6 - 1;
    dust[i + 2] = (random() - 0.5) * 10;
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute("position", new THREE.BufferAttribute(dust, 3));
  const dustMat = new THREE.PointsMaterial({
    color: "#747bdd",
    size: 0.014,
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
  });
  const particles = new THREE.Points(dustGeo, dustMat);
  scene.add(particles);
  objects.push({ geometry: dustGeo, material: dustMat });
  const pointer = { x: 0, y: 0 };
  let options = initial,
    disposed = false,
    contextLost = false,
    visible = true,
    raf = 0,
    time = 0,
    last = 0,
    lastPaint = 0;
  const draw = () => {
    if (contextLost || disposed) return;
    camera.position.set(pointer.x * 0.6, 6.8 - pointer.y * 0.4, 12.8);
    camera.lookAt(0, 0.3, 0);
    sun.quaternion.copy(camera.quaternion);
    renderer.render(scene, camera);
  };
  const resize = () => {
    if (disposed) return;
    const width = host.clientWidth,
      height = host.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    scene.scale.setScalar(Math.min(1, camera.aspect));
    camera.updateProjectionMatrix();
    draw();
  };
  const animate = (now: number) => {
    raf = 0;
    if (
      disposed ||
      contextLost ||
      !visible ||
      document.hidden ||
      options.paused
    )
      return;
    if (now - lastPaint >= 1000 / (compact ? 24 : 30)) {
      const delta = last ? Math.min((now - last) / 1000, 0.05) : 0;
      time += delta;
      last = now;
      lastPaint = now;
      uniforms.uTime.value = time;
      uniforms.uMode.value += (options.mode - uniforms.uMode.value) * 0.045;
      world.rotation.y = -0.28 + Math.sin(time * 0.09) * 0.14;
      particles.rotation.y = time * 0.012;
      draw();
    }
    raf = requestAnimationFrame(animate);
  };
  const start = () => {
    if (
      !raf &&
      !disposed &&
      !contextLost &&
      visible &&
      !document.hidden &&
      !options.paused
    ) {
      last = 0;
      raf = requestAnimationFrame(animate);
    }
  };
  const move = (event: PointerEvent) => {
    if (options.paused || event.pointerType === "touch") return;
    const rect = host.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    pointer.y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
  };
  const leave = () => {
    pointer.x = 0;
    pointer.y = 0;
  };
  const visibility = () => {
    if (document.hidden) {
      cancelAnimationFrame(raf);
      raf = 0;
    } else start();
  };
  const lost = (event: Event) => {
    event.preventDefault();
    contextLost = true;
    cancelAnimationFrame(raf);
    raf = 0;
    onLost();
  };
  const observer = new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
    if (visible) start();
    else {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  });
  observer.observe(host);
  const sizeObserver = new ResizeObserver(resize);
  sizeObserver.observe(host);
  host.addEventListener("pointermove", move);
  host.addEventListener("pointerleave", leave);
  renderer.domElement.addEventListener("webglcontextlost", lost);
  document.addEventListener("visibilitychange", visibility);
  resize();
  start();
  return {
    setOptions(next) {
      options = next;
      if (next.paused) {
        cancelAnimationFrame(raf);
        raf = 0;
        uniforms.uMode.value = next.mode;
        draw();
      } else start();
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      observer.disconnect();
      sizeObserver.disconnect();
      host.removeEventListener("pointermove", move);
      host.removeEventListener("pointerleave", leave);
      document.removeEventListener("visibilitychange", visibility);
      renderer.domElement.removeEventListener("webglcontextlost", lost);
      objects.forEach(({ geometry, material }) => {
        geometry.dispose();
        material.dispose();
      });
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    },
  };
}
