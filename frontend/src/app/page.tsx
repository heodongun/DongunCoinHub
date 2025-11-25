import Link from 'next/link';
import { ArrowRight, TrendingUp, ShieldCheck, Wallet } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-5rem)]">
      {/* Hero Section */}
      <section className="relative flex-1 flex items-center justify-center overflow-hidden py-20 lg:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 dark:from-blue-900/40 dark:via-purple-900/40 dark:to-pink-900/40 -z-10" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] -z-10 opacity-50" />

        <div className="container px-4 md:px-6 text-center">
          <div className="animate-float mb-8 inline-block">
            <span className="px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20 backdrop-blur-sm">
              🚀 차세대 가상 화폐 거래 플랫폼
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-blue-800 to-gray-900 dark:from-white dark:via-blue-200 dark:to-white mb-6">
            DongunCoin Hub
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground max-w-[600px] mx-auto mb-10">
            리스크 없는 가상 거래로 실력을 키우고,<br className="hidden md:block" />
            실제 블록체인 NFT로 가치를 소유하세요.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/register"
              className="group relative px-8 py-4 bg-primary text-primary-foreground rounded-xl font-bold text-lg shadow-lg hover:shadow-primary/50 transition-all hover:-translate-y-1 overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              <span className="relative flex items-center gap-2">
                무료로 시작하기 <ArrowRight className="w-5 h-5" />
              </span>
            </Link>
            <Link
              href="/login"
              className="px-8 py-4 bg-background border border-input hover:bg-accent hover:text-accent-foreground rounded-xl font-bold text-lg transition-all hover:-translate-y-1"
            >
              로그인
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/50 dark:bg-muted/10">
        <div className="container px-4 md:px-6">
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<TrendingUp className="w-10 h-10 text-blue-500" />}
              title="실전 같은 가상 거래"
              description="실제 시장 데이터를 기반으로 한 모의 투자로 트레이딩 감각을 익히세요."
            />
            <FeatureCard
              icon={<ShieldCheck className="w-10 h-10 text-purple-500" />}
              title="안전한 자산 관리"
              description="모든 거래 기록과 자산은 안전하게 보호되며 언제든 확인 가능합니다."
            />
            <FeatureCard
              icon={<Wallet className="w-10 h-10 text-pink-500" />}
              title="Real NFT 소유"
              description="가상 수익으로 실제 블록체인 상의 유니크한 NFT를 구매하고 소유하세요."
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="group p-8 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-2">
      <div className="mb-6 p-4 rounded-xl bg-primary/5 w-fit group-hover:bg-primary/10 transition-colors">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">
        {description}
      </p>
    </div>
  );
}
