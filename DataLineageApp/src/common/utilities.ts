import * as crypto from "crypto";

export default 
    class Utilities {
    public static randomSeed(length: number = 81): string {
        const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ9";
        const values = crypto.randomBytes(length);
        const result = new Array(length);
        for (let i = 0; i < length; i++) {
            result[i] = charset[values[i] % charset.length];
        }
        return result.join("");
    }

    public static containsUnicode(s: string): boolean {
        for (let j = 0; s && j < s.length; j++) {
            if (s.charCodeAt(j) > 255) {
                //find non asicii code
                return true;
            }
        }
        return false;
    }
};
