import React, { useState, useRef, useEffect } from 'react';
import { useI18n } from '../shared/i18n';

interface CustomDatePickerProps {
    placeholder: string;
    value: string;
    onChange: (date: string, time: string) => void;
    className?: string;
    style?: React.CSSProperties;
    error?: boolean;
    errorMessage?: string;
}

const CustomDatePicker: React.FC<CustomDatePickerProps> = ({ placeholder, value, onChange, className, style: externalStyle, error, errorMessage }) => {
    const { t, isRTL } = useI18n();
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Get days and months from i18n
    const DAYS = [
        t('sunday'), t('monday'), t('tuesday'), t('wednesday'),
        t('thursday'), t('friday'), t('saturday')
    ];

    const MONTHS = [
        t('january'), t('february'), t('march'), t('april'),
        t('may'), t('june'), t('july'), t('august'),
        t('september'), t('october'), t('november'), t('december')
    ];

    // internal state
    const [step, setStep] = useState<'date' | 'time' | 'year'>('date');
    const [viewDate, setViewDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    // Reset step when opening
    useEffect(() => {
        if (isOpen) {
            setStep('date');
        }
    }, [isOpen]);

    // Close when clicking outside
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

    const getDaysInMonth = (year: number, month: number) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (year: number, month: number) => {
        return new Date(year, month, 1).getDay();
    };

    const isDateDisabled = (date: Date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        // Disable past dates, and also disable Fridays (5)
        return date < today || date.getDay() === 5;
    };

    const handleDateClick = (day: number) => {
        const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);

        if (isDateDisabled(newDate)) return;

        setSelectedDate(newDate);
        setStep('time'); // Switch to time selection
    };

    const handleTimeClick = (timeStr: string) => {
        if (selectedDate) {
            // Format format: YYYY-MM-DD
            // We need to adjust for timezone or just keep it simple string?
            // "2026-02-06"
            const year = selectedDate.getFullYear();
            const month = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
            const day = selectedDate.getDate().toString().padStart(2, '0');
            const dateString = `${year}-${month}-${day}`;

            onChange(dateString, timeStr);
            setIsOpen(false);
        }
    };

    const changeMonth = (offset: number) => {
        const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1);
        setViewDate(newDate);
    };

    const handleYearHeaderClick = () => {
        setStep('year');
    };

    const handleYearSelect = (year: number) => {
        const newDate = new Date(year, viewDate.getMonth(), 1);
        setViewDate(newDate);
        setStep('date');
    };

    // Generate times: 7 AM to 11 PM (23:00)
    const generateTimes = () => {
        const times = [];
        const now = new Date();
        const isToday = selectedDate &&
            selectedDate.getDate() === now.getDate() &&
            selectedDate.getMonth() === now.getMonth() &&
            selectedDate.getFullYear() === now.getFullYear();

        for (let hour = 7; hour <= 23; hour++) {
            // 00 and 30 minutes
            for (let min of [0, 30]) {
                const isAm = hour < 12;
                const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
                const minStr = min === 0 ? '00' : '30';
                const suffix = isAm ? t('am') : t('pm');

                const timeLabel = `${displayHour}:${minStr} ${suffix}`;

                let disabled = false;
                if (isToday) {
                    // Create specific date object for this time slot
                    const slotDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, min);
                    // Add buffer? No, strict comparison is fine.
                    if (slotDate < now) {
                        disabled = true;
                    }
                }

                times.push({ label: timeLabel, disabled });
            }
        }
        return times;
    };

    const renderYears = () => {
        const currentYear = new Date().getFullYear();
        const years = [];
        for (let year = currentYear; year <= currentYear + 50; year++) {
            const isSelected = viewDate.getFullYear() === year;
            const disabled = year < currentYear;

            years.push(
                <div
                    key={year}
                    className={`year-item ${isSelected ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
                    onClick={() => !disabled && handleYearSelect(year)}
                >
                    {year}
                </div>
            );
        }
        return years;
    };

    const renderCalendar = () => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);

        const days = [];
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const currentLoopDate = new Date(year, month, day);
            const disabled = isDateDisabled(currentLoopDate);
            const isSelected = selectedDate &&
                selectedDate.getDate() === day &&
                selectedDate.getMonth() === month &&
                selectedDate.getFullYear() === year;

            days.push(
                <div
                    key={day}
                    className={`calendar-day ${isSelected ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
                    onClick={() => !disabled && handleDateClick(day)}
                >
                    {day}
                </div>
            );
        }
        return days;
    };

    return (
        <div
            ref={wrapperRef}
            className={`custom-datepicker-wrapper ${className || ''}`}
            style={{
                position: 'relative',
                width: '100%',
                height: '40px',
                ...externalStyle
            }}
        >
            <div
                className={`datepicker-display ${isOpen ? 'open' : ''} ${error ? 'error' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    borderColor: error ? '#d32f2f' : undefined
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <img
                        src="/imgs/home_page/calendar-icon.svg"
                        style={{ display: 'none' }}
                        alt=""
                    />
                    <span style={{ color: '#000000' }}>
                        {value || placeholder}
                    </span>
                </div>
            </div>

            {error && errorMessage && (
                <div style={{ color: '#d32f2f', fontSize: '12px', marginTop: '4px', textAlign: isRTL ? 'right' : 'left' }}>
                    {errorMessage}
                </div>
            )}

            {isOpen && (
                <div className="datepicker-popup">
                    {step === 'date' ? (
                        <div className="calendar-view">
                            <div className="calendar-header">
                                <button type="button" onClick={() => changeMonth(isRTL ? 1 : -1)}>
                                    {isRTL ? '>' : '<'}
                                </button>
                                <span>
                                    {MONTHS[viewDate.getMonth()]}
                                    <span
                                        onClick={handleYearHeaderClick}
                                        style={{
                                            cursor: 'pointer',
                                            margin: isRTL ? '0 0 0 5px' : '0 5px 0 0',
                                            textDecoration: 'underline'
                                        }}
                                    >
                                        {viewDate.getFullYear()}
                                    </span>
                                </span>
                                <button type="button" onClick={() => changeMonth(isRTL ? -1 : 1)}>
                                    {isRTL ? '<' : '>'}
                                </button>
                            </div>
                            <div className="calendar-weekdays">
                                {DAYS.map(d => <div key={d}>{d}</div>)}
                            </div>
                            <div className="calendar-grid">
                                {renderCalendar()}
                            </div>
                        </div>
                    ) : step === 'year' ? (
                        <div className="year-view">
                            <div className="calendar-header">
                                <button type="button" className="back-btn" onClick={() => setStep('date')}>
                                    {isRTL ? '<' : '>'}
                                </button>
                                <span>{t('selectYear')}</span>
                                <div style={{ width: 24 }}></div>
                            </div>
                            <div className="year-grid">
                                {renderYears()}
                            </div>
                        </div>
                    ) : (
                        <div className="time-view">
                            <div className="time-header">
                                <button type="button" className="back-btn" onClick={() => setStep('date')}>
                                    {isRTL ? '<' : '>'} {t('date')}
                                </button>
                                <span>{t('selectTime')}</span>
                            </div>
                            <div className="time-list-container">
                                {generateTimes().map((item, idx) => (
                                    <div
                                        key={idx}
                                        className={`time-list-item ${item.disabled ? 'disabled' : ''}`}
                                        onClick={() => !item.disabled && handleTimeClick(item.label)}
                                    >
                                        {item.label}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            <style>{`
                .datepicker-display {
                    width: 100%;
                    height: 100%;
                    border: 1px solid #9DA4AE;
                    border-radius: 8px;
                    padding: 0 16px;
                    font-size: 16px;
                    font-family: inherit;
                    background: #fff;
                    text-align: right;
                    color: #000000;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: flex-start;
                }
                
                @media (max-width: 768px) {
                    .datepicker-display {
                        font-size: 12px !important;
                    }
                }
                
                .datepicker-popup {
                    position: absolute;
                    top: calc(100% + 5px);
                    ${isRTL ? 'right: 0;' : 'left: 0;'};
                    width: 300px;
                    background: #fff;
                    border: 1px solid #E5E7EB;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                    z-index: 1000;
                    padding: 12px;
                    direction: ${isRTL ? 'rtl' : 'ltr'};
                }

                .calendar-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 10px;
                    font-weight: bold;
                    font-size: 16px;
                }
                .calendar-header button {
                    background: none;
                    border: none;
                    cursor: pointer;
                    font-size: 16px;
                    padding: 3px 8px;
                    color: #666;
                }

                .calendar-weekdays {
                    display: grid;
                    grid-template-columns: repeat(7, 1fr);
                    text-align: center;
                    font-size: 14px;
                    font-weight: 600;
                    color: #6B7280;
                    margin-bottom: 10px;
                }

                .calendar-grid {
                    display: grid;
                    grid-template-columns: repeat(7, 1fr);
                    row-gap: 8px;
                    column-gap: 4px;
                }

                .calendar-day {
                    width: 100%;
                    aspect-ratio: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    border-radius: 50%;
                    font-size: 13px;
                    transition: all 0.2s;
                    color: #111827;
                }
                .calendar-day:hover:not(.empty):not(.disabled) {
                    background-color: #F3F4F6;
                }
                .calendar-day.selected {
                    background-color: #1B8354;
                    color: #fff;
                    font-weight: bold;
                }
                .calendar-day.empty {
                    cursor: default;
                }
                .calendar-day.disabled {
                    color: #9CA3AF;
                    cursor: not-allowed;
                    background-color: transparent;
                }

                /* Time View Styles */
                .time-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 10px;
                    border-bottom: 1px solid #E5E7EB;
                    padding-bottom: 10px;
                    color: #000000;
                }
                .back-btn {
                    background: none;
                    border: none;
                    color: #000000;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: bold;
                }
                
                .time-list-container {
                    max-height: 300px;
                    overflow-y: auto;
                    padding-right: 5px; /* Space for scrollbar */
                }
                
                /* Custom Scrollbar */
                .time-list-container::-webkit-scrollbar {
                    width: 6px;
                }
                .time-list-container::-webkit-scrollbar-track {
                    background: #f1f1f1;
                    border-radius: 3px;
                }
                .time-list-container::-webkit-scrollbar-thumb {
                    background: #ccc; 
                    border-radius: 3px;
                }
                .time-list-container::-webkit-scrollbar-thumb:hover {
                    background: #aaa; 
                }

                .time-list-item {
                    padding: 10px 14px;
                    margin-bottom: 3px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                    color: #374151;
                    text-align: center;
                    transition: all 0.2s;
                    background-color: #fff;
                    border: 1px solid transparent;
                }
                
                .time-list-item:hover:not(.disabled) {
                    background-color: #F3F4F6;
                    color: #111827;
                    font-weight: 600;
                    border-color: #E5E7EB;
                }
                
                .time-list-item.disabled {
                    color: #D1D5DB;
                    cursor: not-allowed;
                    background-color: #FAFAFA;
                }

                /* Year View Styles */
                .year-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 10px;
                    max-height: 300px;
                    overflow-y: auto;
                    padding-right: 5px;
                }
                .year-item {
                    padding: 6px;
                    text-align: center;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                    color: #374151;
                }
                .year-item:hover:not(.disabled) {
                    background-color: #F3F4F6;
                }
                .year-item.selected {
                    background-color: #1B8354;
                    color: #fff;
                    font-weight: bold;
                }
                .year-item.disabled {
                    color: #D1D5DB;
                    cursor: not-allowed;
                }
                
                /* Scrollbar for year grid */
                .year-grid::-webkit-scrollbar {
                    width: 6px;
                }
                .year-grid::-webkit-scrollbar-track {
                    background: #f1f1f1;
                    border-radius: 3px;
                }
                .year-grid::-webkit-scrollbar-thumb {
                    background: #ccc; 
                    border-radius: 3px;
                }

                @media (max-width: 450px) {
                    .datepicker-popup {
                        width: 300px !important;
                        max-width: 90vw !important;
                        left: 50% !important;
                        right: auto !important;
                        transform: translateX(-50%) !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default CustomDatePicker;
