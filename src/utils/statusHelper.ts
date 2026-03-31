export function getStatusConfig(status: string | null) {
  if (status === "COMPLETED") {
    return { label: "CONCLUÍDO", statusClass: "completed" };
  }

  if (status === "CANCELLED") {
    return { label: "CANCELADO", statusClass: "cancelled" };
  }

  if (status === "IN_PROGRESS") {
    return { label: "EM ANDAMENTO", statusClass: "inProgress" };
  }

  return { label: "PENDENTE", statusClass: "pending" };
}
