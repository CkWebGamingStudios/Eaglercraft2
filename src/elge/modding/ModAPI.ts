// src/elge/modding/ModAPI.ts

import { Vec3 } from "../../victus/math/Vec3";

/**
 * Complete Modding API exposed to mods
 * This is the ONLY interface mods can use
 */
export class ModAPI {
    private modId: string;
    
    constructor(modId: string) {
        this.modId = modId;
    }
    
    // ===== Events System =====
    
    /**
     * Listen to game events
     */
    on(event: string, handler: Function): void {
        // TODO: Implement event system
        console.log(`[ModAPI:${this.modId}] Registered event handler for: ${event}`);
    }
    
    /**
     * Emit a custom event
     */
    emit(event: string, data?: any): void {
        // TODO: Implement event system
        console.log(`[ModAPI:${this.modId}] Emitted event: ${event}`, data);
    }
    
    /**
     * Remove event listener
     */
    off(event: string, handler: Function): void {
        // TODO: Implement event system
    }
    
    // ===== Entity System =====
    
    entities = {
        /**
         * Create a new entity
         */
        create: (type: string, data?: any): Entity => {
            // TODO: Implement entity creation
            console.log(`[ModAPI:${this.modId}] Creating entity: ${type}`);
            return {
                id: crypto.randomUUID(),
                type,
                position: new Vec3(0, 0, 0),
                data: data || {}
            };
        },
        
        /**
         * Destroy an entity
         */
        destroy: (entityId: string): void => {
            console.log(`[ModAPI:${this.modId}] Destroying entity: ${entityId}`);
        },
        
        /**
         * Find entities by filter
         */
        find: (filter: EntityFilter): Entity[] => {
            console.log(`[ModAPI:${this.modId}] Finding entities with filter:`, filter);
            return [];
        },
        
        /**
         * Get entity by ID
         */
        get: (entityId: string): Entity | null => {
            return null;
        }
    };
    
    // ===== Block System (Voxel/Minecraft-like) =====
    
    blocks = {
        /**
         * Register a new block type
         */
        register: (block: BlockDefinition): void => {
            console.log(`[ModAPI:${this.modId}] Registering block: ${block.id}`);
            // TODO: Implement block registration
        },
        
        /**
         * Set a block in the world
         */
        setBlock: (x: number, y: number, z: number, blockId: string): void => {
            console.log(`[ModAPI:${this.modId}] Setting block at (${x},${y},${z}): ${blockId}`);
        },
        
        /**
         * Get block at position
         */
        getBlock: (x: number, y: number, z: number): Block | null => {
            return null;
        },
        
        /**
         * Check if block exists
         */
        hasBlock: (blockId: string): boolean => {
            return false;
        }
    };
    
    // ===== Item System =====
    
    items = {
        /**
         * Register a new item type
         */
        register: (item: ItemDefinition): void => {
            console.log(`[ModAPI:${this.modId}] Registering item: ${item.id}`);
        },
        
        /**
         * Give item to player
         */
        give: (playerId: string, itemId: string, count: number = 1): void => {
            console.log(`[ModAPI:${this.modId}] Giving ${count}x ${itemId} to ${playerId}`);
        },
        
        /**
         * Remove item from player
         */
        remove: (playerId: string, itemId: string, count: number = 1): void => {
            console.log(`[ModAPI:${this.modId}] Removing ${count}x ${itemId} from ${playerId}`);
        }
    };
    
    // ===== UI System =====
    
    ui = {
        /**
         * Create an overlay UI component
         */
        createOverlay: (config: OverlayConfig): string => {
            const overlayId = `${this.modId}_${crypto.randomUUID()}`;
            console.log(`[ModAPI:${this.modId}] Creating overlay: ${overlayId}`);
            return overlayId;
        },
        
        /**
         * Remove an overlay
         */
        removeOverlay: (overlayId: string): void => {
            console.log(`[ModAPI:${this.modId}] Removing overlay: ${overlayId}`);
        },
        
        /**
         * Show a notification
         */
        notify: (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): void => {
            console.log(`[ModAPI:${this.modId}] Notification (${type}): ${message}`);
        }
    };
    
