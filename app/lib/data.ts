
export interface User {
    id: string;
    name: string;
    avatar: string; // URL or initials
    status: 'online' | 'offline' | 'busy' | 'away';
    lastSeen?: string;
}

export interface Message {
    id: string;
    senderId: string;
    content: string;
    timestamp: string;
    status: 'sent' | 'delivered' | 'read';
    type: 'text' | 'image' | 'voice' | 'file';
    isSafeUnlocked?: boolean; // For time-locked messages
}

export interface Chat {
    id: string;
    participants: User[];
    lastMessage: Message;
    unreadCount: number;
    isPinned: boolean;
    type: 'direct' | 'group';
    contextMemory?: {
        summary: string;
        entities: string[];
    };
}

export const CURRENT_USER: User = {
    id: '',
    name: '',
    avatar: '',
    status: 'online',
};

export const MOCK_USERS: User[] = [];

export const MOCK_CHATS: Chat[] = [];

export const MOCK_MESSAGES: Record<string, Message[]> = {};
