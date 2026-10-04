'use client';

import React, { useState, useEffect } from 'react';
import { MONTHS_DATA, STATUS_COLORS, DayStatus } from '../types';
import { X, Check, Loader2, Sparkles, Palette } from 'lucide-react';

interface StatusEditModalProps {
  isOpen: boolean;
  month: number;
  day: number;
  initialStatus?: DayStatus | null;
  onClose: () => void;
  onSave: (month: number, day: number, text: string, color: string | null) => Promise<void>;
}

export default function StatusEditModal({
  isOpen,
  month,
  day,
  initialStatus,
  onClose,
  onSave,
}: StatusEditModalProps) {
  const [text, setText] = useState('');
  const [selectedColor, setSelectedColor] = useState<string>('#10b981');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const monthObj = MONTHS_DATA.find((m) => m.month === month);
  const monthName = monthObj ? monthObj.name : `Month ${month}`;

  useEffect(() => {
    if (isOpen) {
      setText(initialStatus?.status_text || '');
      setSelectedColor(initialStatus?.status_color || '#10b981');
      setErrorMessage(null);
      setIsSubmitting(false);
    }
  }, [isOpen, initialStatus]);

  // Handle Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      setErrorMessage('Please enter a status description.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      await onSave(month, day, text.trim(), selectedColor);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save status. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs transition-opacity"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) {
          onClose();
        }
      }}
    >
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <span
              className="w-3.5 h-3.5 rounded-full shadow-xs"
              style={{ backgroundColor: selectedColor }}
            />
            <h2 id="modal-title" className="text-lg font-semibold text-slate-900">
              {initialStatus ? 'Edit Status' : 'Set Status'} — {monthName} {day}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition disabled:opacity-50"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl">
              {errorMessage}
            </div>
          )}

          {/* Status Text Input */}
          <div>
            <label htmlFor="status-text" className="block text-sm font-medium text-slate-700 mb-1.5">
              Status Description
            </label>
            <textarea
              id="status-text"
              rows={3}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g. Launched new feature, Completed milestone, Team offsite..."
              maxLength={500}
              required
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition placeholder:text-slate-400 text-slate-900"
              autoFocus
            />
            <div className="flex justify-between items-center mt-1 text-xs text-slate-400">
              <span>Brief status or achievement for this date</span>
              <span>{text.length}/500</span>
            </div>
          </div>

          {/* Status Color Picker */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-1.5">
              <Palette className="w-4 h-4 text-slate-500" />
              <span>Status Color Indicator</span>
            </label>
            <div className="grid grid-cols-7 gap-2">
              {STATUS_COLORS.map((col) => {
                const isSelected = selectedColor.toLowerCase() === col.value.toLowerCase();
                return (
                  <button
                    key={col.value}
                    type="button"
                    onClick={() => setSelectedColor(col.value)}
                    title={`${col.name} (${col.label})`}
                    className={`group relative h-9 w-full rounded-lg transition-transform flex items-center justify-center border-2 ${
                      isSelected
                        ? 'border-slate-800 scale-105 shadow-xs'
                        : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: col.value }}
                  >
                    {isSelected && <Check className="w-4 h-4 text-white stroke-[3]" />}
                  </button>
                );
              })}
            </div>
            <p className="mt-1.5 text-xs text-slate-500">
              {STATUS_COLORS.find(
                (c) => c.value.toLowerCase() === selectedColor.toLowerCase()
              )?.label || 'Custom indicator'}
            </p>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Save Status</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
