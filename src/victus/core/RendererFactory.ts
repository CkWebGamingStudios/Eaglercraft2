// src/victus/core/RendererFactory.ts

import { WebGL2Renderer } from "../renderers/WebGL2Renderer";
import { WebGL1Renderer } from "../renderers/WebGL1Renderer";
import { Canvas2DRenderer } from "../renderers/Canvas2DRenderer";
import { SoftwareRenderer } from "../renderers/SoftwareRenderer";
import { BaseRenderer, RendererCapabilities } from "./BaseRenderer";

export enum RendererType {
    WEBGL2 = 'webgl2',
    WEBGL1 = 'webgl1',
    CANVAS2D = 'canvas2d',
    SOFTWARE = 'software'
}

export interface RendererInfo {
    type: RendererType;
    name: string;
    capabilities: RendererCapabilities;
    performanceScore: number;
}

export class RendererFactory {
    private static canvas: HTMLCanvasElement;
    
    /**
     * Auto-detect and create the best renderer for the current device
     */
    static createOptimal(canvas: HTMLCanvasElement): BaseRenderer {
        this.canvas = canvas;
        
        const capabilities = this.detectCapabilities();
        console.log('[Victus] Detected capabilities:', capabilities);
        
        // Try renderers in order of preference
        if (capabilities.webgl2) {
            console.log('[Victus] Using WebGL2 renderer');
            return new WebGL2Renderer(canvas);
        }
        
        if (capabilities.webgl1) {
            console.log('[Victus] Using WebGL1 renderer (compatibility mode)');
            return new WebGL1Renderer(canvas);
        }
        
        if (capabilities.canvas2d) {
            console.log('[Victus] Using Canvas2D renderer (2D fallback)');
            return new Canvas2DRenderer(canvas);
        }
        
        console.warn('[Victus] Using Software renderer (CPU rasterization)');
        return new SoftwareRenderer(canvas);
    }
    
    /**
     * Create a specific renderer type
     */
    static create(canvas: HTMLCanvasElement, type: RendererType): BaseRenderer {
        this.canvas = canvas;
        
        switch (type) {
            case RendererType.WEBGL2:
                return new WebGL2Renderer(canvas);
            case RendererType.WEBGL1:
                return new WebGL1Renderer(canvas);
            case RendererType.CANVAS2D:
                return new Canvas2DRenderer(canvas);
            case RendererType.SOFTWARE:
                return new SoftwareRenderer(canvas);
            default:
                throw new Error(`Unknown renderer type: ${type}`);
        }
    }
    
    /**
     * Get all available renderers with their capabilities
     */
    static getAvailableRenderers(): RendererInfo[] {
        const capabilities = this.detectCapabilities();
        const renderers: RendererInfo[] = [];
        
        if (capabilities.webgl2) {
            renderers.push({
                type: RendererType.WEBGL2,
                name: 'WebGL 2.0',
                capabilities: {
                    maxTextureSize: 4096,
                    maxDrawCalls: 10000,
                    supportsInstancing: true,
                    supportsFloatTextures: true,
                    maxLights: 8
                },
                performanceScore: 100
            });
        }
        
        if (capabilities.webgl1) {
            renderers.push({
                type: RendererType.WEBGL1,
                name: 'WebGL 1.0',
                capabilities: {
                    maxTextureSize: 2048,
                    maxDrawCalls: 5000,
                    supportsInstancing: false,
                    supportsFloatTextures: false,
                    maxLights: 4
                },
                performanceScore: 60
            });
        }
        
        if (capabilities.canvas2d) {
            renderers.push({
                type: RendererType.CANVAS2D,
                name: 'Canvas 2D',
                capabilities: {
                    maxTextureSize: 1024,
                    maxDrawCalls: 1000,
                    supportsInstancing: false,
                    supportsFloatTextures: false,
                    maxLights: 1
                },
                performanceScore: 30
            });
        }
        
        // Software renderer is always available
        renderers.push({
            type: RendererType.SOFTWARE,
            name: 'Software Rasterizer',
            capabilities: {
                maxTextureSize: 512,
                maxDrawCalls: 500,
                supportsInstancing: false,
                supportsFloatTextures: false,
                maxLights: 1
            },
            performanceScore: 10
        });
        
        return renderers;
    }
    
