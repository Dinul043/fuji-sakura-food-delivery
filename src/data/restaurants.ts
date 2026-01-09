export interface Restaurant {
  id: number;
  name: string;
  cuisine: string;
  rating: number;
  deliveryTime: string;
  deliveryFee: number;
  image: string;
  tags: string[];
  reviews: number;
  category: string;
}

export const restaurants: Restaurant[] = [
  // Biryani Houses
  {
    id: 1,
    name: "Royal Biryani Palace",
    cuisine: "Indian",
    rating: 4.8,
    deliveryTime: "25-35 min",
    deliveryFee: 2.99,
    image: "🍛",
    tags: ["Biryani", "Spicy", "Authentic"],
    reviews: 2847,
    category: "biryani"
  },
  {
    id: 2,
    name: "Hyderabadi Biryani House",
    cuisine: "Indian",
    rating: 4.7,
    deliveryTime: "30-40 min",
    deliveryFee: 3.49,
    image: "🍛",
    tags: ["Biryani", "Traditional", "Aromatic"],
    reviews: 1923,
    category: "biryani"
  },
  {
    id: 3,
    name: "Lucknowi Biryani Corner",
    cuisine: "Indian",
    rating: 4.6,
    deliveryTime: "35-45 min",
    deliveryFee: 2.49,
    image: "🍛",
    tags: ["Biryani", "Authentic", "Rich"],
    reviews: 1456,
    category: "biryani"
  },
  {
    id: 4,
    name: "Kolkata Biryani Express",
    cuisine: "Indian",
    rating: 4.5,
    deliveryTime: "20-30 min",
    deliveryFee: 1.99,
    image: "🍛",
    tags: ["Biryani", "Sweet", "Traditional"],
    reviews: 987,
    category: "biryani"
  },
  {
    id: 5,
    name: "Bombay Biryani Junction",
    cuisine: "Indian",
    rating: 4.4,
    deliveryTime: "25-35 min",
    deliveryFee: 2.99,
    image: "🍛",
    tags: ["Biryani", "Spicy", "Flavorful"],
    reviews: 1234,
    category: "biryani"
  },

  // Pizza Places
  {
    id: 6,
    name: "Mario's Authentic Pizza",
    cuisine: "Italian",
    rating: 4.9,
    deliveryTime: "15-25 min",
    deliveryFee: 1.99,
    image: "🍕",
    tags: ["Pizza", "Italian", "Cheesy"],
    reviews: 3456,
    category: "pizza"
  },
  {
    id: 7,
    name: "Pepperoni Paradise",
    cuisine: "Italian",
    rating: 4.6,
    deliveryTime: "20-30 min",
    deliveryFee: 2.49,
    image: "🍕",
    tags: ["Pizza", "Pepperoni", "Crispy"],
    reviews: 2134,
    category: "pizza"
  },
  {
    id: 8,
    name: "Wood Fired Pizza Co.",
    cuisine: "Italian",
    rating: 4.8,
    deliveryTime: "25-35 min",
    deliveryFee: 3.99,
    image: "🍕",
    tags: ["Pizza", "Wood Fired", "Artisan"],
    reviews: 1876,
    category: "pizza"
  },
  {
    id: 9,
    name: "Chicago Deep Dish",
    cuisine: "American",
    rating: 4.5,
    deliveryTime: "30-40 min",
    deliveryFee: 2.99,
    image: "🍕",
    tags: ["Pizza", "Deep Dish", "Thick"],
    reviews: 1543,
    category: "pizza"
  },

  // Burger Joints
  {
    id: 10,
    name: "Burger Barn",
    cuisine: "American",
    rating: 4.7,
    deliveryTime: "15-25 min",
    deliveryFee: 1.49,
    image: "🍔",
    tags: ["Burger", "Juicy", "Fresh"],
    reviews: 2987,
    category: "burger"
  },
  {
    id: 11,
    name: "Gourmet Burger House",
    cuisine: "American",
    rating: 4.8,
    deliveryTime: "20-30 min",
    deliveryFee: 2.99,
    image: "🍔",
    tags: ["Burger", "Gourmet", "Premium"],
    reviews: 2456,
    category: "burger"
  },
  {
    id: 12,
    name: "Classic Diner Burgers",
    cuisine: "American",
    rating: 4.4,
    deliveryTime: "18-28 min",
    deliveryFee: 1.99,
    image: "🍔",
    tags: ["Burger", "Classic", "Comfort"],
    reviews: 1789,
    category: "burger"
  },

  // Sushi Places
  {
    id: 13,
    name: "Tokyo Sushi Bar",
    cuisine: "Japanese",
    rating: 4.9,
    deliveryTime: "25-35 min",
    deliveryFee: 3.99,
    image: "🍣",
    tags: ["Sushi", "Fresh", "Authentic"],
    reviews: 3234,
    category: "sushi"
  },
  {
    id: 14,
    name: "Sakura Sushi House",
    cuisine: "Japanese",
    rating: 4.7,
    deliveryTime: "30-40 min",
    deliveryFee: 4.49,
    image: "🍣",
    tags: ["Sushi", "Premium", "Traditional"],
    reviews: 1987,
    category: "sushi"
  },
  {
    id: 15,
    name: "Zen Sushi Kitchen",
    cuisine: "Japanese",
    rating: 4.6,
    deliveryTime: "20-30 min",
    deliveryFee: 2.99,
    image: "🍣",
    tags: ["Sushi", "Modern", "Clean"],
    reviews: 1456,
    category: "sushi"
  },

  // Ramen Shops
  {
    id: 16,
    name: "Ramen Yokocho",
    cuisine: "Japanese",
    rating: 4.8,
    deliveryTime: "20-30 min",
    deliveryFee: 2.49,
    image: "🍜",
    tags: ["Ramen", "Rich", "Authentic"],
    reviews: 2678,
    category: "ramen"
  },
  {
    id: 17,
    name: "Tonkotsu Heaven",
    cuisine: "Japanese",
    rating: 4.7,
    deliveryTime: "25-35 min",
    deliveryFee: 2.99,
    image: "🍜",
    tags: ["Ramen", "Tonkotsu", "Creamy"],
    reviews: 2134,
    category: "ramen"
  },
  {
    id: 18,
    name: "Miso Ramen Corner",
    cuisine: "Japanese",
    rating: 4.5,
    deliveryTime: "18-28 min",
    deliveryFee: 1.99,
    image: "🍜",
    tags: ["Ramen", "Miso", "Comfort"],
    reviews: 1567,
    category: "ramen"
  },

  // Wraps & Rolls
  {
    id: 19,
    name: "Fresh Wrap Station",
    cuisine: "Mediterranean",
    rating: 4.6,
    deliveryTime: "12-22 min",
    deliveryFee: 1.49,
    image: "🌯",
    tags: ["Wrap", "Fresh", "Healthy"],
    reviews: 1876,
    category: "wraps"
  },
  {
    id: 20,
    name: "Mediterranean Roll House",
    cuisine: "Mediterranean",
    rating: 4.5,
    deliveryTime: "15-25 min",
    deliveryFee: 1.99,
    image: "🌯",
    tags: ["Wrap", "Mediterranean", "Flavorful"],
    reviews: 1234,
    category: "wraps"
  },

  // Cafes & Coffee
  {
    id: 21,
    name: "Artisan Coffee House",
    cuisine: "Cafe",
    rating: 4.7,
    deliveryTime: "10-20 min",
    deliveryFee: 0.99,
    image: "☕",
    tags: ["Coffee", "Pastries", "Cozy"],
    reviews: 2345,
    category: "cafe"
  },
  {
    id: 22,
    name: "Morning Brew Cafe",
    cuisine: "Cafe",
    rating: 4.4,
    deliveryTime: "8-18 min",
    deliveryFee: 1.49,
    image: "☕",
    tags: ["Coffee", "Breakfast", "Quick"],
    reviews: 1567,
    category: "cafe"
  },

  // Desserts
  {
    id: 23,
    name: "Sweet Dreams Bakery",
    cuisine: "Desserts",
    rating: 4.8,
    deliveryTime: "15-25 min",
    deliveryFee: 1.99,
    image: "🧁",
    tags: ["Desserts", "Cakes", "Sweet"],
    reviews: 2876,
    category: "desserts"
  },
  {
    id: 24,
    name: "Ice Cream Paradise",
    cuisine: "Desserts",
    rating: 4.6,
    deliveryTime: "12-22 min",
    deliveryFee: 1.49,
    image: "🍦",
    tags: ["Ice Cream", "Cold", "Creamy"],
    reviews: 1987,
    category: "desserts"
  },

  // Chinese Food
  {
    id: 25,
    name: "Golden Dragon Chinese",
    cuisine: "Chinese",
    rating: 4.5,
    deliveryTime: "25-35 min",
    deliveryFee: 2.49,
    image: "🥡",
    tags: ["Chinese", "Authentic", "Savory"],
    reviews: 2134,
    category: "chinese"
  },
  {
    id: 26,
    name: "Szechuan Spice House",
    cuisine: "Chinese",
    rating: 4.7,
    deliveryTime: "20-30 min",
    deliveryFee: 2.99,
    image: "🥡",
    tags: ["Chinese", "Spicy", "Bold"],
    reviews: 1876,
    category: "chinese"
  },

  // Indian Cuisine (Non-Biryani)
  {
    id: 27,
    name: "Curry Palace",
    cuisine: "Indian",
    rating: 4.6,
    deliveryTime: "30-40 min",
    deliveryFee: 2.99,
    image: "🍛",
    tags: ["Indian", "Curry", "Spicy"],
    reviews: 2456,
    category: "indian"
  },
  {
    id: 28,
    name: "Tandoor Express",
    cuisine: "Indian",
    rating: 4.8,
    deliveryTime: "25-35 min",
    deliveryFee: 3.49,
    image: "🍛",
    tags: ["Indian", "Tandoor", "Grilled"],
    reviews: 1987,
    category: "indian"
  },

  // Thai Food
  {
    id: 29,
    name: "Thai Basil Kitchen",
    cuisine: "Thai",
    rating: 4.7,
    deliveryTime: "20-30 min",
    deliveryFee: 2.49,
    image: "🍜",
    tags: ["Thai", "Aromatic", "Fresh"],
    reviews: 1765,
    category: "thai"
  },
  {
    id: 30,
    name: "Bangkok Street Food",
    cuisine: "Thai",
    rating: 4.5,
    deliveryTime: "25-35 min",
    deliveryFee: 2.99,
    image: "🍜",
    tags: ["Thai", "Street Food", "Authentic"],
    reviews: 1432,
    category: "thai"
  },

  // Mexican Food
  {
    id: 31,
    name: "El Mariachi Cantina",
    cuisine: "Mexican",
    rating: 4.6,
    deliveryTime: "18-28 min",
    deliveryFee: 1.99,
    image: "🌮",
    tags: ["Mexican", "Tacos", "Spicy"],
    reviews: 2234,
    category: "mexican"
  },
  {
    id: 32,
    name: "Burrito Bonanza",
    cuisine: "Mexican",
    rating: 4.4,
    deliveryTime: "15-25 min",
    deliveryFee: 1.49,
    image: "🌯",
    tags: ["Mexican", "Burrito", "Filling"],
    reviews: 1678,
    category: "mexican"
  },

  // Korean Food
  {
    id: 33,
    name: "Seoul Kitchen",
    cuisine: "Korean",
    rating: 4.8,
    deliveryTime: "25-35 min",
    deliveryFee: 3.49,
    image: "🍲",
    tags: ["Korean", "BBQ", "Fermented"],
    reviews: 1987,
    category: "korean"
  },
  {
    id: 34,
    name: "K-BBQ House",
    cuisine: "Korean",
    rating: 4.7,
    deliveryTime: "30-40 min",
    deliveryFee: 3.99,
    image: "🍖",
    tags: ["Korean", "BBQ", "Grilled"],
    reviews: 1543,
    category: "korean"
  },

  // Mediterranean
  {
    id: 35,
    name: "Mediterranean Delights",
    cuisine: "Mediterranean",
    rating: 4.5,
    deliveryTime: "20-30 min",
    deliveryFee: 2.49,
    image: "🥙",
    tags: ["Mediterranean", "Healthy", "Fresh"],
    reviews: 1876,
    category: "mediterranean"
  },
  {
    id: 36,
    name: "Greek Taverna",
    cuisine: "Greek",
    rating: 4.6,
    deliveryTime: "25-35 min",
    deliveryFee: 2.99,
    image: "🥙",
    tags: ["Greek", "Traditional", "Olive"],
    reviews: 1432,
    category: "mediterranean"
  },

  // Vietnamese
  {
    id: 37,
    name: "Pho Saigon",
    cuisine: "Vietnamese",
    rating: 4.7,
    deliveryTime: "20-30 min",
    deliveryFee: 2.49,
    image: "🍜",
    tags: ["Vietnamese", "Pho", "Broth"],
    reviews: 2134,
    category: "vietnamese"
  },
  {
    id: 38,
    name: "Banh Mi Express",
    cuisine: "Vietnamese",
    rating: 4.4,
    deliveryTime: "12-22 min",
    deliveryFee: 1.49,
    image: "🥖",
    tags: ["Vietnamese", "Sandwich", "Fresh"],
    reviews: 1234,
    category: "vietnamese"
  },

  // Healthy/Salads
  {
    id: 39,
    name: "Green Garden Salads",
    cuisine: "Healthy",
    rating: 4.5,
    deliveryTime: "10-20 min",
    deliveryFee: 1.99,
    image: "🥗",
    tags: ["Salad", "Healthy", "Fresh"],
    reviews: 1567,
    category: "healthy"
  },
  {
    id: 40,
    name: "Protein Power Bowl",
    cuisine: "Healthy",
    rating: 4.6,
    deliveryTime: "15-25 min",
    deliveryFee: 2.49,
    image: "🥗",
    tags: ["Bowl", "Protein", "Nutritious"],
    reviews: 1876,
    category: "healthy"
  },

  // Seafood
  {
    id: 41,
    name: "Ocean's Bounty",
    cuisine: "Seafood",
    rating: 4.8,
    deliveryTime: "30-40 min",
    deliveryFee: 4.49,
    image: "🦐",
    tags: ["Seafood", "Fresh", "Ocean"],
    reviews: 1432,
    category: "seafood"
  },
  {
    id: 42,
    name: "Crab Shack",
    cuisine: "Seafood",
    rating: 4.6,
    deliveryTime: "25-35 min",
    deliveryFee: 3.99,
    image: "🦀",
    tags: ["Seafood", "Crab", "Coastal"],
    reviews: 1234,
    category: "seafood"
  },

  // BBQ
  {
    id: 43,
    name: "Smoky Joe's BBQ",
    cuisine: "BBQ",
    rating: 4.7,
    deliveryTime: "35-45 min",
    deliveryFee: 3.49,
    image: "🍖",
    tags: ["BBQ", "Smoky", "Tender"],
    reviews: 2345,
    category: "bbq"
  },
  {
    id: 44,
    name: "Rib Heaven",
    cuisine: "BBQ",
    rating: 4.5,
    deliveryTime: "30-40 min",
    deliveryFee: 2.99,
    image: "🍖",
    tags: ["BBQ", "Ribs", "Sauce"],
    reviews: 1678,
    category: "bbq"
  },

  // Breakfast
  {
    id: 45,
    name: "Sunrise Breakfast Diner",
    cuisine: "American",
    rating: 4.4,
    deliveryTime: "15-25 min",
    deliveryFee: 1.99,
    image: "🥞",
    tags: ["Breakfast", "Pancakes", "Morning"],
    reviews: 1987,
    category: "breakfast"
  },
  {
    id: 46,
    name: "Waffle House Express",
    cuisine: "American",
    rating: 4.3,
    deliveryTime: "12-22 min",
    deliveryFee: 1.49,
    image: "🧇",
    tags: ["Breakfast", "Waffles", "Sweet"],
    reviews: 1432,
    category: "breakfast"
  },

  // Sandwiches
  {
    id: 47,
    name: "Deli Deluxe",
    cuisine: "American",
    rating: 4.5,
    deliveryTime: "10-20 min",
    deliveryFee: 1.49,
    image: "🥪",
    tags: ["Sandwich", "Deli", "Fresh"],
    reviews: 1765,
    category: "sandwich"
  },
  {
    id: 48,
    name: "Gourmet Grilled Cheese",
    cuisine: "American",
    rating: 4.6,
    deliveryTime: "8-18 min",
    deliveryFee: 0.99,
    image: "🥪",
    tags: ["Sandwich", "Grilled", "Comfort"],
    reviews: 1234,
    category: "sandwich"
  },

  // Pasta
  {
    id: 49,
    name: "Nonna's Pasta Kitchen",
    cuisine: "Italian",
    rating: 4.8,
    deliveryTime: "20-30 min",
    deliveryFee: 2.99,
    image: "🍝",
    tags: ["Pasta", "Italian", "Homemade"],
    reviews: 2876,
    category: "pasta"
  },
  {
    id: 50,
    name: "Carbonara Corner",
    cuisine: "Italian",
    rating: 4.7,
    deliveryTime: "18-28 min",
    deliveryFee: 2.49,
    image: "🍝",
    tags: ["Pasta", "Creamy", "Rich"],
    reviews: 1987,
    category: "pasta"
  },

  // Additional Variety
  {
    id: 51,
    name: "Fusion Food Lab",
    cuisine: "Fusion",
    rating: 4.6,
    deliveryTime: "25-35 min",
    deliveryFee: 3.49,
    image: "🍽️",
    tags: ["Fusion", "Creative", "Modern"],
    reviews: 1543,
    category: "fusion"
  },
  {
    id: 52,
    name: "Comfort Food Kitchen",
    cuisine: "American",
    rating: 4.4,
    deliveryTime: "20-30 min",
    deliveryFee: 2.49,
    image: "🍽️",
    tags: ["Comfort", "Homestyle", "Hearty"],
    reviews: 1876,
    category: "comfort"
  },
  {
    id: 53,
    name: "Spice Route Indian",
    cuisine: "Indian",
    rating: 4.7,
    deliveryTime: "30-40 min",
    deliveryFee: 3.49,
    image: "🍛",
    tags: ["Indian", "Spices", "Aromatic"],
    reviews: 2134,
    category: "indian"
  },
  {
    id: 54,
    name: "Taco Fiesta",
    cuisine: "Mexican",
    rating: 4.5,
    deliveryTime: "15-25 min",
    deliveryFee: 1.99,
    image: "🌮",
    tags: ["Mexican", "Tacos", "Festive"],
    reviews: 1678,
    category: "mexican"
  },
  {
    id: 55,
    name: "Noodle Express",
    cuisine: "Asian",
    rating: 4.3,
    deliveryTime: "18-28 min",
    deliveryFee: 2.49,
    image: "🍜",
    tags: ["Noodles", "Quick", "Satisfying"],
    reviews: 1432,
    category: "noodles"
  }
];

export const categories = [
  { id: 'pizza', name: 'Pizza', emoji: '🍕', gradient: 'from-pink-500 to-rose-600' },
  { id: 'burger', name: 'Burgers', emoji: '🍔', gradient: 'from-rose-400 to-pink-500' },
  { id: 'sushi', name: 'Sushi', emoji: '🍣', gradient: 'from-rose-500 to-pink-600' },
  { id: 'ramen', name: 'Ramen', emoji: '🍜', gradient: 'from-pink-600 to-rose-700' },
  { id: 'wraps', name: 'Wraps', emoji: '🌯', gradient: 'from-rose-600 to-pink-700' },
  { id: 'cafe', name: 'Cafe', emoji: '☕', gradient: 'from-rose-700 to-pink-800' },
  { id: 'desserts', name: 'Desserts', emoji: '🧁', gradient: 'from-pink-700 to-rose-800' }
];