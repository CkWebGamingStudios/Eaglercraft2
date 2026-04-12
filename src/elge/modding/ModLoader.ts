// src/elge/modding/ModLoader.ts

import { ModAPI } from "./ModAPI";
import { ModSandbox } from "./ModSandbox";
import { HookRegistry } from "./HookRegistry";

export interface ModManifest {
    id: string;
    name: string;
    version: string;
    author: string;
    description: string;
    elge_version: string;
    dependencies: {
        required: string[];
        optional: string[];
    };
    entry: string;
    permissions: string[];
    hooks: {
        [key: string]: string;
    };
}

export interface LoadedMod {
    manifest: ModManifest;
    code: string;
    sandbox: ModSandbox;
    api: ModAPI;
    enabled: boolean;
    error?: string;
}

export class ModLoader {
    private static mods: Map<string, LoadedMod> = new Map();
    private static hookRegistry = new HookRegistry();
    private static loadOrder: string[] = [];
    
    /**
     * Load a mod from URL or local file
     */
    static async loadMod(manifestUrl: string): Promise<void> {
        try {
            // Fetch manifest
            const manifestResponse = await fetch(manifestUrl);
            if (!manifestResponse.ok) {
                throw new Error(`Failed to fetch manifest: ${manifestResponse.statusText}`);
            }
            
            const manifest: ModManifest = await manifestResponse.json();
            
            // Validate manifest
            this.validateManifest(manifest);
            
            // Check if already loaded
            if (this.mods.has(manifest.id)) {
                console.warn(`[ModLoader] Mod ${manifest.id} is already loaded`);
                return;
            }
            
            // Check ELGE version compatibility
            if (!this.isVersionCompatible(manifest.elge_version)) {
                throw new Error(`Incompatible ELGE version. Required: ${manifest.elge_version}`);
            }
            
            // Resolve dependencies
            await this.resolveDependencies(manifest);
            
            // Load mod code
            const baseUrl = manifestUrl.substring(0, manifestUrl.lastIndexOf('/'));
            const codeUrl = `${baseUrl}/${manifest.entry}`;
            const codeResponse = await fetch(codeUrl);
            if (!codeResponse.ok) {
                throw new Error(`Failed to fetch mod code: ${codeResponse.statusText}`);
            }
            
            const code = await codeResponse.text();
            
            // Create sandboxed environment
            const sandbox = new ModSandbox(manifest.permissions);
            const api = new ModAPI(manifest.id);
            
            // Store mod
            const mod: LoadedMod = {
                manifest,
                code,
                sandbox,
                api,
                enabled: false
            };
            
            this.mods.set(manifest.id, mod);
            
            console.log(`[ModLoader] Loaded mod: ${manifest.name} v${manifest.version}`);
        } catch (error) {
            console.error(`[ModLoader] Failed to load mod from ${manifestUrl}:`, error);
            throw error;
        }
    }
    
    /**
     * Initialize a loaded mod
     */
    static async initializeMod(modId: string): Promise<void> {
        const mod = this.mods.get(modId);
        if (!mod) {
            throw new Error(`Mod ${modId} not found`);
        }
        
        if (mod.enabled) {
            console.warn(`[ModLoader] Mod ${modId} is already initialized`);
            return;
        }
        
        try {
            // Execute mod code in sandbox
            const exports = await mod.sandbox.execute(mod.code, mod.api);
            
            // Register hooks
            this.registerModHooks(mod, exports);
            
            // Call init hook
            if (mod.manifest.hooks.init && exports[mod.manifest.hooks.init]) {
                await exports[mod.manifest.hooks.init]();
            }
            
            mod.enabled = true;
            this.updateLoadOrder();
            
            console.log(`[ModLoader] Initialized mod: ${mod.manifest.name}`);
        } catch (error) {
            mod.error = error instanceof Error ? error.message : String(error);
            console.error(`[ModLoader] Failed to initialize mod ${modId}:`, error);
            throw error;
        }
    }
    
    /**
     * Load and initialize a mod in one step
     */
    static async install(manifestUrl: string): Promise<void> {
        await this.loadMod(manifestUrl);
        const manifestResponse = await fetch(manifestUrl);
        const manifest = await manifestResponse.json();
        await this.initializeMod(manifest.id);
    }
    
