export const generateId = () => Math.random().toString(36).substr(2, 9);

export const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("ko-KR").format(amount) + "원";

export const formatDate = (dateString: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
};
