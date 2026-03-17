// Mock data simulating Firebase Realtime Database structure
export const mockEstacao = {
  comandos: {
    status: "parado" as "parado" | "carregando",
    timestamp: Date.now(),
    usuario: "cliente_123",
  },
  sensores: {
    deteccao: true,
    altura_atual: 45,
    eficiencia: 92,
  },
  energia: {
    potencia: 7200,
    kwh_fornecido: 2.5,
    tensao_bateria: 12.4,
  },
};

export const mockHistorico = [
  { id: "s001", inicio: Date.now() - 86400000 * 1, kwh: 5.2, custo: 4.63, usuario: "cliente_123" },
  { id: "s002", inicio: Date.now() - 86400000 * 2, kwh: 3.8, custo: 3.38, usuario: "cliente_123" },
  { id: "s003", inicio: Date.now() - 86400000 * 3, kwh: 6.1, custo: 5.43, usuario: "cliente_123" },
  { id: "s004", inicio: Date.now() - 86400000 * 5, kwh: 4.5, custo: 4.01, usuario: "cliente_123" },
  { id: "s005", inicio: Date.now() - 86400000 * 6, kwh: 7.0, custo: 6.23, usuario: "cliente_123" },
];

export const mockPosto = {
  config: {
    preco_kwh: 0.89,
    cashback_percent: 5,
  },
  faturamento: {
    hoje: 156.70,
    semana: 892.45,
  },
};

export const mockConsumoSemanal = [
  { dia: "Seg", kwh: 5.2 },
  { dia: "Ter", kwh: 3.8 },
  { dia: "Qua", kwh: 6.1 },
  { dia: "Qui", kwh: 0 },
  { dia: "Sex", kwh: 4.5 },
  { dia: "Sáb", kwh: 7.0 },
  { dia: "Dom", kwh: 2.3 },
];

export const mockAbastecimentosHora = Array.from({ length: 24 }, (_, i) => ({
  hora: `${i.toString().padStart(2, "0")}:00`,
  abastecimentos: Math.floor(Math.random() * 8),
}));

export const mockFaturamentoDia = [
  { dia: "Seg", valor: 125.4 },
  { dia: "Ter", valor: 98.2 },
  { dia: "Qua", valor: 156.7 },
  { dia: "Qui", valor: 134.5 },
  { dia: "Sex", valor: 189.3 },
  { dia: "Sáb", valor: 210.8 },
  { dia: "Dom", valor: 78.5 },
];

export const mockPagamentos = [
  { name: "Créditos", value: 65 },
  { name: "Dinheiro", value: 35 },
];

export const mockAbastecimentosRealtime = [
  { id: 1, horario: "14:32", cliente: "Cliente #127", kwh: 3.2, valor: 2.85, status: "Em andamento" as const },
  { id: 2, horario: "14:15", cliente: "Cliente #089", kwh: 5.8, valor: 5.16, status: "Concluído" as const },
  { id: 3, horario: "13:48", cliente: "Cliente #203", kwh: 4.1, valor: 3.65, status: "Concluído" as const },
  { id: 4, horario: "13:20", cliente: "Cliente #156", kwh: 6.3, valor: 5.61, status: "Concluído" as const },
  { id: 5, horario: "12:55", cliente: "Cliente #078", kwh: 2.9, valor: 2.58, status: "Concluído" as const },
];
