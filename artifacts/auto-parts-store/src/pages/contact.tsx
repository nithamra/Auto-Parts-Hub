import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { MapPin, Phone, Mail, Clock, Navigation } from "lucide-react";
import { useT } from "@/lib/language-context";

// Leaflet CSS + lib imported dynamically to avoid SSR issues
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";

// Custom red pin icon (avoids Vite/Leaflet default-icon path issue)
const redPinIcon = L.divIcon({
  className: "",
  html: `<svg width="28" height="38" viewBox="0 0 28 38" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 0C6.268 0 0 6.268 0 14c0 9.8 14 24 14 24S28 23.8 28 14C28 6.268 21.732 0 14 0z" fill="#ef4444"/>
    <circle cx="14" cy="14" r="6" fill="white"/>
    <circle cx="14" cy="14" r="3" fill="#ef4444"/>
  </svg>`,
  iconSize: [28, 38],
  iconAnchor: [14, 38],
  popupAnchor: [0, -38],
});

const stores = [
  {
    id: 1,
    nameEn: "Olaya Main Branch",
    nameAr: "فرع العليا الرئيسي",
    addressEn: "King Fahd Road, Olaya District, Riyadh 11461",
    addressAr: "طريق الملك فهد، حي العليا، الرياض 11461",
    phone: "+966 11 465 7890",
    email: "olaya@allamerican-auto.sa",
    hoursEn: "Sat–Thu 8:00 AM – 9:00 PM  |  Fri 2:00 PM – 9:00 PM",
    hoursAr: "السبت–الخميس ٨:٠٠ ص – ٩:٠٠ م  |  الجمعة ٢:٠٠ م – ٩:٠٠ م",
    lat: 24.7136,
    lng: 46.6753,
    since: "1984",
  },
  {
    id: 2,
    nameEn: "Al-Malaz Branch",
    nameAr: "فرع الملز",
    addressEn: "Prince Sultan Road, Al-Malaz District, Riyadh 11417",
    addressAr: "طريق الأمير سلطان، حي الملز، الرياض 11417",
    phone: "+966 11 479 3210",
    email: "malaz@allamerican-auto.sa",
    hoursEn: "Sat–Thu 8:00 AM – 9:00 PM  |  Fri 2:00 PM – 9:00 PM",
    hoursAr: "السبت–الخميس ٨:٠٠ ص – ٩:٠٠ م  |  الجمعة ٢:٠٠ م – ٩:٠٠ م",
    lat: 24.6932,
    lng: 46.7289,
    since: "2003",
  },
];

// Center map between both stores
const MAP_CENTER: [number, number] = [24.703, 46.702];

