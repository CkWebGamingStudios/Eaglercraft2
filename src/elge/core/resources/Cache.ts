export class Cache<T> {
    private storage: Map<string, T> = new Map();

    set(key: string, value: T): void {
        this.storage.set(key, value);
    }

    get(key: string): T | undefined {
        return this.storage.get(key);
    }

    has(key: string): boolean {
        return this.storage.has(key);
    }

    clear(): void {
        this.storage.clear();
    }
}
