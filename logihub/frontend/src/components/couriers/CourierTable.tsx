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

interface CourierTableProps {
  couriers?: User[];
  onEdit?: (user: User) => void;
}

export function CourierTable({ couriers = [], onEdit }: CourierTableProps) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
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
          {couriers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                Нет данных о курьерах
              </TableCell>
            </TableRow>
          ) : (
            couriers.map((c) => (
              <TableRow key={c.id} className="hover:bg-muted/50 transition-colors">
                <TableCell className="font-medium text-ocean">{c.name}</TableCell>
                <TableCell className="text-ocean">{c.tg_id ?? "—"}</TableCell>
                <TableCell className="text-ocean">{c.phone ?? "—"}</TableCell>
                <TableCell>
                  {c.is_active ? (
                    <Badge className="bg-ocean text-cream hover:bg-ocean/90 border-none font-medium">
                      Активен
                    </Badge>
                  ) : (
                    <Badge className="bg-beige text-ocean hover:bg-beige/90 border-none font-medium">
                      Отключён
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-ocean hover:bg-beige/50"
                    onClick={() => onEdit?.(c)}
                  >
                    Изменить
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
