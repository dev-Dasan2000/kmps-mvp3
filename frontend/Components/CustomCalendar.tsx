"use client";

import { useState, useEffect } from 'react';
import { format, addMonths, subMonths, isSameMonth, isSameDay, addDays, isToday } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';

type CalendarProps = {
  selectedDate: Date | undefined;
  onSelect: (date: Date) => void;
  modifiers?: {
    booked?: {
      date: Date;
      bookedSlots: number;
      totalSlots: number;
    }[];
  };
};

export default function CustomCalendar({ selectedDate, onSelect, modifiers = {} }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDateState, setSelectedDateState] = useState<Date | undefined>(selectedDate);

  useEffect(() => {
    if (selectedDate) {
      setSelectedDateState(selectedDate);
      setCurrentMonth(selectedDate);
    }
  }, [selectedDate]);

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const onDateClick = (day: Date) => {
    setSelectedDateState(day);
    onSelect(day);
  };

  const renderHeader = () => {
    return (
      <div className="flex items-center justify-between px-4 py-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={prevMonth}
          className="h-8 w-8 p-0 opacity-50 hover:opacity-100"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={nextMonth}
          className="h-8 w-8 p-0 opacity-50 hover:opacity-100"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  const renderDays = () => {
    const dateFormat = 'EEE';
    const days = [];
    // Create a date set to Sunday (0) of the current week
    const startOfWeek = new Date(currentMonth);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

    for (let i = 0; i < 7; i++) {
      days.push(
        <div
          key={i}
          className="text-gray-500 text-sm font-medium text-center w-12 h-12 flex items-center justify-center"
        >
          {format(addDays(startOfWeek, i), dateFormat)}
        </div>
      );
    }

    return <div className="grid grid-cols-7 gap-1 mb-2">{days}</div>;
  };

  const renderCells = () => {
    const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    const startDate = new Date(monthStart);
    startDate.setDate(1 - monthStart.getDay());
    const endDate = new Date(monthEnd);
    endDate.setDate(monthEnd.getDate() + (6 - monthEnd.getDay()));

    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = '';

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, 'd');
        const cloneDay = new Date(day);
        const bookingInfo = modifiers.booked?.find(entry => isSameDay(entry.date, day));
        const isFullyBooked = bookingInfo && bookingInfo.bookedSlots >= bookingInfo.totalSlots;


        days.push(
          <div
            className={`
              relative w-12 h-12 flex items-center justify-center mx-auto rounded-full
              ${!isSameMonth(day, monthStart) ? 'text-gray-400' : ''}
              ${isToday(day) ? 'bg-blue-500 font-semibold' : ''}
              ${selectedDateState && isSameDay(day, selectedDateState) ? 'bg-emerald-500' : ''}
              ${isFullyBooked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-100'}
            `}
            key={day.toString()}
            onClick={() => !isFullyBooked && onDateClick(cloneDay)}
          >
            <span className="text-sm">{formattedDate}</span>
            {isFullyBooked && (
              <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-red-500"></span>
            )}
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7 gap-1" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }
    return <div className="space-y-1">{rows}</div>;
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow">
      {renderHeader()}
      <div className="p-4">
        {renderDays()}
        {renderCells()}
      </div>
    </div>
  );
}