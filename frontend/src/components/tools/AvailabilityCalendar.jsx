import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

/**
 * bookedRanges: [{ startDate, endDate }] — approved/pending bookings
 * onRangeSelect: (start, end) => void — called when user selects a range (optional)
 * readOnly: bool — just display, no selection
 */
export default function AvailabilityCalendar({ bookedRanges = [], onRangeSelect, readOnly = false }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [year,  setYear]  = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectStart, setSelectStart] = useState(null);
  const [selectEnd,   setSelectEnd]   = useState(null);
  const [hovering,    setHovering]    = useState(null);

  // Build a Set of booked date strings for O(1) lookup
  const bookedDates = new Set();
  bookedRanges.forEach(({ startDate, endDate }) => {
    const s = new Date(startDate); s.setHours(0,0,0,0);
    const e = new Date(endDate);   e.setHours(0,0,0,0);
    for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
      bookedDates.add(d.toDateString());
    }
  });

  const isBooked   = (d) => bookedDates.has(d.toDateString());
  const isPast     = (d) => d < today;
  const isToday    = (d) => d.toDateString() === today.toDateString();
  const isSelected = (d) => {
    if (!selectStart) return false;
    const end = selectEnd || hovering;
    if (!end) return d.toDateString() === selectStart.toDateString();
    const [s, e] = selectStart <= end ? [selectStart, end] : [end, selectStart];
    return d >= s && d <= e;
  };
  const isRangeBooked = (start, end) => {
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      if (isBooked(d)) return true;
    }
    return false;
  };

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const handleDayClick = (d) => {
    if (readOnly || isPast(d) || isBooked(d)) return;
    if (!selectStart || (selectStart && selectEnd)) {
      setSelectStart(d); setSelectEnd(null); setHovering(null);
    } else {
      const [s, e] = d >= selectStart ? [selectStart, d] : [d, selectStart];
      if (isRangeBooked(s, e)) return; // can't select range with booked days in it
      setSelectEnd(e);
      setSelectStart(s);
      if (onRangeSelect) onRangeSelect(s, e);
    }
  };

  // Build calendar grid
  const firstDay  = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  const dayClass = (d) => {
    if (!d) return '';
    const past    = isPast(d);
    const booked  = isBooked(d);
    const sel     = !readOnly && isSelected(d);
    const todayCls = isToday(d) ? 'ring-2 ring-brand-400' : '';

    if (booked)  return `${todayCls} bg-red-100 text-red-400 cursor-not-allowed line-through`;
    if (past)    return `${todayCls} text-gray-300 cursor-not-allowed`;
    if (sel)     return `${todayCls} bg-brand-500 text-white font-semibold`;
    if (!readOnly) return `${todayCls} hover:bg-brand-50 hover:text-brand-700 cursor-pointer text-gray-700`;
    return `${todayCls} text-gray-700`;
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 bg-gray-50 border-b border-gray-100">
        <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-200 transition-colors">
          <ChevronLeft size={16} className="text-gray-600" />
        </button>
        <span className="font-display font-bold text-gray-800">{MONTHS[month]} {year}</span>
        <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-200 transition-colors">
          <ChevronRight size={16} className="text-gray-600" />
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 px-3 pt-3">
        {DAYS.map(d => (
          <div key={d} className="text-center text-xs font-semibold text-gray-400 py-1">{d}</div>
        ))}
      </div>

      {/* Cells */}
      <div className="grid grid-cols-7 gap-0.5 px-3 pb-4">
        {cells.map((d, i) => (
          <div key={i}
            className={`aspect-square flex items-center justify-center text-sm rounded-lg transition-colors select-none ${d ? dayClass(d) : ''}`}
            onClick={() => d && handleDayClick(d)}
            onMouseEnter={() => d && !readOnly && selectStart && !selectEnd && setHovering(d)}
            onMouseLeave={() => setHovering(null)}
          >
            {d ? d.getDate() : ''}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-5 py-3 bg-gray-50 border-t border-gray-100 flex-wrap">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-red-100 border border-red-200" />
          <span className="text-xs text-gray-500">Booked</span>
        </div>
        {!readOnly && (
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-brand-500" />
            <span className="text-xs text-gray-500">Your selection</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-white border-2 border-brand-400" />
          <span className="text-xs text-gray-500">Today</span>
        </div>
      </div>

      {/* Selected range display */}
      {!readOnly && selectStart && selectEnd && (
        <div className="px-5 py-3 bg-brand-50 border-t border-brand-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-brand-700">Selected dates</p>
            <p className="text-sm text-brand-900 font-bold">
              {selectStart.toLocaleDateString()} → {selectEnd.toLocaleDateString()}
            </p>
          </div>
          <button onClick={() => { setSelectStart(null); setSelectEnd(null); }}
            className="text-xs text-brand-500 hover:text-brand-700 underline">Clear</button>
        </div>
      )}
    </div>
  );
}