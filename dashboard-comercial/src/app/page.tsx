import { ComercialDashboard } from "@/components/comercial/comercial-dashboard";

export default function Home() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Departamento <span className="text-accent">Comercial</span>
        </h1>
        <p className="text-muted mt-1">
          Desempenho do time de vendas — funil, gargalos, origens e atividades
        </p>
      </header>

      <ComercialDashboard />
    </div>
  );
}
