// Lista simples de treinamentos, alimentada manualmente (sem feed automático).
import type { TrainingCourse } from "@/components/portal-communications";

export const trainingsData: TrainingCourse[] = [
  { curso: "Videomonitoramento com IA — DSS Pro", fabricante: "Dahua Academy", data_inicio: "2026-11-10", data_fim: "2026-11-12", hora_inicio: "09:00", hora_fim: "12:00", modalidade: "Online ao vivo", gratuito: true, setor: "Monitoramento", link_inscricao: "#" },
  { curso: "Instalação de câmeras AcuSense", fabricante: "Hikvision eLearning", data_inicio: "2026-11-18", data_fim: "2026-11-18", hora_inicio: "14:00", hora_fim: "17:00", modalidade: "Online", gratuito: true, setor: "Técnico", link_inscricao: "#" },
  { curso: "Centrais de alarme AMT 8000", fabricante: "Intelbras", data_inicio: "2026-12-02", data_fim: "2026-12-03", hora_inicio: "08:30", hora_fim: "17:30", modalidade: "Presencial", gratuito: false, setor: "Técnico", link_inscricao: "#" },
];
