// This runs in sandboxed environment
// Only has access to ModAPI

export function onInit() {
    console.log('Example mod initializing!');
    
    // Register a custom block
    api.blocks.register({
        id: 'example:glowing_block',
        name: 'Glowing Block',
        solid: true,
        transparent: false,
        luminance: 15,
        hardness: 1.5,
        onPlace: () => {
            api.ui.notify('You placed a glowing block!', 'success');
        }
    });
    
    // Register a custom command
    api.commands.register('glow', (args) => {
        const player = api.player.get();
        if (player) {
            const pos = player.position;
            api.blocks.setBlock(pos.x, pos.y - 1, pos.z, 'example:glowing_block');
            api.ui.notify('Glowing block placed beneath you!', 'info');
        }
    });
    
    console.log('Example mod initialized!');
}

export function onTick(tick) {
    // Runs every game tick (20 times per second)
    // Be careful with performance here!
}
