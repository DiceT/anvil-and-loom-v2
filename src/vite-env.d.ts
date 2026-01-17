/// <reference types="vite/client" />

// CSS module declarations
declare module '*.css' {
    const content: Record<string, string>;
    export default content;
}

declare module '*.module.css' {
    const content: Record<string, string>;
    export default content;
}
