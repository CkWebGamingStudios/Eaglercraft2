export class AssetLoader {
    /**
     * Loads an image and returns a Promise
     */
    async loadImage(url: string): Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "anonymous"; 
            img.onload = () => resolve(img);
            img.onerror = (e) => reject(new Error(`Failed to load image at ${url}`));
            img.src = url;
        });
    }

    /**
     * Loads and parses a JSON file (useful for models/configs)
     */
    async loadJSON<T>(url: string): Promise<T> {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json() as T;
    }

    /**
     * Loads an ArrayBuffer (useful for binary data/shaders)
     */
    async loadBinary(url: string): Promise<ArrayBuffer> {
        const response = await fetch(url);
        return await response.arrayBuffer();
    }
}
