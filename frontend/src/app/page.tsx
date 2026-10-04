'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { daysApi } from '../lib/api';
import { DayStatus, MONTHS_DATA, MonthInfo } from '../types';
import StatusEditModal from '../components/StatusEditModal';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Edit3,
  LogIn,
  Clock,
  User as UserIcon,
  Sparkles,
  Info,
  Loader2,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';

export default function DayStatusViewerPage() {
  const { user, accessToken, isLoading: authLoading } = useAuth();

  // State
  const [currentMonthIndex, setCurrentMonthIndex] = useState<number>(0); // 0-indexed (0 = January)
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [allDays, setAllDays] = useState<DayStatus[]>([]);
  const [isLoadingDays, setIsLoadingDays] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);

  const currentMonthInfo: MonthInfo = MONTHS_DATA[currentMonthIndex];
  const currentMonthNum = currentMonthInfo.month; // 1-12

  // Fetch all saved day entries
  const loadDays = useCallback(async () => {
    try {
      setIsLoadingDays(true);
      setFetchError(null);
      const res = await daysApi.getAllDays();
      setAllDays(res.days);
    } catch (err: any) {
      setFetchError(err.message || 'Failed to load day statuses');
    } finally {
      setIsLoadingDays(false);
    }
  }, []);

  useEffect(() => {
    loadDays();
  }, [loadDays]);

  // Fast lookup map: `${month}-${day}` -> DayStatus
  const statusMap = useMemo(() => {
    const map = new Map<string, DayStatus>();
    for (const item of allDays) {
      map.set(`${item.month}-${item.day}`, item);
    }
    return map;
  }, [allDays]);

  // Status for currently selected day
  const currentSelectedStatus = useMemo(() => {
    return statusMap.get(`${currentMonthNum}-${selectedDay}`) || null;
  }, [statusMap, currentMonthNum, selectedDay]);

  // Month navigation
  const handlePrevMonth = () => {
    const newIdx = currentMonthIndex === 0 ? 11 : currentMonthIndex - 1;
    setCurrentMonthIndex(newIdx);
    const newMonthMax = MONTHS_DATA[newIdx].maxDays;
    if (selectedDay > newMonthMax) {
      setSelectedDay(newMonthMax);
    }
  };

  const handleNextMonth = () => {
    const newIdx = currentMonthIndex === 11 ? 0 : currentMonthIndex + 1;
    setCurrentMonthIndex(newIdx);
    const newMonthMax = MONTHS_DATA[newIdx].maxDays;
    if (selectedDay > newMonthMax) {
      setSelectedDay(newMonthMax);
    }
  };

  // Handle saving status from modal
  const handleSaveStatus = async (
    month: number,
    day: number,
    text: string,
    color: string | null
  ) => {
    const response = await daysApi.upsertDay(month, day, text, color, accessToken);
    const updatedItem = response.data;

    // Update in-memory allDays list
    setAllDays((prev) => {
      const idx = prev.findIndex((d) => d.month === month && d.day === day);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = updatedItem;
        return copy;
      }
      return [...prev, updatedItem];
    });
  };

  // Calculate day-of-week offset for month (using year 2026 for realistic day-of-week alignment)
  // Month is 0-indexed in JS Date: new Date(2026, month - 1, 1).getDay()
  const firstDayOfWeek = useMemo(() => {
    return new Date(2026, currentMonthNum - 1, 1).getDay(); // 0 = Sun, 1 = Mon ...
  }, [currentMonthNum]);

  // Stats
  const monthStatusesCount = useMemo(() => {
    return allDays.filter((d) => d.month === currentMonthNum).length;
  }, [allDays, currentMonthNum]);

  return (
    <div className="space-y-8">
      {/* Top Banner & Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Public Calendar Viewer</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Day Status Calendar
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Browse through each month of the year to inspect or record daily status updates.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadDays}
            disabled={isLoadingDays}
            className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            title="Refresh statuses"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingDays ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition"
          >
            Open 12×31 Grid
          </Link>
        </div>
      </div>

      {fetchError && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl flex items-center justify-between">
          <span>{fetchError}</span>
          <button onClick={loadDays} className="underline font-medium hover:text-rose-900">
            Retry
          </button>
        </div>
      )}

      {/* Main Grid: Calendar Left, Detail Panel Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Calendar View Component (7 columns on Desktop) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
          {/* Month Header & Controls */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <span>{currentMonthInfo.name}</span>
                <span className="text-sm font-medium text-slate-500">
                  ({monthStatusesCount} / {currentMonthInfo.maxDays} days tracked)
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Month {currentMonthNum} of 12</p>
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition"
                aria-label="Previous month"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <select
                value={currentMonthIndex}
                onChange={(e) => {
                  const idx = parseInt(e.target.value, 10);
                  setCurrentMonthIndex(idx);
                  const max = MONTHS_DATA[idx].maxDays;
                  if (selectedDay > max) setSelectedDay(max);
                }}
                className="bg-transparent text-sm font-semibold text-slate-800 px-2 py-1 rounded-lg focus:outline-hidden cursor-pointer"
                aria-label="Select month"
              >
                {MONTHS_DATA.map((m, idx) => (
                  <option key={m.month} value={idx}>
                    {m.name}
                  </option>
                ))}
              </select>
              <button
                onClick={handleNextMonth}
                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition"
                aria-label="Next month"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-1 text-center font-medium text-xs text-slate-600 py-1 border-b border-slate-100">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar Day Grid */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {/* Blank placeholder spaces before day 1 */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="h-14 sm:h-16 rounded-xl bg-slate-50/50" />
            ))}

            {/* Actual Month Days */}
            {Array.from({ length: currentMonthInfo.maxDays }).map((_, i) => {
              const dayNum = i + 1;
              const hasStatus = statusMap.get(`${currentMonthNum}-${dayNum}`);
              const isSelected = selectedDay === dayNum;

              return (
                <button
                  key={`day-${dayNum}`}
                  onClick={() => setSelectedDay(dayNum)}
                  className={`relative h-14 sm:h-16 p-1.5 rounded-xl border flex flex-col justify-between items-start transition-all cursor-pointer ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/20 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 bg-white'
                  }`}
                  aria-label={`${currentMonthInfo.name} ${dayNum}`}
                >
                  <span
                    className={`text-xs font-semibold px-1.5 py-0.5 rounded-md ${
                      isSelected
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-700 bg-slate-100'
                    }`}
                  >
                    {dayNum}
                  </span>

                  {hasStatus ? (
                    <div className="w-full flex items-center gap-1 overflow-hidden">
                      <span
                        className="w-2 h-2 rounded-full shrink-0 shadow-2xs"
                        style={{ backgroundColor: hasStatus.status_color || '#10b981' }}
                      />
                      <span className="text-[10px] text-slate-600 truncate font-medium max-w-[70px]">
                        {hasStatus.status_text}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-300">&bull;</span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              <span>Has recorded status</span>
            </div>
            <span>February capped at 28 days as specified</span>
          </div>
        </div>

        {/* Selected Day Status Panel (5 columns on Desktop) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              Selected Date
            </span>
            <div className="flex items-center justify-between mt-1">
              <h3 className="text-2xl font-bold text-slate-900">
                {currentMonthInfo.name} {selectedDay}
              </h3>
              <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-lg">
                Day {selectedDay} of {currentMonthInfo.maxDays}
              </span>
            </div>
          </div>

          {/* Status Content */}
          {isLoadingDays ? (
            <div className="flex items-center justify-center py-12 text-slate-400 gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Loading day data...</span>
            </div>
          ) : currentSelectedStatus ? (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3.5 h-3.5 rounded-full shadow-2xs"
                    style={{
                      backgroundColor: currentSelectedStatus.status_color || '#10b981',
                    }}
                  />
                  <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                    Recorded Status
                  </span>
                </div>

                <p className="text-slate-800 text-base font-medium leading-relaxed whitespace-pre-wrap">
                  {currentSelectedStatus.status_text}
                </p>
              </div>

              {/* Metadata */}
              <div className="text-xs text-slate-500 space-y-1.5 pt-1">
                {currentSelectedStatus.updated_by && (
                  <div className="flex items-center gap-1.5">
                    <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                    <span>Updated by: {currentSelectedStatus.updated_by.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    Last modified:{' '}
                    {new Date(currentSelectedStatus.updated_at).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2">
                {!authLoading && user ? (
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Edit Status</span>
                  </button>
                ) : (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-center justify-between">
                    <span>You are in read-only mode.</span>
                    <Link
                      href="/login"
                      className="font-semibold text-amber-900 underline flex items-center gap-1 hover:text-black"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>Log in to edit</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-10 space-y-4">
              <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
                <Info className="w-6 h-6" />
              </div>
              <div>
                <p className="text-slate-800 font-medium">No data for this day</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  No status or milestone has been logged for {currentMonthInfo.name} {selectedDay} yet.
                </p>
              </div>

              <div>
                {!authLoading && user ? (
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Set Status Now</span>
                  </button>
                ) : (
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Log in to edit</span>
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Quick Year Progress Stats */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <div className="flex justify-between text-xs font-medium text-slate-600">
              <span>Overall Year Progress</span>
              <span>
                {allDays.length} / 365 days ({Math.round((allDays.length / 365) * 100)}%)
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (allDays.length / 365) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Edit Status Modal */}
      <StatusEditModal
        isOpen={isModalOpen}
        month={currentMonthNum}
        day={selectedDay}
        initialStatus={currentSelectedStatus}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveStatus}
      />
    </div>
  );
}
