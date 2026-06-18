export interface Product {
  id:          string;
  name:        string;
  description: string;
  price:       number;   // INR
  emoji:       string;
  image:       string;   // Unsplash photo URL
  color:       string;   // thumbnail bg fallback
  category:    string;
  upiId:       string;
}

export const PRODUCTS: Product[] = [
  {
    id:          "solana-cap",
    name:        "Solana India Cap",
    description: "Structured 6-panel cap in washed cotton. Embroidered Solana × India insignia.",
    price:       749,
    emoji:       "🧢",
    image:       "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=600&q=80",
    color:       "#dce3dc",
    category:    "Accessories",
    upiId:       "bharatkit@paytm",
  },
  {
    id:          "auron-tshirt",
    name:        "Auron × Solana Tee",
    description: "240 GSM heavyweight cotton. Screen-printed logo on chest. Oversized fit.",
    price:       999,
    emoji:       "👕",
    image:       "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80",
    color:       "#e8e0d4",
    category:    "Apparel",
    upiId:       "bharatkit@paytm",
  },
  {
    id:          "sticker-pack",
    name:        "Builder Sticker Set",
    description: "12 die-cut vinyl stickers. UV-laminated, waterproof. For laptops, helmets, anywhere.",
    price:       299,
    emoji:       "🎨",
    image:       "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=600&q=80",
    color:       "#ddd8e4",
    category:    "Collectibles",
    upiId:       "bharatkit@paytm",
  },
  {
    id:          "build-hoodie",
    name:        '"Build on Bharat" Hoodie',
    description: "450 GSM fleece. Dropped shoulders, kangaroo pocket. Embroidered back print.",
    price:       1999,
    emoji:       "🧥",
    image:       "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&q=80",
    color:       "#d8dde4",
    category:    "Apparel",
    upiId:       "bharatkit@paytm",
  },
];

export function getProduct(id: string): Product | undefined {
  return PRODUCTS.find(p => p.id === id);
}
