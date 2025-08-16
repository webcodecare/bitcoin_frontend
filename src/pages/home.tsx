import Banner from "@/components/Banner/Banner";
import Features from "@/components/Features/Features";
import Choose from "@/components/Choose/Choose";
import TradingCarousel from "@/components/carousel/carousel";
import WeeklySignalChartSimple from "@/components/charts/WeeklySignalChartSimple";
import BuySellSignalChart from "@/components/charts/BuySellSignalChart";
import CTASection from "@/components/CTASection/CTASection";
import Footer from "@/components/layout/Footer";
import Navigation from "@/components/layout/Navigation";
import LiveMarketData from "@/components/LiveMarketData/LiveMarketData";
import { TestimonialSection } from "@/components/testimonial-section";
import Pricing from "@/components/Pricing/Pricing";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <Banner />
      <Choose />
      <Features />
      <Pricing />
      <TradingCarousel />
      <TestimonialSection />
      <LiveMarketData />
      
      {/* Weekly Buy/Sell Signals - Past 2 Years */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3 sm:mb-4 lg:mb-6 text-white leading-tight">
              Weekly Buy/Sell Signals - Past 2 Years
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-slate-300 dark:text-slate-400 max-w-xl lg:max-w-2xl mx-auto leading-relaxed">
              Track our proven performance with real trading signals from professional analysts
            </p>
            <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-6 mt-6 sm:mt-8">
              <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-slate-800 dark:bg-slate-800 border border-slate-700">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-sm text-slate-300">Live Data</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-slate-800 dark:bg-slate-800 border border-slate-700">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-sm text-slate-300">Real Signals</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-slate-800 dark:bg-slate-800 border border-slate-700">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <span className="text-sm text-slate-300">Proven Performance</span>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-transparent to-green-500/10 rounded-2xl"></div>
            <div className="relative bg-slate-800/50 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-4 sm:p-6 lg:p-8">
              <WeeklySignalChartSimple />
            </div>
          </div>
        </div>
      </section>

      {/* Buy/Sell Signal Chart */}
      <section className="py-16 bg-slate-800 dark:bg-slate-900">
        <div className="container mx-auto px-4">
          <BuySellSignalChart />
        </div>
      </section>
      
      <CTASection />
      <Footer />
    </div>
  );
}