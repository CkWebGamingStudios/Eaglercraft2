import { ELGE_ModAPI } from './ModAPI.ts';

export class ModSandbox {
    private allowedGlobals = [
        'Math', 'Date', 'JSON', 'Array', 'Object', 'String', 
        'Number', 'Boolean', 'RegExp', 'console', 'setTimeout'
    ];

    /**
     * Executes mod code in a restricted scope
     * @param modId The unique ID of the mod
     * @param code The raw JavaScript code of the mod
     * @param api The ModAPI instance to provide to the mod
     */
    async execute(modId: string, code: string, api: ELGE_ModAPI): Promise<void> {
        console.log(`[ModSandbox] Virtualizing environment for: ${modId}`);

        // Create a restricted proxy for the window/global object
        const sandboxProxy = new Proxy(window, {
            get: (target, prop: string) => {
                // Return the API if requested
                if (prop === 'elge') return api;
                
                // Allow specific safe globals
                if (this.allowedGlobals.includes(prop)) {
                    return (target as any)[prop];
                }

                // Block everything else (document, localStorage, cookies, etc)
                console.warn(`[ModSandbox] Security Block: Mod "${modId}" tried to access "${prop}"`);
                return undefined;
            },
            has: (target, prop: string) => {
                return prop === 'elge' || this.allowedGlobals.includes(prop);
            }
        });

        try {
            // Use a Function constructor to create a scoped execution context
            // 'elge' becomes the local variable mods use to interact with the engine
            const script = new Function('elge', 'window', 'document', 'globalThis', `
                "use strict";
                ${code}
            `);

            // Execute with the proxy as the global context
            script.bind(sandboxProxy)(api, sandboxProxy, undefined, sandboxProxy);
            
        } catch (error) {
            console.error(`[ModSandbox] Runtime error in mod "${modId}":`, error);
        }
    }
}
