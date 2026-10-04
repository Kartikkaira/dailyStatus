'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { daysApi } from '../../lib/api';
import { DayStatus, MONTHS_DATA, MonthInfo } from '../../types';
import StatusEditModal from '../../components/StatusEditModal';
import {
  Table2,
  LogOut,
  User as UserIcon,
  RefreshCw,
  Loader2,
  CheckCircle,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

interface CellSaveState {
  status: 'saving' | 'success' | 'error';
  message?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, accessToken, logout, isLoading: authLoading } = useAuth();

  // Redirect to /login if unauthenticated after initial check
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const [allDays, setAllDays] = useState<DayStatus[]>([]);
  const [isLoadingDays, setIsLoadingDays] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Per-cell state tracking: key `${month}-${day}`
  const [cellStates, setCellStates] = useState<Record<string, CellSaveState>>({});

  // Active modal state
  const [activeCell, setActiveCell] = useState<{
    month: number;
    day: number;
    initialStatus: DayStatus | null;
  } | null>(null);

  // Load all days from backend
  const fetchDays = useCallback(async () => {
    try {
      setIsLoadingDays(true);
      setErrorMessage(null);
      const res = await daysApi.getAllDays();
      setAllDays(res.days);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load day statuses');
    } finally {
      setIsLoadingDays(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchDays();
    }
  }, [user, fetchDays]);

  // Lookup map: `${month}-${day}` -> DayStatus
  const statusMap = useMemo(() => {
    const map = new Map<string, DayStatus>();
    for (const item of allDays) {
      map.set(`${item.month}-${item.day}`, item);
    }
    return map;
  }, [allDays]);

  // Save handler for cell
  const handleSaveStatus = async (
    month: number,
    day: number,
    text: string,
    color: string | null
  ) => {
    const cellKey = `${month}-${day}`;
    setCellStates((prev) => ({
      ...prev,
      [cellKey]: { status: 'saving' },
    }));

    try {
      const response = await daysApi.upsertDay(month, day, text, color, accessToken);
      const updatedItem = response.data;

      // Update in-memory allDays
      setAllDays((prev) => {
        const idx = prev.findIndex((d) => d.month === month && d.day === day);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = updatedItem;
          return copy;
        }
        return [...prev, updatedItem];
      });

      // Show success feedback
      setCellStates((prev) => ({
        ...prev,
        [cellKey]: { status: 'success' },
      }));

      // Clear success indicator after 3 seconds
      setTimeout(() => {
        setCellStates((prev) => {
          const next = { ...prev };
          delete next[cellKey];
          return next;
        });
      }, 3000);
    } catch (err: any) {
      setCellStates((prev) => ({
        ...prev,
        [cellKey]: {
          status: 'error',
          message: err.message || 'Failed to save',
        },
      }));
      throw err;
    }
  };

  // If loading session, show loading skeleton
  if (authLoading || !user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        <p className="text-sm font-medium text-slate-500">Checking authentication session...</p>
      </div>
    );
  }

  // Row numbers: 1 to 31
  const daysArray = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className="space-y-6">
      {/* Header bar with user email and logout button */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Protected Data Input Grid</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Table2 className="w-7 h-7 text-emerald-600 inline" />
            <span>12×31 Day Status Grid</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Click on any active cell to set or update its status. Disabled cells represent invalid dates.
          </p>
        </div>

        {/* User Account Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 rounded-xl border border-slate-200 text-sm text-slate-700">
            <UserIcon className="w-4 h-4 text-emerald-600" />
            <span className="font-medium">{user.email}</span>
          </div>

          <button
            onClick={fetchDays}
            disabled={isLoadingDays}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            title="Reload statuses"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingDays ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => logout()}
            className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Log out</span>
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl flex items-center justify-between">
          <span>{errorMessage}</span>
          <button onClick={fetchDays} className="underline font-medium hover:text-rose-900">
            Retry
          </button>
        </div>
      )}

      {/* Grid Table Container */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {/* Table Controls / Legend */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-white border border-slate-300" />
              <span>Empty Day (Click to Set)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-emerald-500" />
              <span>Has Status</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm disabled-day-pattern border border-slate-300" />
              <span>Invalid Day (Greyed Out)</span>
            </div>
          </div>
          <span className="text-slate-500 font-medium">
            Total Statuses Tracked: {allDays.length} / 365
          </span>
        </div>

        {/* Responsive Table with horizontal scroll for smaller displays */}
        <div className="overflow-x-auto max-h-[75vh]">
          <table className="w-full border-collapse text-left text-xs min-w-[900px]">
            {/* Table Header: 12 Columns (Jan to Dec) */}
            <thead className="sticky top-0 z-20 bg-slate-100 text-slate-700 font-bold border-b border-slate-300 shadow-2xs">
              <tr>
                <th className="sticky left-0 z-30 bg-slate-100 p-2.5 text-center border-r border-slate-300 w-14">
                  Day
                </th>
                {MONTHS_DATA.map((month) => (
                  <th
                    key={month.month}
                    className="p-2.5 text-center border-r border-slate-200 last:border-r-0 min-w-[90px]"
                  >
                    <div>{month.name}</div>
                    <div className="text-[10px] font-normal text-slate-500">
                      ({month.maxDays}d)
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            {/* Table Body: 31 Rows (Days 1 to 31) */}
            <tbody className="divide-y divide-slate-200">
              {daysArray.map((dayNum) => (
                <tr key={`row-${dayNum}`} className="hover:bg-slate-50/60 transition-colors">
                  {/* Sticky Day Row Header */}
                  <td className="sticky left-0 z-10 bg-slate-50 p-2 text-center font-bold text-slate-700 border-r border-slate-300">
                    {dayNum}
                  </td>

                  {/* 12 Month Cells for this Day */}
                  {MONTHS_DATA.map((month) => {
                    const isInvalid = dayNum > month.maxDays;
                    const cellKey = `${month.month}-${dayNum}`;
                    const status = statusMap.get(cellKey);
                    const cellState = cellStates[cellKey];

                    if (isInvalid) {
                      return (
                        <td
                          key={cellKey}
                          className="p-1 text-center border-r border-slate-200 last:border-r-0 disabled-day-pattern cursor-not-allowed select-none"
                          title={`${month.name} only has ${month.maxDays} days`}
                        >
                          <span className="text-[10px] font-mono text-slate-400">&mdash;</span>
                        </td>
                      );
                    }

                    return (
                      <td
                        key={cellKey}
                        onClick={() =>
                          setActiveCell({
                            month: month.month,
                            day: dayNum,
                            initialStatus: status || null,
                          })
                        }
                        className={`p-1 text-center border-r border-slate-200 last:border-r-0 cursor-pointer transition-all relative group ${
                          status
                            ? 'bg-emerald-50/40 hover:bg-emerald-100/60'
                            : 'hover:bg-slate-100'
                        }`}
                        title={
                          status
                            ? `${month.name} ${dayNum}: ${status.status_text}`
                            : `Click to set status for ${month.name} ${dayNum}`
                        }
                      >
                        <div className="min-h-[38px] p-1 rounded-md flex flex-col items-center justify-center gap-0.5">
                          {/* Saving / Success / Error Indicators */}
                          {cellState?.status === 'saving' && (
                            <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-semibold animate-pulse">
                              <Loader2 className="w-3 h-3 animate-spin" />
                              <span>Saving...</span>
                            </div>
                          )}

                          {cellState?.status === 'success' && (
                            <div className="flex items-center gap-1 text-[10px] text-emerald-700 font-semibold bg-emerald-100 px-1.5 py-0.5 rounded-full">
                              <CheckCircle className="w-3 h-3" />
                              <span>Saved</span>
                            </div>
                          )}

                          {cellState?.status === 'error' && (
                            <div className="flex items-center gap-1 text-[10px] text-rose-700 font-semibold bg-rose-100 px-1.5 py-0.5 rounded-full">
                              <AlertCircle className="w-3 h-3" />
                              <span>Error</span>
                            </div>
                          )}

                          {/* Normal Cell Content (when not actively showing saving/success/error) */}
                          {!cellState && status && (
                            <div className="w-full flex items-center justify-center gap-1">
                              <span
                                className="w-2 h-2 rounded-full shrink-0 shadow-2xs"
                                style={{ backgroundColor: status.status_color || '#10b981' }}
                              />
                              <span className="truncate max-w-[70px] text-[10px] font-medium text-slate-800">
                                {status.status_text}
                              </span>
                            </div>
                          )}

                          {!cellState && !status && (
                            <span className="text-slate-300 group-hover:text-slate-500 font-bold text-xs">
                              +
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {activeCell && (
        <StatusEditModal
          isOpen={true}
          month={activeCell.month}
          day={activeCell.day}
          initialStatus={activeCell.initialStatus}
          onClose={() => setActiveCell(null)}
          onSave={handleSaveStatus}
        />
      )}
    </div>
  );
}
