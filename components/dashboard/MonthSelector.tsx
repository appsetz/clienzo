"use client";

import { useState, useRef, useEffect } from "react";
import { format, subMonths, addMonths, startOfMonth, endOfMonth, isSameMonth } from "date-fns";
import { Calendar, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";

interface MonthSelectorProps {
  selectedMonth: Date;
  onMonthChange: (month: Date) => void;
  minDate?: Date;
  maxDate?: Date;
}

export default function MonthSelector({
  selectedMonth,
  onMonthChange,
  minDate,
  maxDate = new Date(),
}: MonthSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewYear, setViewYear] = useState(selectedMonth.getFullYear());
  const dropdownRef = useRef<HTMLDivElement>(null);

  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handlePrevMonth = () => {
    const newMonth = subMonths(selectedMonth, 1);
    if (!minDate || newMonth >= startOfMonth(minDate)) {
      onMonthChange(newMonth);
    }
  };

  const handleNextMonth = () => {
    const newMonth = addMonths(selectedMonth, 1);
    if (newMonth <= endOfMonth(maxDate)) {
      onMonthChange(newMonth);
    }
  };

  const handleMonthSelect = (monthIndex: number) => {
    const newMonth = new Date(viewYear, monthIndex, 1);
    if ((!minDate || newMonth >= startOfMonth(minDate)) && newMonth <= endOfMonth(maxDate)) {
      onMonthChange(newMonth);
      setIsOpen(false);
    }
  };

  const handlePrevYear = () => {
    setViewYear(viewYear - 1);
  };

  const handleNextYear = () => {
    if (viewYear < maxDate.getFullYear()) {
      setViewYear(viewYear + 1);
    }
  };

  const isMonthDisabled = (monthIndex: number) => {
    const monthDate = new Date(viewYear, monthIndex, 1);
    if (minDate && monthDate < startOfMonth(minDate)) return true;
    if (monthDate > endOfMonth(maxDate)) return true;
    return false;
  };

  const isMonthSelected = (monthIndex: number) => {
    return isSameMonth(new Date(viewYear, monthIndex, 1), selectedMonth);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="flex items-center gap-2">
        {/* Previous Month Button */}
        <button
          onClick={handlePrevMonth}
          disabled={minDate ? selectedMonth <= startOfMonth(minDate) : false}
          className="p-2 hover:bg-gray-100 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          title="Previous month"
        >
          <ChevronLeft className="w-4 h-4 text-gray-600" />
        </button>

        {/* Month Display / Dropdown Trigger */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition min-w-[160px] justify-center"
        >
          <Calendar className="w-4 h-4 text-gray-500" />
          <span>{format(selectedMonth, "MMMM yyyy")}</span>
          <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>

        {/* Next Month Button */}
        <button
          onClick={handleNextMonth}
          disabled={addMonths(selectedMonth, 1) > endOfMonth(maxDate)}
          className="p-2 hover:bg-gray-100 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          title="Next month"
        >
          <ChevronRight className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full mt-2 right-0 bg-white rounded-xl shadow-lg border border-gray-200 p-4 z-50 min-w-[280px]">
          {/* Year Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handlePrevYear}
              className="p-1 hover:bg-gray-100 rounded-lg transition"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <span className="text-lg font-semibold text-gray-900">{viewYear}</span>
            <button
              onClick={handleNextYear}
              disabled={viewYear >= maxDate.getFullYear()}
              className="p-1 hover:bg-gray-100 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Month Grid */}
          <div className="grid grid-cols-3 gap-2">
            {months.map((month, index) => (
              <button
                key={month}
                onClick={() => handleMonthSelect(index)}
                disabled={isMonthDisabled(index)}
                className={`py-2 px-3 rounded-lg text-sm font-medium transition ${
                  isMonthSelected(index)
                    ? "bg-teal-500 text-white"
                    : isMonthDisabled(index)
                    ? "text-gray-300 cursor-not-allowed"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {month}
              </button>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
            <button
              onClick={() => {
                onMonthChange(new Date());
                setIsOpen(false);
              }}
              className="flex-1 py-2 px-3 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition"
            >
              This Month
            </button>
            <button
              onClick={() => {
                onMonthChange(subMonths(new Date(), 1));
                setIsOpen(false);
              }}
              className="flex-1 py-2 px-3 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition"
            >
              Last Month
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
