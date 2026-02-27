import { Link } from "react-router-dom";
import { Globe } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export function Footer() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container-page py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <h3 className="text-lg font-bold mb-4">
              LOJA<span className="text-accent">.</span>EU
            </h3>
            <p className="text-sm text-primary-foreground/70 leading-relaxed">
              {language === "pt"
                ? "A sua loja online de confiança em Portugal e Espanha."
                : "Tu tienda online de confianza en Portugal y España."}
            </p>
            <button
              onClick={() => setLanguage(language === "pt" ? "es" : "pt")}
              className="mt-4 flex items-center gap-2 text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors"
            >
              <Globe className="w-4 h-4" />
              {language === "pt" ? "Español" : "Português"}
            </button>
          </div>

          {/* Help */}
          <div>
            <h4 className="font-semibold text-sm mb-4 uppercase tracking-wider">{t("footer.help")}</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              <li><Link to="/" className="hover:text-primary-foreground transition-colors">{t("footer.faq")}</Link></li>
              <li><Link to="/" className="hover:text-primary-foreground transition-colors">{t("footer.shipping")}</Link></li>
              <li><Link to="/" className="hover:text-primary-foreground transition-colors">{t("footer.returns")}</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-sm mb-4 uppercase tracking-wider">{t("footer.legal")}</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              <li><Link to="/" className="hover:text-primary-foreground transition-colors">{t("footer.privacy")}</Link></li>
              <li><Link to="/" className="hover:text-primary-foreground transition-colors">{t("footer.terms")}</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-sm mb-4 uppercase tracking-wider">{t("footer.contact")}</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              <li>info@loja.eu</li>
              <li>+351 912 345 678</li>
              <li>Lisboa, Portugal</li>
            </ul>
            {/* Payment icons */}
            <div className="flex items-center gap-3 mt-4 text-xs text-primary-foreground/50">
              <span className="border border-primary-foreground/20 rounded px-2 py-1">VISA</span>
              <span className="border border-primary-foreground/20 rounded px-2 py-1">MC</span>
              <span className="border border-primary-foreground/20 rounded px-2 py-1">MB</span>
              <span className="border border-primary-foreground/20 rounded px-2 py-1">Klarna</span>
            </div>
          </div>
        </div>

        <div className="border-t border-primary-foreground/10 mt-10 pt-6 text-center text-xs text-primary-foreground/50">
          © 2026 LOJA.EU — {t("footer.rights")}
        </div>
      </div>
    </footer>
  );
}
