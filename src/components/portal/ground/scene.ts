import {
  BufferAttribute,
  BufferGeometry,
  LineSegments,
  MathUtils,
  PerspectiveCamera,
  Scene,
  ShaderMaterial,
  Vector3,
  WebGLRenderer,
} from "three";

import {
  buildField,
  countryPolygons,
  drapeRings,
  rasterizeMask,
  regionOutlines,
  softenMask,
} from "@/lib/map/ground";

export type GroundPalette = {
  line: Vector3;
  country: Vector3;
  border: Vector3;
  lineAlpha: number;
  countryAlpha: number;
  borderAlpha: number;
};

export type GroundPlacement = {
  x: number;
  y: number;
  width: number;
  height: number;
  alignX: number;
  alignY: number;
};

export type GroundScene = {
  render: (time: number, lean: { x: number; y: number }) => void;
  resize: (width: number, height: number, pixelRatio: number) => void;
  place: (placement: GroundPlacement | null, immediate: boolean) => void;
  placing: () => boolean;
  setPalette: (palette: GroundPalette) => void;
  dispose: () => void;
};

export type GroundFraming = "doorway" | "workspace";

type Pose = {
  elevation: number;
  azimuth: number;
  distance: number;
  fov: number;
  near: number;
  far: number;
  lines: number;
  nearY: number;
  farY: number;
  fill: number;
  rest: (width: number, height: number) => GroundPlacement;
};

type View = { scale: number; left: number; top: number };

const FIELD_SAMPLES = 260;
const FIELD_SPAN_X = 2.6;
const LOOK_AT = new Vector3(0, 0.05, 0);

const POSES: Record<GroundFraming, Pose> = {
  doorway: {
    elevation: 25,
    azimuth: 7,
    distance: 3.2,
    fov: 30,
    near: 1.9,
    far: 5.6,
    lines: 64,
    nearY: -2.6,
    farY: 1.25,
    fill: 0.94,
    rest: (width, height) => ({
      x: width * 0.42,
      y: height * 0.18,
      width: width * 0.54,
      height: height * 0.7,
      alignX: 0.5,
      alignY: 0.5,
    }),
  },
  workspace: {
    elevation: 23,
    azimuth: 6,
    distance: 3.2,
    fov: 30,
    near: 1.9,
    far: 5.8,
    lines: 44,
    nearY: -2.4,
    farY: 1.1,
    fill: 0.9,
    rest: (width, height) => ({
      x: width * 0.06,
      y: height * 0.66,
      width: width * 0.88,
      height: height * 0.3,
      alignX: 0.5,
      alignY: 1,
    }),
  },
};

function orbit(pose: Pose): Vector3 {
  const elevation = MathUtils.degToRad(pose.elevation);
  const azimuth = MathUtils.degToRad(pose.azimuth);
  return new Vector3(
    LOOK_AT.x + pose.distance * Math.cos(elevation) * Math.sin(azimuth),
    LOOK_AT.y + pose.distance * Math.sin(elevation),
    LOOK_AT.z + pose.distance * Math.cos(elevation) * Math.cos(azimuth),
  );
}

const DISPLACE = `
  uniform float uTime;
  uniform float uNear;
  uniform float uFar;
  varying float vFade;

  vec3 swell(vec3 p, float inside) {
    float wave = sin(p.x * 3.1 + uTime * 0.21) * sin(p.z * 2.4 - uTime * 0.16);
    float ripple = sin((p.x * 1.7 - p.z * 2.3) * 3.0 - uTime * 0.37);
    p.y += (0.55 + 0.45 * inside) * (0.014 * wave + 0.006 * ripple);
    return p;
  }

  vec4 place(vec3 p, float inside) {
    vec4 view = modelViewMatrix * vec4(swell(p, inside), 1.0);
    float depth = -view.z;
    vFade = smoothstep(uFar, uFar * 0.62, depth)
      * smoothstep(uNear * 0.35, uNear, depth)
      * (1.0 - smoothstep(1.55, 2.55, abs(p.x)));
    return projectionMatrix * view;
  }
`;

const FIELD_VERTEX = `
  ${DISPLACE}
  attribute float aInside;
  varying float vInside;

  void main() {
    vInside = aInside;
    gl_Position = place(position, aInside);
  }
`;

const FIELD_FRAGMENT = `
  uniform vec3 uLine;
  uniform vec3 uCountry;
  uniform float uLineAlpha;
  uniform float uCountryAlpha;
  varying float vInside;
  varying float vFade;

  void main() {
    float inside = smoothstep(0.08, 0.92, vInside);
    gl_FragColor = vec4(mix(uLine, uCountry, inside), mix(uLineAlpha, uCountryAlpha, inside) * vFade);
  }
`;

