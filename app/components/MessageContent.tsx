import { useEffect, useState, useRef } from 'react';
import { decryptMessageForUser } from '@/app/lib/security';
import { decryptMessage as decryptLegacy } from '@/app/lib/encryption';
import { Loader2, Lock, ShieldCheck } from 'lucide-react';

interface MessageContentProps {
    content: string;
    privateKey: CryptoKey | null;
    isMe: boolean;
}

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()";

export const MessageContent = ({ content, privateKey, isMe }: MessageContentProps) => {
    const [decryptedText, setDecryptedText] = useState<string>('');
    const [displayedText, setDisplayedText] = useState<string>('');
    const [isDecrypting, setIsDecrypting] = useState(true);
    const [encryptionType, setEncryptionType] = useState<'e2ee' | 'legacy' | 'none'>('none');
    const [scrambleComplete, setScrambleComplete] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const decrypt = async () => {
            setIsDecrypting(true);
            setScrambleComplete(false);

            try {
                // 0. Detect E2EE Format efficiently
                let isE2EE = false;
                if (content.trim().startsWith('{') && content.includes('"iv"')) {
                    try {
                        const parsed = JSON.parse(content);
                        if (parsed.iv && parsed.ciphertext && (parsed.encryptedKey || parsed.encryptedKeySelf)) {
                            isE2EE = true;
                        }
                    } catch (e) { /* Not JSON */ }
                }

                // 1. Handle E2EE
                if (isE2EE) {
                    if (!privateKey) {
                        if (isMounted) {
                            setDecryptedText("Waiting for secure keys...");
                            setIsDecrypting(true); // Keep spinner
                        }
                        return;
                    }

                    try {
                        const text = await decryptMessageForUser(content, privateKey);
                        if (isMounted) {
                            // Check if it returned the failure string
                            if (text.startsWith("[Encrypted Message")) {
                                setDecryptedText("🔒 Encrypted Message");
                                setEncryptionType('none'); // Or 'e2ee-failed'
                            } else {
                                setDecryptedText(text);
                                setEncryptionType('e2ee');
                            }
                            setIsDecrypting(false);
                        }
                        return;
                    } catch (e) {
                        console.warn("E2E failed", e);
                        if (isMounted) {
                            setDecryptedText("🔒 Unreadable Message");
                            setIsDecrypting(false);
                        }
                        return;
                    }
                }

                // 2. Try Legacy Decryption
                const legacyText = decryptLegacy(content);
                if (legacyText && legacyText !== content) {
                    if (isMounted) {
                        setDecryptedText(legacyText);
                        setEncryptionType('legacy');
                        setIsDecrypting(false);
                    }
                    return;
                }

                // 3. Plain Text Fallback
                if (isMounted) {
                    setDecryptedText(content);
                    setEncryptionType('none');
                    setIsDecrypting(false);
                }
            } catch (e) {
                console.error("Decryption error", e);
                if (isMounted) {
                    setDecryptedText("⚠️ Error");
                    setIsDecrypting(false);
                }
            }
        };

        decrypt();

        return () => { isMounted = false; };
    }, [content, privateKey]);

    // Scramble Effect
    useEffect(() => {
        if (isDecrypting || !decryptedText) return;

        let iterations = 0;
        const maxIterations = 15; // Speed of resolve

        const interval = setInterval(() => {
            setDisplayedText(prev => {
                if (iterations >= maxIterations) {
                    clearInterval(interval);
                    setScrambleComplete(true);
                    return decryptedText;
                }

                return decryptedText.split("")
                    .map((char, index) => {
                        if (index < iterations) return decryptedText[index];
                        return CHARS[Math.floor(Math.random() * CHARS.length)];
                    })
                    .join("");
            });
            iterations += 1 / 2; // Slow down the reveal slightly
        }, 30);

        return () => clearInterval(interval);
    }, [decryptedText, isDecrypting]);

    if (isDecrypting) {
        return <span className="flex items-center gap-1 opacity-50 font-mono text-xs"><Loader2 className="w-3 h-3 animate-spin text-emerald-500" /> DECRYPTING_PACKET...</span>;
    }

    return (
        <span className="relative group/msg inline-block min-w-[20px]">
            <span className={scrambleComplete ? "" : "font-mono text-emerald-500 break-all"}>
                {displayedText || decryptedText}
            </span>

            {encryptionType === 'e2ee' && (
                <span title="E2EE Encrypted" className="ml-2 inline-flex align-middle opacity-50 group-hover/msg:opacity-100 transition-opacity">
                    <ShieldCheck className="w-3 h-3 text-emerald-500" />
                </span>
            )}
            {encryptionType === 'legacy' && (
                <span title="Legacy Encryption" className="ml-2 inline-flex align-middle opacity-30 group-hover/msg:opacity-100 transition-opacity">
                    <Lock className="w-3 h-3 text-slate-400" />
                </span>
            )}
        </span>
    );
};
