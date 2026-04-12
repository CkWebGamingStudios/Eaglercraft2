// src/elge/modding/ModSandbox.ts
export class ModSandbox {
    execute(code: string, api: ModAPI): any {
class ModSandbox {
  // Restricted globals
  private allowedAPIs = [
    'console', 'Math', 'Date', 'JSON', 'Array', 'Object'
  ];
  
  // Blocked APIs
  private blockedAPIs = [
    'fetch', 'XMLHttpRequest', 'localStorage', 'indexedDB'
  ];
  
  // Execute mod in isolated context
  execute(modCode: string, api: ELGE_ModAPI): void;
}