const BORDER_VERTEX = `
  ${DISPLACE}

  void main() {
    gl_Position = place(position, 1.0);
  }
`;

const BORDER_FRAGMENT = `
  uniform vec3 uBorder;
  uniform float uBorderAlpha;
  varying float vFade;

  void main() {
    gl_FragColor = vec4(uBorder, uBorderAlpha * vFade);
  }
`;

function groundGeometry(pose: Pose): {
  field: BufferGeometry;
  borders: BufferGeometry;
} {
  const mask = softenMask(
    rasterizeMask(countryPolygons(), { columns: 220, rows: 144, margin: 0.06 }),
    2,
    2,
  );
  const built = buildField(mask, {
    lines: pose.lines,
    samples: FIELD_SAMPLES,
    spanX: FIELD_SPAN_X,
    nearY: pose.nearY,
    farY: pose.farY,
  });

  const index = new Uint32Array(built.lines * (built.samples - 1) * 2);
  let cursor = 0;
  for (let line = 0; line < built.lines; line += 1) {
    for (let sample = 0; sample < built.samples - 1; sample += 1) {
      const start = line * built.samples + sample;
      index[cursor] = start;
      index[cursor + 1] = start + 1;
      cursor += 2;
    }
  }

  const field = new BufferGeometry();
  field.setAttribute("position", new BufferAttribute(built.positions, 3));
  field.setAttribute("aInside", new BufferAttribute(built.inside, 1));
  field.setIndex(new BufferAttribute(index, 1));

  const borders = new BufferGeometry();
  borders.setAttribute(
    "position",
    new BufferAttribute(drapeRings(mask, regionOutlines()), 3),
  );

  return { field, borders };
}

type Bounds = { left: number; right: number; top: number; bottom: number };

function countryBounds(
  camera: PerspectiveCamera,
  field: BufferGeometry,
  borders: BufferGeometry,
): Bounds {
  const bounds = { left: Infinity, right: -Infinity, top: -Infinity, bottom: Infinity };
  const point = new Vector3();
  const inside = field.getAttribute("aInside");

  function include(x: number, y: number, z: number) {
    point.set(x, y, z).applyMatrix4(camera.matrixWorldInverse);
    const depth = -point.z;
    if (depth <= 0) return;
    const u = point.x / depth;
    const v = point.y / depth;
    bounds.left = Math.min(bounds.left, u);
    bounds.right = Math.max(bounds.right, u);
    bounds.top = Math.max(bounds.top, v);
    bounds.bottom = Math.min(bounds.bottom, v);
  }

  const outline = borders.getAttribute("position");
  for (let index = 0; index < outline.count; index += 1) {
    include(outline.getX(index), outline.getY(index), outline.getZ(index));
  }
  const relief = field.getAttribute("position");
  for (let index = 0; index < relief.count; index += 1) {
    if (inside.getX(index) < 0.5) continue;
    include(relief.getX(index), relief.getY(index), relief.getZ(index));
  }

  return bounds;
}

const GLIDE_RATE = 4.2;

