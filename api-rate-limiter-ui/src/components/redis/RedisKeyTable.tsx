'use client';

import React, { useState } from 'react';
import { RedisKeyItem } from '@/types';
import { DataTable, Column } from '../ui/DataTable';
import { StatusBadge } from '../ui/StatusBadge';
import { RateLimiterStore } from '@/lib/services/store';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { useToast } from '../providers/ToastProvider';
import { Database, RotateCcw, Trash2, Clock, Eye, Activity, Key, RefreshCw } from 'lucide-react';
import { formatRuleSpec } from '@/lib/utils';

export interface RedisKeyTableProps {
  keys: RedisKeyItem[];
  onRefresh: () => void;
  onFlushSingle: (key: string) => Promise<void>;
  onFlushAll: () => Promise<void>;
  redisConnected?: boolean;
}

export function RedisKeyTable({ keys, onRefresh, onFlushSingle, onFlushAll, redisConnected = true }: RedisKeyTableProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'ALL' | 'RATE_LIMIT' | 'RATE_RULE'>('ALL');
  const [keyToFlush, setKeyToFlush] = useState<string | null>(null);
  const [showFlushAllDialog, setShowFlushAllDialog] = useState(false);
  const [selectedKeyForJson, setSelectedKeyForJson] = useState<RedisKeyItem | null>(null);

  const filteredKeys = React.useMemo(() => {
    return keys.filter((k) => {
      if (activeTab === 'RATE_LIMIT' && k.type !== 'rate_limit') return false;
      if (activeTab === 'RATE_RULE' && k.type !== 'rate_rule') return false;
      return true;
    });
  }, [keys, activeTab]);

  const handleFlushSingleKey = async () => {
    if (!keyToFlush) return;
    try {
      await onFlushSingle(keyToFlush);
      toast('Key Flushed', `Removed '${keyToFlush}' from Redis memory`, 'success');
    } catch (e: any) {
      toast('Error', e.message || 'Failed to flush key', 'error');
    }
    setKeyToFlush(null);
  };

  const handleFlushAll = async () => {
    try {
      await onFlushAll();
      toast('All Redis Keys Flushed', 'Cleared all counter and cache keys from Redis.', 'warning');
    } catch (e: any) {
      toast('Error', e.message || 'Failed to flush keys', 'error');
    }
    setShowFlushAllDialog(false);
  };

  const columns: Column<RedisKeyItem>[] = [
    {
      header: 'Redis Key Name',
      accessorKey: 'key',
      cell: (item) => (
        <div className="flex items-center gap-3">
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
              item.type === 'rate_limit'
                ? 'bg-sky-50 text-sky-700 border border-sky-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}
          >
            {item.type === 'rate_limit' ? <Activity className="w-4 h-4" /> : <Key className="w-4 h-4" />}
          </div>
          <div>
            <span className="font-mono font-bold text-slate-900 text-xs block">{item.key}</span>
            <span className="text-[10px] text-slate-400 font-semibold uppercase">
              Client: {item.clientId}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: 'Key Category',
      accessorKey: 'type',
      cell: (item) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border ${
            item.type === 'rate_limit'
              ? 'bg-sky-50 text-sky-800 border-sky-200'
              : 'bg-amber-50 text-amber-800 border-amber-200'
          }`}
        >
          {item.type === 'rate_limit' ? 'COUNTER KEY' : 'RULE CACHE'}
        </span>
      ),
    },
    {
      header: 'Counter / Value Payload',
      cell: (item) => {
        if (item.type === 'rate_limit') {
          const current = item.currentCount || 0;
          const max = item.maxRequests || 5;
          const pct = Math.min(100, Math.round((current / max) * 100));

          return (
            <div className="min-w-[140px]">
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="font-mono">{current} / {max} req</span>
                <span className="text-[10px] text-slate-400">{pct}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  style={{ width: `${pct}%` }}
                  className={`h-full transition-all ${
                    pct >= 100 ? 'bg-rose-500' : pct >= 80 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                />
              </div>
            </div>
          );
        }

        return (
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded">
              {formatRuleSpec(item.maxRequests || 0, item.windowValue || 1, item.windowUnit || 'MINUTE')}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedKeyForJson(item);
              }}
              className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 underline"
            >
              View JSON
            </button>
          </div>
        );
      },
    },
    {
      header: 'TTL (Seconds)',
      accessorKey: 'ttlSeconds',
      cell: (item) => {
        let ttlText = `${item.ttlSeconds}s`;
        if (item.ttlSeconds === -1) {
          ttlText = 'No expiration';
        } else if (item.ttlSeconds === -2) {
          ttlText = 'Expired / Not found';
        }
        return (
          <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-slate-700">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{ttlText}</span>
          </div>
        );
      },
    },
    {
      header: 'Enforcement Status',
      cell: (item) => {
        if (item.type === 'rate_limit') {
          return <StatusBadge type="redis_status" value={item.status || 'ALLOWED'} />;
        }
        return <StatusBadge type="rule_source" value={item.source || 'RATE_PLAN'} />;
      },
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (item) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => setKeyToFlush(item.key)}
            disabled={!redisConnected}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Flush key from Redis"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const filterComponent = (
    <div className="flex items-center justify-between w-full flex-wrap gap-2">
      {/* Category Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-200/60 rounded-xl">
        <button
          onClick={() => setActiveTab('ALL')}
          className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          All Keys ({keys.length})
        </button>
        <button
          onClick={() => setActiveTab('RATE_LIMIT')}
          className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'RATE_LIMIT'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Counters ({keys.filter((k) => k.type === 'rate_limit').length})
        </button>
        <button
          onClick={() => setActiveTab('RATE_RULE')}
          className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'RATE_RULE'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Rule Cache ({keys.filter((k) => k.type === 'rate_rule').length})
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onRefresh}
          className="p-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-xs font-semibold flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
        <button
          onClick={() => setShowFlushAllDialog(true)}
          disabled={!redisConnected}
          className="px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Flush All Keys
        </button>
      </div>
    </div>
  );

  return (
    <>
      <DataTable
        data={filteredKeys}
        columns={columns}
        searchKey="key"
        searchPlaceholder="Filter keys by pattern rate_limit:* or rate_rule:*..."
        filterComponent={filterComponent}
        emptyTitle={!redisConnected ? "Redis Monitor Unavailable" : "No Redis Keys Found"}
        emptyDescription={!redisConnected ? "Redis cannot currently be reached. Start Redis to enable live key monitoring." : "No keys stored in Redis memory matching your filter."}
      />

      {/* JSON Viewer Modal for Rule Cache Keys */}
      {selectedKeyForJson && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
          onClick={() => setSelectedKeyForJson(null)}
        >
          <div
            className="bg-white p-6 rounded-2xl max-w-md w-full border border-slate-200 shadow-xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="text-sm font-bold text-slate-900 font-mono">
                {selectedKeyForJson.key}
              </h4>
              <button
                onClick={() => setSelectedKeyForJson(null)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                Close
              </button>
            </div>

            <div>
              <p className="text-xs text-slate-500 mb-2 font-semibold">Cached JSON Payload in Redis:</p>
              <pre className="p-4 bg-slate-900 text-emerald-400 rounded-xl text-xs font-mono overflow-x-auto">
                {JSON.stringify(
                  {
                    maxRequests: selectedKeyForJson.maxRequests,
                    windowValue: selectedKeyForJson.windowValue,
                    windowUnit: selectedKeyForJson.windowUnit,
                    source: selectedKeyForJson.source,
                    cachedAt: selectedKeyForJson.lastUpdated,
                  },
                  null,
                  2
                )}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Flush Single Key Modal */}
      <ConfirmDialog
        isOpen={Boolean(keyToFlush)}
        onClose={() => setKeyToFlush(null)}
        onConfirm={handleFlushSingleKey}
        title="Flush Redis Key"
        description={`Are you sure you want to flush key '${keyToFlush}' from Redis memory?`}
        confirmText="Flush Key"
        variant="warning"
      />

      {/* Flush All Keys Modal */}
      <ConfirmDialog
        isOpen={showFlushAllDialog}
        onClose={() => setShowFlushAllDialog(false)}
        onConfirm={handleFlushAll}
        title="Flush ALL Redis Keys"
        description="Are you sure you want to flush ALL rate limit counters and cached rules from Redis? This action will reset request counts for all active clients."
        confirmText="Flush All Keys"
        variant="danger"
      />
    </>
  );
}
