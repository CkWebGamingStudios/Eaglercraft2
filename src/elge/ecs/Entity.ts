export class Entity {
    public id: string;
    private components: Map<string, any> = new Map();

    constructor() {
        this.id = Math.random().toString(36).substr(2, 9);
    }

    addComponent(name: string, component: any): this {
        this.components.set(name, component);
        return this;
    }

    getComponent<T>(name: string): T | undefined {
        return this.components.get(name) as T;
    }

    hasComponent(name: string): boolean {
        return this.components.has(name);
    }
}
