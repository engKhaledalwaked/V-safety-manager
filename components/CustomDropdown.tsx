import React, { useState, useRef, useEffect } from 'react';
import { useI18n } from '../shared/i18n';

interface Option {
    value: string;
    label: string;
    icon?: string;
}

interface CustomDropdownProps {
    options: Option[];
    placeholder: string;
    value: string;
    onChange: (value: string) => void;
    className?: string; // To allow passing the existing .search-input class logic if needed, though we might encapsulate it.
    error?: boolean;
    errorMessage?: string;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({ options, placeholder, value, onChange, error, errorMessage }) => {
    const { isRTL } = useI18n();
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [wrapperRef]);

    const handleSelect = (optionValue: string) => {
        onChange(optionValue);
        setIsOpen(false);
    };

    const selectedLabel = options.find(opt => opt.value === value)?.label || placeholder;

    return (
        <div
            ref={wrapperRef}
            className="custom-dropdown-wrapper"
            style={{
                position: 'relative',
                width: '100%',
                height: '40px'
            }}
        >
            {/* Display Area (The "Input") */}
            <div
                className={`dropdown-display ${isOpen ? 'open' : ''} ${error ? 'error' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                tabIndex={0} // Make it focusable to handle blur/focus if needed
                style={{
                    borderColor: error ? '#d32f2f' : undefined
                }}
            >
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    flexDirection: 'row'
                }}>
                    {/* Show icon if selected */}
                    {options.find(opt => opt.value === value)?.icon && (
                        <img
                            src={options.find(opt => opt.value === value)?.icon}
                            alt=""
                            style={{ width: '24px', height: '24px', filter: 'brightness(0)' }}
                        />
                    )}
                    <span style={{ color: value ? '#000000' : '#000000' }}>
                        {selectedLabel}
                    </span>
                </div>
            </div>

            {error && errorMessage && (
                <div style={{ color: '#d32f2f', fontSize: '12px', marginTop: '4px', textAlign: isRTL ? 'right' : 'left' }}>
                    {errorMessage}
                </div>
            )}

            {/* Dropdown List */}
            {isOpen && (
                <div className="dropdown-list">
                    {/* Placeholder content could be here if we wanted "All" or "Reset" */}
                    {/* <div 
                        className="dropdown-item placeholder-item"
                        onClick={() => handleSelect("")}
                    >
                        {placeholder}
                    </div> */}

                    {options.map((option) => (
                        <div
                            key={option.value}
                            className={`dropdown-item ${value === option.value ? 'selected' : ''}`}
                            onClick={() => handleSelect(option.value)}
                        >
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                justifyContent: isRTL ? 'flex-start' : 'flex-start',
                                width: '100%',
                                flexDirection: 'row'
                            }}>
                                {option.icon && (
                                    <img
                                        src={option.icon}
                                        alt=""
                                        style={{ width: '28px', height: 'auto', filter: 'brightness(0)' }}
                                    />
                                )}
                                <span>{option.label}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <style>{`
                .custom-dropdown-wrapper {
                   /* Width handle by inline style or parent */
                }

                .dropdown-display {
                    width: 100%;
                    height: 100%;
                    border: 1px solid #9DA4AE;
                    border-radius: 8px;
                    padding: 0 48px 0 16px;
                    font-size: 16px;
                    font-family: inherit;
                    background: #fff;
                    text-align: right;
                    color: #000000;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: flex-start;
                    
                    /* Arrow Icon (Default Down) */
                    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23000000' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
                    background-repeat: no-repeat;
                    background-position: right 16px center;
                    background-size: 20px;
                    user-select: none;
                }
                
                @media (max-width: 768px) {
                    .dropdown-display {
                        font-size: 12px !important;
                        padding: 0 56px 0 16px !important;
                    }
                }

                .dropdown-display.open {
                    /* Arrow Icon (Up when open) */
                    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23000000' stroke-width='2'%3E%3Cpath d='M6 15l6-6 6 6'/%3E%3C/svg%3E");
                    border-color: #1B8354; /* Optional: Highlight border when open */
                }

                .dropdown-list {
                    position: absolute;
                    top: calc(100% + 5px);
                    ${isRTL ? 'right: 0;' : 'left: 0;'};
                    width: 100%;
                    max-height: 300px;
                    overflow-y: auto;
                    background: #fff;
                    border: 1px solid #E5E7EB;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                    z-index: 1000;
                    padding: 8px 0;
                    direction: ${isRTL ? 'rtl' : 'ltr'};
                }

                .dropdown-item {
                    padding: 7px 12px;
                    font-size: 13px;
                    color: #374151; /* Gray-700 */
                    cursor: pointer;
                    text-align: ${isRTL ? 'right' : 'left'};
                    transition: background 0.2s;
                    font-weight: 500;
                }

                .dropdown-item:hover, .dropdown-item.selected {
                    background-color: #F3F4F6; /* User requested color */
                    color: #111827; /* Darker text on hover */
                }
                
                /* Scrollbar styling for the list */
                .dropdown-list::-webkit-scrollbar {
                    width: 6px;
                }
                .dropdown-list::-webkit-scrollbar-track {
                    background: #f1f1f1;
                }
                .dropdown-list::-webkit-scrollbar-thumb {
                    background: #ccc;
                    border-radius: 3px;
                }
            `}</style>
        </div>
    );
};

export default CustomDropdown;
