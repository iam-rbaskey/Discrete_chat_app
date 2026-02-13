
// Client-side Security Module using Web Crypto API
// Implements RSA-OAEP for key exchange and AES-GCM for message encryption

const DB_NAME = 'ChatSecureStorage';
const STORE_NAME = 'keys';
const KEY_PAIR_ID = 'user-key-pair';

// IndexedDB Helper
const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = (event: any) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

// Generate RSA-OAEP Key Pair
export const generateKeyPair = async (): Promise<CryptoKeyPair> => {
    const keyPair = await window.crypto.subtle.generateKey(
        {
            name: "RSA-OAEP",
            modulusLength: 2048,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: "SHA-256",
        },
        true, // Extractable for export/storage
        ["encrypt", "decrypt"]
    );
    return keyPair;
};

// Save Key Pair to IndexedDB
export const saveKeyPair = async (keyPair: CryptoKeyPair) => {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.put(keyPair, KEY_PAIR_ID);
    return new Promise((resolve) => {
        tx.oncomplete = () => resolve(true);
    });
};

// Load Key Pair from IndexedDB
export const loadKeyPair = async (): Promise<CryptoKeyPair | null> => {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(KEY_PAIR_ID);
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
    });
};

// Export Public Key to JWK format for server storage
export const exportPublicKey = async (publicKey: CryptoKey): Promise<JsonWebKey> => {
    return await window.crypto.subtle.exportKey("jwk", publicKey);
};

// Import Public Key from JWK format (from server)
export const importPublicKey = async (jwk: JsonWebKey): Promise<CryptoKey> => {
    return await window.crypto.subtle.importKey(
        "jwk",
        jwk,
        {
            name: "RSA-OAEP",
            hash: "SHA-256",
        },
        true,
        ["encrypt"]
    );
};

// Hybrid Encryption: Encrypt message for recipient AND sender (for self-view)
// Returns JSON string containing { iv, encryptedKey, encryptedKeySelf, ciphertext }
export const encryptMessageForUser = async (message: string, recipientPublicKey: CryptoKey, senderPublicKey?: CryptoKey): Promise<string> => {
    // 1. Generate random AES-GCM session key
    const sessionKey = await window.crypto.subtle.generateKey(
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
    );

    // 2. Encrypt message with session key
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encodedMessage = new TextEncoder().encode(message);
    const ciphertext = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        sessionKey,
        encodedMessage
    );

    // 3. Encrypt session key with RECIPIENT'S RSA public key
    const rawSessionKey = await window.crypto.subtle.exportKey("raw", sessionKey);
    const encryptedKey = await window.crypto.subtle.encrypt(
        { name: "RSA-OAEP" },
        recipientPublicKey,
        rawSessionKey
    );

    // 4. Encrypt session key with SENDER'S RSA public key (if provided) to allow sender to read their own msg
    let encryptedKeySelf: ArrayBuffer | null = null;
    if (senderPublicKey) {
        encryptedKeySelf = await window.crypto.subtle.encrypt(
            { name: "RSA-OAEP" },
            senderPublicKey,
            rawSessionKey
        );
    }

    // 5. Pack into JSON
    return JSON.stringify({
        iv: Array.from(iv),
        ciphertext: Array.from(new Uint8Array(ciphertext)),
        encryptedKey: Array.from(new Uint8Array(encryptedKey)),
        encryptedKeySelf: encryptedKeySelf ? Array.from(new Uint8Array(encryptedKeySelf)) : null
    });
};

// Hybrid Decryption: Decrypt message with own private key
export const decryptMessageForUser = async (packedMessage: string, privateKey: CryptoKey): Promise<string> => {
    try {
        const data = JSON.parse(packedMessage);
        if (!data.iv || !data.ciphertext || (!data.encryptedKey && !data.encryptedKeySelf)) throw new Error("Invalid format");

        const iv = new Uint8Array(data.iv);
        const ciphertext = new Uint8Array(data.ciphertext);

        let rawSessionKey: ArrayBuffer | null = null;

        // 1. Try decrypting Repicient Key (Standard)
        if (data.encryptedKey) {
            try {
                rawSessionKey = await window.crypto.subtle.decrypt(
                    { name: "RSA-OAEP" },
                    privateKey,
                    new Uint8Array(data.encryptedKey)
                );
            } catch (e) {
                // Ignore, might be sender reading their own message
            }
        }

        // 2. If failed, try Self Key (Sender reading own message)
        if (!rawSessionKey && data.encryptedKeySelf) {
            try {
                rawSessionKey = await window.crypto.subtle.decrypt(
                    { name: "RSA-OAEP" },
                    privateKey,
                    new Uint8Array(data.encryptedKeySelf)
                );
            } catch (e) {
                // Ignore
            }
        }

        if (!rawSessionKey) throw new Error("No valid decryption key found for this user");

        // 3. Import session key
        const sessionKey = await window.crypto.subtle.importKey(
            "raw",
            rawSessionKey,
            { name: "AES-GCM" },
            true,
            ["decrypt"]
        );

        // 4. Decrypt message content
        const decryptedContent = await window.crypto.subtle.decrypt(
            { name: "AES-GCM", iv },
            sessionKey,
            ciphertext
        );

        return new TextDecoder().decode(decryptedContent);
    } catch (e) {
        console.error("Decryption failed", e);
        return "[Encrypted Message - Cannot Decrypt]";
    }
};
