// GET /orders/:id → order detail
// order_status_log → StatusTimeline
// POST /orders/:id/assign → AssignModal

interface Props {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params;
  return (
    <div>
      <h1>Заказ #{id}</h1>
      {/* <StatusTimeline orderId={id} /> */}
      {/* <AssignModal orderId={id} /> */}
    </div>
  );
}
