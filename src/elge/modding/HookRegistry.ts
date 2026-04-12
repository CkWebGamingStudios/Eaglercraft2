// src/elge/modding/HookRegistry.ts
export class HookRegistry {
    register(hookName: string, modId: string, handler: Function): void;
    getHook(hookName: string): Map<string, Function>;
    unregisterMod(modId: string): void;
}
