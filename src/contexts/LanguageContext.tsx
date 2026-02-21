import { createContext, useContext, useState, ReactNode } from "react";

type Language = "pt" | "es";

type Translations = Record<string, Record<Language, string>>;

const translations: Translations = {
  // Header
  "nav.home": { pt: "Home", es: "Home" },
  "nav.shop": { pt: "Loja", es: "Tienda" },
  "nav.orders": { pt: "Encomendas", es: "Pedidos" },
  "nav.categories": { pt: "Categorias", es: "CategorÃ­as" },
  "nav.about": { pt: "Sobre", es: "Acerca" },
  "nav.contact": { pt: "Contacto", es: "Contacto" },
  "search.placeholder": { pt: "Pesquisar produtos...", es: "Buscar productos..." },
  "cart": { pt: "Carrinho", es: "Carrito" },
  "account": { pt: "Conta", es: "Cuenta" },

  // Hero
  "hero.title": { pt: "Nova ColeÃ§Ã£o 2026", es: "Nueva ColecciÃ³n 2026" },
  "hero.subtitle": { pt: "Descubra as Ãºltimas tendÃªncias com qualidade europeia premium", es: "Descubre las Ãºltimas tendencias con calidad europea premium" },
  "hero.cta": { pt: "Comprar Agora", es: "Comprar Ahora" },

  // Sections
  "featured.categories": { pt: "Categorias em Destaque", es: "CategorÃ­as Destacadas" },
  "featured.products": { pt: "Produtos em Destaque", es: "Productos Destacados" },
  "view.all": { pt: "Ver Todos", es: "Ver Todos" },
  "promo.title": { pt: "AtÃ© 40% de Desconto", es: "Hasta 40% de Descuento" },
  "promo.subtitle": { pt: "Ofertas especiais por tempo limitado", es: "Ofertas especiales por tiempo limitado" },
  "promo.cta": { pt: "Ver Ofertas", es: "Ver Ofertas" },

  // Trust
  "trust.payment": { pt: "Pagamento Seguro", es: "Pago Seguro" },
  "trust.delivery": { pt: "Entrega RÃ¡pida", es: "Entrega RÃ¡pida" },
  "trust.returns": { pt: "DevoluÃ§Ãµes FÃ¡ceis", es: "Devoluciones FÃ¡ciles" },
  "trust.support": { pt: "Suporte 24/7", es: "Soporte 24/7" },

  // Newsletter
  "newsletter.title": { pt: "Subscreva a nossa Newsletter", es: "SuscrÃ­bete a nuestro BoletÃ­n" },
  "newsletter.subtitle": { pt: "Receba as Ãºltimas novidades e ofertas exclusivas", es: "Recibe las Ãºltimas novedades y ofertas exclusivas" },
  "newsletter.placeholder": { pt: "O seu email", es: "Tu email" },
  "newsletter.button": { pt: "Subscrever", es: "Suscribirse" },

  // Footer
  "footer.about": { pt: "Sobre NÃ³s", es: "Sobre Nosotros" },
  "footer.help": { pt: "Ajuda", es: "Ayuda" },
  "footer.legal": { pt: "Legal", es: "Legal" },
  "footer.contact": { pt: "Contacto", es: "Contacto" },
  "footer.privacy": { pt: "PolÃ­tica de Privacidade", es: "PolÃ­tica de Privacidad" },
  "footer.terms": { pt: "Termos e CondiÃ§Ãµes", es: "TÃ©rminos y Condiciones" },
  "footer.shipping": { pt: "Envio e Entregas", es: "EnvÃ­o y Entregas" },
  "footer.returns": { pt: "PolÃ­tica de DevoluÃ§Ãµes", es: "PolÃ­tica de Devoluciones" },
  "footer.faq": { pt: "Perguntas Frequentes", es: "Preguntas Frecuentes" },
  "footer.rights": { pt: "Todos os direitos reservados.", es: "Todos los derechos reservados." },

  // Products
  "product.addToCart": { pt: "Adicionar ao Carrinho", es: "AÃ±adir al Carrito" },
  "product.description": { pt: "DescriÃ§Ã£o", es: "DescripciÃ³n" },
  "product.specifications": { pt: "EspecificaÃ§Ãµes", es: "Especificaciones" },
  "product.related": { pt: "Produtos Relacionados", es: "Productos Relacionados" },
  "product.inStock": { pt: "Em stock", es: "En stock" },
  "product.outOfStock": { pt: "Esgotado", es: "Agotado" },
  "product.quantity": { pt: "Quantidade", es: "Cantidad" },
  "product.reviews": { pt: "avaliaÃ§Ãµes", es: "opiniones" },

  // Filters
  "filter.title": { pt: "Filtros", es: "Filtros" },
  "filter.category": { pt: "Categoria", es: "CategorÃ­a" },
  "filter.price": { pt: "PreÃ§o", es: "Precio" },
  "filter.availability": { pt: "Disponibilidade", es: "Disponibilidad" },
  "filter.sort": { pt: "Ordenar por", es: "Ordenar por" },
  "filter.sort.newest": { pt: "Mais recentes", es: "MÃ¡s recientes" },
  "filter.sort.priceLow": { pt: "PreÃ§o: menor para maior", es: "Precio: menor a mayor" },
  "filter.sort.priceHigh": { pt: "PreÃ§o: maior para menor", es: "Precio: mayor a menor" },
  "filter.sort.popular": { pt: "Mais populares", es: "MÃ¡s populares" },

  // Cart
  "cart.title": { pt: "O seu Carrinho", es: "Tu Carrito" },
  "cart.empty": { pt: "O seu carrinho estÃ¡ vazio", es: "Tu carrito estÃ¡ vacÃ­o" },
  "cart.continue": { pt: "Continuar a Comprar", es: "Seguir Comprando" },
  "cart.subtotal": { pt: "Subtotal", es: "Subtotal" },
  "cart.shipping": { pt: "Envio", es: "EnvÃ­o" },
  "cart.total": { pt: "Total", es: "Total" },
  "cart.checkout": { pt: "Finalizar Compra", es: "Finalizar Compra" },
  "cart.coupon": { pt: "CÃ³digo de cupÃ£o", es: "CÃ³digo de cupÃ³n" },
  "cart.apply": { pt: "Aplicar", es: "Aplicar" },
  "cart.free": { pt: "GrÃ¡tis", es: "Gratis" },
  "cart.remove": { pt: "Remover", es: "Eliminar" },

  // Checkout
  "checkout.title": { pt: "Finalizar Compra", es: "Finalizar Compra" },
  "checkout.step1": { pt: "InformaÃ§Ã£o Pessoal", es: "InformaciÃ³n Personal" },
  "checkout.step2": { pt: "EndereÃ§o de Envio", es: "DirecciÃ³n de EnvÃ­o" },
  "checkout.step3": { pt: "MÃ©todo de Pagamento", es: "MÃ©todo de Pago" },
  "checkout.firstName": { pt: "Nome", es: "Nombre" },
  "checkout.lastName": { pt: "Apelido", es: "Apellido" },
  "checkout.email": { pt: "Email", es: "Email" },
  "checkout.phone": { pt: "Telefone", es: "TelÃ©fono" },
  "checkout.address": { pt: "Morada", es: "DirecciÃ³n" },
  "checkout.city": { pt: "Cidade", es: "Ciudad" },
  "checkout.postalCode": { pt: "CÃ³digo Postal", es: "CÃ³digo Postal" },
  "checkout.country": { pt: "PaÃ­s", es: "PaÃ­s" },
  "checkout.next": { pt: "Continuar", es: "Continuar" },
  "checkout.back": { pt: "Voltar", es: "Volver" },
  "checkout.placeOrder": { pt: "Confirmar Encomenda", es: "Confirmar Pedido" },
  "checkout.mbway": { pt: "MB Way", es: "MB Way" },
  "checkout.mbref": { pt: "ReferÃªncia Multibanco", es: "Referencia Multibanco" },
  "checkout.creditCard": { pt: "CartÃ£o de CrÃ©dito", es: "Tarjeta de CrÃ©dito" },
  "checkout.klarna": { pt: "Klarna", es: "Klarna" },
  "checkout.cardNumber": { pt: "NÃºmero do CartÃ£o", es: "NÃºmero de Tarjeta" },
  "checkout.expiry": { pt: "Validade", es: "Caducidad" },
  "checkout.cvv": { pt: "CVV", es: "CVV" },
  "checkout.mbwayPhone": { pt: "NÃºmero de telemÃ³vel", es: "NÃºmero de mÃ³vil" },
  "checkout.secure": { pt: "Pagamento 100% seguro e encriptado", es: "Pago 100% seguro y encriptado" },

  // Order Confirmation
  "order.thanks": { pt: "Obrigado pela sua encomenda!", es: "Â¡Gracias por tu pedido!" },
  "order.confirmed": { pt: "A sua encomenda foi confirmada", es: "Tu pedido ha sido confirmado" },
  "order.number": { pt: "NÃºmero da encomenda", es: "NÃºmero de pedido" },
  "order.tracking": { pt: "InformaÃ§Ã£o de rastreio", es: "InformaciÃ³n de seguimiento" },
  "order.trackingInfo": { pt: "ReceberÃ¡ um email com os detalhes de rastreio quando a sua encomenda for enviada.", es: "RecibirÃ¡ un email con los detalles de seguimiento cuando su pedido sea enviado." },
  "order.invoice": { pt: "Descarregar Fatura", es: "Descargar Factura" },
  "order.continue": { pt: "Continuar a Comprar", es: "Seguir Comprando" },
  "order.summary": { pt: "Resumo da Encomenda", es: "Resumen del Pedido" },
  "order.estimatedDelivery": { pt: "Entrega estimada", es: "Entrega estimada" },

  // Account
  "account.title": { pt: "A Minha Conta", es: "Mi Cuenta" },
  "account.profile": { pt: "Perfil", es: "Perfil" },
  "account.addresses": { pt: "Moradas", es: "Direcciones" },
  "account.orders": { pt: "Encomendas", es: "Pedidos" },
  "account.invoices": { pt: "Faturas", es: "Facturas" },
  "account.logout": { pt: "Terminar SessÃ£o", es: "Cerrar SesiÃ³n" },
  "account.logoutConfirmTitle": { pt: "Terminar Sessao", es: "Cerrar Sesion" },
  "account.logoutConfirmDescription": { pt: "Tem a certeza de que quer terminar sessao?", es: "Estas seguro de que quieres cerrar sesion?" },
  "account.logoutConfirmYes": { pt: "Sim", es: "Si" },
  "account.logoutConfirmNo": { pt: "Nao", es: "No" },
  "account.login": { pt: "Iniciar SessÃ£o", es: "Iniciar SesiÃ³n" },
  "account.register": { pt: "Criar Conta", es: "Crear Cuenta" },
  "account.forgotPassword": { pt: "Esqueceu-se da palavra-passe?", es: "Olvido su contrasena?" },
  "account.sendResetOtp": { pt: "Enviar OTP de recuperacao", es: "Enviar OTP de recuperacion" },
  "account.resetPassword": { pt: "Redefinir Palavra-passe", es: "Restablecer Contrasena" },
  "account.backToLogin": { pt: "Voltar ao Login", es: "Volver al Login" },
  "account.password": { pt: "Palavra-passe", es: "ContraseÃ±a" },
  "account.newPassword": { pt: "Nova Palavra-passe", es: "Nueva Contrasena" },
  "account.otpCode": { pt: "Codigo OTP (6 digitos)", es: "Codigo OTP (6 digitos)" },
  "account.save": { pt: "Guardar", es: "Guardar" },
  "account.noOrders": { pt: "Ainda nÃ£o tem encomendas.", es: "AÃºn no tiene pedidos." },
  "account.addAddress": { pt: "Adicionar Morada", es: "AÃ±adir DirecciÃ³n" },
  "account.name": { pt: "Nome completo", es: "Nombre completo" },
  "account.download": { pt: "Descarregar", es: "Descargar" },
  "account.otpTitle": { pt: "Confirmar OTP", es: "Confirmar OTP" },
  "account.otpSubtitle": { pt: "Introduza o codigo de 6 digitos enviado para o seu email", es: "Introduce el codigo de 6 digitos enviado a tu email" },
  "account.otpHint": { pt: "OTP deve ter 6 digitos", es: "El OTP debe tener 6 digitos" },
  "account.sendOtp": { pt: "Enviar OTP", es: "Enviar OTP" },
  "account.loginSuccess": { pt: "Sessao iniciada com sucesso", es: "Sesion iniciada con exito" },
  "account.loginFailed": { pt: "Falha no login", es: "Error al iniciar sesion" },
  "account.registerFailed": { pt: "Falha ao criar conta", es: "Error al crear cuenta" },
  "account.allFields": { pt: "Preencha todos os campos", es: "Rellena todos los campos" },
  "account.otpVerified": { pt: "Conta verificada com sucesso", es: "Cuenta verificada con exito" },
  "account.otpFailed": { pt: "Falha ao verificar OTP", es: "Error al verificar OTP" },
  "account.otpMissingEmail": { pt: "Email em falta. Volte a criar a conta.", es: "Falta el email. Vuelve a crear la cuenta." },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("pt");

  const t = (key: string): string => {
    return translations[key]?.[language] ?? key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
}
