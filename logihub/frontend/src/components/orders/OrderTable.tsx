"use client";

import type { Order } from "@/types/order";
import { STATUS_LABELS_RU } from "@/lib/constants";
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
import { useRouter } from "next/navigation";

interface OrderTableProps {
  orders?: Order[];
  onAssign?: (order: Order) => void;
}

export function OrderTable({ orders = [], onAssign }: OrderTableProps) {
  const router = useRouter();

  const getStatusBadge = (status: Order["status"]) => {
    switch (status) {
      case "new":
        return <Badge className="bg-beige text-ocean hover:bg-beige/90 border-none font-medium">{STATUS_LABELS_RU[status]}</Badge>;
      case "assigned":
      case "in_transit":
        return <Badge className="bg-ocean text-cream hover:bg-ocean/90 border-none font-medium">{STATUS_LABELS_RU[status]}</Badge>;
      case "delivered":
        return <Badge className="bg-muted text-muted-foreground hover:bg-muted/90 border-none font-medium">{STATUS_LABELS_RU[status]}</Badge>;
      case "failed":
        return <Badge className="bg-destructive/10 text-destructive hover:bg-destructive/20 border-none font-medium">{STATUS_LABELS_RU[status]}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="font-semibold text-ocean">ID</TableHead>
            <TableHead className="font-semibold text-ocean">Товар</TableHead>
            <TableHead className="font-semibold text-ocean">Курьер</TableHead>
            <TableHead className="font-semibold text-ocean">Статус</TableHead>
            <TableHead className="font-semibold text-ocean">Адрес</TableHead>
            <TableHead className="font-semibold text-ocean text-right">Прибыль</TableHead>
            <TableHead className="font-semibold text-ocean text-right">Действия</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                Нет заказов
              </TableCell>
            </TableRow>
          ) : (
            orders.map((o) => (
              <TableRow key={o.id} className="hover:bg-muted/50 transition-colors">
                <TableCell className="font-medium text-ocean font-mono text-xs" title={String(o.id)}>
                  {o.id}
                </TableCell>
                <TableCell className="text-ocean">{o.product?.title}</TableCell>
                <TableCell className="text-ocean">
                  {o.courier?.name ?? <span className="text-muted-foreground italic">Не назначен</span>}
                </TableCell>
                <TableCell>{getStatusBadge(o.status)}</TableCell>
                <TableCell className="text-ocean truncate max-w-[150px]" title={o.delivery_address}>
                  {o.delivery_address}
                </TableCell>
                <TableCell className="text-right text-ocean font-medium whitespace-nowrap">
                  {o.net_profit_som !== undefined && o.net_profit_som !== null ? `${o.net_profit_som} сом` : "—"}
                </TableCell>
                <TableCell className="text-right space-x-2 whitespace-nowrap">
                  {(o.status === "new" || o.status === "assigned") && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-ocean hover:bg-beige/50"
                      onClick={() => onAssign?.(o)}
                    >
                      {o.courier ? "Переназначить" : "Назначить"}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-ocean hover:bg-beige/50"
                    onClick={() => router.push(`/orders/${o.id}`)}
                  >
                    Детали
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
