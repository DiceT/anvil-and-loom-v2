/**
 * Volumetric Flame Core (Radial Fireball)
 * Uses Las^Mercury noise but adapted for omni-directional radiation.
 */
export const FlameCoreShader = {
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
    uniform vec3 baseColor;    // Primary (Core Flame)
    uniform vec3 liquidColor;  // Secondary (Outer/Background)
    
    uniform float scale;       // default 2.5
    uniform float speed;       // default 1.2
    uniform float intensity;   // default 1.0

    varying vec3 vPosition;

    // --- Noise Function ---
    float noise(vec3 p) {
        vec3 i = floor(p);
        vec4 a = dot(i, vec3(1., 57., 21.)) + vec4(0., 57., 21., 78.);
        vec3 f = cos((p-i)*acos(-1.))*(-.5)+.5;
        a = mix(sin(cos(a)*a),sin(cos(1.+a)*(1.+a)), f.x);
        a.xy = mix(a.xz, a.yw, f.y);
        return mix(a.x, a.y, f.z);
    }

    float sphere(vec3 p, float r) {
        return length(p) - r;
    }

    float flame(vec3 p) {
        float t = time * speed;
        // Base Sphere - Increased radius to ensure it touches the mesh shell
        // Mesh p is approx 2.0-2.5 magnitude. We need sphere to be ~2.2.
        float d = sphere(p, 2.2); 
        
        // Omni-directional distortion
        float dist = noise(p + vec3(0.0, t * 2.0, 0.0)) + noise(p * 3.0) * 0.5;
        
        return d + dist * 0.8; // Stronger distortion
    }

    // sRGB encoding - ShaderMaterial doesn't auto-convert like other materials
    vec3 linearToSRGB(vec3 color) {
        return pow(color, vec3(1.0 / 2.2));
    }

    void main() {
        // Center and scale coordinates
        vec3 p = vPosition * scale;

        // Evaluate SDF
        float d = flame(p);

        // Density Mapping
        float val = -d;
        float density = smoothstep(-1.0, 0.3, val);

        // Noise-based Color Swirling
        float t = time * speed;
        float noiseVal = noise(p + vec3(0.0, t * 2.0, 0.0));
        float swirl = clamp(noiseVal * 0.5 + 0.5, 0.0, 1.0);
        // Biased toward Secondary (liquidColor) - Primary appears as highlights only
        swirl = smoothstep(0.4, 0.9, swirl);
        
        // Flamecore: Secondary (liquidColor) is dominant flame, Primary (baseColor) is accent
        vec3 col = mix(liquidColor, baseColor, swirl);
        
        col *= intensity;
        
        // CRITICAL: Encode to sRGB for proper display
        col = linearToSRGB(col);
        
        // Alpha based on density
        float alpha = density * 0.7;
        alpha = clamp(alpha, 0.0, 1.0);

        gl_FragColor = vec4(col, alpha);
    }
  `
};
