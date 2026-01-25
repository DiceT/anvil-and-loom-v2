/**
 * Vortex / Energy Core shader for dice interiors.
 * Arcane reactor, mana well, or contained energy vortex.
 *
 * One-pass, stateless shader:
 * - Radial swirl
 * - Center-weighted intensity
 * - Noise-driven turbulence
 *
 * Designed to sit deep beneath a glass shell.
 */

export const VortexLiquidShader = {
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
    uniform vec3 baseColor;    // outer energy color
    uniform vec3 liquidColor;  // core energy color

    // Optional tuning knobs
    uniform float scale;       // suggested: 2.5
    uniform float swirl;       // suggested: 2.0
    uniform float speed;       // suggested: 0.8
    uniform float intensity;   // suggested: 1.0

    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;

    // Simplex 3D Noise (same implementation as your other shaders)
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

    float snoise(vec3 v) {
      const vec2 C = vec2(1.0/6.0, 1.0/3.0);
      const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

      vec3 i  = floor(v + dot(v, C.yyy));
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

      vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
      p0 *= norm.x;
      p1 *= norm.y;
      p2 *= norm.z;
      p3 *= norm.w;

      vec4 m = max(
        0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)),
        0.0
      );
      m = m * m;

      return 42.0 * dot(m*m, vec4(
        dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)
      ));
    }

    mat2 rot(float a) {
      float s = sin(a), c = cos(a);
      return mat2(c, -s, s, c);
    }

    void main() {
      float t = time * speed;

      // Object-space coordinates
      vec3 p = vPosition * scale;
      
      // Spherical coordinates for omnidirectional swirling
      float r = length(p);
      vec3 dir = normalize(p);
      
      // Latitude/longitude for swirl pattern
      float lat = asin(clamp(dir.y, -1.0, 1.0)); // -PI/2 to PI/2
      float lon = atan(dir.z, dir.x);            // -PI to PI
      
      // Swirl: rotate longitude based on latitude + time (spiral pattern)
      float swirlOffset = lat * swirl + t * 0.5;
      lon += swirlOffset;
      
      // Convert back to direction for noise sampling
      vec3 swirledDir = vec3(
        cos(lat) * cos(lon),
        sin(lat),
        cos(lat) * sin(lon)
      );
      
      // Sample noise with swirled coordinates
      vec3 np = swirledDir * scale;
      float n = snoise(np + vec3(t * 0.3, 0.0, t * 0.2));
      float n2 = snoise(np * 2.0 - vec3(0.0, t * 0.4, 0.0));
      float energy = (n * 0.6 + n2 * 0.4);
      
      // Energy field with smooth transitions - WIDENED range for better color distribution
      float field = smoothstep(-0.5, 0.5, energy);
      
      // Color blend based on energy - Primary is BASE, Secondary is ACCENT
      vec3 col = mix(baseColor, liquidColor, field);
      
      // Apply intensity only - NO swirlLines multiplication that darkens colors
      col *= intensity;

      gl_FragColor = vec4(col, 0.7);
    }
  `
};
