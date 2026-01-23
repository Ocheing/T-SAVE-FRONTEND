import { ArrowRight, Shield, TrendingUp, Zap } from "lucide-react";
import HeroCarousel from "@/components/HeroCarousel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const Home = () => {
  const { t } = useTranslation();

  const features = [
    {
      icon: Shield,
      title: t('home.secureSavings'),
      description: t('home.secureSavingsDesc')
    },
    {
      icon: TrendingUp,
      title: t('home.trackProgress'),
      description: t('home.trackProgressDesc')
    },
    {
      icon: Zap,
      title: t('home.quickSetup'),
      description: t('home.quickSetupDesc')
    }
  ];

  return (
    <div className="min-h-screen">
      <section className="container mx-auto px-4 py-12">
        <HeroCarousel />
      </section>

      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-4xl font-bold mb-4">{t('home.heroTitle')}</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('home.heroSubtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="p-8 hover:shadow-[var(--shadow-elegant)] transition-all duration-300 hover:-translate-y-2 animate-scale-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="mb-4 inline-flex p-4 rounded-2xl bg-primary">
                <feature.icon className="h-8 w-8 text-primary-foreground" />
              </div>
              <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="py-20 bg-primary">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto animate-fade-in">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              {t('home.readyToStart')}
            </h2>
            <p className="text-xl text-white/90 mb-8">
              {t('home.joinThousands')}
            </p>
            <Link to="/auth">
              <Button variant="secondary" size="lg" className="text-lg">
                {t('home.createFreeAccount')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
