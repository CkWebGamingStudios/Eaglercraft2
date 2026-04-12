import { Entity } from './Entity.ts';

export abstract class System {
    abstract update(entities: Entity[], deltaTime: number): void;
}
