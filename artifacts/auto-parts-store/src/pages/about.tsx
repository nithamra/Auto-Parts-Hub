import { motion } from "framer-motion";
import { Link } from "wouter";
import { Shield, Award, Users, MapPin, Wrench, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/language-context";

const milestones = [
  { year: "1984", en: "Founded by the Al-Rashidi family in Olaya District, Riyadh — a small shop with a big vision: to be the trusted source for American vehicle parts in the Kingdom.", ar: "تأسست المجموعة على يد عائلة الراشدي في حي العليا بالرياض — بدأت بمحل صغير برؤية كبيرة: أن تكون المصدر الموثوق لقطع غيار السيارات الأمريكية في المملكة." },
  { year: "1992", en: "Expanded the Olaya branch and launched a dedicated workshop for Ford and Chevrolet vehicles.", ar: "توسعنا في فرع العليا وافتتحنا ورشة متخصصة لمركبات فورد وشيفروليه." },
  { year: "2003", en: "Opened our second location in the Al-Malaz district to serve the growing east-side customer base.", ar: "افتتحنا فرعنا الثاني في حي الملز لخدمة قاعدة العملاء المتنامية في الشرق." },
  { year: "2010", en: "Became an authorized distributor for OEM parts from Ford Motor Company and General Motors.", ar: "أصبحنا موزعاً معتمداً لقطع غيار OEM من شركة فورد وجنرال موتورز." },
  { year: "2018", en: "Launched our online catalog, bringing 10,000+ parts to customers across Saudi Arabia.", ar: "أطلقنا كتالوجنا الإلكتروني، مما أتاح أكثر من 10,000 قطعة غيار للعملاء في جميع أنحاء المملكة العربية السعودية." },
  { year: "2024", en: "Celebrating 40 years of serving Saudi drivers — stronger, wider, and more trusted than ever.", ar: "الاحتفال بـ 40 عاماً من خدمة قائدي السيارات في المملكة — أقوى وأوسع وأكثر ثقة من أي وقت مضى." },
];

const values = [
  { icon: Shield, en: "Authenticity", ar: "الأصالة", descEn: "Every part we sell is genuine OEM or certified aftermarket — no counterfeits, ever.", descAr: "كل قطعة نبيعها أصلية OEM أو معتمدة — لا تقليد أبداً." },
  { icon: Award, en: "Quality", ar: "الجودة", descEn: "We stand behind every product with a full return and warranty guarantee.", descAr: "نضمن كل منتج بضمان كامل وسياسة إرجاع واضحة." },
  { icon: Users, en: "Service", ar: "الخدمة", descEn: "Our expert team speaks your language — technical advice from real gearheads.", descAr: "فريقنا المتخصص يتحدث لغتك — نصائح تقنية من خبراء حقيقيين." },
  { icon: Wrench, en: "Expertise", ar: "الخبرة", descEn: "40+ years specializing exclusively in American vehicles: Ford, Chevy, GMC, Jeep.", descAr: "أكثر من 40 عاماً متخصصاً حصرياً في السيارات الأمريكية: فورد وشيفروليه وجي إم سي وجيب." },
];

export default function AboutPage() {
  const t = useT();
  const isAr = t.nav.catalog === "الكتالوج";

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative min-h-[50vh] flex items-center justify-center overflow-hidden bg-zinc-900 border-b-4 border-primary">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?q=80&w=2000&auto=format&fit=crop"
            alt="Auto parts workshop"
            className="w-full h-full object-cover opacity-20 grayscale"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/80 to-transparent" />
        </div>
        <div className="relative z-10 container mx-auto px-4 text-center py-24">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/40 bg-primary/10 text-primary mb-6">
              <Clock className="w-4 h-4" />
              <span className="font-display tracking-widest text-xs uppercase font-bold">
                {isAr ? "أكثر من 40 عاماً في الرياض" : "40+ Years in Riyadh"}
              </span>
            </div>
            <h1 className="text-5xl md:text-7xl font-display font-extrabold uppercase tracking-tighter text-white mb-6">
              {isAr ? "من نحن" : "Our"} <span className="text-primary">{isAr ? "" : "Story"}</span>
            </h1>
            <p className="text-xl text-zinc-300 max-w-2xl mx-auto leading-relaxed">
              {isAr
                ? "منذ عام 1984، كنا الاسم الموثوق لقطع غيار السيارات الأمريكية في الرياض. مؤسسة عائلية، بنيت على الثقة والجودة والخبرة."
                : "Since 1984, we have been the trusted name for American auto parts in Riyadh. A family business built on trust, quality, and expertise."}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-primary py-12 border-b-4 border-primary/80">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
            {[
              { num: "40+", labelEn: "Years in Business", labelAr: "عاماً في الخدمة" },
              { num: "2", labelEn: "Riyadh Locations", labelAr: "فرع في الرياض" },
              { num: "10K+", labelEn: "Parts in Stock", labelAr: "قطعة في المخزون" },
              { num: "50K+", labelEn: "Happy Customers", labelAr: "عميل راضٍ" },
            ].map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <div className="text-4xl md:text-5xl font-display font-extrabold">{s.num}</div>
                <div className="mt-2 text-white/80 font-sans text-sm">{isAr ? s.labelAr : s.labelEn}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <h2 className="text-4xl font-display font-bold uppercase tracking-wider mb-2">
                {isAr ? "قصتنا" : "The"} <span className="text-primary">{isAr ? "" : "Story"}</span>
              </h2>
              <div className="h-1 w-16 bg-primary mb-6" />
              <div className="space-y-4 text-muted-foreground leading-relaxed text-base">
                {isAr ? (
                  <>
                    <p>بدأت رحلتنا عام 1984 حين فتحت عائلة الراشدي أبواب أول محل متخصص في قطع غيار السيارات الأمريكية في الرياض. في تلك الحقبة، كانت سيارات فورد وشيفروليه وجي إم سي وجيب تملأ شوارع المملكة، لكن قطع الغيار الأصلية كانت شحيحة وصعبة المنال.</p>
                    <p>أدركنا الفرصة وبنينا شبكة موردين مباشرة مع المصنّعين الأمريكيين، مما أتاح للسائق السعودي الحصول على قطع أصلية بسعر عادل وفي وقت قياسي.</p>
                    <p>اليوم، بعد أربعة عقود من الخبرة والثقة، نفتخر بخدمة أكثر من 50,000 عميل عبر فرعينا في الرياض، مع كتالوج إلكتروني يضم أكثر من 10,000 قطعة غيار.</p>
                  </>
                ) : (
                  <>
                    <p>Our journey began in 1984 when the Al-Rashidi family opened Riyadh's first shop dedicated entirely to American vehicle parts. At the time, Ford, Chevrolet, GMC, and Jeep trucks and SUVs were everywhere on Saudi roads — but genuine parts were hard to find.</p>
                    <p>We saw the gap and built direct relationships with American manufacturers, giving Saudi drivers access to authentic OEM and premium aftermarket parts at fair prices, fast.</p>
                    <p>Four decades later, we have served more than 50,000 customers across two Riyadh locations, backed by an online catalog of 10,000+ parts and a team that lives and breathes American vehicles.</p>
                  </>
                )}
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="relative h-[400px] rounded-sm overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1530046339160-ce3e530c7d2f?q=80&w=800&auto=format&fit=crop"
                alt="Auto parts store"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                <p className="text-white font-display font-bold text-lg uppercase tracking-wider">
                  {isAr ? "فرع العليا — منذ 1984" : "Olaya Branch — Since 1984"}
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 bg-zinc-900/50 border-y border-border">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-display font-bold uppercase tracking-wider">
              {isAr ? "مسيرة" : "Our"} <span className="text-primary">{isAr ? "أربعة عقود" : "40 Years"}</span>
            </h2>
            <div className="h-1 w-16 bg-primary mt-4 mx-auto" />
          </div>
          <div className="relative">
            <div className="absolute start-1/2 top-0 bottom-0 w-px bg-border -translate-x-1/2 hidden md:block" />
            <div className="space-y-10">
              {milestones.map((m, i) => (
                <motion.div
                  key={m.year}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className={`flex flex-col md:flex-row gap-6 items-center ${i % 2 === 1 ? "md:flex-row-reverse" : ""}`}
                >
                  <div className="flex-1 md:text-end" style={i % 2 === 1 ? { textAlign: "start" } : {}}>
                    <div className="bg-card border border-border rounded-sm p-5">
                      <p className="text-xs text-muted-foreground mb-2 font-mono">{m.year}</p>
                      <p className="text-sm leading-relaxed">{isAr ? m.ar : m.en}</p>
                    </div>
                  </div>
                  <div className="hidden md:flex w-10 h-10 rounded-full bg-primary items-center justify-center shrink-0 z-10 font-display font-bold text-white text-xs border-4 border-background">
                    {m.year.slice(2)}
                  </div>
                  <div className="flex-1 hidden md:block" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-display font-bold uppercase tracking-wider">
              {isAr ? "قيمنا" : "Our"} <span className="text-primary">{isAr ? "" : "Values"}</span>
            </h2>
            <div className="h-1 w-16 bg-primary mt-4 mx-auto" />
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <div className="bg-card border border-border rounded-sm p-6 h-full hover:border-primary transition-colors group">
                  <div className="w-12 h-12 rounded-sm bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <v.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-display font-bold text-lg uppercase tracking-wider mb-2">
                    {isAr ? v.ar : v.en}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {isAr ? v.descAr : v.descEn}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-display font-bold uppercase tracking-wider mb-4">
            {isAr ? "تعال وزرنا اليوم" : "Come See Us Today"}
          </h2>
          <p className="text-white/80 mb-8 text-lg max-w-xl mx-auto">
            {isAr
              ? "فرعانا في الرياض مفتوحان لاستقبالك. فريقنا جاهز لمساعدتك في إيجاد القطعة المناسبة."
              : "Both our Riyadh locations are ready to welcome you. Our team is on hand to help you find the right part."}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact">
              <Button size="lg" variant="secondary" className="h-14 px-10 text-lg">
                <MapPin className="me-2 w-5 h-5" />
                {isAr ? "عرض المواقع على الخريطة" : "View Store Locations"}
              </Button>
            </Link>
            <Link href="/catalog">
              <Button size="lg" variant="outline" className="h-14 px-10 text-lg border-white text-white hover:bg-white hover:text-primary">
                {isAr ? "تسوق الكتالوج" : "Shop the Catalog"}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
