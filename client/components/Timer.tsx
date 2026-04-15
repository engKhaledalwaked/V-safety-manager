import React, { useState, useEffect } from 'react';

interface TimerProps {
    seconds: number;
    onComplete?: () => void;
    className?: string;
}

const Timer: React.FC<TimerProps> = ({ seconds, onComplete, className }) => {
    const [timeLeft, setTimeLeft] = useState(seconds);

    useEffect(() => {
        if (timeLeft <= 0) {
            if (onComplete) onComplete();
            return;
        }

        const interval = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(interval);
    }, [timeLeft, onComplete]);

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const secs = time % 60;
        return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    };

    return (
        <span className={`font-mono dir-ltr ${className}`}>
            {formatTime(timeLeft)}
        </span>
    );
};

export default Timer;