export function createGroundScene(
  canvas: HTMLCanvasElement,
  palette: GroundPalette,
  framing: GroundFraming = "workspace",
): GroundScene {
  const renderer = new WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: "low-power",
  });
  renderer.setClearAlpha(0);

  const pose = POSES[framing];
  const eye = orbit(pose);
  const scene = new Scene();
  const camera = new PerspectiveCamera(pose.fov, 1, 0.05, 30);
  camera.position.copy(eye);
  camera.lookAt(LOOK_AT);
  camera.updateMatrixWorld();

  const { field, borders } = groundGeometry(pose);
  const bounds = countryBounds(camera, field, borders);
  const tanHalf = Math.tan(MathUtils.degToRad(pose.fov / 2));

  const shared = {
    uTime: { value: 0 },
    uNear: { value: pose.near },
    uFar: { value: pose.far },
  };

  const fieldMaterial = new ShaderMaterial({
    vertexShader: FIELD_VERTEX,
    fragmentShader: FIELD_FRAGMENT,
    transparent: true,
    depthWrite: false,
    uniforms: {
      ...shared,
      uLine: { value: palette.line.clone() },
      uCountry: { value: palette.country.clone() },
      uLineAlpha: { value: palette.lineAlpha },
      uCountryAlpha: { value: palette.countryAlpha },
    },
  });

  const borderMaterial = new ShaderMaterial({
    vertexShader: BORDER_VERTEX,
    fragmentShader: BORDER_FRAGMENT,
    transparent: true,
    depthWrite: false,
    uniforms: {
      ...shared,
      uBorder: { value: palette.border.clone() },
      uBorderAlpha: { value: palette.borderAlpha },
    },
  });

  scene.add(new LineSegments(field, fieldMaterial));
  scene.add(new LineSegments(borders, borderMaterial));

  const size = { width: 1, height: 1 };
  const target = new Vector3();
  let requested: GroundPlacement | null = null;
  let goal: View | null = null;
  let shown: View | null = null;
  let lastFrame = 0;

  function fit(placement: GroundPlacement): View {
    const spanU = bounds.right - bounds.left;
    const spanV = bounds.top - bounds.bottom;
    const scale = Math.max(
      1,
      Math.min(
        (placement.width * pose.fill) / spanU,
        (placement.height * pose.fill) / spanV,
      ),
    );
    return {
      scale,
      left: placement.x + (placement.width - spanU * scale) * placement.alignX,
      top: placement.y + (placement.height - spanV * scale) * placement.alignY,
    };
  }

  function project(next: View) {
    const aspect = size.width / size.height;
    const fullHeight = 2 * tanHalf * next.scale;
    camera.aspect = aspect;
    camera.setViewOffset(
      aspect * fullHeight,
      fullHeight,
      (bounds.left + aspect * tanHalf) * next.scale - next.left,
      (tanHalf - bounds.top) * next.scale - next.top,
      size.width,
      size.height,
    );
  }

  function settle() {
    goal = fit(requested ?? pose.rest(size.width, size.height));
  }

  function glide(now: number) {
    if (!goal) return;
    if (!shown) {
      shown = goal;
      project(shown);
      return;
    }
    const seconds = lastFrame ? Math.min(0.1, (now - lastFrame) / 1000) : 0;
    const step = 1 - Math.exp(-seconds * GLIDE_RATE);
    const next = {
      scale: Math.exp(
        MathUtils.lerp(Math.log(shown.scale), Math.log(goal.scale), step),
      ),
      left: MathUtils.lerp(shown.left, goal.left, step),
      top: MathUtils.lerp(shown.top, goal.top, step),
    };
    shown = arrived(next, goal) ? goal : next;
    project(shown);
  }

  function arrived(from: View, to: View) {
    return (
      Math.abs(from.left - to.left) < 0.5 &&
      Math.abs(from.top - to.top) < 0.5 &&
      Math.abs(from.scale - to.scale) / to.scale < 0.002
    );
  }

  function render(time: number, lean: { x: number; y: number }) {
    const now = performance.now();
    glide(now);
    lastFrame = now;
    shared.uTime.value = time;
    const drift = Math.sin(time * 0.045);
    camera.position.set(
      eye.x + drift * 0.16 + lean.x * 0.08,
      eye.y + lean.y * 0.035,
      eye.z,
    );
    target.set(LOOK_AT.x + drift * 0.1 + lean.x * 0.03, LOOK_AT.y, LOOK_AT.z);
    camera.lookAt(target);
    renderer.render(scene, camera);
  }

  function resize(width: number, height: number, pixelRatio: number) {
    size.width = Math.max(1, width);
    size.height = Math.max(1, height);
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(size.width, size.height, false);
    settle();
    shown = goal;
    if (shown) project(shown);
  }

  function place(placement: GroundPlacement | null, immediate: boolean) {
    requested = placement;
    settle();
    if (immediate || !shown) {
      shown = goal;
      if (shown) project(shown);
    }
    lastFrame = 0;
  }

  function placing() {
    return Boolean(goal && shown && shown !== goal);
  }

  function setPalette(next: GroundPalette) {
    fieldMaterial.uniforms.uLine!.value.copy(next.line);
    fieldMaterial.uniforms.uCountry!.value.copy(next.country);
    fieldMaterial.uniforms.uLineAlpha!.value = next.lineAlpha;
    fieldMaterial.uniforms.uCountryAlpha!.value = next.countryAlpha;
    borderMaterial.uniforms.uBorder!.value.copy(next.border);
    borderMaterial.uniforms.uBorderAlpha!.value = next.borderAlpha;
  }

  function dispose() {
    field.dispose();
    borders.dispose();
    fieldMaterial.dispose();
    borderMaterial.dispose();
    renderer.dispose();
  }

  return { render, resize, place, placing, setPalette, dispose };
}
