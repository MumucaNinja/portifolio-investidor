import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  BarChart3, 
  Globe, 
  Shield, 
  ArrowRight,
  Loader2 
} from "lucide-react";

const features = [
  {
    icon: TrendingUp,
    title: "Dados em Tempo Real",
    description: "Integração direta com a B3 e Cripto via Brapi.",
  },
  {
    icon: BarChart3,
    title: "Análises Profissionais",
    description: "Gráficos de setores, dividendos e KPIs avançados.",
  },
  {
    icon: Globe,
    title: "Visão de Mercado",
    description: "Widgets do TradingView para acompanhar o mundo.",
  },
  {
    icon: Shield,
    title: "Privacidade Total",
    description: "Seus dados são seus. Segurança via Supabase.",
  },
];

export default function Index() {
  const { user, isLoading } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary to-emerald-500">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-foreground">PortfolioTracker</span>
          </Link>

          <div className="flex items-center gap-3">
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : user ? (
              <Button asChild className="bg-gradient-to-r from-primary to-emerald-500 hover:from-primary/90 hover:to-emerald-500/90">
                <Link to="/dashboard">
                  Ir para o Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild className="text-muted-foreground hover:text-foreground">
                  <Link to="/auth">Entrar</Link>
                </Button>
                <Button asChild className="bg-gradient-to-r from-primary to-emerald-500 hover:from-primary/90 hover:to-emerald-500/90">
                  <Link to="/auth?mode=signup">Criar Conta</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto max-w-5xl relative z-10">
          <div className="text-center space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold text-foreground leading-tight">
              Domine Seu Portfólio de{" "}
              <span className="bg-gradient-to-r from-primary to-emerald-500 bg-clip-text text-transparent">
                Investimentos
              </span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Acompanhe ações, FIIs e criptomoedas em tempo real. Gestão profissional, simples e privada.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button 
                asChild 
                size="lg" 
                className="bg-gradient-to-r from-primary to-emerald-500 hover:from-primary/90 hover:to-emerald-500/90 text-lg px-8 py-6"
              >
                <Link to="/auth">
                  Acessar Plataforma
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Hero Visual - Glassmorphism Card Mock */}
          <div className="mt-16 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/30 to-emerald-500/30 rounded-2xl blur-2xl" />
            <div className="relative glass-card rounded-2xl p-6 md:p-8 border border-border/50">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {/* Mock Stats */}
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Valor Total</p>
                  <p className="text-xl md:text-2xl font-bold text-foreground">R$ 125.430</p>
                  <p className="text-xs text-gain">+12.5%</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Retorno Mensal</p>
                  <p className="text-xl md:text-2xl font-bold text-gain">+R$ 3.240</p>
                  <p className="text-xs text-muted-foreground">Este mês</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Dividendos</p>
                  <p className="text-xl md:text-2xl font-bold text-foreground">R$ 890</p>
                  <p className="text-xs text-muted-foreground">Recebidos</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Ativos</p>
                  <p className="text-xl md:text-2xl font-bold text-foreground">24</p>
                  <p className="text-xs text-muted-foreground">Em carteira</p>
                </div>
              </div>
              
              {/* Mock Chart */}
              <div className="mt-6 h-32 md:h-48 flex items-end gap-1 md:gap-2">
                {[40, 55, 45, 60, 50, 70, 65, 80, 75, 90, 85, 95].map((height, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t bg-gradient-to-t from-primary to-emerald-500 opacity-80"
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-secondary/30">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Tudo que você precisa
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Ferramentas profissionais para gerenciar seus investimentos com simplicidade.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="glass-card-hover rounded-xl p-6 group"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-emerald-500/20 group-hover:from-primary/30 group-hover:to-emerald-500/30 transition-colors">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-3xl text-center">
          <div className="glass-card rounded-2xl p-8 md:p-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-emerald-500/10" />
            <div className="relative z-10">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                Pronto para começar?
              </h2>
              <p className="text-muted-foreground mb-6">
                Crie sua conta gratuitamente e comece a rastrear seus investimentos hoje.
              </p>
              <Button 
                asChild 
                size="lg" 
                className="bg-gradient-to-r from-primary to-emerald-500 hover:from-primary/90 hover:to-emerald-500/90"
              >
                <Link to="/auth?mode=signup">
                  Criar Conta Grátis
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border/50">
        <div className="container mx-auto max-w-5xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary to-emerald-500">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-medium text-foreground">PortfolioTracker</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
