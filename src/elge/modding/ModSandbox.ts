// src/elge/modding/ModSandbox.ts

// Define the interface for your API if not already defined elsewhere
interface ELGE_ModAPI {
    [key: string]: any;
}

export class ModSandbox {
    // Properties must be defined at the class level, not inside methods
    private allowedAPIs: string[] = [
        'console', 'Math', 'Date', 'JSON', 'Array', 'Object'
    ];

    private blockedAPIs: string[] = [
        'fetch', 'XMLHttpRequest', 'localStorage', 'indexedDB'
    ];

    /**
     * Executes mod code in a semi-isolated context.
     * Note: True isolation in JS usually requires a Proxy or a Worker.
     */
    execute(modCode: string, api: ELGE_ModAPI): void {
        try {
            // Create a wrapper function that passes your API as a local variable
            // This prevents the mod from easily accessing the global 'window' or 'global' object
            const runner = new Function('api', 'console', ...this.blockedAPIs, `
                "use strict";
                ${modCode}
            `);

            // Execute the code, passing your API and nulling out blocked globals
            // We pass 'null' for blocked APIs to overshadow the global versions
            const blockedValues = this.blockedAPIs.map(() => null);
            runner(api, console, ...blockedValues);

        } catch (error) {
            console.error("Mod Execution Error:", error);
        }
    }
}
