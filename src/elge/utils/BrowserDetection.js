// src/elge/utils/BrowserDetection.js

/**
 * Detect GPU and recommend best browser
 */
export function getBrowserRecommendation() {
    const gpu = detectGPU();
    const browser = detectBrowser();
    
    // Legacy GPU detected and not using Firefox
    if (gpu.legacy && !browser.firefox) {
        return {
            recommended: 'Firefox',
            reason: 'Firefox has better WebGL compatibility with Intel HD Graphics 3000 and older GPUs',
            downloadUrl: 'https://www.mozilla.org/firefox/'
        };
    }
    
    // No WebGL support at all
    if (!hasWebGLSupport()) {
        return {
            recommended: 'Firefox or Chrome (latest)',
            reason: 'Update to a modern browser for WebGL support',
            downloadUrl: 'https://www.mozilla.org/firefox/'
        };
    }
    
    return {
        recommended: browser.name,
        reason: 'Your current browser is optimal for this hardware'
    };
}

function detectGPU() {
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        
        if (!gl) {
            return { vendor: 'Unknown', renderer: 'Unknown', legacy: true };
        }
        
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (!debugInfo) {
            return { vendor: 'Unknown', renderer: 'Unknown', legacy: false };
        }
        
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

function detectBrowser() {
    const ua = navigator.userAgent;
    
    return {
        firefox: /Firefox/i.test(ua),
        chrome: /Chrome/i.test(ua) && !/Edge/i.test(ua),
        safari: /Safari/i.test(ua) && !/Chrome/i.test(ua),
        edge: /Edge/i.test(ua),
        name: getBrowserName(ua)
    };
}

function getBrowserName(ua) {
    if (/Firefox/i.test(ua)) return 'Firefox';
    if (/Chrome/i.test(ua) && !/Edge/i.test(ua)) return 'Chrome';
    if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) return 'Safari';
    if (/Edge/i.test(ua)) return 'Edge';
    return 'Unknown';
}

function hasWebGLSupport() {
    try {
        const canvas = document.createElement('canvas');
        return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
    } catch {
        return false;
    }
}

export function logBrowserRecommendation() {
    const rec = getBrowserRecommendation();
    
    if (rec.recommended !== rec.reason.includes('optimal')) {
        console.warn(`[ELGE] Browser Recommendation: ${rec.recommended}`);
        console.warn(`[ELGE] Reason: ${rec.reason}`);
        if (rec.downloadUrl) {
            console.warn(`[ELGE] Download: ${rec.downloadUrl}`);
        }
    }
}
