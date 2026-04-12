export enum Permission {
    WORLD_EDIT = 'world.edit',
    ENTITY_SPAWN = 'entity.spawn',
    UI_OVERLAY = 'ui.overlay',
    FS_READ = 'filesystem.read',
    FS_WRITE = 'filesystem.write',
    NETWORK = 'network.access'
}

export class PermissionSystem {
    private modPermissions: Map<string, Set<Permission>> = new Map();

    /**
     * Registers a mod's requested permissions from its mod.json
     */
    registerMod(modId: string, requestedPermissions: string[]): void {
        const allowed = new Set<Permission>();
        
        requestedPermissions.forEach(perm => {
            if (Object.values(Permission).includes(perm as Permission)) {
                allowed.add(perm as Permission);
            } else {
                console.warn(`[PermissionSystem] Mod "${modId}" requested unknown permission: ${perm}`);
            }
        });

        this.modPermissions.set(modId, allowed);
    }

    /**
     * Checks if a specific mod has the right to perform an action
     */
    hasPermission(modId: string, permission: Permission): boolean {
        const permissions = this.modPermissions.get(modId);
        if (!permissions) return false;
        
        const granted = permissions.has(permission);
        if (!granted) {
            console.error(`[PermissionSystem] Security Block: Mod "${modId}" attempted to use unauthorized permission "${permission}"`);
        }
        
        return granted;
    }

    /**
     * Revokes a permission dynamically (useful for admin tools)
     */
    revokePermission(modId: string, permission: Permission): void {
        this.modPermissions.get(modId)?.delete(permission);
    }
}
