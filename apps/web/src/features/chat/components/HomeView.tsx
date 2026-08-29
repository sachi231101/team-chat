import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, ArrowRight, AtSign, Award, CheckSquare, Flame, Home, Loader2, MessageSquare, RefreshCw } from 'lucide-react';
import { ActionItemStatus, DailyBriefingData } from '@team-chat/shared';
import { useChatMutations, useWorkspace } from '../../../hooks';
import { chatService } from '../../../services';
import { useUiStore } from '../../../stores';

type Timeframe = 'today' | '24h' | '7d';

export const HomeView: React.FC = () => {
  const [timeframe, setTimeframe] = useState<Timeframe>('24h');
  const { currentUser, notifications } = useWorkspace();
  const { updateActionItem, markNotificationAsRead } = useChatMutations();
  const { setActiveChannel, setActiveRailTab } = useUiStore();
  const briefing = useQuery({
    queryKey: ['dailyBriefing', timeframe],
    queryFn: () => chatService.getDailyBriefing(timeframe),
  });

  const data: DailyBriefingData | undefined = briefing.data;
  const unread = notifications.filter((item) => item.unread);
  const actions = data?.myTasks.filter((item) => item.status !== 'DONE') ?? [];
  const decisions = data?.keyDecisions ?? [];
  const highlights = data?.channelHighlights ?? [];
  const openChannel = (id?: string) => {
    if (id) setActiveChannel(id);
  };
  const toggleAction = (id: string, status: ActionItemStatus) =>
    updateActionItem.mutate({ id, data: { status: status === 'DONE' ? 'TODO' : 'DONE' } });

  return (
    <main className="flex h-full flex-1 flex-col overflow-hidden" style={{ background: 'var(--color-main)' }}>
      <header className="flex min-h-[64px] shrink-0 flex-wrap items-center justify-between gap-3 px-6 py-3" style={{ background: 'var(--color-header)', borderBottom: '1px solid var(--color-border)' }}>
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: 'var(--color-accent-muted)', color: 'var(--color-accent)' }}><Home className="h-5 w-5" /></span>
          <div>
            <h1 className="text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>Your home, {currentUser.name.split(' ')[0]}</h1>
            <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>Outcomes first. Open conversations only when they need you.</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {(['today', '24h', '7d'] as const).map((item) => (
            <button key={item} type="button" onClick={() => setTimeframe(item)} className="rounded-lg px-2.5 py-1.5 text-xs font-semibold" style={{ background: timeframe === item ? 'var(--color-accent-muted)' : 'transparent', color: timeframe === item ? 'var(--color-accent)' : 'var(--color-text-secondary)', border: `1px solid ${timeframe === item ? 'var(--color-active-border)' : 'transparent'}` }}>
              {item === 'today' ? 'Today' : item === '24h' ? '24 hours' : '7 days'}
            </button>
          ))}
          <button type="button" onClick={() => void briefing.refetch()} disabled={briefing.isFetching} className="ml-1 flex h-8 w-8 items-center justify-center rounded-lg hover-surface disabled:opacity-50" style={{ color: 'var(--color-text-secondary)' }} aria-label="Refresh home digest">
            <RefreshCw className={`h-3.5 w-3.5 ${briefing.isFetching ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {briefing.isLoading ? (
          <div className="flex h-full items-center justify-center gap-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}><Loader2 className="h-5 w-5 animate-spin" />Building your outcome digest…</div>
        ) : briefing.isError || !data ? (
          <div className="mx-auto mt-16 max-w-md rounded-xl border p-6 text-center" style={{ borderColor: 'var(--color-border)', background: 'var(--color-elevated)' }}>
            <AlertCircle className="mx-auto h-7 w-7" style={{ color: 'var(--color-danger)' }} />
            <p className="mt-2 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Home digest is unavailable</p>
            <button type="button" onClick={() => void briefing.refetch()} className="mt-3 text-xs font-semibold" style={{ color: 'var(--color-accent)' }}>Try again</button>
          </div>
        ) : (
          <div className="mx-auto max-w-6xl space-y-4">
            <section className="rounded-2xl border p-5" style={{ background: 'var(--color-accent-muted)', borderColor: 'var(--color-active-border)' }}>
              <div className="mb-2 flex items-center gap-2 text-xs font-bold" style={{ color: 'var(--color-accent)' }}><Flame className="h-4 w-4" />Outcome digest<span className="ml-auto font-normal" style={{ color: 'var(--color-text-tertiary)' }}>Updated {new Date(data.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div>
              <p className="text-sm leading-6" style={{ color: 'var(--color-text-primary)' }}>{data.summary}</p>
            </section>
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <Section icon={<AtSign className="h-4 w-4" />} title="Unread & mentions" count={unread.length}>
                {unread.length === 0 ? <Empty text="You’re caught up." /> : unread.slice(0, 5).map((item) => (
                  <button key={item.id} type="button" onClick={() => { markNotificationAsRead.mutate(item.id); if (item.channelId) openChannel(item.channelId); else setActiveRailTab('activity'); }} className="flex w-full items-start gap-3 rounded-lg p-2.5 text-left hover-surface">
                    <MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: 'var(--color-accent)' }} /><span className="min-w-0 flex-1"><b className="block truncate text-xs" style={{ color: 'var(--color-text-primary)' }}>{item.title}</b><span className="mt-0.5 block line-clamp-1 text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>{item.body}</span></span>
                  </button>
                ))}
                {unread.length > 0 && <button type="button" onClick={() => setActiveRailTab('activity')} className="mt-1 flex w-full items-center justify-center gap-1 rounded-lg py-2 text-[11px] font-semibold hover-surface" style={{ color: 'var(--color-accent)' }}>View all activity<ArrowRight className="h-3 w-3" /></button>}
              </Section>
              <Section icon={<Flame className="h-4 w-4" />} title="Highlights" count={highlights.length}>
                {highlights.length === 0 ? <Empty text="No new channel highlights." /> : highlights.slice(0, 5).map((item, index) => (
                  <button key={`${item.channelId}-${index}`} type="button" onClick={() => openChannel(item.channelId)} className="w-full rounded-lg p-2.5 text-left hover-surface"><b className="text-[11px]" style={{ color: 'var(--color-accent)' }}>#{item.channelName}</b><span className="mt-0.5 block text-xs leading-5" style={{ color: 'var(--color-text-secondary)' }}>{item.highlight}</span></button>
                ))}
              </Section>
              <Section icon={<CheckSquare className="h-4 w-4" />} title="Open actions" count={actions.length}>
                {actions.length === 0 ? <Empty text="No open actions assigned to you." /> : actions.slice(0, 5).map((item) => (
                  <div key={item.id} className="flex items-start gap-2.5 rounded-lg p-2.5 hover-surface"><button type="button" onClick={() => toggleAction(item.id, item.status)} style={{ color: 'var(--color-text-tertiary)' }} aria-label={`Complete ${item.title}`}><CheckSquare className="h-4 w-4" /></button><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>{item.title}</p><p className="mt-0.5 text-[10px]" style={{ color: item.isOverdue ? 'var(--color-danger)' : 'var(--color-text-tertiary)' }}>#{item.channelName}{item.dueDate ? ` · Due ${new Date(item.dueDate).toLocaleDateString()}` : ''}</p></div></div>
                ))}
              </Section>
              <Section icon={<Award className="h-4 w-4" />} title="Recent decisions" count={decisions.length}>
                {decisions.length === 0 ? <Empty text="No decisions recorded in this period." /> : decisions.slice(0, 5).map((item) => (
                  <div key={item.id} className="rounded-lg p-2.5"><div className="flex justify-between gap-2"><b className="text-xs" style={{ color: 'var(--color-text-primary)' }}>{item.title}</b><span className="shrink-0 text-[10px]" style={{ color: 'var(--color-accent)' }}>#{item.channelName}</span></div>{item.rationale && <p className="mt-1 line-clamp-2 text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>{item.rationale}</p>}</div>
                ))}
              </Section>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

const Section: React.FC<{ icon: React.ReactNode; title: string; count: number; children: React.ReactNode }> = ({ icon, title, count, children }) => (
  <section className="overflow-hidden rounded-2xl border" style={{ background: 'var(--color-elevated)', borderColor: 'var(--color-border)' }}><div className="flex items-center gap-2 border-b px-4 py-3" style={{ borderColor: 'var(--color-border-subtle)', color: 'var(--color-accent)' }}>{icon}<h2 className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>{title}</h2><span className="ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: 'var(--color-input)', color: 'var(--color-text-secondary)' }}>{count}</span></div><div className="p-2">{children}</div></section>
);
const Empty: React.FC<{ text: string }> = ({ text }) => <p className="px-3 py-6 text-center text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{text}</p>;
