"use client";

// POST /orders/:id/assign { courier_id }
// Opens a dialog with a courier picker (GET /users?role=courier)

interface AssignModalProps {
  orderId: string;
  isOpen: boolean;
  onClose: () => void;
  onAssigned?: () => void;
}

export function AssignModal({ orderId, isOpen, onClose, onAssigned }: AssignModalProps) {
  if (!isOpen) return null;

  return (
    <dialog open aria-label="Назначить курьера">
      <h2>Назначить курьера на заказ #{orderId}</h2>
      {/* TODO: courier select from GET /users?role=courier */}
      <button onClick={onClose}>Отмена</button>
      <button
        onClick={() => {
          // TODO: call POST /orders/:orderId/assign
          onAssigned?.();
          onClose();
        }}
      >
        Назначить
      </button>
    </dialog>
  );
}
