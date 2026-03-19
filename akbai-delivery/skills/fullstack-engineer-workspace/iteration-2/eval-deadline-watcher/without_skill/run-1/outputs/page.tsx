'use client';

import { createClient } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { DeadlineCard } from './deadline-card';
import { ErrorBoundary } from './error';
import { DeadlinesSkeleton } from './loading';

interface Deadline {
  id: string;
  form_type: string;
  form_name: string;
  due_date: string;
  description: string | null;
  is_filed: boolean;
  filed_date: string | null;
  days_remaining: number;
  priority_level: 'critical' | 'warning' | 'normal';
  created_at: string;
  updated_at: string;
}

interface ApiResponse {
  data: Deadline[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

// Initialize Supabase client (public/anon key)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default function DeadlinesPage() {
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'unfiled' | 'filed' | 'all'>('unfiled');

  // Fetch deadlines
  useEffect(() => {
    const fetchDeadlines = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get session
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError || !session) {
          setError('Please log in to view your deadlines');
          setDeadlines([]);
          return;
        }

        // Fetch deadlines from API route
        const response = await fetch(`/api/deadlines?status=${statusFilter}&limit=50`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: ApiResponse = await response.json();
        setDeadlines(data.data || []);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load deadlines';
        setError(errorMessage);
        setDeadlines([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDeadlines();
  }, [statusFilter]);

  // Handle mark as filed
  const handleMarkFiled = async (id: string) => {
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        setError('Session expired. Please log in again.');
        return;
      }

      const today = new Date().toISOString().split('T')[0];

      const response = await fetch(`/api/deadlines?id=${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          is_filed: true,
          filed_date: today,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update deadline');
      }

      // Update local state
      setDeadlines((prev) =>
        prev.map((deadline) =>
          deadline.id === id
            ? {
                ...deadline,
                is_filed: true,
                filed_date: today,
              }
            : deadline
        )
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to mark deadline as filed';
      setError(errorMessage);
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        setError('Session expired. Please log in again.');
        return;
      }

      const response = await fetch(`/api/deadlines?id=${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete deadline');
      }

      // Update local state
      setDeadlines((prev) => prev.filter((deadline) => deadline.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete deadline';
      setError(errorMessage);
    }
  };

  if (isLoading) {
    return <DeadlinesSkeleton />;
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50 pb-8">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-gray-200 bg-white px-4 py-6 shadow-sm">
          <h1 className="mb-1 text-2xl font-bold text-gray-900">BIR Deadlines</h1>
          <p className="text-sm text-gray-600">Track your tax compliance deadlines</p>
        </div>

        {/* Content */}
        <div className="px-4 py-6">
          {/* Error Message */}
          {error && (
            <div className="mb-4 rounded-lg border-2 border-red-200 bg-red-50 p-4">
              <p className="text-sm font-semibold text-red-800">{error}</p>
            </div>
          )}

          {/* Status Filter Tabs */}
          <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
            {(['unfiled', 'filed', 'all'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  statusFilter === status
                    ? 'bg-blue-600 text-white'
                    : 'border-2 border-gray-300 text-gray-700 hover:border-gray-400'
                }`}
              >
                {status === 'unfiled' && 'Unfiled'}
                {status === 'filed' && 'Filed'}
                {status === 'all' && 'All'}
              </button>
            ))}
          </div>

          {/* Deadlines List */}
          {deadlines.length === 0 ? (
            <div className="rounded-lg border-2 border-gray-200 bg-white p-8 text-center">
              <p className="text-gray-600">
                {statusFilter === 'unfiled'
                  ? 'No unfiled deadlines yet. Great work!'
                  : statusFilter === 'filed'
                    ? 'No filed deadlines yet.'
                    : 'No deadlines yet.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {deadlines.map((deadline) => (
                <DeadlineCard
                  key={deadline.id}
                  id={deadline.id}
                  formType={deadline.form_type}
                  formName={deadline.form_name}
                  dueDate={deadline.due_date}
                  daysRemaining={deadline.days_remaining}
                  isFiled={deadline.is_filed}
                  description={deadline.description || undefined}
                  onMarkFiled={handleMarkFiled}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}

          {/* Info Section */}
          <div className="mt-8 rounded-lg bg-blue-50 p-4">
            <h3 className="mb-2 text-sm font-semibold text-blue-900">How it works</h3>
            <ul className="space-y-1 text-xs text-blue-800">
              <li>• Red cards show deadlines 3 days or less away</li>
              <li>• Amber cards show deadlines 7 days or less away</li>
              <li>• Mark deadlines as filed once you submit them</li>
              <li>• Delete deadlines you no longer need to track</li>
            </ul>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
