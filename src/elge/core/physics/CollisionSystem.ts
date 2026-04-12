import { Vec3 } from '../../../victus/math/Vec3';

export interface Box {
    min: Vec3;
    max: Vec3;
}

export class CollisionSystem {
    static testAABB(a: Box, b: Box): boolean {
        return (
            a.min.x <= b.max.x && a.max.x >= b.min.x &&
            a.min.y <= b.max.y && a.max.y >= b.min.y &&
            a.min.z <= b.max.z && a.max.z >= b.min.z
        );
    }

    static resolve(pos: Vec3, vel: Vec3, box: Box): void {
        // Simple collision response logic
        if (pos.x < box.min.x || pos.x > box.max.x) vel.x *= -0.5;
        if (pos.y < box.min.y || pos.y > box.max.y) vel.y *= -0.5;
        if (pos.z < box.min.z || pos.z > box.max.z) vel.z *= -0.5;
    }
}
