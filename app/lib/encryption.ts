
import CryptoJS from 'crypto-js';

const SECRET_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || 'default_secret_key_for_demo';

export const encryptMessage = (message: string): string => {
    if (!message) return '';
    return CryptoJS.AES.encrypt(message, SECRET_KEY).toString();
};

export const decryptMessage = (ciphertext: string): string => {
    if (!ciphertext) return '';
    try {
        const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
        const decrypted = bytes.toString(CryptoJS.enc.Utf8);
        // If decryption results in valid string, return it.
        if (decrypted) return decrypted;
        // If empty string (could be failed decrypt of random string that isn't valid ciphertext), return original
        return ciphertext;
    } catch (error) {
        // If throws (e.g. malformed UTF-8), return original text
        return ciphertext;
    }
};
