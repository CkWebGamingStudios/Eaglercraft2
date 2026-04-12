import { Cache } from './Cache.ts';
import { AssetLoader } from './AssetLoader.ts';

export class ResourceManager {
    private loader = new AssetLoader();
    private textureCache = new Cache<HTMLImageElement>();

    async loadTexture(name: string, url: string): Promise<HTMLImageElement> {
        if (this.textureCache.has(name)) return this.textureCache.get(name)!;
        
        const img = await this.loader.loadImage(url);
        this.textureCache.set(name, img);
        return img;
    }
}
