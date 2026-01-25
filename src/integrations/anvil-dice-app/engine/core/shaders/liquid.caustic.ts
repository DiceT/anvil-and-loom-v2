export const CausticLiquidShader = {
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
    uniform vec3 baseColor;    // Effect Primary (Caustic Lines)
    uniform vec3 liquidColor;  // Effect Secondary (Background)
    uniform float scale;       // default 1.0
    uniform float speed;       // default 1.0
    uniform float intensity;   // default 1.0

    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;

    #define TAU 6.28318530718
    #define PI 3.14159265359
    #define MAX_ITER 5

    void main() {
        // Match user's iTime * 0.5 + 23.0
        float t = time * speed * 0.5 + 23.0; 
        
        // Spherical Mapping (Equirectangular)
        vec3 dir = normalize(vPosition);
        
        // Calculate UV based on latitude/longitude
        float u = atan(dir.z, dir.x) / (2.0 * PI) + 0.5;
        float v = asin(dir.y) / PI + 0.5;
        
        vec2 uv = vec2(u, v) * scale;
        
        // Add slow global drift
        uv.x += time * speed * 0.05;
        // uv.y += ... (optional)
        
        vec2 p = mod(uv*TAU, TAU) - 250.0;
        
        vec2 i = vec2(p);
        float c = 1.0;
        float inten = 0.005;

        for (int n = 0; n < MAX_ITER; n++) {
            float t_iter = t * (1.0 - (3.5 / float(n+1)));
            
            i = p + vec2(
                cos(t_iter - i.x) + sin(t_iter + i.y), 
                sin(t_iter - i.y) + cos(t_iter + i.x)
            );
            
            c += 1.0/length(vec2(
                p.x / (sin(i.x+t_iter)/inten), 
                p.y / (cos(i.y+t_iter)/inten)
            ));
        }
        
        c /= float(MAX_ITER);
        c = 1.17 - pow(c, 1.4);
        
        // Highlight value - REDUCED power from 8.0 to 4.0 for more visible lines
        float val = pow(abs(c), 4.0);
        
        // Color Logic:
        // Background = liquidColor (Secondary) at minimum 70% brightness
        // Lines = baseColor (Primary) mixed in based on "val"
        
        // Start with full Secondary color as base (not darkened)
        vec3 col = liquidColor * 0.8 + baseColor * val * 0.8;
        
        col = clamp(col, 0.0, 1.0);
        col *= intensity;

        gl_FragColor = vec4(col, 1.0);
    }
  `
};