    // ===== World System =====
    
    world = {
        /**
         * Get current world time
         */
        getTime: (): number => {
            return Date.now();
        },
        
        /**
         * Set world time
         */
        setTime: (time: number): void => {
            console.log(`[ModAPI:${this.modId}] Setting world time: ${time}`);
        },
        
        /**
         * Spawn entity at position
         */
        spawn: (type: string, position: Vec3): Entity => {
            return this.entities.create(type, { position });
        }
    };
    
    // ===== Player System =====
    
    player = {
        /**
         * Get current player
         */
        get: (): Player | null => {
            return null;
        },
        
        /**
         * Teleport player
         */
        teleport: (position: Vec3): void => {
            console.log(`[ModAPI:${this.modId}] Teleporting player to:`, position);
        },
        
        /**
         * Get player inventory
         */
        getInventory: (): Inventory => {
            return {
                items: [],
                size: 36
            };
        }
    };
    
    // ===== Command System =====
    
    commands = {
        /**
         * Register a custom command
         */
        register: (name: string, handler: CommandHandler): void => {
            console.log(`[ModAPI:${this.modId}] Registering command: /${name}`);
        },
        
        /**
         * Execute a command
         */
        execute: (command: string): void => {
            console.log(`[ModAPI:${this.modId}] Executing command: ${command}`);
        }
    };
    
    // ===== Storage System =====
    
    storage = {
        /**
         * Get value from mod storage
         */
        get: async (key: string): Promise<any> => {
            const storageKey = `mod:${this.modId}:${key}`;
            const value = localStorage.getItem(storageKey);
            return value ? JSON.parse(value) : null;
        },
        
        /**
         * Set value in mod storage
         */
        set: async (key: string, value: any): Promise<void> => {
            const storageKey = `mod:${this.modId}:${key}`;
            localStorage.setItem(storageKey, JSON.stringify(value));
        },
        
        /**
         * Delete value from mod storage
         */
        delete: async (key: string): Promise<void> => {
            const storageKey = `mod:${this.modId}:${key}`;
            localStorage.removeItem(storageKey);
        },
        
        /**
         * Clear all mod storage
         */
        clear: async (): Promise<void> => {
            const prefix = `mod:${this.modId}:`;
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith(prefix)) {
                    localStorage.removeItem(key);
                }
            });
        }
    };
    
    // ===== Utilities =====
    
    utils = {
        /**
         * Generate UUID
         */
        uuid: (): string => {
            return crypto.randomUUID();
        },
        
        /**
         * Random number
         */
        random: (min: number = 0, max: number = 1): number => {
            return Math.random() * (max - min) + min;
        },
        
        /**
         * Log message (prefixed with mod ID)
         */
        log: (...args: any[]): void => {
            console.log(`[Mod:${this.modId}]`, ...args);
        }
    };
}

// ===== Type Definitions =====

export interface Entity {
    id: string;
    type: string;
    position: Vec3;
    data: any;
}

export interface EntityFilter {
    type?: string;
    position?: { near: Vec3; radius: number };
    custom?: (entity: Entity) => boolean;
}

export interface BlockDefinition {
    id: string;
    name: string;
    texture?: string;
    solid?: boolean;
    transparent?: boolean;
    luminance?: number;
    hardness?: number;
    onBreak?: () => void;
    onPlace?: () => void;
}

export interface Block {
    id: string;
    position: Vec3;
    data?: any;
}

export interface ItemDefinition {
    id: string;
    name: string;
    description?: string;
    icon?: string;
    stackSize?: number;
    onUse?: () => void;
}

export interface Player {
    id: string;
    name: string;
    position: Vec3;
    health: number;
    inventory: Inventory;
}

export interface Inventory {
    items: ItemStack[];
    size: number;
}

export interface ItemStack {
    itemId: string;
    count: number;
    data?: any;
}

export interface OverlayConfig {
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
    content: string | HTMLElement;
    style?: Partial<CSSStyleDeclaration>;
}

export type CommandHandler = (args: string[]) => void | Promise<void>;
