'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { CalendarClock, FileText } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/components/ui/use-toast';

interface ScriptTableItem {
  id: string;
  topic: string;
  tone: string;
  style?: string;
  lengthMinutes: number;
  chapters: number;
  status: string;
  actualWordCount: number;
  targetWordCount: number;
  updatedAt: string;
  createdAt: string;
}

interface ScriptsTableProps {
  projectId: string;
  scripts: ScriptTableItem[];
}

export function ScriptsTable({ projectId, scripts }: ScriptsTableProps) {
  const router = useRouter();
  const [pending, setPending] = React.useState<string | null>(null);

  const handleDelete = async (scriptId: string) => {
    if (!window.confirm('Delete this script permanently?')) return;
    try {
      const res = await fetch(`/api/scripts/${scriptId}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Failed to delete script');
      }
      toast({ title: 'Script deleted' });
      router.refresh();
    } catch (error) {
      toast({
        title: 'Unable to delete',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    }
  };

  const handleEstimate = async (scriptId: string) => {
    try {
      setPending(scriptId);
      const res = await fetch(`/api/scripts/${scriptId}/estimate`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Failed to recalculate');
      }
      const data = await res.json();
      toast({
        title: 'Word count updated',
        description: `Target ${data.targetWordCount} words, actual ${data.actualWordCount}.`
      });
      router.refresh();
    } catch (error) {
      toast({
        title: 'Unable to update estimate',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Script</TableHead>
            <TableHead>Length</TableHead>
            <TableHead>Chapters</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Word count</TableHead>
            <TableHead>Updated</TableHead>
            <TableHead className="w-[120px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {scripts.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                No scripts yet. Generate one to see it here.
              </TableCell>
            </TableRow>
          )}
          {scripts.map((script) => {
            const delta = script.actualWordCount - script.targetWordCount;
            const withinRange = Math.abs(delta) <= script.targetWordCount * 0.1;
            return (
              <TableRow key={script.id}>
                <TableCell>
                  <div className="space-y-1">
                    <p className="font-medium">{script.topic}</p>
                    <p className="text-xs text-muted-foreground">
                      {script.tone}
                      {script.style ? ` · ${script.style}` : ''}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-sm">
                    <CalendarClock className="h-4 w-4" />
                    {script.lengthMinutes} min
                  </div>
                </TableCell>
                <TableCell>{script.chapters}</TableCell>
                <TableCell>
                  <Badge variant={script.status === 'ready' ? 'secondary' : script.status === 'error' ? 'outline' : 'default'}>
                    {script.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={withinRange ? 'default' : 'outline'}>
                    {script.actualWordCount} / {script.targetWordCount} {delta === 0 ? '' : delta > 0 ? `(+${delta})` : `(${delta})`}
                  </Badge>
                </TableCell>
                <TableCell>{new Date(script.updatedAt).toLocaleString()}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label="More script actions">
                        <FileText className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Script</DropdownMenuLabel>
                      <DropdownMenuItem onSelect={() => router.push(`/projects/${projectId}/scripts/${script.id}`)}>
                        Open
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => handleEstimate(script.id)}
                        disabled={pending === script.id}
                      >
                        {pending === script.id ? 'Recalculating…' : 'Refresh estimate'}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive" onSelect={() => handleDelete(script.id)}>
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
