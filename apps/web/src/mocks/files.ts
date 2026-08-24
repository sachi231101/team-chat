import { Attachment } from '@team-chat/shared';

export interface SharedFileItem extends Attachment {
  uploadedBy: string;
  channelId?: string;
  downloadCount: number;
}

export const MOCK_FILES: SharedFileItem[] = [
  {
    id: 'file-1',
    name: 'team-chat-dark-theme-spec.png',
    size: 1024 * 720,
    type: 'image/png',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
    previewUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
    uploadedBy: 'Priya Patel',
    channelId: 'chn-general',
    downloadCount: 14,
    createdAt: '2026-01-04T09:15:00.000Z',
  },
  {
    id: 'file-2',
    name: 'architecture-diagram-v1.pdf',
    size: 2048 * 1024,
    type: 'application/pdf',
    url: '#',
    uploadedBy: 'Arjun Mehta',
    channelId: 'chn-engineering',
    downloadCount: 28,
    createdAt: '2026-01-03T14:30:00.000Z',
  },
  {
    id: 'file-3',
    name: 'product-launch-deck-q3.key',
    size: 5120 * 1024,
    type: 'application/presentation',
    url: '#',
    uploadedBy: 'Ananya Iyer',
    channelId: 'chn-marketing',
    downloadCount: 9,
    createdAt: '2026-01-02T16:00:00.000Z',
  },
  {
    id: 'file-4',
    name: 'docker-compose-production-spec.yml',
    size: 4 * 1024,
    type: 'text/yaml',
    url: '#',
    uploadedBy: 'Sachin Verma',
    channelId: 'chn-engineering',
    downloadCount: 35,
    createdAt: '2026-01-01T11:00:00.000Z',
  },
];
