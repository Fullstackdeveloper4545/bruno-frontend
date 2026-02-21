export interface ProductImageItem {
  url: string;
  alt_text?: string;
  position?: number;
}

export interface ProductVariant {
  id: string;
  sku?: string;
  price: number;
  compare_at_price?: number;
  currency?: string;
  is_active?: boolean;
  attribute_values: Record<string, string>;
}

export interface Product {
  id: string;
  name: { pt: string; es: string };
  description: { pt: string; es: string };
  price: number;
  originalPrice?: number;
  category: string;
  categoryId?: string;
  image: string;
  images: string[];
  rating: number;
  reviews: number;
  inStock: boolean;
  sizes?: string[];
  colors?: { name: string; hex: string }[];
  specifications?: { key: string; value: { pt: string; es: string } }[];
  badge?: string;
  imageItems?: ProductImageItem[];
  variants?: ProductVariant[];
}

export interface Category {
  id: string;
  name: { pt: string; es: string };
  image: string;
  count: number;
}

export const categories: Category[] = [
  { id: "electronics", name: { pt: "Eletrónica", es: "Electrónica" }, image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&h=400&fit=crop", count: 156 },
  { id: "fashion", name: { pt: "Moda", es: "Moda" }, image: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&h=400&fit=crop", count: 243 },
  { id: "home", name: { pt: "Casa & Decoração", es: "Hogar & Decoración" }, image: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=400&h=400&fit=crop", count: 89 },
  { id: "sports", name: { pt: "Desporto", es: "Deporte" }, image: "https://images.unsplash.com/photo-1461896836934-bd45ba8fcf9b?w=400&h=400&fit=crop", count: 67 },
  { id: "beauty", name: { pt: "Beleza", es: "Belleza" }, image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=400&fit=crop", count: 112 },
  { id: "books", name: { pt: "Livros", es: "Libros" }, image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=400&fit=crop", count: 98 },
];

export const products: Product[] = [
  {
    id: "1",
    name: { pt: "Auscultadores Bluetooth Premium", es: "Auriculares Bluetooth Premium" },
    description: {
      pt: "Auscultadores sem fio de alta qualidade com cancelamento de ruído ativo e até 30 horas de bateria.",
      es: "Auriculares inalámbricos de alta calidad con cancelación de ruido activa y hasta 30 horas de batería.",
    },
    price: 149.99,
    originalPrice: 199.99,
    category: "electronics",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop",
      "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&h=800&fit=crop",
      "https://images.unsplash.com/photo-1487215078519-e21cc028cb29?w=800&h=800&fit=crop",
    ],
    rating: 4.5,
    reviews: 128,
    inStock: true,
    colors: [
      { name: "Preto", hex: "#1a1a1a" },
      { name: "Branco", hex: "#f5f5f5" },
      { name: "Azul", hex: "#1e3a5f" },
    ],
    specifications: [
      { key: "Bateria", value: { pt: "30 horas", es: "30 horas" } },
      { key: "Bluetooth", value: { pt: "5.3", es: "5.3" } },
      { key: "Peso", value: { pt: "250g", es: "250g" } },
    ],
    badge: "-25%",
  },
  {
    id: "2",
    name: { pt: "Relógio Minimalista Aço", es: "Reloj Minimalista Acero" },
    description: {
      pt: "Relógio elegante em aço inoxidável com design minimalista. Resistente à água até 50m.",
      es: "Reloj elegante en acero inoxidable con diseño minimalista. Resistente al agua hasta 50m.",
    },
    price: 89.90,
    category: "fashion",
    image: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=500&h=500&fit=crop",
    images: ["https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=800&h=800&fit=crop"],
    rating: 4.8,
    reviews: 67,
    inStock: true,
    colors: [
      { name: "Prateado", hex: "#c0c0c0" },
      { name: "Dourado", hex: "#d4a853" },
    ],
    specifications: [
      { key: "Material", value: { pt: "Aço inoxidável", es: "Acero inoxidable" } },
      { key: "Resistência", value: { pt: "50m", es: "50m" } },
    ],
  },
  {
    id: "3",
    name: { pt: "Mochila Urban Explorer", es: "Mochila Urban Explorer" },
    description: {
      pt: "Mochila moderna e funcional com compartimento para portátil de 15 polegadas.",
      es: "Mochila moderna y funcional con compartimento para portátil de 15 pulgadas.",
    },
    price: 59.99,
    originalPrice: 79.99,
    category: "fashion",
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=500&fit=crop",
    images: ["https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=800&fit=crop"],
    rating: 4.3,
    reviews: 45,
    inStock: true,
    colors: [
      { name: "Preto", hex: "#1a1a1a" },
      { name: "Verde", hex: "#2d5a27" },
    ],
    badge: "-25%",
  },
  {
    id: "4",
    name: { pt: "Candeeiro de Mesa LED", es: "Lámpara de Mesa LED" },
    description: {
      pt: "Candeeiro de mesa moderno com luz LED ajustável e design escandinavo.",
      es: "Lámpara de mesa moderna con luz LED ajustable y diseño escandinavo.",
    },
    price: 44.50,
    category: "home",
    image: "https://images.unsplash.com/photo-1507473885765-e6ed057ab6fe?w=500&h=500&fit=crop",
    images: ["https://images.unsplash.com/photo-1507473885765-e6ed057ab6fe?w=800&h=800&fit=crop"],
    rating: 4.6,
    reviews: 34,
    inStock: true,
  },
  {
    id: "5",
    name: { pt: "Ténis de Corrida Pro", es: "Zapatillas Running Pro" },
    description: {
      pt: "Ténis de corrida de alta performance com amortecimento avançado.",
      es: "Zapatillas de running de alto rendimiento con amortiguación avanzada.",
    },
    price: 119.99,
    originalPrice: 149.99,
    category: "sports",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop",
    images: ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=800&fit=crop"],
    rating: 4.7,
    reviews: 89,
    inStock: true,
    sizes: ["38", "39", "40", "41", "42", "43", "44"],
    colors: [
      { name: "Vermelho", hex: "#cc3333" },
      { name: "Azul", hex: "#1e3a5f" },
      { name: "Preto", hex: "#1a1a1a" },
    ],
    badge: "-20%",
  },
  {
    id: "6",
    name: { pt: "Perfume Essence Noir", es: "Perfume Essence Noir" },
    description: {
      pt: "Fragrância sofisticada com notas de sândalo e baunilha. 100ml.",
      es: "Fragancia sofisticada con notas de sándalo y vainilla. 100ml.",
    },
    price: 68.00,
    category: "beauty",
    image: "https://images.unsplash.com/photo-1541643600914-78b084683601?w=500&h=500&fit=crop",
    images: ["https://images.unsplash.com/photo-1541643600914-78b084683601?w=800&h=800&fit=crop"],
    rating: 4.4,
    reviews: 56,
    inStock: true,
  },
  {
    id: "7",
    name: { pt: "Câmara Instantânea Retro", es: "Cámara Instantánea Retro" },
    description: {
      pt: "Câmara instantânea com design retrô e impressão automática de fotos.",
      es: "Cámara instantánea con diseño retro e impresión automática de fotos.",
    },
    price: 79.90,
    category: "electronics",
    image: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500&h=500&fit=crop",
    images: ["https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&h=800&fit=crop"],
    rating: 4.2,
    reviews: 23,
    inStock: false,
  },
  {
    id: "8",
    name: { pt: "Vaso Cerâmica Artesanal", es: "Jarrón Cerámica Artesanal" },
    description: {
      pt: "Vaso em cerâmica feito à mão com acabamento mate. Perfeito para decoração moderna.",
      es: "Jarrón de cerámica hecho a mano con acabado mate. Perfecto para decoración moderna.",
    },
    price: 32.00,
    category: "home",
    image: "https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=500&h=500&fit=crop",
    images: ["https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=800&h=800&fit=crop"],
    rating: 4.9,
    reviews: 12,
    inStock: true,
  },
];
