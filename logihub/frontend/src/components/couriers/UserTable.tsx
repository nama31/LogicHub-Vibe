"use client";

import type { User } from "@/types/user";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";

interface UserTableProps {
  users?: User[];
  onEdit?: (user: User) => void;
  onDelete?: (id: string) => void;
}

export function UserTable({ users = [], onEdit, onDelete }: UserTableProps) {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="font-semibold text-ocean">Имя</TableHead>
            <TableHead className="font-semibold text-ocean">Telegram ID</TableHead>
            <TableHead className="font-semibold text-ocean">Телефон</TableHead>
            <TableHead className="font-semibold text-ocean">Статус</TableHead>
            <TableHead className="text-right font-semibold text-ocean">Действия</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                Нет данных
              </TableCell>
            </TableRow>
          ) : (
            users.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium text-ocean">{u.name}</TableCell>
                <TableCell className="text-ocean">{u.tg_id ?? "—"}</TableCell>
                <TableCell className="text-ocean">{u.phone ?? "—"}</TableCell>
                <TableCell>
                  {u.is_active ? (
                    <Badge className="border-ocean bg-ocean text-cream hover:bg-ocean/90 font-medium">
                      Активен
                    </Badge>
                  ) : (
                    <Badge className="border-beige bg-beige text-ocean hover:bg-beige/90 font-medium">
                      Отключён
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-ocean"
                      onClick={() => onEdit?.(u)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-ocean hover:bg-ocean/10"
                      onClick={() => onDelete?.(u.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
