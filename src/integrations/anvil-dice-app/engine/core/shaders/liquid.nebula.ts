export const NebulaLiquidShader = {
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
    uniform vec3 baseColor;    // Effect Primary
    uniform vec3 liquidColor;  // Effect Secondary
    uniform float scale;       // default 2.0
    uniform float speed;       // default 1.0
    uniform float intensity;   // default 1.0

    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;

    // Hash function for Value Noise
    float hash( vec2 p ) {
        float h = dot(p,vec2(127.1,311.7));
        return fract(sin(h)*43758.5453123);
    }

    // Value Noise
    float noise( in vec2 p ) {
        vec2 i = floor( p );
        vec2 f = fract( p );
        vec2 u = f*f*(3.0-2.0*f);
        return -1.0+2.0*mix( mix( hash( i + vec2(0.0,0.0) ), 
                     hash( i + vec2(1.0,0.0) ), u.x),
                mix( hash( i + vec2(0.0,1.0) ), 
                     hash( i + vec2(1.0,1.0) ), u.x), u.y);
    }

    // FBM (Fractal Brownian Motion)
    float fbm( in vec2 p ) {
        float f = 0.0;
        float amp = 0.5;
        // 4 Octaves
        f += amp * noise( p ); p = p * 2.02; amp *= 0.5;
        f += amp * noise( p ); p = p * 2.03; amp *= 0.5;
        f += amp * noise( p ); p = p * 2.01; amp *= 0.5;
        f += amp * noise( p );
        return f;
    }

    // Domain Warping Pattern (The "IQ" Fluid method)
    float pattern( in vec2 p, out vec2 q, out vec2 r ) {
        float t = time * speed * 0.2; 

        // Layer 1: Basic Flow
        q.x = fbm( p + vec2(0.0,0.0) + 0.2*t );
        q.y = fbm( p + vec2(5.2,1.3) + 0.3*t );

        // Layer 2: Distortion by Layer 1
        r.x = fbm( p + 4.0*q + vec2(1.7,9.2) + 0.5*t );
        r.y = fbm( p + 4.0*q + vec2(8.3,2.8) + 0.4*t );

        // Layer 3: Final Density distorted by Layer 2
        return fbm( p + 4.0*r );
    }

    #define PI 3.14159265359

    void main() {
        // Spherical Mapping (Equirectangular)
        vec3 dir = normalize(vPosition);
        
        // Calculate UV based on latitude/longitude
        float u = atan(dir.z, dir.x) / (2.0 * PI) + 0.5;
        float v = asin(dir.y) / PI + 0.5;
        
        vec2 uv = vec2(u, v) * scale;
        
        // Add slow global drift
        uv.x += time * speed * 0.05;
        uv.y += time * speed * 0.02;

        vec2 q, r;
        float f = pattern( uv, q, r );

        // Density remapping - SHIFTED to be brighter overall
        // f typically ranges -0.5 to 0.5, remap with bias toward higher values
        float density = clamp(f * 0.8 + 0.5, 0.0, 1.0);
        // Smoothstep for contrast but NOT as aggressive
        density = density * density * (3.0 - 2.0 * density);
        
        // SIMPLIFIED Color stops - NO black, use colors directly:
        // 0.0 - 0.5: Secondary (liquidColor)
        // 0.5 - 1.0: Secondary → Primary (baseColor)
        // At peaks (>0.9): slight white highlight
        vec3 col;
        if (density < 0.5) {
            // Use Secondary with slight variation
            col = liquidColor * (0.7 + density * 0.6); // 0.7 to 1.0 range
        } else if (density < 0.9) {
            // Blend Secondary → Primary
            float t = (density - 0.5) / 0.4;
            col = mix(liquidColor, baseColor, t);
        } else {
            // Subtle white highlight at peaks
            float t = (density - 0.9) / 0.1;
            col = mix(baseColor, vec3(1.0), t * 0.3); // Only 30% toward white
        }
        
        // Apply intensity
        col = clamp(col, 0.0, 1.0);
        col *= intensity;

        // Fully opaque
        gl_FragColor = vec4(col, 1.0);
    }
  `
};
