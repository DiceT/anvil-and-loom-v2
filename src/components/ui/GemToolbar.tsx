import { useState } from 'react';
import { useSessionStore } from '../../stores/useSessionStore';
import { createNewSession } from '../../utils/sessionActions';

// Import gem assets - Individual gems for independent animations
import sessionActive from '../../assets/images/gems/session-active.png';
import sessionInactive from '../../assets/images/gems/session-inactive.png';
import leftGem01Active from '../../assets/images/gems/left-gem-01-active.png';
import leftGem01Inactive from '../../assets/images/gems/left-gem-01-inactive.png';
import leftGem02Active from '../../assets/images/gems/left-gem-02-active.png';
import leftGem02Inactive from '../../assets/images/gems/left-gem-02-inactive.png';
import rightGem01Active from '../../assets/images/gems/right-gem-01-active.png';
import rightGem01Inactive from '../../assets/images/gems/right-gem-01-inactive.png';
import rightGem02Active from '../../assets/images/gems/right-gem-02-active.png';
import rightGem02Inactive from '../../assets/images/gems/right-gem-02-inactive.png';
import topBorderActive from '../../assets/images/gems/top-border-active.png';
import topBorderInactive from '../../assets/images/gems/top-border-inactive.png';

interface GemButtonProps {
    activeSrc: string;
    inactiveSrc: string;
    alt: string;
    tooltip: string;
    onClick: () => void;
    size?: 'small' | 'large';
    forceActive?: boolean; // For session gem when session is running
    className?: string;
}

function GemButton({ activeSrc, inactiveSrc, alt, tooltip, onClick, size = 'small', forceActive = false, className = '' }: GemButtonProps) {
    const [isHovered, setIsHovered] = useState(false);
    const isActive = forceActive || isHovered;

    // Doubled sizes: small 8->16, large 12->24
    const sizeClass = size === 'large' ? 'w-24 h-24' : 'w-16 h-16';

    return (
        <button
            onClick={onClick}
            title={tooltip}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={`
        relative transition-all duration-200 ease-in-out
        hover:scale-110
        active:scale-95
        ${sizeClass}
        ${className}
      `}
            style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
            }}
        >
            <img
                src={isActive ? activeSrc : inactiveSrc}
                alt={alt}
                className="w-full h-full object-contain transition-all duration-200"
                style={{
                    filter: isActive
                        ? 'drop-shadow(0 0 8px rgba(255, 200, 100, 0.5))'
                        : 'none',
                }}
            />
        </button>
    );
}

export function GemToolbar() {
    const { activeSessionId, endSession } = useSessionStore();
    const isSessionActive = !!activeSessionId;

    // Handler functions
    const handleSessionToggle = () => {
        if (isSessionActive) {
            endSession();
        } else {
            createNewSession();
        }
    };

    const handleWeaveClick = () => {
        console.log('Active Weave oracle clicked');
        // TODO: Wire up to actual oracle function
    };

    const handleYesNoClick = () => {
        console.log('Yes/No oracle clicked');
        // TODO: Wire up to actual oracle function
    };

    const handleActionThemeClick = () => {
        console.log('Action + Theme oracle clicked');
        // TODO: Wire up to actual oracle function
    };

    const handleDescriptorFocusClick = () => {
        console.log('Descriptor + Focus oracle clicked');
        // TODO: Wire up to actual oracle function
    };

    return (
        <div className="relative flex items-center justify-center z-50">
            {/* Background Border Frame - always uses inactive (dormant) state */}
            <img
                src={topBorderInactive}
                alt="Gem Toolbar Frame"
                className="absolute h-28 pointer-events-none"
                style={{
                    filter: 'drop-shadow(0 2px 6px rgba(0, 0, 0, 0.4))',
                }}
            />

            {/* Gems Container - positioned over the frame */}
            <div className="relative flex items-center justify-center gap-0 z-10 h-28">
                {/* Left Gem 01: Gold (Active Weave) */}
                <GemButton
                    activeSrc={leftGem01Active}
                    inactiveSrc={leftGem01Inactive}
                    alt="Active Weave"
                    tooltip="Active Weave"
                    onClick={handleWeaveClick}
                    size="small"
                />

                {/* Left Gem 02: Blue (Yes/No Oracle) */}
                <GemButton
                    activeSrc={leftGem02Active}
                    inactiveSrc={leftGem02Inactive}
                    alt="Yes/No Oracle"
                    tooltip="Yes/No Oracle"
                    onClick={handleYesNoClick}
                    size="small"
                />

                {/* Center Session Gem - stays active when session is running */}
                <GemButton
                    activeSrc={sessionActive}
                    inactiveSrc={sessionInactive}
                    alt={isSessionActive ? 'Session Active' : 'Session Inactive'}
                    tooltip={isSessionActive ? 'End Session' : 'Start Session'}
                    onClick={handleSessionToggle}
                    size="large"
                    forceActive={isSessionActive}
                    className={isSessionActive ? 'animate-heartbeat' : ''}
                />

                {/* Right Gem 01: Purple (Action + Theme) */}
                <GemButton
                    activeSrc={rightGem01Active}
                    inactiveSrc={rightGem01Inactive}
                    alt="Action + Theme"
                    tooltip="Action + Theme"
                    onClick={handleActionThemeClick}
                    size="small"
                />

                {/* Right Gem 02: Green (Descriptor + Focus) */}
                <GemButton
                    activeSrc={rightGem02Active}
                    inactiveSrc={rightGem02Inactive}
                    alt="Descriptor + Focus"
                    tooltip="Descriptor + Focus"
                    onClick={handleDescriptorFocusClick}
                    size="small"
                />
            </div>
        </div>
    );
}
