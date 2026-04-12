export class Serializer {
    static serialize(data: any): string {
        return JSON.stringify(data);
    }

    static deserialize<T>(data: string): T {
        return JSON.parse(data) as T;
    }
}
