import { Serializer } from './Serializer.ts';

export class SaveManager {
    save(key: string, data: any): void {
        const serialized = Serializer.serialize(data);
        localStorage.setItem(`elge_save_${key}`, serialized);
    }

    load<T>(key: string): T | null {
        const data = localStorage.getItem(`elge_save_${key}`);
        return data ? Serializer.deserialize<T>(data) : null;
    }
}
