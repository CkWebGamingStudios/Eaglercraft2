import { Vec3 } from '../../../victus/math/Vec3.ts';

export class Ray {
    constructor(public origin: Vec3, public direction: Vec3) {
        this.direction = direction.normalize();
    }

    at(t: number): Vec3 {
        return this.origin.add(this.direction.multiplyScalar(t));
    }
}
