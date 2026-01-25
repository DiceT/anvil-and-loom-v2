/**
 * Singularity shader for dice interiors.
 * Creates a black hole/event horizon effect with swirling accretion disk.
 */

export const SingularityLiquidShader = {
  vertexShader: `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float time;
    uniform vec3 baseColor;
    uniform vec3 liquidColor;

    varying vec3 vPosition;

    // Simplex 3D Noise
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

    float snoise(vec3 v) {
      const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
      const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

      vec3 i = floor(v + dot(v, C.yyy));
      vec3 x0 = v - i + dot(i, C.xxx);

      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min(g.xyz, l.zxy);
      vec3 i2 = max(g.xyz, l.zxy);

      vec3 x1 = x0 - i1 + C.xxx;
      vec3 x2 = x0 - i2 + C.yyy;
      vec3 x3 = x0 - D.yyy;

      i = mod289(i);
      vec4 p = permute(permute(permute(
          i.z + vec4(0.0, i1.z, i2.z, 1.0))
        + i.y + vec4(0.0, i1.y, i2.y, 1.0))
        + i.x + vec4(0.0, i1.x, i2.x, 1.0));

      float n_ = 0.142857142857;
      vec3 ns = n_ * D.wyz - D.xzx;

      vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_);

      vec4 x = x_ * ns.x + ns.yyyy;
      vec4 y = y_ * ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);

      vec4 b0 = vec4(x.xy, y.xy);
      vec4 b1 = vec4(x.zw, y.zw);

      vec4 s0 = floor(b0) * 2.0 + 1.0;
      vec4 s1 = floor(b1) * 2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));

      vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
      vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

      vec3 p0 = vec3(a0.xy, h.x);
      vec3 p1 = vec3(a0.zw, h.y);
      vec3 p2 = vec3(a1.xy, h.z);
      vec3 p3 = vec3(a1.zw, h.w);

      vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
      p0 *= norm.x;
      p1 *= norm.y;
      p2 *= norm.z;
      p3 *= norm.w;

      vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
      m = m * m;
      return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
    }

    mat2 rot(float a) {
      float s = sin(a), c = cos(a);
      return mat2(c, -s, s, c);
    }

    void main() {
      float t = time * 1.5;

      // Base coordinates
      vec3 p = vPosition * 2.5;

      // Singularity controls
      float horizon = 0.35;    // radius of the black hole
      float twist = 1.25;      // swirl strength
      float infall = 0.20;     // inward pull strength
      float falloff = 1.7;     // how aggressively swirl ramps near center

      float r = length(p.xy) + 1e-4;
      float centerBias = 1.0 / pow(r + 0.25, falloff);

      // Infall: pull coordinates inward near center
      float pull = infall * centerBias;
      p.xy *= (1.0 - pull * 0.25);

      // Swirl: rotate more near center
      float ang = twist * centerBias + t * 0.15;
      p.xy = rot(ang) * p.xy;

      // Noise layers
      float n1 = snoise(p + vec3(t * 0.2, t * 0.1, 0.0));
      float n2 = snoise(p * 2.0 - vec3(0.0, t * 0.15, 0.0));
      float noiseVal = (n1 + n2 * 0.5) * 0.7;

      // WIDENED mix range for better color distribution
      float mixVal = smoothstep(-0.2, 0.8, noiseVal);
      // Primary is BASE, Secondary is ACCENT
      vec3 col = mix(baseColor, liquidColor, mixVal);

      // Event horizon: REDUCED darkening - only darken the very core, not crush colors
      float core = smoothstep(horizon * 1.5, horizon * 0.5, r);
      col = mix(col, vec3(0.0), core * 0.8); // Only 80% dark at absolute center

      // Accretion ring glow - BOOSTED visibility
      float ringR = horizon * 1.8;
      float ring = exp(-pow((r - ringR) / (horizon * 0.25), 2.0));
      col += ring * liquidColor * 0.4; // Boosted from 0.15

      gl_FragColor = vec4(col, 1.0);
    }
  `
};