export default function ContactPage() {
  const t = useT();
  const isAr = t.nav.catalog === "الكتالوج";

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative py-20 bg-zinc-900 border-b-4 border-primary overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=2000&auto=format&fit=crop"
            alt="Riyadh city"
            className="w-full h-full object-cover opacity-20 grayscale"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent" />
        </div>
        <div className="relative z-10 container mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/40 bg-primary/10 text-primary mb-6">
              <MapPin className="w-4 h-4" />
              <span className="font-display tracking-widest text-xs uppercase font-bold">
                {isAr ? "فرعان في الرياض" : "Two Locations in Riyadh"}
              </span>
            </div>
            <h1 className="text-5xl md:text-7xl font-display font-extrabold uppercase tracking-tighter text-white mb-4">
              {isAr ? "تواصل" : "Contact"} <span className="text-primary">{isAr ? "معنا" : "Us"}</span>
            </h1>
            <p className="text-lg text-zinc-300 max-w-xl mx-auto">
              {isAr
                ? "زورنا في أحد فرعينا بالرياض أو تواصل معنا عبر الهاتف أو البريد الإلكتروني."
                : "Visit us at either of our Riyadh locations, or reach out by phone or email — we're here to help."}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Interactive Map */}
      <section className="relative z-10" style={{ height: 480 }}>
        <MapContainer
          center={MAP_CENTER}
          zoom={12}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={true}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {stores.map((store) => (
            <Marker
              key={store.id}
              position={[store.lat, store.lng]}
              icon={redPinIcon}
            >
              <Popup maxWidth={280}>
                <div style={{ fontFamily: "system-ui, sans-serif", padding: "4px 2px" }}>
                  <strong style={{ fontSize: 14, display: "block", marginBottom: 4 }}>
                    {isAr ? store.nameAr : store.nameEn}
                  </strong>
                  <p style={{ fontSize: 12, color: "#555", margin: "4px 0" }}>
                    {isAr ? store.addressAr : store.addressEn}
                  </p>
                  <p style={{ fontSize: 12, color: "#ef4444", margin: "4px 0" }}>
                    {store.phone}
                  </p>
                  <p style={{ fontSize: 11, color: "#777", margin: "4px 0" }}>
                    {isAr ? `منذ ${store.since}` : `Est. ${store.since}`}
                  </p>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${store.lat},${store.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: 12, color: "#ef4444", display: "inline-block", marginTop: 6 }}
                  >
                    {isAr ? "الحصول على الاتجاهات ↗" : "Get Directions ↗"}
                  </a>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </section>

      {/* Store Cards */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-display font-bold uppercase tracking-wider">
              {isAr ? "فروعنا" : "Our"} <span className="text-primary">{isAr ? "" : "Locations"}</span>
            </h2>
            <div className="h-1 w-16 bg-primary mt-4 mx-auto" />
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {stores.map((store, i) => (
              <motion.div
                key={store.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-card border border-border rounded-sm overflow-hidden hover:border-primary transition-colors group"
              >
                <div className="bg-primary/10 px-6 py-4 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-sm bg-primary/20 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold uppercase tracking-wider text-lg leading-tight">
                        {isAr ? store.nameAr : store.nameEn}
                      </h3>
                      <p className="text-xs text-primary font-mono">
                        {isAr ? `منذ ${store.since}` : `Est. ${store.since}`}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-5">
                  <div className="flex gap-3">
                    <MapPin className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">
                        {isAr ? store.addressAr : store.addressEn}
                      </p>
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${store.lat},${store.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline mt-1 inline-flex items-center gap-1"
                      >
                        <Navigation className="w-3 h-3" />
                        {isAr ? "الحصول على الاتجاهات" : "Get Directions"}
                      </a>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Phone className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-mono">{store.phone}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {isAr ? "مباشر من الهاتف" : "Direct line"}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Mail className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <a href={`mailto:${store.email}`} className="text-sm hover:text-primary transition-colors">
                        {store.email}
                      </a>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Clock className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm">{isAr ? store.hoursAr : store.hoursEn}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {isAr ? "مغلق أيام الأعياد الرسمية" : "Closed on official public holidays"}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Info Banner */}
      <section className="py-16 bg-card border-t border-border">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-display font-bold uppercase tracking-wider">
              {isAr ? "تواصل معنا" : "Get In"} <span className="text-primary">{isAr ? "" : "Touch"}</span>
            </h2>
            <div className="h-1 w-16 bg-primary mt-4 mx-auto" />
          </div>
          <div className="grid sm:grid-cols-3 gap-8 text-center">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-sm bg-primary/10 flex items-center justify-center mx-auto">
                <Phone className="w-6 h-6 text-primary" />
              </div>
              <h4 className="font-display font-bold uppercase tracking-wider">{isAr ? "هاتف" : "Phone"}</h4>
              <p className="text-muted-foreground text-sm font-mono">+966 11 465 7890</p>
              <p className="text-muted-foreground text-sm font-mono">+966 11 479 3210</p>
            </div>
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-sm bg-primary/10 flex items-center justify-center mx-auto">
                <Mail className="w-6 h-6 text-primary" />
              </div>
              <h4 className="font-display font-bold uppercase tracking-wider">{isAr ? "بريد إلكتروني" : "Email"}</h4>
              <a href="mailto:info@allamerican-auto.sa" className="text-muted-foreground text-sm hover:text-primary transition-colors block">
                info@allamerican-auto.sa
              </a>
              <a href="mailto:orders@allamerican-auto.sa" className="text-muted-foreground text-sm hover:text-primary transition-colors block">
                orders@allamerican-auto.sa
              </a>
            </div>
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-sm bg-primary/10 flex items-center justify-center mx-auto">
                <Clock className="w-6 h-6 text-primary" />
              </div>
              <h4 className="font-display font-bold uppercase tracking-wider">{isAr ? "ساعات العمل" : "Hours"}</h4>
              <p className="text-muted-foreground text-sm">{isAr ? "السبت–الخميس: ٨ص – ٩م" : "Sat–Thu: 8 AM – 9 PM"}</p>
              <p className="text-muted-foreground text-sm">{isAr ? "الجمعة: ٢م – ٩م" : "Friday: 2 PM – 9 PM"}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