    /**
     * Unload a mod
     */
    static async unloadMod(modId: string): Promise<void> {
        const mod = this.mods.get(modId);
        if (!mod) {
            throw new Error(`Mod ${modId} not found`);
        }
        
        if (mod.enabled) {
            // Call cleanup hook if exists
            if (mod.manifest.hooks.cleanup) {
                try {
                    const exports = mod.sandbox.getExports();
                    if (exports[mod.manifest.hooks.cleanup]) {
                        await exports[mod.manifest.hooks.cleanup]();
                    }
                } catch (error) {
                    console.error(`[ModLoader] Error during mod cleanup:`, error);
                }
            }
            
            // Unregister hooks
            this.hookRegistry.unregisterMod(modId);
        }
        
        this.mods.delete(modId);
        this.updateLoadOrder();
        
        console.log(`[ModLoader] Unloaded mod: ${mod.manifest.name}`);
    }
    
    /**
     * Get all loaded mods
     */
    static getAllMods(): LoadedMod[] {
        return Array.from(this.mods.values());
    }
    
    /**
     * Get a specific mod
     */
    static getMod(modId: string): LoadedMod | undefined {
        return this.mods.get(modId);
    }
    
    /**
     * Check if a mod is loaded
     */
    static isLoaded(modId: string): boolean {
        return this.mods.has(modId);
    }
    
    /**
     * Execute a hook for all mods
     */
    static async executeHook(hookName: string, ...args: any[]): Promise<void> {
        const handlers = this.hookRegistry.getHook(hookName);
        
        for (const modId of this.loadOrder) {
            const handler = handlers.get(modId);
            if (handler) {
                try {
                    await handler(...args);
                } catch (error) {
                    console.error(`[ModLoader] Error in ${modId} hook ${hookName}:`, error);
                }
            }
        }
    }
    
    /**
     * Execute a hook for a specific mod
     */
    static async executeModHook(modId: string, hookName: string, ...args: any[]): Promise<void> {
        const mod = this.mods.get(modId);
        if (!mod || !mod.enabled) return;
        
        const handler = this.hookRegistry.getHook(hookName).get(modId);
        if (handler) {
            try {
                await handler(...args);
            } catch (error) {
                console.error(`[ModLoader] Error in ${modId} hook ${hookName}:`, error);
            }
        }
    }
    
    // ===== Private Methods =====
    
    private static validateManifest(manifest: ModManifest): void {
        if (!manifest.id) throw new Error('Mod manifest missing "id"');
        if (!manifest.version) throw new Error('Mod manifest missing "version"');
        if (!manifest.entry) throw new Error('Mod manifest missing "entry"');
        
        // Validate ID format (alphanumeric, hyphens, underscores)
        if (!/^[a-z0-9_-]+$/.test(manifest.id)) {
            throw new Error('Mod ID must be lowercase alphanumeric with hyphens or underscores');
        }
        
        // Validate version format (semver)
        if (!/^\d+\.\d+\.\d+/.test(manifest.version)) {
            throw new Error('Mod version must follow semantic versioning (X.Y.Z)');
        }
    }
    
    private static isVersionCompatible(requiredVersion: string): boolean {
        // Simple compatibility check
        // In production, use proper semver comparison
        const current = '0.1.0'; // ELGE version
        
        if (requiredVersion.startsWith('>=')) {
            const required = requiredVersion.substring(2);
            return this.compareVersions(current, required) >= 0;
        }
        
        return true;
    }
    
    private static compareVersions(a: string, b: string): number {
        const aParts = a.split('.').map(Number);
        const bParts = b.split('.').map(Number);
        
        for (let i = 0; i < 3; i++) {
            if (aParts[i] > bParts[i]) return 1;
            if (aParts[i] < bParts[i]) return -1;
        }
        
        return 0;
    }
    
    private static async resolveDependencies(manifest: ModManifest): Promise<void> {
        // Check required dependencies
        for (const dep of manifest.dependencies.required) {
            const [depId] = dep.split('@');
            if (!this.isLoaded(depId)) {
                throw new Error(`Missing required dependency: ${dep}`);
            }
        }
    }
    
    private static registerModHooks(mod: LoadedMod, exports: any): void {
        for (const [hookName, handlerName] of Object.entries(mod.manifest.hooks)) {
            if (exports[handlerName]) {
                this.hookRegistry.register(hookName, mod.manifest.id, exports[handlerName]);
            }
        }
    }
    
    private static updateLoadOrder(): void {
        // Topological sort based on dependencies
        // For now, simple load order
        this.loadOrder = Array.from(this.mods.keys()).filter(
            id => this.mods.get(id)?.enabled
        );
    }
}
