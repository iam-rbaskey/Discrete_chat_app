
import React from 'react';
import Image from 'next/image';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface AvatarProps {
    src?: string;
    name: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    status?: 'online' | 'busy' | 'away' | 'offline';
    className?: string; // Additional classes
}

export const Avatar: React.FC<AvatarProps> = ({ src, name, size = 'md', status, className }) => {
    const sizeClasses = {
        sm: 'w-8 h-8',
        md: 'w-10 h-10',
        lg: 'w-12 h-12',
        xl: 'w-16 h-16',
    };

    const statusColors = {
        online: 'bg-green-500',
        busy: 'bg-red-500',
        away: 'bg-yellow-500',
        offline: 'bg-gray-400',
    };

    const initials = name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();

    return (
        <div className={twMerge('relative inline-flex', sizeClasses[size], className)}>
            <div className="relative w-full h-full overflow-hidden rounded-full ring-2 ring-transparent bg-white/10 flex items-center justify-center">
                {src ? (
                    <Image
                        src={src}
                        alt={name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                ) : (
                    <span className="font-medium text-white text-xs">{initials}</span>
                )}
            </div>
            {status && (
                <span
                    className={clsx(
                        'absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-[--color-background] shadow-[0_0_8px_rgba(0,0,0,0.5)]',
                        statusColors[status],
                        status === 'online' && 'shadow-[0_0_10px_#22c55e] animate-pulse'
                    )}
                />
            )}
        </div>
    );
};