    /**
     * Detect GPU and browser capabilities
     */
    private static detectCapabilities() {
        const testCanvas = document.createElement('canvas');
        
        return {
            webgl2: this.testWebGL2(testCanvas),
            webgl1: this.testWebGL1(testCanvas),
            canvas2d: this.testCanvas2D(testCanvas),
            gpu: this.detectGPU(testCanvas),
            browser: this.detectBrowser()
        };
    }
    
    private static testWebGL2(canvas: HTMLCanvasElement): boolean {
        try {
            const gl = canvas.getContext('webgl2', {
                failIfMajorPerformanceCaveat: false
            });
            return gl !== null;
        } catch {
            return false;
        }
    }
    
    private static testWebGL1(canvas: HTMLCanvasElement): boolean {
        try {
            const gl = canvas.getContext('webgl', {
                failIfMajorPerformanceCaveat: false
            }) || canvas.getContext('experimental-webgl', {
                failIfMajorPerformanceCaveat: false
            });
            return gl !== null;
        } catch {
            return false;
        }
    }
    
    private static testCanvas2D(canvas: HTMLCanvasElement): boolean {
        try {
            const ctx = canvas.getContext('2d');
            return ctx !== null;
        } catch {
            return false;
        }
    }
    
    private static detectGPU(canvas: HTMLCanvasElement) {
        try {
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            if (!gl) return { vendor: 'Unknown', renderer: 'Unknown', legacy: true };
            
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            if (!debugInfo) return { vendor: 'Unknown', renderer: 'Unknown', legacy: false };
            
            const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
            const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
            
            // Detect legacy GPUs (Intel HD 3000, etc.)
            const legacy = renderer.includes('Intel') && (
                renderer.includes('HD Graphics 3000') ||
                renderer.includes('HD Graphics 2000') ||
                renderer.includes('HD Graphics') && parseInt(renderer.match(/\d+/)?.[0] || '9999') < 4000
            );
            
            return { vendor, renderer, legacy };
        } catch {
            return { vendor: 'Unknown', renderer: 'Unknown', legacy: true };
        }
    }
    
    private static detectBrowser() {
        const ua = navigator.userAgent;
        
        return {
            firefox: /Firefox/i.test(ua),
            chrome: /Chrome/i.test(ua) && !/Edge/i.test(ua),
            safari: /Safari/i.test(ua) && !/Chrome/i.test(ua),
            edge: /Edge/i.test(ua),
            name: this.getBrowserName(ua)
        };
    }
    
    private static getBrowserName(ua: string): string {
        if (/Firefox/i.test(ua)) return 'Firefox';
        if (/Chrome/i.test(ua) && !/Edge/i.test(ua)) return 'Chrome';
        if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) return 'Safari';
        if (/Edge/i.test(ua)) return 'Edge';
        return 'Unknown';
    }
    
    /**
     * Get browser recommendation for current hardware
     */
    static getBrowserRecommendation(): {
        recommended: string;
        reason: string;
        downloadUrl?: string;
    } {
        const caps = this.detectCapabilities();
        
        // Legacy GPU detected and not using Firefox
        if (caps.gpu.legacy && !caps.browser.firefox) {
            return {
                recommended: 'Firefox',
                reason: 'Firefox has better WebGL compatibility with Intel HD Graphics 3000 and older GPUs',
                downloadUrl: 'https://www.mozilla.org/firefox/'
            };
        }
        
        // No WebGL support at all
        if (!caps.webgl1 && !caps.webgl2) {
            return {
                recommended: 'Firefox or Chrome (latest)',
                reason: 'Update to a modern browser for WebGL support',
                downloadUrl: 'https://www.mozilla.org/firefox/'
            };
        }
        
        return {
            recommended: caps.browser.name,
            reason: 'Your current browser is optimal for this hardware'
        };
    }
}
