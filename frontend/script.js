import {
  clearTabSessionBridge,
  persistTabSessionBridge,
  restoreSupabaseSessionFromBridge,
  supabase,
  isSupabaseConfigured,
  SUPABASE_SETUP_MESSAGE
} from "./supabase-client.js";
import { BACKEND_API_BASE } from "./api-config.js";

document.addEventListener("DOMContentLoaded", async () => {
  const isFileProtocol = window.location.protocol === "file:";
  const FALLBACK_PRICE = { regular: 200, silver: 280, gold: 350 };
  const DEFAULT_FOOD_IMAGES = {
    "classic-popcorn": "https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/Food/salted%20popcorn.png",
    "cheese-popcorn": "https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/Food/cheese%20popcorn.png",
    "caramel-popcorn": "https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/Food/carmal%20popcorn.png",
    "peri-peri-popcorn": "https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/Food/periperi%20popcorn.png",
    "classic-fries": "https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/Food/salted%20fries.png",
    "peri-peri-fries": "https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/Food/periperi%20fries.png",
    "cheese-fries": "https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/Food/cheese%20loaded%20fries.png",
    "masala-fries": "https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/Food/masala%20fries.png",
    "samosa": "https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/Food/samosa.png",
    "vadapav": "https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/Food/vadapav.png",
    "kachori": "https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/Food/kachpri.png",
    "kachi-dabeli": "https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/Food/kachi%20dabeli.png",
    "veg-burger": "https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/Food/veg%20burger.png",
    "paneer-burger": "https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/Food/paneer%20burger.png",
    "chicken-burger": "https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/Food/crispy%20chicken%20burger.png",
    "veg-sandwich": "https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/Food/veg%20sandwich.png",
    "grilled-cheese-sandwich": "https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/Food/grilled%20cheese%20sandwich.png",
    "paneer-sandwich": "https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/Food/paneer%20ticka%20sandwich.png",
    "corn-sandwich": "https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/Food/sweet%20corn%20sandwich.png",
    "cola": "https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/Food/coca%20cola.png",
    "pepsi": "https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/Food/pepsi.png",
    "sprite": "https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/Food/sprite.png",
    "fanta": "https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/Food/fanta.png",
    "iced-tea": "https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/Food/iced%20tea.png",
    "masala-tea": "https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/Food/masala%20tea.png",
    "green-tea": "https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/Food/greentea.png",
    "normal-coffee": "https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/Food/coffee.png",
    "cappuccino": "https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/Food/cappuccino.png",
    "cold-coffee": "https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/Food/cold%20coffee.png"
  };
  const LEGACY_FOOD_IMAGE_ALIASES = {
    "https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/Food/salted%20popcorn.jpg": DEFAULT_FOOD_IMAGES["classic-popcorn"],
    "https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/Food/cheese%20popcorn.jpg": DEFAULT_FOOD_IMAGES["cheese-popcorn"],
    "https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/Food/carmel%20popcorn.jpg": DEFAULT_FOOD_IMAGES["caramel-popcorn"],
    "https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/Food/periperi%20popcorn.jpg": DEFAULT_FOOD_IMAGES["peri-peri-popcorn"],
    "https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/Food/salted%20fries.jpg": DEFAULT_FOOD_IMAGES["classic-fries"],
    "https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/Food/periperi%20fries.jpg": DEFAULT_FOOD_IMAGES["peri-peri-fries"],
    "https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/Food/cheese%20loaded%20fries.jpg": DEFAULT_FOOD_IMAGES["cheese-fries"],
    "https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/Food/masala%20fries.jpg": DEFAULT_FOOD_IMAGES["masala-fries"],
    "https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/Food/samosa.jpg": DEFAULT_FOOD_IMAGES["samosa"],
    "https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/Food/vadapav.jpg": DEFAULT_FOOD_IMAGES["vadapav"],
    "https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/Food/kachori.jpg": DEFAULT_FOOD_IMAGES["kachori"],
    "https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/Food/kachi%20dabeli.jpg": DEFAULT_FOOD_IMAGES["kachi-dabeli"],
    "https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/Food/veg%20burger.jpg": DEFAULT_FOOD_IMAGES["veg-burger"],
    "https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/Food/paneer%20burger.jpg": DEFAULT_FOOD_IMAGES["paneer-burger"],
    "https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/Food/crispy%20chicken%20burger.jpg": DEFAULT_FOOD_IMAGES["chicken-burger"],
    "https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/Food/veg%20sandwich.jpg": DEFAULT_FOOD_IMAGES["veg-sandwich"],
    "https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/Food/grilled%20cheese%20sandwich.jpg": DEFAULT_FOOD_IMAGES["grilled-cheese-sandwich"],
    "https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/Food/paneer%20ticka%20sandwich.jpg": DEFAULT_FOOD_IMAGES["paneer-sandwich"],
    "https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/Food/sweet%20corn%20sandwich.jpg": DEFAULT_FOOD_IMAGES["corn-sandwich"],
    "https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/Food/coca%20cola.jpg": DEFAULT_FOOD_IMAGES["cola"],
    "https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/Food/pepsi.jpg": DEFAULT_FOOD_IMAGES["pepsi"],
    "https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/Food/sprite.jpg": DEFAULT_FOOD_IMAGES["sprite"],
    "https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/Food/fanta.jpg": DEFAULT_FOOD_IMAGES["fanta"],
    "https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/Food/iced%20tea.jpg": DEFAULT_FOOD_IMAGES["iced-tea"],
    "https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/Food/masala%20tea.jpg": DEFAULT_FOOD_IMAGES["masala-tea"],
    "https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/Food/green%20tea.jpg": DEFAULT_FOOD_IMAGES["green-tea"],
    "https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/Food/Coffee.jpg": DEFAULT_FOOD_IMAGES["normal-coffee"],
    "https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/Food/cappuccino.jpg": DEFAULT_FOOD_IMAGES["cappuccino"],
    "https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/Food/cold%20coffee.jpg": DEFAULT_FOOD_IMAGES["cold-coffee"]
  };
  const STORAGE_BUCKETS = {
    moviePosters: "movie-posters"
  };
  let currentSession = null;
  const SUPABASE_MOVIE_POSTERS = {
    mercy: "https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/images/MERCY.png",
    themummyreboot: "https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/images/The%20Mummy%20(Reboot).png",
    insideout2: "https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/images/Inside%20Out%202.png",
    dhurandhartherevenge: "https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/images/Dhurandhar%20The%20Revenge.png",
    vadh2: "https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/images/VADH%202.png",
    subedaar: "https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/images/Subedaar.png",
    deadpoolwolverine: "https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/images/Deadpool%20&%20Wolverine.png",
    jokerfolieadeux: "https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/images/Joker.png",
    duneparttwo: "https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/images/DUNE%202.png",
    mardaani3: "https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/images/Mardaani%203.png",
    ekdin: "https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/images/EK%20DIN.png",
    assi: "https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/images/Assi.png",
    kungfupanda4: "https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/images/Kung%20Fu%20Panda%204.png",
    godzillaxkongthenewempire: "https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/images/Godzilla%20x%20Kong%20The%20New%20Empire.png",
    rahuketu: "https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/images/RAHU%20KETU.png"
  };
  const MOVIE_DISPLAY_ORDER = [
    "mercy",
    "themummyreboot",
    "insideout2",
    "dhurandhartherevenge",
    "vadh2",
    "subedaar",
    "deadpoolwolverine",
    "jokerfolieadeux",
    "duneparttwo",
    "mardaani3",
    "ekdin",
    "assi",
    "kungfupanda4",
    "godzillaxkongthenewempire",
    "rahuketu"
  ];
  const MOVIE_ORDER_INDEX = Object.fromEntries(
    MOVIE_DISPLAY_ORDER.map((movieId, index) => [movieId, index])
  );
  const getLegacyMovieOrder = (movieId) =>
    MOVIE_ORDER_INDEX[movieId] !== undefined ? MOVIE_ORDER_INDEX[movieId] + 1 : null;
  const DEFAULT_FOOD_MENU = [
    { id: "classic-popcorn", name: "Classic Salted Popcorn", category: "Popcorn", price: 180, badge: "Best Seller", artLabel: "POP", description: "Big tub with buttery cinema crunch." },
    { id: "cheese-popcorn", name: "Cheese Burst Popcorn", category: "Popcorn", price: 220, badge: "Hot Pick", artLabel: "CHE", description: "Loaded with creamy cheddar flavor." },
    { id: "caramel-popcorn", name: "Caramel Popcorn", category: "Popcorn", price: 210, badge: "Sweet", artLabel: "CAR", description: "Golden caramel glaze with crisp bites." },
    { id: "peri-peri-popcorn", name: "Peri Peri Popcorn", category: "Popcorn", price: 230, badge: "Spicy", artLabel: "PER", description: "Masala-spiced popcorn for bold movie snacks." },
    { id: "classic-fries", name: "Classic Fries", category: "Fries", price: 160, badge: "Crispy", artLabel: "FRY", description: "Lightly salted fries with dip." },
    { id: "peri-peri-fries", name: "Peri Peri Fries", category: "Fries", price: 190, badge: "Trending", artLabel: "HOT", description: "Spiced fries with tangy seasoning." },
    { id: "cheese-fries", name: "Cheese Loaded Fries", category: "Fries", price: 210, badge: "Cheesy", artLabel: "CHS", description: "Fries topped with warm cheese sauce." },
    { id: "masala-fries", name: "Masala Fries", category: "Fries", price: 185, badge: "Desi", artLabel: "MAS", description: "Indian-style masala seasoning on crisp fries." },
    { id: "samosa", name: "Crispy Samosa", category: "Snacks", price: 90, badge: "Fresh", artLabel: "SAM", description: "Golden samosa with mint chutney." },
    { id: "vadapav", name: "Vada Pav", category: "Snacks", price: 95, badge: "Mumbai", artLabel: "VAD", description: "Soft pav with spicy vada and chutney." },
    { id: "kachori", name: "Khasta Kachori", category: "Snacks", price: 100, badge: "Crunchy", artLabel: "KAC", description: "Flaky kachori with masala filling." },
    { id: "kachi-dabeli", name: "Kacchi Dabeli", category: "Snacks", price: 120, badge: "Street Style", artLabel: "DAB", description: "Sweet-spicy dabeli with peanuts and masala." },
    { id: "veg-burger", name: "Classic Veg Burger", category: "Burger", price: 170, badge: "Veg", artLabel: "VEG", description: "Veg patty with lettuce and sauce." },
    { id: "paneer-burger", name: "Paneer Tikka Burger", category: "Burger", price: 210, badge: "Popular", artLabel: "PAN", description: "Paneer tikka patty with smoky mayo." },
    { id: "chicken-burger", name: "Crispy Chicken Burger", category: "Burger", price: 240, badge: "Juicy", artLabel: "CHK", description: "Crunchy chicken fillet burger." },
    { id: "veg-sandwich", name: "Classic Veg Sandwich", category: "Sandwich", price: 150, badge: "Light Bite", artLabel: "VEG", description: "Fresh veggie sandwich with mayo spread." },
    { id: "grilled-cheese-sandwich", name: "Grilled Cheese Sandwich", category: "Sandwich", price: 175, badge: "Cheesy", artLabel: "CHS", description: "Toasted bread packed with melted cheese." },
    { id: "paneer-sandwich", name: "Paneer Tikka Sandwich", category: "Sandwich", price: 195, badge: "Popular", artLabel: "PAN", description: "Paneer tikka filling in a grilled sandwich." },
    { id: "corn-sandwich", name: "Sweet Corn Sandwich", category: "Sandwich", price: 165, badge: "Cafe", artLabel: "CRN", description: "Creamy corn filling with herbs and crunch." },
    { id: "cola", name: "Coca Cola", category: "Cold Drink", price: 110, badge: "Chilled", artLabel: "COL", description: "Ice-cold cola for the show." },
    { id: "pepsi", name: "Pepsi", category: "Cold Drink", price: 110, badge: "Classic", artLabel: "PEP", description: "Refreshing fizzy soft drink." },
    { id: "sprite", name: "Sprite", category: "Cold Drink", price: 105, badge: "Lime", artLabel: "SPR", description: "Crisp lemon-lime sparkle." },
    { id: "fanta", name: "Fanta Orange", category: "Cold Drink", price: 105, badge: "Orange", artLabel: "FAN", description: "Sweet orange soda served cold." },
    { id: "iced-tea", name: "Iced Tea", category: "Cold Drink", price: 125, badge: "Cool", artLabel: "ICE", description: "Fresh brewed tea over ice." },
    { id: "masala-tea", name: "Masala Tea", category: "Tea & Coffee", price: 80, badge: "Warm", artLabel: "TEA", description: "Hot masala chai for evening shows." },
    { id: "green-tea", name: "Green Tea", category: "Tea & Coffee", price: 90, badge: "Healthy", artLabel: "GRN", description: "Light and soothing hot green tea." },
    { id: "normal-coffee", name: "Normal Coffee", category: "Tea & Coffee", price: 110, badge: "Classic", artLabel: "COF", description: "Simple hot coffee for a quick refresh." },
    { id: "cappuccino", name: "Cappuccino", category: "Tea & Coffee", price: 140, badge: "Cafe", artLabel: "CAP", description: "Foamy cappuccino with rich aroma." },
    { id: "cold-coffee", name: "Cold Coffee", category: "Tea & Coffee", price: 155, badge: "Smooth", artLabel: "COF", description: "Chilled coffee shake for long movies." }
  ];

  const hallCatalog = {
    1: {
      hallId: 1,
      name: "Hall 1",
      classes: {
        gold: 35,
        standard: 75
      },
      seatGroups: {
        regular: 40,
        silver: 35,
        gold: 35
      }
    },
    2: {
      hallId: 2,
      name: "Hall 2",
      classes: {
        gold: 27,
        standard: 97
      },
      seatGroups: {
        regular: 52,
        silver: 45,
        gold: 27
      }
    },
    3: {
      hallId: 3,
      name: "Hall 3",
      classes: {
        gold: 26,
        standard: 98
      },
      seatGroups: {
        regular: 54,
        silver: 44,
        gold: 26
      }
    }
  };
  const priceListingByDay = {
    Monday: { "2D": 10, "3D": 12, "4DX": 15, "IMAX": 18 },
    Tuesday: { "2D": 10, "3D": 12, "4DX": 14, "IMAX": 18 },
    Wednesday: { "2D": 8, "3D": 10, "4DX": 12, "IMAX": 16 },
    Thursday: { "2D": 10, "3D": 12, "4DX": 15, "IMAX": 18 },
    Friday: { "2D": 12, "3D": 15, "4DX": 22, "IMAX": 24 },
    Saturday: { "2D": 12, "3D": 15, "4DX": 20, "IMAX": 22 },
    Sunday: { "2D": 10, "3D": 13, "4DX": 17, "IMAX": 20 }
  };
  const movieTypeMap = {
    mercy: ["2D"],
    themummyreboot: ["2D", "IMAX"],
    insideout2: ["2D", "3D"],
    dhurandhartherevenge: ["2D", "IMAX"],
    vadh2: ["2D"],
    subedaar: ["2D"],
    deadpoolwolverine: ["2D", "IMAX"],
    jokerfolieadeux: ["2D", "IMAX"],
    duneparttwo: ["2D", "IMAX"],
    mardaani3: ["2D"],
    ekdin: ["2D"],
    assi: ["2D"],
    kungfupanda4: ["2D", "3D"],
    godzillaxkongthenewempire: ["2D", "IMAX", "3D"],
    rahuketu: ["2D"]
  };

  const defaultMovieCatalog = {
    mercy: {
      name: "Mercy",
      image: SUPABASE_MOVIE_POSTERS.mercy,
      rating: "7.0/10",
      genre: "Thriller",
      formats: "2D",
      languages: "English",
      summary: "A tense thriller involving survival and moral dilemmas. The protagonist faces life-threatening challenges. Suspense and emotional depth keep viewers engaged.",
      criticRating: "3.5/5",
      highlights: [
        "Survival stakes keep the tension sharp.",
        "Moral choices drive the emotional conflict.",
        "Built around a tightly wound thriller setup."
      ],
      trailerUrl: "https://www.youtube.com/watch?v=6ch1ngUM3w8",
      defaultPrice: { regular: 190, silver: 270, gold: 340 }
    },
    themummyreboot: {
      name: "The Mummy (Reboot Trailer)",
      image: SUPABASE_MOVIE_POSTERS.themummyreboot,
      rating: "7.6/10",
      genre: "Horror, Adventure",
      formats: "2D / IMAX",
      languages: "English, Hindi (dubbed)",
      summary: "A reboot of the iconic franchise with a darker tone. Ancient curses return in a modern setting. The film blends action, horror, and adventure.",
      criticRating: "3.8/5",
      highlights: [
        "Ancient horror meets modern blockbuster scale.",
        "Adventure set pieces balance the darker tone.",
        "A franchise reboot with action-first energy."
      ],
      trailerUrl: "https://www.youtube.com/watch?v=IjHgzkQM2Sg",
      defaultPrice: { regular: 230, silver: 310, gold: 380 }
    },
    insideout2: {
      name: "Inside Out 2",
      image: SUPABASE_MOVIE_POSTERS.insideout2,
      rating: "8.4/10",
      genre: "Animation, Family",
      formats: "2D / 3D",
      languages: "English, Hindi",
      summary: "Riley enters her teenage years, bringing new emotions into her life. The story explores mental growth and emotional challenges. A heartwarming and relatable sequel.",
      criticRating: "4.2/5",
      highlights: [
        "New emotions reshape Riley's teenage journey.",
        "Family-friendly storytelling with emotional depth.",
        "Balances humor, heart, and coming-of-age themes."
      ],
      trailerUrl: "https://www.youtube.com/watch?v=LEjhY15eCx0",
      defaultPrice: { regular: 220, silver: 300, gold: 370 }
    },
    dhurandhartherevenge: {
      name: "Dhurandhar: The Revenge",
      image: SUPABASE_MOVIE_POSTERS.dhurandhartherevenge,
      rating: "8.2/10",
      genre: "Action, Thriller",
      formats: "2D / IMAX",
      languages: "Hindi",
      summary: "A high-octane action thriller following a covert operative entangled in a global conspiracy. As secrets unfold, he must confront betrayal within his own agency. Packed with intense action sequences and emotional depth, it sets a new benchmark for Indian cinema.",
      criticRating: "4.1/5",
      highlights: [
        "A covert mission unravels into global conspiracy.",
        "Betrayal inside the agency raises the stakes.",
        "Large-scale action is matched with emotional payoff."
      ],
      trailerUrl: "https://www.youtube.com/watch?v=NHk7scrb_9I",
      defaultPrice: { regular: 240, silver: 320, gold: 390 }
    },
    vadh2: {
      name: "Vadh 2",
      image: SUPABASE_MOVIE_POSTERS.vadh2,
      rating: "7.8/10",
      genre: "Crime, Drama",
      formats: "2D",
      languages: "Hindi",
      summary: "A gripping sequel that continues a morally complex crime story. It explores justice, guilt, and survival in a harsh world. Strong performances make it emotionally engaging.",
      criticRating: "3.9/5",
      highlights: [
        "Justice and guilt shape the central conflict.",
        "Crime drama tension stays grounded and intense.",
        "Performance-driven storytelling carries the sequel."
      ],
      trailerUrl: "https://www.youtube.com/watch?v=AnOCvitPlsc",
      defaultPrice: { regular: 200, silver: 280, gold: 350 }
    },
    subedaar: {
      name: "Subedaar",
      image: SUPABASE_MOVIE_POSTERS.subedaar,
      rating: "7.3/10",
      genre: "Drama",
      formats: "2D",
      languages: "Hindi, Marathi",
      summary: "A story of honor, sacrifice, and duty centered on a soldier's life. Emotional storytelling highlights personal and national conflicts.",
      criticRating: "3.7/5",
      highlights: [
        "Duty and sacrifice sit at the story's core.",
        "Personal conflict is tied to national service.",
        "An emotional military drama with a grounded tone."
      ],
      trailerUrl: "https://www.youtube.com/watch?v=wY1V7rEAQ3o",
      defaultPrice: { regular: 195, silver: 275, gold: 345 }
    },
    deadpoolwolverine: {
      name: "Deadpool & Wolverine",
      image: SUPABASE_MOVIE_POSTERS.deadpoolwolverine,
      rating: "8.6/10",
      genre: "Action, Comedy",
      formats: "2D / IMAX",
      languages: "English, Hindi",
      summary: "Deadpool teams up with Wolverine in a chaotic multiverse adventure. The film is packed with humor, action, and surprises. A fan-favorite Marvel entry.",
      criticRating: "4.3/5",
      highlights: [
        "Multiverse chaos fuels the action-comedy pairing.",
        "Deadpool and Wolverine deliver fan-service fireworks.",
        "Fast-paced humor rides alongside blockbuster action."
      ],
      trailerUrl: "https://www.youtube.com/watch?v=73_1biulkYk",
      defaultPrice: { regular: 250, silver: 330, gold: 400 }
    },
    jokerfolieadeux: {
      name: "Joker: Folie a Deux",
      image: SUPABASE_MOVIE_POSTERS.jokerfolieadeux,
      rating: "8.1/10",
      genre: "Drama, Musical",
      formats: "2D / IMAX",
      languages: "English, Hindi",
      summary: "A psychological continuation of Joker's story with a musical twist. It explores madness, love, and identity. A unique cinematic experience.",
      criticRating: "4.1/5",
      highlights: [
        "Madness and identity remain central to the sequel.",
        "The musical layer gives the story a new texture.",
        "A darker character study with a bold formal shift."
      ],
      trailerUrl: "https://youtu.be/zAGVQLHvwOY?si=hSx2NzMB9tawNh9A",
      defaultPrice: { regular: 235, silver: 315, gold: 385 }
    },
    duneparttwo: {
      name: "Dune: Part Two",
      image: SUPABASE_MOVIE_POSTERS.duneparttwo,
      rating: "8.9/10",
      genre: "Sci-Fi, Adventure",
      formats: "2D / IMAX",
      languages: "English, Hindi",
      summary: "Paul Atreides rises to power while seeking revenge. The film expands its epic universe with stunning visuals. A masterpiece of modern sci-fi cinema.",
      criticRating: "4.5/5",
      highlights: [
        "Paul's rise is framed as epic prophecy and revenge.",
        "Scale and spectacle define the world-building.",
        "Modern sci-fi ambition meets blockbuster precision."
      ],
      trailerUrl: "https://www.youtube.com/watch?v=Way9Dexny3w",
      defaultPrice: { regular: 255, silver: 335, gold: 405 }
    },
    mardaani3: {
      name: "Mardaani 3",
      image: SUPABASE_MOVIE_POSTERS.mardaani3,
      rating: "8.0/10",
      genre: "Action, Crime",
      formats: "2D",
      languages: "Hindi",
      summary: "A powerful cop drama where a fearless officer takes on a new criminal network. The film delivers intense action and social themes. Strong performances and gripping storytelling drive the narrative.",
      criticRating: "4.0/5",
      highlights: [
        "A fearless officer anchors the high-stakes conflict.",
        "Crime action is blended with social commentary.",
        "Strong performances keep the drama grounded."
      ],
      trailerUrl: "https://www.youtube.com/watch?v=V4TJKSEftkU",
      defaultPrice: { regular: 220, silver: 300, gold: 370 }
    },
    ekdin: {
      name: "Ek Din",
      image: SUPABASE_MOVIE_POSTERS.ekdin,
      rating: "7.2/10",
      genre: "Romance, Drama",
      formats: "2D",
      languages: "Hindi",
      summary: "A heartfelt story of love and relationships unfolding over time. Emotional moments and relatable characters make it engaging. The film explores destiny and human connection.",
      criticRating: "3.6/5",
      highlights: [
        "Love and destiny drive the emotional journey.",
        "Relatable characters keep the drama intimate.",
        "A romance shaped by time and connection."
      ],
      trailerUrl: "https://www.youtube.com/watch?v=RCmyr_d3Hi0",
      defaultPrice: { regular: 190, silver: 270, gold: 340 }
    },
    assi: {
      name: "Assi",
      image: SUPABASE_MOVIE_POSTERS.assi,
      rating: "7.4/10",
      genre: "Drama",
      formats: "2D",
      languages: "Hindi",
      summary: "Set in Varanasi, the film explores culture, politics, and society. It reflects changing times through powerful storytelling. A critically appreciated drama with depth.",
      criticRating: "3.7/5",
      highlights: [
        "Varanasi becomes the center of social reflection.",
        "Culture and politics shape the film's dramatic core.",
        "A thoughtful drama about change and identity."
      ],
      trailerUrl: "https://www.youtube.com/watch?v=_fTMb1olDQY",
      defaultPrice: { regular: 195, silver: 275, gold: 345 }
    },
    kungfupanda4: {
      name: "Kung Fu Panda 4",
      image: SUPABASE_MOVIE_POSTERS.kungfupanda4,
      rating: "7.9/10",
      genre: "Animation, Action",
      formats: "2D / 3D",
      languages: "English, Hindi",
      summary: "Po returns for another adventure as he trains a new warrior. The film blends humor, action, and emotional storytelling. A fun family entertainer.",
      criticRating: "4.0/5",
      highlights: [
        "Po's new journey mixes training with fresh adventure.",
        "Family-friendly humor powers the action beats.",
        "Emotion and comedy stay balanced throughout."
      ],
      trailerUrl: "https://www.youtube.com/watch?v=_inKs4eeHiI",
      defaultPrice: { regular: 220, silver: 300, gold: 370 }
    },
    godzillaxkongthenewempire: {
      name: "Godzilla x Kong: The New Empire",
      image: SUPABASE_MOVIE_POSTERS.godzillaxkongthenewempire,
      rating: "8.0/10",
      genre: "Action, Sci-Fi",
      formats: "2D / IMAX / 3D",
      languages: "English, Hindi",
      summary: "Godzilla and Kong unite against a massive new threat. The film delivers large-scale action and visual spectacle. A must-watch for monster movie fans.",
      criticRating: "4.0/5",
      highlights: [
        "Titan team-up spectacle drives the blockbuster scale.",
        "Large-scale action is the main theatrical hook.",
        "Designed for monster-movie fans and big screens."
      ],
      trailerUrl: "https://www.youtube.com/watch?v=qqrpMRDuPfc",
      defaultPrice: { regular: 250, silver: 330, gold: 400 }
    },
    rahuketu: {
      name: "Rahu Ketu",
      image: SUPABASE_MOVIE_POSTERS.rahuketu,
      rating: "7.1/10",
      genre: "Comedy, Drama",
      formats: "2D",
      languages: "Hindi",
      summary: "A quirky story involving astrology, fate, and humorous situations. The characters navigate life's unpredictability with wit. A light-hearted entertainer.",
      criticRating: "3.6/5",
      highlights: [
        "Astrology and fate add playful conflict to the story.",
        "Comedy keeps the tone lively and accessible.",
        "A light-hearted entertainer built on quirky situations."
      ],
      trailerUrl: "https://www.youtube.com/watch?v=JeQZW8E5TB8",
      defaultPrice: { regular: 185, silver: 265, gold: 335 }
    }
  };

  const clonePriceSet = (priceSet) => ({
    regular: Number(priceSet?.regular) || FALLBACK_PRICE.regular,
    silver: Number(priceSet?.silver) || FALLBACK_PRICE.silver,
    gold: Number(priceSet?.gold) || FALLBACK_PRICE.gold
  });

  const slugifyMovieId = (value) =>
    String(value || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "")
      .replace(/^\d+/, "");

  const escapeHtml = (value) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const getDefaultPrices = (catalog) => {
    const defaults = {};

    Object.keys(catalog).forEach((movieId) => {
      defaults[movieId] = clonePriceSet(catalog[movieId].defaultPrice);
    });

    return defaults;
  };

  const normalizeMovieEntry = (movie, fallbackId) => ({
    name: String(movie?.name || "Untitled Movie"),
    image: String(movie?.image || defaultMovieCatalog[MOVIE_DISPLAY_ORDER[0]].image),
    rating: String(movie?.rating || "New"),
    votes: String(movie?.votes || "Fresh Listing"),
    duration: String(movie?.duration || "TBA"),
    genre: String(movie?.genre || "Drama"),
    certificate: String(movie?.certificate || "TBA"),
    releaseDate: String(movie?.releaseDate || "Now Showing"),
    formats: String(movie?.formats || "2D"),
    languages: String(movie?.languages || "Hindi"),
    summary: String(movie?.summary || "Movie details will be updated soon."),
    criticRating: String(movie?.criticRating || "New"),
    highlights: Array.isArray(movie?.highlights) && movie.highlights.length
      ? movie.highlights.map((item) => String(item))
      : ["Fresh entry added from the admin dashboard."],
    trailerUrl: String(movie?.trailerUrl || ""),
    defaultPrice: clonePriceSet(movie?.defaultPrice),
    isCustom: Boolean(movie?.isCustom),
    displayOrder: Number.isFinite(Number(movie?.displayOrder))
      ? Math.max(1, Math.round(Number(movie.displayOrder)))
      : getLegacyMovieOrder(fallbackId),
    id: fallbackId
  });

  const normalizeFoodImageUrl = (imageUrl, fallbackId) => {
    const normalized = String(imageUrl || "").trim();
    if (!normalized) {
      return DEFAULT_FOOD_IMAGES[fallbackId] || "";
    }

    return LEGACY_FOOD_IMAGE_ALIASES[normalized] || normalized;
  };

  const normalizeFoodEntry = (item, fallbackId) => ({
    id: fallbackId,
    name: String(item?.name || "Untitled Food Item"),
    category: String(item?.category || "Snacks"),
    price: Number(item?.price) > 0 ? Math.round(Number(item.price)) : 100,
    badge: String(item?.badge || "Fresh"),
    artLabel: String(item?.artLabel || fallbackId || "FOD").trim().slice(0, 3).toUpperCase(),
    image: normalizeFoodImageUrl(item?.image, fallbackId),
    description: String(item?.description || "Fresh snack for your movie time."),
    isCustom: Boolean(item?.isCustom)
  });

  const getFoodPosterMarkup = (item, imageClass = "food-card-image") =>
    item.image
      ? `
          <img
            class="${imageClass}"
            src="${escapeHtml(item.image)}"
            alt="${escapeHtml(item.name)}"
            loading="lazy"
            decoding="async"
            fetchpriority="low"
          >
        `
      : `<div class="food-card-icon">${escapeHtml(item.artLabel)}</div>`;

  const normalizePrices = (rawPrices, catalog) => {
    const defaults = getDefaultPrices(catalog);
    const normalized = {};

    Object.keys(catalog).forEach((movieId) => {
      const incoming = rawPrices?.[movieId];

      if (typeof incoming === "number") {
        normalized[movieId] = {
          regular: incoming,
          silver: incoming + 80,
          gold: incoming + 150
        };
        return;
      }

      normalized[movieId] = {
        regular: Number(incoming?.regular) > 0 ? Math.round(Number(incoming.regular)) : defaults[movieId].regular,
        silver: Number(incoming?.silver) > 0 ? Math.round(Number(incoming.silver)) : defaults[movieId].silver,
        gold: Number(incoming?.gold) > 0 ? Math.round(Number(incoming.gold)) : defaults[movieId].gold
      };
    });

    return normalized;
  };

  const getSession = () => currentSession;

  const setSession = (session) => {
    currentSession = session;
  };

  const clearSession = () => {
    currentSession = null;
  };

  const isRemoteDataEnabled = () => Boolean(supabase) && isSupabaseConfigured();

  const buildSessionFromProfile = (profile, user) => ({
    role: String(profile?.role || "user"),
    name: String(
      profile?.full_name
      || user?.user_metadata?.full_name
      || user?.email?.split("@")[0]
      || "Movie Lover"
    ),
    email: String(profile?.email || user?.email || "")
  });

  const ensureProfile = async (user, fallbackName = "", fallbackRole = "user") => {
    if (!supabase || !user?.id) {
      return null;
    }

    const { data: existingProfile, error: fetchError } = await supabase
      .from("profiles")
      .select("id, full_name, email, role")
      .eq("id", user.id)
      .maybeSingle();

    if (fetchError) {
      throw fetchError;
    }

    if (existingProfile) {
      return existingProfile;
    }

    const profilePayload = {
      id: user.id,
      full_name: String(fallbackName || user.user_metadata?.full_name || user.email?.split("@")[0] || "Movie Lover"),
      email: String(user.email || ""),
      role: fallbackRole
    };

    const { data: insertedProfile, error: insertError } = await supabase
      .from("profiles")
      .upsert(profilePayload, { onConflict: "id" })
      .select("id, full_name, email, role")
      .single();

    if (insertError) {
      throw insertError;
    }

    return insertedProfile;
  };

  const syncSessionFromSupabase = async () => {
    if (!isRemoteDataEnabled()) {
      clearSession();
      return null;
    }

    const {
      data: { session: activeSession }
    } = await supabase.auth.getSession();

    if (!activeSession?.user) {
      clearSession();
      return null;
    }

    const profile = await ensureProfile(activeSession.user);
    const nextSession = buildSessionFromProfile(profile, activeSession.user);
    setSession(nextSession);
    return nextSession;
  };

  const getBackendAccessToken = async () => {
    if (!supabase) {
      throw new Error("Supabase is not configured.");
    }

    await restoreSupabaseSessionFromBridge();
    const {
      data: { session }
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error("Please sign in again to continue.");
    }

    return session.access_token;
  };

  const apiRequest = async (path, options = {}) => {
    const headers = new Headers(options.headers || {});
    const body = options.body;
    const timeoutMs = Number(options.timeoutMs) > 0 ? Number(options.timeoutMs) : 15000;

    if (!(body instanceof FormData) && body !== undefined && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    if (options.auth !== false) {
      headers.set("Authorization", `Bearer ${await getBackendAccessToken()}`);
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);
    let response;

    try {
      response = await fetch(`${BACKEND_API_BASE}${path}`, {
        method: options.method || "GET",
        headers,
        body,
        signal: controller.signal
      });
    } catch (error) {
      if (error?.name === "AbortError") {
        throw new Error("The server is taking too long to respond. Please wait a few seconds and try again.");
      }

      throw error;
    } finally {
      window.clearTimeout(timeoutId);
    }

    let payload = null;

    try {
      payload = await response.json();
    } catch (error) {
      payload = null;
    }

    if (!response.ok) {
      throw new Error(payload?.error || `Request failed with status ${response.status}`);
    }

    return payload;
  };

  const mapMovieRowToEntry = (row) => normalizeMovieEntry({
    name: row.name,
    displayOrder: row.display_order,
    image: row.image_url,
    rating: row.rating,
    votes: row.votes,
    duration: row.duration,
    genre: row.genre,
    certificate: row.certificate,
    releaseDate: row.release_date,
    formats: row.formats,
    languages: row.languages,
    summary: row.summary,
    criticRating: row.critic_rating,
    highlights: Array.isArray(row.highlights) ? row.highlights : [],
    trailerUrl: row.trailer_url,
    defaultPrice: {
      regular: row.regular_price,
      silver: row.silver_price,
      gold: row.gold_price
    },
    isCustom: Boolean(row.is_custom)
  }, row.id);

  const mapFoodRowToEntry = (row) => normalizeFoodEntry({
    name: row.name,
    category: row.category,
    price: row.price,
    badge: row.badge,
    artLabel: row.art_label,
    image: row.image_url,
    description: row.description,
    isCustom: Boolean(row.is_custom)
  }, row.id);

  const mapMovieEntryToRow = (movieId, movieData) => ({
    id: movieId,
    name: movieData.name,
    display_order: Number.isFinite(Number(movieData.displayOrder))
      ? Math.max(1, Math.round(Number(movieData.displayOrder)))
      : null,
    image_url: movieData.image,
    rating: movieData.rating,
    votes: movieData.votes,
    duration: movieData.duration,
    genre: movieData.genre,
    certificate: movieData.certificate,
    release_date: movieData.releaseDate,
    formats: movieData.formats,
    languages: movieData.languages,
    summary: movieData.summary,
    critic_rating: movieData.criticRating,
    highlights: Array.isArray(movieData.highlights) ? movieData.highlights : [],
    trailer_url: movieData.trailerUrl,
    regular_price: movieData.defaultPrice.regular,
    silver_price: movieData.defaultPrice.silver,
    gold_price: movieData.defaultPrice.gold,
    is_custom: Boolean(movieData.isCustom),
    is_active: true
  });

  const mapFoodEntryToRow = (itemId, itemData) => ({
    id: itemId,
    name: itemData.name,
    category: itemData.category,
    price: itemData.price,
    badge: itemData.badge,
    art_label: itemData.artLabel,
    image_url: itemData.image,
    description: itemData.description,
    is_custom: Boolean(itemData.isCustom),
    is_active: true
  });

  const mapShowEntryToRow = (show) => ({
    id: show.showId,
    movie_id: show.movieId,
    hall_id: show.hallId,
    show_date: show.date,
    show_time: show.time,
    format: show.format
  });

  const fillMissingMovieSchedules = (catalog, prices, shows) => {
    const scheduledMovieIds = new Set(shows.map((show) => show.movieId));
    const missingCatalogEntries = Object.entries(catalog)
      .filter(([movieId]) => !scheduledMovieIds.has(movieId));

    if (!missingCatalogEntries.length) {
      return shows;
    }

    const missingCatalog = Object.fromEntries(missingCatalogEntries);
    const generatedShows = buildShowCatalog(missingCatalog, prices);
    return [...shows, ...generatedShows];
  };

  const getOrderedMovieEntries = (catalog) =>
    Object.entries(catalog).sort(([movieIdA, movieDataA], [movieIdB, movieDataB]) => {
      const orderA = Number.isFinite(Number(movieDataA?.displayOrder))
        ? Number(movieDataA.displayOrder)
        : getLegacyMovieOrder(movieIdA);
      const orderB = Number.isFinite(Number(movieDataB?.displayOrder))
        ? Number(movieDataB.displayOrder)
        : getLegacyMovieOrder(movieIdB);

      if (orderA !== undefined || orderB !== undefined) {
        if (orderA === undefined || orderA === null) {
          return 1;
        }

        if (orderB === undefined || orderB === null) {
          return -1;
        }

        return orderA - orderB;
      }

      return String(movieDataA?.name || movieIdA).localeCompare(String(movieDataB?.name || movieIdB));
    });

  const orderMovieCatalog = (catalog) => Object.fromEntries(getOrderedMovieEntries(catalog));
  const getNextMovieDisplayOrder = (catalog) => Object.values(catalog)
    .reduce((max, movieData) => {
      const value = Number(movieData?.displayOrder);
      return Number.isFinite(value) ? Math.max(max, value) : max;
    }, 0) + 1;

  const loadSupabaseAppState = async () => {
    if (!isRemoteDataEnabled()) {
      throw new Error(SUPABASE_SETUP_MESSAGE);
    }

    const [moviesResponse, foodResponse, showsResponse] = await Promise.all([
      supabase.from("movies").select("*").eq("is_active", true),
      supabase.from("food_items").select("*").eq("is_active", true).order("name"),
      supabase.from("shows").select("*").order("show_date").order("show_time")
    ]);

    if (moviesResponse.error) {
      throw moviesResponse.error;
    }

    if (foodResponse.error) {
      throw foodResponse.error;
    }

    if (showsResponse.error) {
      throw showsResponse.error;
    }

    const catalog = {};
    moviesResponse.data.forEach((row) => {
      catalog[row.id] = mapMovieRowToEntry(row);
    });

    const menu = {};
    foodResponse.data.forEach((row) => {
      menu[row.id] = mapFoodRowToEntry(row);
    });

    const orderedCatalog = orderMovieCatalog(catalog);

    const remotePrices = {};
    Object.entries(orderedCatalog).forEach(([movieId, movieData]) => {
      remotePrices[movieId] = clonePriceSet(movieData.defaultPrice);
    });

    const shows = showsResponse.data.map((row) => hydrateShowEntry({
      showId: row.id,
      movieId: row.movie_id,
      hallId: row.hall_id,
      date: row.show_date,
      time: row.show_time,
      format: row.format
    }, remotePrices));

    return {
      movieCatalog: orderedCatalog,
      foodMenu: menu,
      prices: remotePrices,
      showCatalog: fillMissingMovieSchedules(orderedCatalog, remotePrices, shows)
    };
  };

  const buildDefaultFoodMenuMap = () => {
    const menu = {};

    DEFAULT_FOOD_MENU.forEach((item) => {
      menu[item.id] = normalizeFoodEntry(item, item.id);
    });

    return menu;
  };

  const buildDefaultAppState = () => {
    const movieCatalog = {};

    Object.entries(defaultMovieCatalog).forEach(([movieId, movieData]) => {
      movieCatalog[movieId] = normalizeMovieEntry(movieData, movieId);
    });

    const orderedMovieCatalog = orderMovieCatalog(movieCatalog);
    const prices = normalizePrices({}, orderedMovieCatalog);
    const showCatalog = buildShowCatalog(orderedMovieCatalog, prices);

    return {
      movieCatalog: orderedMovieCatalog,
      foodMenu: buildDefaultFoodMenuMap(),
      prices,
      showCatalog
    };
  };

  const getBookedSeatIdsForShow = async (showId) => {
    if (!isRemoteDataEnabled() || !showId) {
      return [];
    }

    const normalizeSeatId = (seat) => String(seat?.id || seat?.label || seat || "")
      .trim()
      .toUpperCase();

    let bookings = [];

    try {
      const response = await apiRequest(`/bookings/by-show/${encodeURIComponent(showId)}`);
      bookings = Array.isArray(response) ? response : [];
    } catch (error) {
      console.error("Unable to fetch booked seats from backend.", error);

      const { data, error: supabaseError } = await supabase
        .from("bookings")
        .select("seats")
        .eq("show_id", showId);

      if (supabaseError) {
        console.error("Unable to fetch booked seats from Supabase.", supabaseError);
        return [];
      }

      bookings = Array.isArray(data) ? data : [];
    }

    const remoteSeatIds = bookings.flatMap((booking) =>
      Array.isArray(booking.seats)
        ? booking.seats.map((seat) => normalizeSeatId(seat)).filter(Boolean)
        : []
    );

    return [...new Set(remoteSeatIds)];
  };

  const upsertMoviesToSupabase = async (movieRows) => {
    if (!isRemoteDataEnabled() || !movieRows.length) {
      return;
    }

    await apiRequest("/movies/bulk", {
      method: "POST",
      body: JSON.stringify({ movies: movieRows })
    });
  };

  const upsertFoodItemsToSupabase = async (foodRows) => {
    if (!isRemoteDataEnabled() || !foodRows.length) {
      return;
    }

    await apiRequest("/food/bulk", {
      method: "POST",
      body: JSON.stringify({ items: foodRows })
    });
  };

  const upsertShowsToSupabase = async (showRows) => {
    if (!isRemoteDataEnabled() || !showRows.length) {
      return;
    }

    await apiRequest("/shows/bulk", {
      method: "POST",
      body: JSON.stringify({ shows: showRows })
    });
  };

  const getYouTubeVideoId = (url) => {
    const value = String(url || "").trim();

    if (!value) {
      return "";
    }

    try {
      const parsedUrl = new URL(value);
      let videoId = "";

      if (parsedUrl.hostname.includes("youtu.be")) {
        videoId = parsedUrl.pathname.replace("/", "").trim();
      } else if (parsedUrl.hostname.includes("youtube.com")) {
        videoId = parsedUrl.searchParams.get("v") || "";

        if (!videoId && parsedUrl.pathname.includes("/embed/")) {
          videoId = parsedUrl.pathname.split("/embed/")[1]?.split("/")[0] || "";
        }
      }

      if (!videoId) {
        return "";
      }

      return videoId;
    } catch (error) {
      return "";
    }
  };

  const getYouTubeWatchUrl = (url) => {
    const videoId = getYouTubeVideoId(url);
    return videoId ? `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}` : "";
  };

  const getYouTubeEmbedUrl = (url) => {
    const videoId = getYouTubeVideoId(url);

    if (!videoId) {
      return "";
    }

    try {
      const embedHost = "https://www.youtube.com/embed";
      const params = new URLSearchParams({
        autoplay: "1",
        rel: "0",
        modestbranding: "1",
        playsinline: "1"
      });

      return `${embedHost}/${encodeURIComponent(videoId)}?${params.toString()}`;
    } catch (error) {
      return "";
    }
  };

  const replaceTrailerFrameSource = (frame, url) => {
    if (!frame) {
      return;
    }

    try {
      frame.contentWindow.location.replace(url);
    } catch (error) {
      frame.src = url;
    }
  };

  const closeTrailerModal = () => {
    const modal = document.getElementById("trailerModal");

    if (!modal) {
      return;
    }

    const frame = modal.querySelector("#trailerModalFrame");
    if (frame) {
      replaceTrailerFrameSource(frame, "about:blank");
    }

    modal.hidden = true;
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("trailer-modal-open");
  };

  const getShowStorageDetails = (activeShow) => ({
    showId: activeShow?.showId || "",
    showDate: activeShow?.date || "",
    showTimeValue: activeShow?.time || "",
    dateLabel: activeShow?.dateLabel || "",
    timeLabel: activeShow?.timeLabel || "",
    hallName: activeShow?.hallName || "",
    format: activeShow?.format || ""
  });

  const buildBookingDraft = (movieId, activeShow, seats = [], snacks = []) => ({
    movieId,
    movieName: movieCatalog[movieId]?.name || movieId,
    show: getShowStorageDetails(activeShow),
    seats,
    snacks
  });

  const ensureTrailerModal = () => {
    let modal = document.getElementById("trailerModal");

    if (modal) {
      return modal;
    }

    modal = document.createElement("div");
    modal.id = "trailerModal";
    modal.className = "trailer-modal";
    modal.hidden = true;
    modal.setAttribute("aria-hidden", "true");
    modal.innerHTML = `
      <div class="trailer-modal-backdrop" data-trailer-close></div>
      <div class="trailer-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="trailerModalTitle">
        <button type="button" class="trailer-modal-close" data-trailer-close aria-label="Close trailer">&times;</button>
        <div class="trailer-modal-header">
          <p class="trailer-modal-kicker">Now Playing</p>
          <h3 id="trailerModalTitle">Trailer</h3>
        </div>
        <div class="trailer-modal-frame-wrap">
          <iframe
            id="trailerModalFrame"
            class="trailer-modal-frame"
            src="about:blank"
            title="Trailer player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerpolicy="strict-origin-when-cross-origin"
            allowfullscreen
          ></iframe>
        </div>
        <a id="trailerModalFallback" class="trailer-modal-fallback" href="#" target="_blank" rel="noopener noreferrer">
          If this trailer is blocked here, open it on YouTube
        </a>
      </div>
    `;

    document.body.appendChild(modal);
    const backdrop = modal.querySelector(".trailer-modal-backdrop");
    const closeButton = modal.querySelector(".trailer-modal-close");
    const dialog = modal.querySelector(".trailer-modal-dialog");

    modal.addEventListener("pointerdown", (event) => {
      if (event.target instanceof Element && event.target.closest("[data-trailer-close]")) {
        event.preventDefault();
        closeTrailerModal();
      }
    }, true);

    if (backdrop) {
      backdrop.addEventListener("click", closeTrailerModal);
    }

    if (closeButton) {
      closeButton.addEventListener("click", closeTrailerModal);
    }

    modal.addEventListener("click", (event) => {
      if (event.target instanceof Element && event.target.closest("[data-trailer-close]")) {
        closeTrailerModal();
      }
    });

    if (dialog) {
      dialog.addEventListener("click", (event) => {
        if (event.target instanceof Element && event.target.closest("[data-trailer-close]")) {
          return;
        }

        event.stopPropagation();
      });
    }

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !modal.hidden) {
        closeTrailerModal();
      }
    });

    return modal;
  };

  const openTrailerModal = (url, title = "Trailer") => {
    const embedUrl = getYouTubeEmbedUrl(url);

    if (!embedUrl) {
      alert("This trailer link is not available for the in-page player yet.");
      return;
    }

    const modal = ensureTrailerModal();
    const frame = modal.querySelector("#trailerModalFrame");
    const titleNode = modal.querySelector("#trailerModalTitle");
    const fallbackLink = modal.querySelector("#trailerModalFallback");

    if (frame) {
      replaceTrailerFrameSource(frame, embedUrl);
    }

    if (titleNode) {
      titleNode.textContent = title;
    }

    if (fallbackLink) {
      fallbackLink.href = getYouTubeWatchUrl(url) || url;
    }

    modal.hidden = false;
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("trailer-modal-open");
  };

  const closeCustomSelects = (exceptShell = null) => {
    document.querySelectorAll(".custom-select-shell.is-open").forEach((shell) => {
      if (exceptShell && shell === exceptShell) {
        return;
      }

      shell.classList.remove("is-open");
      const trigger = shell.querySelector(".custom-select-trigger");
      if (trigger) {
        trigger.setAttribute("aria-expanded", "false");
      }
    });
  };

  const enhanceCustomSelects = (root = document) => {
    root.querySelectorAll(".custom-select-shell").forEach((node) => node.remove());

    root.querySelectorAll("select").forEach((select) => {
      if (select.dataset.nativeSelect === "true") {
        return;
      }

      select.classList.add("native-select-hidden");
      const shell = document.createElement("div");
      shell.className = "custom-select-shell";

      const trigger = document.createElement("button");
      trigger.type = "button";
      trigger.className = "custom-select-trigger";
      trigger.setAttribute("aria-haspopup", "listbox");
      trigger.setAttribute("aria-expanded", "false");

      const triggerLabel = document.createElement("span");
      triggerLabel.className = "custom-select-trigger-label";
      const triggerIcon = document.createElement("span");
      triggerIcon.className = "custom-select-trigger-icon";
      triggerIcon.innerHTML = "&#9662;";

      trigger.appendChild(triggerLabel);
      trigger.appendChild(triggerIcon);

      const menu = document.createElement("div");
      menu.className = "custom-select-menu";
      menu.setAttribute("role", "listbox");

      const syncTriggerLabel = () => {
        const selectedOption = select.options[select.selectedIndex];
        triggerLabel.textContent = selectedOption ? selectedOption.textContent : "Select";
      };

      const buildOptions = () => {
        menu.innerHTML = "";

        [...select.options].forEach((option) => {
          const optionButton = document.createElement("button");
          optionButton.type = "button";
          optionButton.className = `custom-select-option${option.selected ? " is-selected" : ""}`;
          optionButton.dataset.value = option.value;
          optionButton.textContent = option.textContent;
          optionButton.disabled = option.disabled;
          optionButton.setAttribute("role", "option");
          optionButton.setAttribute("aria-selected", option.selected ? "true" : "false");
          optionButton.addEventListener("click", () => {
            select.value = option.value;
            select.dispatchEvent(new Event("change", { bubbles: true }));
            closeCustomSelects();
          });
          menu.appendChild(optionButton);
        });
      };

      trigger.addEventListener("click", () => {
        const isOpen = shell.classList.contains("is-open");
        closeCustomSelects(shell);
        shell.classList.toggle("is-open", !isOpen);
        trigger.setAttribute("aria-expanded", String(!isOpen));
      });

      select.addEventListener("change", () => {
        syncTriggerLabel();
        buildOptions();
      });

      syncTriggerLabel();
      buildOptions();
      shell.appendChild(trigger);
      shell.appendChild(menu);
      select.insertAdjacentElement("afterend", shell);
    });
  };

  const formatDisplayDate = (isoDate) => {
    const date = new Date(`${isoDate}T00:00:00`);

    return new Intl.DateTimeFormat("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short"
    }).format(date);
  };

  const formatShowTime = (timeValue) => {
    const digits = String(timeValue || "").padStart(4, "0");
    const hours = Number(digits.slice(0, 2));
    const minutes = Number(digits.slice(2));
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);

    return new Intl.DateTimeFormat("en-IN", {
      hour: "numeric",
      minute: "2-digit"
    }).format(date);
  };

  const getMovieTypes = (movieId) => movieTypeMap[movieId] || ["2D"];

  const getWeekdayName = (isoDate) =>
    new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(new Date(`${isoDate}T00:00:00`));

  const toIsoLocalDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const createStorageSuffix = (movieId, showId) => String(showId || movieId);

  const parseJsonParam = (value, fallback = null) => {
    try {
      return value ? JSON.parse(value) : fallback;
    } catch (error) {
      return fallback;
    }
  };

  const serializeBookingDraft = (draft) => JSON.stringify(draft);

  const buildBookingUrl = (page, movieId, showId, draft) => {
    const nextParams = new URLSearchParams({
      movie: movieId,
      show: showId
    });

    if (draft) {
      nextParams.set("draft", serializeBookingDraft(draft));
    }

    return `${page}?${nextParams.toString()}`;
  };

  const getPriceMultiplier = (format) => {
    if (format === "3D") {
      return { regular: 20, silver: 30, gold: 40 };
    }

    if (format === "IMAX") {
      return { regular: 35, silver: 50, gold: 65 };
    }

    if (format === "4DX") {
      return { regular: 50, silver: 70, gold: 90 };
    }

    return { regular: 0, silver: 0, gold: 0 };
  };

  const normalizeTimeValue = (value) => {
    const text = String(value ?? "").trim();

    if (/^\d{1,2}:\d{2}$/.test(text)) {
      const [hours, minutes] = text.split(":");
      return Number(hours) * 100 + Number(minutes);
    }

    return Number(text) || 900;
  };

  const createShowId = (movieId, isoDate, hallId, format, time) =>
    `${movieId}-${isoDate}-${hallId}-${format}-${String(time).padStart(4, "0")}`;

  const hydrateShowEntry = (show, prices) => {
    const hallId = Number(show.hallId) || 1;
    const hallData = hallCatalog[hallId] || hallCatalog[1];
    const time = normalizeTimeValue(show.time);
    const date = String(show.date || toIsoLocalDate(new Date()));
    const format = String(show.format || "2D").toUpperCase();
    const movieId = String(show.movieId || "");
    const weekdayName = getWeekdayName(date);

    return {
      showId: String(show.showId || createShowId(movieId, date, hallId, format, time)),
      movieId,
      hallId,
      hallName: hallData.name,
      date,
      dateLabel: formatDisplayDate(date),
      weekdayName,
      time,
      timeLabel: formatShowTime(time),
      format,
      seatGroups: hallData.seatGroups,
      hallClasses: hallData.classes,
      priceSet: getSchedulePriceSet(movieId, prices, format, weekdayName)
    };
  };

  const getSchedulePriceSet = (movieId, prices, format, weekdayName) => {
    const basePrice = prices[movieId] || clonePriceSet(defaultMovieCatalog[movieId]?.defaultPrice);
    const dayPricing = priceListingByDay[weekdayName] || priceListingByDay.Monday;
    const weekdayBoost = Number(dayPricing?.[format]) || 0;
    const formatBoost = getPriceMultiplier(format);

    return {
      regular: basePrice.regular + weekdayBoost + formatBoost.regular,
      silver: basePrice.silver + weekdayBoost + formatBoost.silver,
      gold: basePrice.gold + weekdayBoost + formatBoost.gold
    };
  };

  const buildShowCatalog = (catalog, prices) => {
    const timeSlots = [930, 1230, 1630, 2015];
    const movieIds = Object.keys(catalog);

    return movieIds.flatMap((movieId, movieIndex) => {
      return Array.from({ length: 5 }, (_, dayIndex) => {
        const date = new Date();
        date.setHours(0, 0, 0, 0);
        date.setDate(date.getDate() + dayIndex);
        const isoDate = toIsoLocalDate(date);
        const weekdayName = getWeekdayName(isoDate);
        const movieTypes = getMovieTypes(movieId);

        return timeSlots.map((time, slotIndex) => {
          const hallId = ((movieIndex + dayIndex + slotIndex) % 3) + 1;
          const format = movieTypes[slotIndex % movieTypes.length];
          return hydrateShowEntry({
            showId: createShowId(movieId, isoDate, hallId, format, time),
            movieId,
            hallId,
            date: isoDate,
            time,
            format
          }, prices);
        });
      }).flat();
    });
  };

  const getShowsForMovie = (shows, movieId) =>
    shows.filter((show) => show.movieId === movieId);

  const groupShowsByDate = (shows) => {
    const groups = new Map();

    shows.forEach((show) => {
      if (!groups.has(show.date)) {
        groups.set(show.date, []);
      }

      groups.get(show.date).push(show);
    });

    return [...groups.entries()].map(([date, entries]) => ({
      date,
      dateLabel: entries[0]?.dateLabel || formatDisplayDate(date),
      shows: entries.sort((a, b) => a.time - b.time)
    }));
  };

  const getSequentialRowLabels = (count, startIndex = 0) =>
    Array.from({ length: count }, (_, index) => String.fromCharCode(65 + startIndex + index));

  const getRegularRowSizes = (count) => {
    const rowCount = Math.ceil(count / 12);
    const baseSize = Math.floor(count / rowCount);
    const remainder = count % rowCount;

    return Array.from({ length: rowCount }, (_, index) => baseSize + (index < remainder ? 1 : 0)).filter(Boolean);
  };

  const getCompactRowSizes = (count, rowCount) => {
    const baseSize = Math.floor(count / rowCount);
    const remainder = count % rowCount;

    return Array.from({ length: rowCount }, (_, index) => baseSize + (index < remainder ? 1 : 0)).filter(Boolean);
  };

  const buildSeatGroupLayouts = (seatGroups) => {
    const regularRows = getRegularRowSizes(seatGroups.regular);
    const silverRows = getCompactRowSizes(seatGroups.silver, 4);
    const goldRows = getCompactRowSizes(seatGroups.gold, 2);
    let rowIndex = 0;

    const withLabels = (rows) => {
      const labels = getSequentialRowLabels(rows.length, rowIndex);
      rowIndex += rows.length;

      return rows.map((size, index) => ({
        size,
        rowLabel: labels[index]
      }));
    };

    return {
      regular: withLabels(regularRows),
      silver: withLabels(silverRows),
      gold: withLabels(goldRows)
    };
  };

  const buildStorageFileName = (prefix, file) => {
    const originalName = String(file?.name || "upload").trim().replace(/\s+/g, "-");
    const sanitizedName = originalName.replace(/[^a-zA-Z0-9._-]/g, "");
    return `${prefix}/${Date.now()}-${sanitizedName || "upload"}`;
  };

  const uploadMoviePosterToSupabase = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    const result = await apiRequest("/upload/movie-poster", {
      method: "POST",
      body: formData
    });

    return result.public_url;
  };

  const uploadFoodPosterToSupabase = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    const result = await apiRequest("/upload/food-image", {
      method: "POST",
      body: formData
    });

    return result.public_url;
  };

  const getStoragePathFromPublicUrl = (publicUrl, bucketName) => {
    const value = String(publicUrl || "").trim();

    if (!value) {
      return "";
    }

    try {
      const url = new URL(value);
      const marker = `/storage/v1/object/public/${bucketName}/`;
      const markerIndex = url.pathname.indexOf(marker);

      if (markerIndex === -1) {
        return "";
      }

      return decodeURIComponent(url.pathname.slice(markerIndex + marker.length));
    } catch (error) {
      return "";
    }
  };

  const removeStorageObjectFromPublicUrl = async (publicUrl, bucketName) => {
    if (!bucketName) {
      return;
    }

    const storagePath = getStoragePathFromPublicUrl(publicUrl, bucketName);

    if (!storagePath) {
      return;
    }

    await apiRequest("/upload/file", {
      method: "DELETE",
      body: JSON.stringify({ path: storagePath })
    });
  };

  let scrollRevealObserver;
  let lastScrollY = window.scrollY;
  let lastScrollTime = performance.now();
  let scrollSpeedFrame;
  const revealSelector = [
    ".cinema-hero",
    ".cinema-hero-panel",
    ".auth-strip",
    ".swiper",
    ".now-showing",
    ".movies-subtitle",
    ".movie-card",
    ".showtime-hero",
    ".showtime-day-card",
    ".show-selection-card",
    ".seat-layout",
    ".booking-summary",
    ".screen-wrap",
    ".seat-section",
    ".booking-choice-card",
    ".details-card",
    ".details-block",
    ".details-fact",
    ".food-hero",
    ".food-filters",
    ".food-card",
    ".food-cart-card",
    ".confirmation",
    ".login-card",
    ".admin-view-switch-wrap",
    ".admin-section",
    ".movie-price-card"
  ].join(", ");

  const updateRevealSpeedByScroll = () => {
    const now = performance.now();
    const currentScrollY = window.scrollY;
    const deltaY = Math.abs(currentScrollY - lastScrollY);
    const deltaTime = Math.max(now - lastScrollTime, 16);
    const pixelsPerMillisecond = deltaY / deltaTime;
    const speedRatio = Math.min(pixelsPerMillisecond / 1.8, 1);
    const durationScale = 1 - (speedRatio * 0.35);
    const staggerScale = 1 - (speedRatio * 0.4);

    document.documentElement.style.setProperty("--reveal-duration-scale", durationScale.toFixed(3));
    document.documentElement.style.setProperty("--reveal-stagger-scale", staggerScale.toFixed(3));

    lastScrollY = currentScrollY;
    lastScrollTime = now;
    scrollSpeedFrame = null;
  };

  const scheduleRevealSpeedUpdate = () => {
    if (scrollSpeedFrame) {
      return;
    }

    scrollSpeedFrame = window.requestAnimationFrame(updateRevealSpeedByScroll);
  };

  document.documentElement.style.setProperty("--reveal-duration-scale", "1");
  document.documentElement.style.setProperty("--reveal-stagger-scale", "1");
  window.addEventListener("scroll", scheduleRevealSpeedUpdate, { passive: true });
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".custom-select-shell")) {
      closeCustomSelects();
    }
  });

  const initScrollReveal = (root = document) => {
    const nodes = [...root.querySelectorAll(revealSelector)];

    if (!nodes.length) {
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      nodes.forEach((node) => node.classList.add("is-visible"));
      return;
    }

    if (!scrollRevealObserver && "IntersectionObserver" in window) {
      scrollRevealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          const revealDelay = entry.target.dataset.revealDelay || "0ms";

          if (!entry.isIntersecting) {
            entry.target.style.setProperty("--reveal-delay", "0ms");
            entry.target.classList.remove("is-visible");
            return;
          }

          entry.target.style.setProperty("--reveal-delay", revealDelay);
          entry.target.classList.add("is-visible");
        });
      }, {
        threshold: 0.16,
        rootMargin: "0px 0px -8% 0px"
      });
    }

    nodes.forEach((node, index) => {
      if (node.dataset.revealReady === "true") {
        return;
      }

      node.dataset.revealReady = "true";
      node.dataset.revealDelay = `calc(${Math.min(index % 3, 2) * 36}ms * var(--reveal-stagger-scale, 1))`;
      node.classList.add("reveal-on-scroll");
      node.style.setProperty("--reveal-delay", node.dataset.revealDelay);

      if (scrollRevealObserver) {
        scrollRevealObserver.observe(node);
      } else {
        node.classList.add("is-visible");
      }
    });
  };

  const renderHomeMovieGrid = (catalog) => {
    const movieGrid = document.getElementById("movieGrid");
    const movieFilters = document.getElementById("movieFilters");
    const homeScrollStateKey = "movieDekhoHomeScrollState";
    let didRestoreHomeScroll = false;

    if (!movieGrid) {
      return;
    }

    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    const saveHomeScrollState = (movieId) => {
      try {
        sessionStorage.setItem(homeScrollStateKey, JSON.stringify({
          movieId,
          y: window.scrollY,
          createdAt: Date.now()
        }));
      } catch (error) {
        // Ignore storage failures so navigation still works.
      }
    };

    const restoreHomeScrollState = () => {
      if (didRestoreHomeScroll) {
        return;
      }

      didRestoreHomeScroll = true;

      let savedState = null;
      try {
        savedState = JSON.parse(sessionStorage.getItem(homeScrollStateKey) || "null");
        sessionStorage.removeItem(homeScrollStateKey);
      } catch (error) {
        savedState = null;
      }

      if (!savedState || Date.now() - Number(savedState.createdAt || 0) > 30 * 60 * 1000) {
        return;
      }

      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          const card = savedState.movieId
            ? [...movieGrid.querySelectorAll("[data-movie-card]")]
                .find((node) => node.dataset.movieCard === savedState.movieId)
            : null;

          if (card) {
            card.scrollIntoView({ block: "center", inline: "nearest", behavior: "auto" });
            return;
          }

          window.scrollTo({ top: Number(savedState.y) || 0, behavior: "auto" });
        });
      });
    };

    const getMovieGenres = (movieData) =>
      String(movieData?.genre || "")
        .split(",")
        .map((genre) => genre.trim())
        .filter(Boolean);

    const genreOrder = [
      "Action",
      "Drama",
      "Romance",
      "Thriller",
      "Comedy",
      "Horror",
      "Crime",
      "Adventure",
      "Fantasy",
      "Sci-Fi",
      "Mystery",
      "Family",
      "Animation",
      "Biography",
      "Historical",
      "Musical",
      "Sports"
    ];
    const movieEntries = getOrderedMovieEntries(catalog);
    const discoveredGenres = new Set();

    movieEntries.forEach(([, movieData]) => {
      getMovieGenres(movieData).forEach((genre) => discoveredGenres.add(genre));
    });

    const genres = [
      "All",
      ...genreOrder.filter((genre) => discoveredGenres.has(genre)),
      ...[...discoveredGenres]
        .filter((genre) => !genreOrder.includes(genre))
        .sort((a, b) => a.localeCompare(b))
    ];

    let activeGenre = "All";

    const renderMovieCards = () => {
      const visibleEntries = movieEntries.filter(([, movieData]) =>
        activeGenre === "All" || getMovieGenres(movieData).includes(activeGenre)
      );

      movieGrid.innerHTML = visibleEntries.length
        ? visibleEntries.map(([movieId, movieData]) => `
            <div class="movie-card" data-movie-card="${escapeHtml(movieId)}" data-details-href="movie-details.html?movie=${encodeURIComponent(movieId)}">
              <img class="movie-card-reveal-item" src="${escapeHtml(movieData.image)}" alt="${escapeHtml(movieData.name)} poster">
              <h3 class="movie-card-reveal-item">${escapeHtml(movieData.name)}</h3>
              <p class="movie-genre movie-card-reveal-item">${escapeHtml(getMovieGenres(movieData).join(" | "))}</p>
              <p class="movie-price movie-card-reveal-item" data-movie-price="${escapeHtml(movieId)}"></p>
              <a href="movie-details.html?movie=${encodeURIComponent(movieId)}" class="details-link movie-card-reveal-item" data-home-nav-movie="${escapeHtml(movieId)}">View Details</a>
              <a href="showtime.html?movie=${encodeURIComponent(movieId)}" class="book-link movie-card-reveal-item" data-home-nav-movie="${escapeHtml(movieId)}">Book Tickets</a>
            </div>
          `).join("")
        : '<p class="movie-grid-empty">No movies matched this genre.</p>';

      updateVisiblePrices(prices);
      movieGrid.querySelectorAll("[data-home-nav-movie]").forEach((link) => {
        link.addEventListener("click", () => {
          saveHomeScrollState(link.dataset.homeNavMovie || "");
        });
      });
      bindMovieCardLinks(saveHomeScrollState);
      attachBookLinkGuards();
      initScrollReveal(movieGrid);
      restoreHomeScrollState();
    };

    if (movieFilters) {
      const renderMovieFilters = () => {
        movieFilters.innerHTML = "";

        genres.forEach((genre) => {
          const button = document.createElement("button");
          button.type = "button";
          button.className = `movie-filter-chip${genre === activeGenre ? " active" : ""}`;
          button.textContent = genre;
          button.addEventListener("click", () => {
            activeGenre = genre;
            renderMovieFilters();
            renderMovieCards();
          });
          movieFilters.appendChild(button);
        });
      };

      renderMovieFilters();
    }

    renderMovieCards();
  };

  const renderAdminPriceGrid = (catalog, prices) => {
    const priceGrid = document.getElementById("adminPriceGrid");

    if (!priceGrid) {
      return;
    }

    priceGrid.innerHTML = getOrderedMovieEntries(catalog)
      .map(([movieId, movieData]) => {
        const priceSet = prices[movieId] || clonePriceSet(movieData.defaultPrice);

        return `
          <section class="movie-price-card">
            <img src="${escapeHtml(movieData.image)}" alt="${escapeHtml(movieData.name)} poster" class="admin-movie-poster">
            <div class="movie-price-card-body">
              <div class="movie-price-card-head">
                <div>
                  <span class="admin-movie-badge">${movieData.isCustom ? "Custom Movie" : "Default Movie"}</span>
                  <h3>${escapeHtml(movieData.name)}</h3>
                </div>
                <button type="button" class="movie-delete-btn" data-delete-movie="${escapeHtml(movieId)}">Remove</button>
              </div>
              <p>${escapeHtml(movieData.genre)} | ${escapeHtml(movieData.languages)}</p>
              <div class="price-tier-grid admin-price-tier-grid">
                <label class="price-field" for="${escapeHtml(movieId)}DisplayOrder">Home Order
                  <input id="${escapeHtml(movieId)}DisplayOrder" name="${escapeHtml(movieId)}_display_order" type="number" min="1" value="${Number(movieData.displayOrder) || ""}" required>
                </label>
              </div>
              <div class="price-tier-grid">
                <label class="price-field" for="${escapeHtml(movieId)}RegularPrice">Regular
                  <input id="${escapeHtml(movieId)}RegularPrice" name="${escapeHtml(movieId)}_regular" type="number" min="1" value="${priceSet.regular}" required>
                </label>
                <label class="price-field" for="${escapeHtml(movieId)}SilverPrice">Silver
                  <input id="${escapeHtml(movieId)}SilverPrice" name="${escapeHtml(movieId)}_silver" type="number" min="1" value="${priceSet.silver}" required>
                </label>
                <label class="price-field" for="${escapeHtml(movieId)}GoldPrice">Gold
                  <input id="${escapeHtml(movieId)}GoldPrice" name="${escapeHtml(movieId)}_gold" type="number" min="1" value="${priceSet.gold}" required>
                </label>
              </div>
            </div>
          </section>
        `;
      })
      .join("");

    initScrollReveal(priceGrid);
  };

  const updateVisiblePrices = (prices) => {
    document.querySelectorAll("[data-movie-price]").forEach((node) => {
      const movieId = node.dataset.moviePrice;
      const priceSet = prices[movieId];
      node.textContent = priceSet ? `Regular: Rs. ${priceSet.regular}` : "Regular: Rs. 0";
    });
  };

  const attachBookLinkGuards = () => {
    document.querySelectorAll(".book-link").forEach((link) => {
      if (link.dataset.bookGuardBound === "true") {
        return;
      }

      link.dataset.bookGuardBound = "true";
      link.addEventListener("click", (event) => {
        const activeSession = getSession();

        if (activeSession && activeSession.role === "user") {
          return;
        }

        event.preventDefault();
        const redirectTarget = encodeURIComponent(link.getAttribute("href"));
        window.location.href = `user-login.html?redirect=${redirectTarget}`;
      });
    });
  };

  const params = new URLSearchParams(window.location.search);
  let syncedSession = null;
  let movieCatalog = {};
  let prices = {};
  let showCatalog = [];
  let foodMenu = {};
  let isUsingFallbackData = false;

  const initSwiperIfAvailable = () => {
    if (!document.querySelector(".mySwiper") || typeof window.Swiper !== "function") {
      return;
    }

    if (document.querySelector(".mySwiper")?.dataset.swiperReady === "true") {
      return;
    }

    document.querySelector(".mySwiper").dataset.swiperReady = "true";
    new window.Swiper(".mySwiper", {
      direction: "horizontal",
      loop: true,
      autoplay: {
        delay: 3000,
        disableOnInteraction: false
      },
      pagination: { el: ".swiper-pagination" },
      navigation: {
        nextEl: ".swiper-button-next",
        prevEl: ".swiper-button-prev"
      }
    });
  };

  const bindPosterLinks = () => {
    document.querySelectorAll(".poster-link, .poster-media-link").forEach((link) => {
      if (link.dataset.trailerBound === "true") {
        return;
      }

      link.dataset.trailerBound = "true";
      link.addEventListener("click", (event) => {
        event.preventDefault();
        openTrailerModal(link.getAttribute("href"), link.dataset.trailerName || "Trailer");
      });
    });
  };

  const bindMovieCardLinks = (saveHomeScrollState) => {
    document.querySelectorAll("[data-movie-card]").forEach((card) => {
      if (card.dataset.cardNavBound === "true") {
        return;
      }

      card.dataset.cardNavBound = "true";
      card.tabIndex = 0;
      card.setAttribute("role", "link");

      const openDetailsPage = () => {
        const detailsHref = card.dataset.detailsHref;
        if (!detailsHref) {
          return;
        }

        saveHomeScrollState(card.dataset.movieCard || "");
        window.location.href = detailsHref;
      };

      card.addEventListener("click", (event) => {
        if (event.target instanceof Element && event.target.closest("a, button, input, textarea, select, label")) {
          return;
        }

        openDetailsPage();
      });

      card.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") {
          return;
        }

        if (event.target instanceof Element && event.target.closest("a, button, input, textarea, select, label")) {
          return;
        }

        event.preventDefault();
        openDetailsPage();
      });
    });
  };

  const updateAuthChrome = () => {
    const session = syncedSession || getSession();
    const authGreeting = document.querySelector("[data-auth-greeting]");
    const authAction = document.querySelector("[data-auth-action]");
    const adminOnlyLinks = document.querySelectorAll("[data-admin-link]");
    const userOnlyLinks = document.querySelectorAll("[data-user-link]");

    adminOnlyLinks.forEach((link) => {
      link.hidden = !(session && session.role === "admin");
    });

    userOnlyLinks.forEach((link) => {
      link.hidden = !(session && session.role === "user");
    });

    if (!authGreeting || !authAction) {
      return;
    }

    authAction.onclick = null;

    if (session) {
      authGreeting.textContent = `Signed in as ${session.name} (${session.role}).`;
      authAction.hidden = false;
      authAction.textContent = "Logout";
      authAction.onclick = async () => {
        if (supabase) {
          await supabase.auth.signOut();
        }

        clearSession();
        clearTabSessionBridge();
        if (window.location.pathname.includes("admin-dashboard.html")) {
          window.location.href = "index.html";
          return;
        }

        window.location.reload();
      };
      return;
    }

    if (isFileProtocol) {
      authGreeting.textContent = "This site is opened with file://. Use a local server or deployment URL for login, signup, admin access, and live Supabase data.";
      authAction.hidden = true;
      return;
    }

    authGreeting.textContent = "Browse movies and sign in to book your seats.";
    authAction.hidden = true;
  };

  const renderShell = () => {
    renderHomeMovieGrid(movieCatalog);
    updateVisiblePrices(prices);
    attachBookLinkGuards();
    enhanceCustomSelects(document);
    initSwiperIfAvailable();
    bindPosterLinks();
    initScrollReveal(document);
    updateAuthChrome();
  };

  const initAuthPageInteractions = () => {
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");
    const authModeButtons = document.querySelectorAll("[data-auth-mode-target]");
    const authModePanels = document.querySelectorAll("[data-auth-mode-panel]");

    if (authModeButtons.length && authModePanels.length) {
      const setAuthMode = (mode) => {
        authModeButtons.forEach((button) => {
          button.classList.toggle("active", button.dataset.authModeTarget === mode);
        });

        authModePanels.forEach((panel) => {
          panel.hidden = panel.dataset.authModePanel !== mode;
          panel.classList.toggle("active", panel.dataset.authModePanel === mode);
        });
      };

      authModeButtons.forEach((button) => {
        if (button.dataset.authModeBound === "true") {
          return;
        }

        button.dataset.authModeBound = "true";
        button.addEventListener("click", () => {
          setAuthMode(button.dataset.authModeTarget);
        });
      });
    }

    if (loginForm && loginForm.dataset.submitBound !== "true") {
      const role = loginForm.dataset.role;
      const emailInput = document.getElementById("email");
      const passwordInput = document.getElementById("password");
      const statusText = document.getElementById("loginStatus");
      const redirectPath = params.get("redirect") || "index.html";

      loginForm.dataset.submitBound = "true";
      loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const email = emailInput.value.trim().toLowerCase();
        const password = passwordInput.value.trim();
        if (isFileProtocol) {
          statusText.textContent = "Open this site through http://localhost or a deployed URL. Supabase login is not reliable from file:// pages.";
          statusText.classList.add("error");
          return;
        }

        if (!isRemoteDataEnabled()) {
          statusText.textContent = SUPABASE_SETUP_MESSAGE;
          statusText.classList.add("error");
          return;
        }

        statusText.textContent = "Signing in with Supabase...";
        statusText.classList.remove("error");

        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
          statusText.textContent = error.message;
          statusText.classList.add("error");
          return;
        }

        try {
          persistTabSessionBridge(data.session);
          const profile = await ensureProfile(data.user);
          const nextSession = buildSessionFromProfile(profile, data.user);

          if (role === "admin" && nextSession.role !== "admin") {
            await supabase.auth.signOut();
            clearSession();
            clearTabSessionBridge();
            statusText.textContent = "This account does not have admin access.";
            statusText.classList.add("error");
            return;
          }

          if (role === "user" && nextSession.role === "admin") {
            nextSession.role = "admin";
          }

          setSession(nextSession);
          syncedSession = nextSession;
          updateAuthChrome();
          statusText.textContent = `${role === "admin" ? "Admin" : "User"} login successful. Redirecting...`;
          statusText.classList.remove("error");

          window.setTimeout(() => {
            window.location.href = redirectPath;
          }, 800);
        } catch (profileError) {
          statusText.textContent = profileError.message;
          statusText.classList.add("error");
        }
      });
    }

    if (registerForm && registerForm.dataset.submitBound !== "true") {
      const registerStatus = document.getElementById("registerStatus");
      const registerNameInput = document.getElementById("registerName");
      const registerEmailInput = document.getElementById("registerEmail");
      const registerPasswordInput = document.getElementById("registerPassword");
      const registerConfirmPasswordInput = document.getElementById("registerConfirmPassword");

      registerForm.dataset.submitBound = "true";
      registerForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const name = String(registerNameInput.value || "").trim();
        const email = String(registerEmailInput.value || "").trim().toLowerCase();
        const password = String(registerPasswordInput.value || "").trim();
        const confirmPassword = String(registerConfirmPasswordInput.value || "").trim();
        if (isFileProtocol) {
          registerStatus.textContent = "Open this site through http://localhost or a deployed URL before creating a Supabase account.";
          registerStatus.classList.add("error");
          return;
        }

        if (!name || !email || !password || !confirmPassword) {
          registerStatus.textContent = "Fill in all account details.";
          registerStatus.classList.add("error");
          return;
        }

        if (password.length < 6) {
          registerStatus.textContent = "Password must be at least 6 characters.";
          registerStatus.classList.add("error");
          return;
        }

        if (password !== confirmPassword) {
          registerStatus.textContent = "Passwords do not match.";
          registerStatus.classList.add("error");
          return;
        }

        if (!isRemoteDataEnabled()) {
          registerStatus.textContent = SUPABASE_SETUP_MESSAGE;
          registerStatus.classList.add("error");
          return;
        }

        registerStatus.textContent = "Creating your Supabase account...";
        registerStatus.classList.remove("error");

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name
            }
          }
        });

        if (error) {
          registerStatus.textContent = error.message;
          registerStatus.classList.add("error");
          return;
        }

        try {
          if (data.user && data.session) {
            await ensureProfile(data.user, name, "user");
          }

          registerForm.reset();
          registerStatus.textContent = data.session
            ? "Account created successfully. You can sign in now."
            : "Account created. Check your email inbox and confirm the account if email confirmation is enabled, then sign in.";
          registerStatus.classList.remove("error");

          const signInButton = [...authModeButtons].find((button) => button.dataset.authModeTarget === "signin");
          if (signInButton) {
            signInButton.click();
          }
        } catch (profileError) {
          registerStatus.textContent = profileError.message;
          registerStatus.classList.add("error");
        }
      });
    }
  };

  const fallbackState = buildDefaultAppState();
  movieCatalog = fallbackState.movieCatalog;
  prices = fallbackState.prices;
  showCatalog = fallbackState.showCatalog;
  foodMenu = fallbackState.foodMenu;
  isUsingFallbackData = true;

  initAuthPageInteractions();
  renderShell();

  if (supabase) {
    supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        persistTabSessionBridge(session);
        return;
      }

      clearTabSessionBridge();
    });
  }

  try {
    await restoreSupabaseSessionFromBridge();
  } catch (error) {
    console.error("Tab session restore failed.", error);
  }

  try {
    syncedSession = await syncSessionFromSupabase();
  } catch (error) {
    console.error("Supabase auth sync failed.", error);
  }

  try {
    const remoteState = await loadSupabaseAppState();
    movieCatalog = remoteState.movieCatalog;
    prices = remoteState.prices;
    showCatalog = remoteState.showCatalog;
    foodMenu = remoteState.foodMenu;
    isUsingFallbackData = false;
  } catch (error) {
    console.error("Supabase data load failed.", error);
  }

  let movieIds = Object.keys(movieCatalog);
  const requestedMovie = params.get("movie");
  const requestedShowId = params.get("show");
  const incomingBookingDraft = parseJsonParam(params.get("draft"), null);
  const movie = movieCatalog[requestedMovie] ? requestedMovie : movieIds[0];
  renderShell();

  const detailsCard = document.getElementById("movieDetailsCard");

  if (detailsCard) {
    const movieData = movieCatalog[movie];
    if (!movieData) {
      detailsCard.innerHTML = `
        <div class="details-content">
          <div class="details-block">
            <h3>No Movies Available</h3>
            <p>The admin has removed all movies from the booking list.</p>
          </div>
        </div>
      `;
      const detailsBookBtn = document.getElementById("detailsBookBtn");
      if (detailsBookBtn) {
        detailsBookBtn.textContent = "Back to Home";
        detailsBookBtn.href = "index.html";
      }
    } else {
    const detailsHeaderTitle = document.getElementById("detailsHeaderTitle");
    const detailsTitle = document.getElementById("detailsTitle");
    const detailsPoster = document.getElementById("detailsPoster");
    const detailsRating = document.getElementById("detailsRating");
    const detailsVotes = document.getElementById("detailsVotes");
    const detailsMeta = document.getElementById("detailsMeta");
    const detailsFormats = document.getElementById("detailsFormats");
    const detailsLanguages = document.getElementById("detailsLanguages");
    const detailsSummary = document.getElementById("detailsSummary");
    const detailsGenre = document.getElementById("detailsGenre");
    const detailsCriticRating = document.getElementById("detailsCriticRating");
    const detailsPrice = document.getElementById("detailsPrice");
    const detailsHighlights = document.getElementById("detailsHighlights");
    const detailsStatus = document.getElementById("detailsStatus");
    const detailsBookBtn = document.getElementById("detailsBookBtn");
    const watchTrailerBtn = document.getElementById("watchTrailerBtn");

    if (detailsHeaderTitle) {
      detailsHeaderTitle.textContent = movieData.name;
    }

    if (detailsTitle) {
      detailsTitle.textContent = movieData.name;
    }

    if (detailsPoster) {
      detailsPoster.src = movieData.image;
      detailsPoster.alt = `${movieData.name} poster`;
    }

    if (detailsRating) {
      detailsRating.textContent = movieData.rating;
    }

    if (detailsVotes) {
      detailsVotes.textContent = `(${movieData.votes})`;
    }

    if (detailsMeta) {
      detailsMeta.textContent =
        `${movieData.duration} • ${movieData.genre} • ${movieData.certificate} • ${movieData.releaseDate}`;
    }

    if (detailsFormats) {
      detailsFormats.textContent = movieData.formats;
    }

    if (detailsLanguages) {
      detailsLanguages.textContent = movieData.languages;
    }

    if (detailsSummary) {
      detailsSummary.textContent = movieData.summary;
    }

    if (detailsGenre) {
      detailsGenre.textContent = movieData.genre;
    }

    if (detailsCriticRating) {
      detailsCriticRating.textContent = movieData.criticRating;
    }

    if (detailsPrice) {
      const priceSet = prices[movie] || clonePriceSet(movieData.defaultPrice);
      detailsPrice.textContent =
        `Regular Rs. ${priceSet.regular} | Silver Rs. ${priceSet.silver} | Gold Rs. ${priceSet.gold}`;
    }

    if (detailsStatus) {
      detailsStatus.textContent = "In Cinemas";
    }

    if (detailsHighlights) {
      detailsHighlights.innerHTML = "";
      movieData.highlights.forEach((highlight) => {
        const item = document.createElement("li");
        item.textContent = highlight;
        detailsHighlights.appendChild(item);
      });
    }

    if (detailsBookBtn) {
      detailsBookBtn.href = `showtime.html?movie=${encodeURIComponent(movie)}`;
    }

    if (watchTrailerBtn) {
      watchTrailerBtn.addEventListener("click", () => {
        if (!movieData.trailerUrl) {
          alert(`Trailer link for ${movieData.name} will be added once you share it.`);
          return;
        }
        openTrailerModal(movieData.trailerUrl, `${movieData.name} Trailer`);
      });
    }
    }
  }

  const showtimeGrid = document.getElementById("showtimeGrid");

  if (showtimeGrid && movieCatalog[movie]) {
    const showtimeHeaderTitle = document.getElementById("showtimeHeaderTitle");
    const showtimeTitle = document.getElementById("showtimeTitle");
    const showtimePoster = document.getElementById("showtimePoster");
    const showtimeMeta = document.getElementById("showtimeMeta");
    const showtimePrice = document.getElementById("showtimePrice");
    const movieData = movieCatalog[movie];
    const movieShows = getShowsForMovie(showCatalog, movie);
    const groupedShows = groupShowsByDate(movieShows);

    if (showtimeHeaderTitle) {
      showtimeHeaderTitle.textContent = `${movieData.name} Shows`;
    }

    if (showtimeTitle) {
      showtimeTitle.textContent = movieData.name;
    }

    if (showtimePoster) {
      showtimePoster.src = movieData.image;
      showtimePoster.alt = `${movieData.name} poster`;
    }

    if (showtimeMeta) {
      showtimeMeta.textContent = `${movieData.duration} | ${movieData.genre} | ${movieData.languages}`;
    }

    if (showtimePrice) {
      const basePrice = prices[movie] || clonePriceSet(movieData.defaultPrice);
      showtimePrice.textContent =
        `Base seat prices: Regular Rs. ${basePrice.regular} | Silver Rs. ${basePrice.silver} | Gold Rs. ${basePrice.gold}`;
    }

    showtimeGrid.innerHTML = groupedShows.length
      ? groupedShows.map((dayGroup) => `
          <section class="showtime-day-card">
            <div class="showtime-day-head">
              <div>
                <strong>${escapeHtml(dayGroup.dateLabel)}</strong>
                <p>${escapeHtml(getWeekdayName(dayGroup.date))}</p>
              </div>
              <span>${dayGroup.shows.length} shows</span>
            </div>
            <div class="showtime-options">
              ${dayGroup.shows.map((show) => `
                <a href="movie.html?movie=${encodeURIComponent(movie)}&show=${encodeURIComponent(show.showId)}" class="showtime-option-card book-link">
                  <span class="showtime-option-time">${escapeHtml(show.timeLabel)}</span>
                  <span>${escapeHtml(show.hallName)}</span>
                  <span>${escapeHtml(show.format)}</span>
                  <span>Regular from Rs. ${show.priceSet.regular}</span>
                </a>
              `).join("")}
            </div>
          </section>
        `).join("")
      : '<p class="movie-grid-empty">No shows available for this movie.</p>';

    attachBookLinkGuards();
    initScrollReveal(showtimeGrid);
  }

  const seatContainer = document.getElementById("seatContainer");
  const directConfirmBtn = document.getElementById("directConfirmBtn");
  const makeTastierBtn = document.getElementById("makeTastierBtn");
  const seatActionMessage = document.getElementById("seatActionMessage");
  const selectedInfo = document.getElementById("selectedInfo");
  const ticketPriceNode = document.getElementById("ticketPrice");
  const totalPriceNode = document.getElementById("totalPrice");
  const selectedShowTitle = document.getElementById("selectedShowTitle");
  const selectedShowMeta = document.getElementById("selectedShowMeta");
  const showSelectionGrid = document.getElementById("showSelectionGrid");

  if (seatContainer && movieCatalog[movie]) {
    const activeSession = getSession();

    if (!activeSession || activeSession.role !== "user") {
      const redirectTarget = encodeURIComponent(
        `${window.location.pathname.split("/").pop()}${window.location.search}`
      );
      window.location.href = `user-login.html?redirect=${redirectTarget}`;
      return;
    }

    const movieTitle = document.getElementById("movieTitle");

    if (movieTitle) {
      movieTitle.textContent = `Select Your Seats - ${movieCatalog[movie].name}`;
    }

    const availableShows = getShowsForMovie(showCatalog, movie);
    const activeShow = availableShows.find((show) => show.showId === requestedShowId)
      || availableShows[0];

    if (!activeShow) {
      seatContainer.innerHTML = '<p class="movie-grid-empty">No showtimes available for this movie right now.</p>';
      return;
    }

    const seatTierPrices = activeShow.priceSet;
    const savedSelectedSeatIds = [];
    let selectedSeats = [];
    let bookedSeats = await getBookedSeatIdsForShow(activeShow.showId);
    const seatGroups = [
      { id: "regular", title: "Regular Seats", description: `${activeShow.seatGroups.regular} seats`, count: activeShow.seatGroups.regular, labelPrefix: "R" },
      { id: "silver", title: "Silver Seats", description: `${activeShow.seatGroups.silver} seats`, count: activeShow.seatGroups.silver, labelPrefix: "S" },
      { id: "gold", title: "Gold Seats", description: `${activeShow.seatGroups.gold} seats`, count: activeShow.seatGroups.gold, labelPrefix: "G" }
    ];
    const seatGroupLayouts = buildSeatGroupLayouts(activeShow.seatGroups);

    if (selectedShowTitle) {
      selectedShowTitle.textContent = `${movieCatalog[movie].name} | ${activeShow.timeLabel}`;
    }

    if (selectedShowMeta) {
      selectedShowMeta.textContent =
        `${activeShow.dateLabel} | ${activeShow.hallName} | ${activeShow.format} | Standard ${activeShow.hallClasses.standard} seats | Gold ${activeShow.hallClasses.gold} seats`;
    }

    if (showSelectionGrid) {
      showSelectionGrid.innerHTML = availableShows.slice(0, 10).map((show) => `
        <a
          href="movie.html?movie=${encodeURIComponent(movie)}&show=${encodeURIComponent(show.showId)}"
          class="show-selection-chip${show.showId === activeShow.showId ? " active" : ""}"
        >
          <span>${escapeHtml(show.dateLabel)}</span>
          <strong>${escapeHtml(show.timeLabel)}</strong>
          <span>${escapeHtml(show.hallName)} · ${escapeHtml(show.format)}</span>
        </a>
      `).join("");
    }

    const updateSelectionSummary = () => {
      const selectedLabels = selectedSeats.map((seat) => seat.label).join(", ");
      const totalAmount = selectedSeats.reduce((sum, seat) => sum + seat.price, 0);
      selectedInfo.textContent = selectedSeats.length ? `Selected Seats: ${selectedLabels}` : "Selected Seats: 0";

      if (selectedSeats.length && seatActionMessage) {
        seatActionMessage.hidden = true;
        seatActionMessage.textContent = "";
      }

      if (ticketPriceNode) {
        ticketPriceNode.textContent =
          `Regular: Rs. ${seatTierPrices.regular} | Silver: Rs. ${seatTierPrices.silver} | Gold: Rs. ${seatTierPrices.gold}`;
      }

      if (totalPriceNode) {
        totalPriceNode.textContent = `Total Amount: Rs. ${totalAmount}`;
      }
    };

    let seatActionMessageTimeoutId = null;

    const showSeatActionMessage = (message) => {
      if (!seatActionMessage) {
        return;
      }

      seatActionMessage.textContent = message;
      seatActionMessage.hidden = false;

      if (seatActionMessageTimeoutId) {
        window.clearTimeout(seatActionMessageTimeoutId);
      }

      seatActionMessageTimeoutId = window.setTimeout(() => {
        seatActionMessage.hidden = true;
        seatActionMessage.textContent = "";
      }, 3200);
    };

    seatGroups.forEach((group) => {
      const section = document.createElement("section");
      const heading = document.createElement("h3");
      const description = document.createElement("p");
      const grid = document.createElement("div");

      section.className = `seat-section ${group.id}-section`;
      heading.textContent = group.title;
      description.textContent = `${group.description} | Rs. ${seatTierPrices[group.id]} per seat`;
      grid.className = "seats";

      section.appendChild(heading);
      section.appendChild(description);
      section.appendChild(grid);

      let seatNumber = 1;
      seatGroupLayouts[group.id].forEach(({ size: rowSize, rowLabel }) => {
        const row = document.createElement("div");
        const rowLabelLeft = document.createElement("span");
        const rowSeats = document.createElement("div");
        const rowLabelRight = document.createElement("span");
        const leftBlockCount = group.id === "regular" ? Math.ceil(rowSize / 2) : rowSize;
        const rightBlockCount = group.id === "regular" ? rowSize - leftBlockCount : 0;
        let seatNumberInRow = 1;

        row.className = "seat-row";
        rowLabelLeft.className = "seat-row-label";
        rowLabelRight.className = "seat-row-label";
        rowSeats.className = "seat-row-seats";
        rowLabelLeft.textContent = rowLabel;
        rowLabelRight.textContent = rowLabel;

        for (let sideIndex = 0; sideIndex < leftBlockCount; sideIndex += 1) {
          const currentSeatNumber = seatNumber;
          const seatLabel = `${rowLabel}${seatNumberInRow}`;
          const seatId = seatLabel;
          const seat = document.createElement("div");
          seat.classList.add("seat");

          if (group.id !== "regular") {
            seat.classList.add(group.id);
          }

          seat.textContent = seatNumberInRow;
          seat.title = `${group.title} ${seatLabel}`;

          if (bookedSeats.includes(seatId.toUpperCase())) {
            seat.classList.add("booked");
          }

          seat.addEventListener("click", () => {
            if (seat.classList.contains("booked")) {
              return;
            }

            seat.classList.toggle("selected");

            const selectedSeat = {
              id: seatId,
              label: seatLabel,
              tier: group.id,
              price: seatTierPrices[group.id]
            };
            const existingIndex = selectedSeats.findIndex((entry) => entry.id === seatId);

            if (existingIndex >= 0) {
              selectedSeats = selectedSeats.filter((entry) => entry.id !== seatId);
            } else {
              selectedSeats.push(selectedSeat);
            }

            updateSelectionSummary();
          });

          rowSeats.appendChild(seat);
          seatNumber += 1;
          seatNumberInRow += 1;
        }

        if (group.id === "regular" && rightBlockCount > 0) {
          const aisle = document.createElement("span");
          aisle.className = "seat-row-aisle";
          rowSeats.appendChild(aisle);
        }

        for (let sideIndex = 0; sideIndex < rightBlockCount; sideIndex += 1) {
          const currentSeatNumber = seatNumber;
          const seatLabel = `${rowLabel}${seatNumberInRow}`;
          const seatId = seatLabel;
          const seat = document.createElement("div");
          seat.classList.add("seat");

          if (group.id !== "regular") {
            seat.classList.add(group.id);
          }

          seat.textContent = seatNumberInRow;
          seat.title = `${group.title} ${seatLabel}`;

          if (bookedSeats.includes(seatId.toUpperCase())) {
            seat.classList.add("booked");
          }

          seat.addEventListener("click", () => {
            if (seat.classList.contains("booked")) {
              return;
            }

            seat.classList.toggle("selected");

            const selectedSeat = {
              id: seatId,
              label: seatLabel,
              tier: group.id,
              price: seatTierPrices[group.id]
            };
            const existingIndex = selectedSeats.findIndex((entry) => entry.id === seatId);

            if (existingIndex >= 0) {
              selectedSeats = selectedSeats.filter((entry) => entry.id !== seatId);
            } else {
              selectedSeats.push(selectedSeat);
            }

            updateSelectionSummary();
          });

          rowSeats.appendChild(seat);
          seatNumber += 1;
          seatNumberInRow += 1;
        }

        row.appendChild(rowLabelLeft);
        row.appendChild(rowSeats);
        row.appendChild(rowLabelRight);
        grid.appendChild(row);
      });

      seatContainer.appendChild(section);
    });

    updateSelectionSummary();

    const claimFreeTicketBtn = document.getElementById("claimFreeTicketBtn");

    const continueToConfirmation = (claimFreeTicket = false) => {
      if (selectedSeats.length === 0) {
        showSeatActionMessage("Please select at least one seat before continuing.");
        return;
      }

      const draft = buildBookingDraft(movie, activeShow, selectedSeats, []);
      if (claimFreeTicket) {
        draft.claimFreeTicket = true;
      }
      window.location.href = buildBookingUrl("confirm.html", movie, activeShow.showId, draft);
    };

    const continueToFood = () => {
      if (selectedSeats.length === 0) {
        showSeatActionMessage("Choose at least one seat before adding snacks.");
        return;
      }

      const draft = buildBookingDraft(movie, activeShow, selectedSeats, []);
      window.location.href = buildBookingUrl("food.html", movie, activeShow.showId, draft);
    };

    if (directConfirmBtn) {
      directConfirmBtn.addEventListener("click", () => continueToConfirmation(false));
    }

    if (claimFreeTicketBtn) {
      claimFreeTicketBtn.addEventListener("click", () => continueToConfirmation(true));
    }

    if (makeTastierBtn) {
      makeTastierBtn.addEventListener("click", continueToFood);
    }
  }

  const foodGrid = document.getElementById("foodGrid");
  const foodFilters = document.getElementById("foodFilters");

  if (foodGrid && movieCatalog[movie]) {
    const activeSession = getSession();
    const foodTitle = document.getElementById("foodPageTitle");
    const foodCartMovie = document.getElementById("foodCartMovie");
    const foodSelectionList = document.getElementById("foodSelectionList");
    const foodTotal = document.getElementById("foodTotal");
    const foodItemCount = document.getElementById("foodItemCount");
    const foodContinueBtn = document.getElementById("foodContinueBtn");
    const skipFoodBtn = document.getElementById("skipFoodBtn");
    const availableShows = getShowsForMovie(showCatalog, movie);
    const activeShow = availableShows.find((show) => show.showId === requestedShowId)
      || availableShows[0];
    const savedSelections = Array.isArray(incomingBookingDraft?.snacks) ? incomingBookingDraft.snacks : [];
    const snackState = new Map(savedSelections.map((item) => [item.id, item]));
    const foodItems = Object.values(foodMenu);
    const categories = ["All", ...new Set(foodItems.map((item) => item.category))];
    let activeCategory = "All";
    const selectedSeats = Array.isArray(incomingBookingDraft?.seats) ? incomingBookingDraft.seats : [];

    if (!activeSession || activeSession.role !== "user") {
      const redirectTarget = encodeURIComponent(
        `${window.location.pathname.split("/").pop()}${window.location.search}`
      );
      window.location.href = `user-login.html?redirect=${redirectTarget}`;
      return;
    }

    if (!selectedSeats.length) {
      window.location.href = `movie.html?movie=${encodeURIComponent(movie)}${activeShow ? `&show=${encodeURIComponent(activeShow.showId)}` : ""}`;
      return;
    }

    if (foodTitle) {
      foodTitle.textContent = "Make Your Movie Tastier";
    }

    if (foodCartMovie) {
      foodCartMovie.textContent = activeShow
        ? `Pick food for ${movieCatalog[movie].name} on ${activeShow.dateLabel} at ${activeShow.timeLabel} in ${activeShow.hallName}.`
        : `Pick food for ${movieCatalog[movie].name} before ticket confirmation.`;
    }

    if (skipFoodBtn) {
      const skipDraft = buildBookingDraft(movie, activeShow, selectedSeats, []);
      skipFoodBtn.href = buildBookingUrl("confirm.html", movie, activeShow?.showId || "", skipDraft);
    }

    const renderSummary = () => {
      const selectedItems = [...snackState.values()].filter((item) => item.quantity > 0);
      const total = selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const count = selectedItems.reduce((sum, item) => sum + item.quantity, 0);

      if (foodSelectionList) {
        foodSelectionList.innerHTML = selectedItems.length
          ? selectedItems.map((item) => `
              <div class="food-selection-row">
                <span>${item.name} x${item.quantity}</span>
                <strong>Rs. ${item.price * item.quantity}</strong>
              </div>
            `).join("")
          : '<p class="food-empty">No snacks selected yet.</p>';
      }

      if (foodTotal) {
        foodTotal.textContent = `Rs. ${total}`;
      }

      if (foodItemCount) {
        foodItemCount.textContent = String(count);
      }
    };

    const updateQuantity = (item, quantity) => {
      if (quantity <= 0) {
        snackState.delete(item.id);
      } else {
        snackState.set(item.id, { ...item, quantity });
      }

      renderFoodCards();
      renderSummary();
    };

    const createFilterButtons = () => {
      foodFilters.innerHTML = "";

      categories.forEach((category) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = `food-filter-chip${category === activeCategory ? " active" : ""}`;
        button.textContent = category;
        button.addEventListener("click", () => {
          activeCategory = category;
          createFilterButtons();
          renderFoodCards();
        });
        foodFilters.appendChild(button);
      });
    };

    function renderFoodCards() {
      const visibleItems = foodItems.filter((item) => {
        const matchesCategory = activeCategory === "All" || item.category === activeCategory;

        return matchesCategory;
      });

      foodGrid.innerHTML = visibleItems.map((item) => {
        const quantity = snackState.get(item.id)?.quantity || 0;
        const foodArt = getFoodPosterMarkup(item);

        return `
          <article class="food-card">
            <div class="food-card-art">
              <span class="food-card-badge">${item.badge}</span>
              ${foodArt}
            </div>
            <div class="food-card-body">
              <p class="food-card-category">${escapeHtml(item.category)}</p>
              <h3>${escapeHtml(item.name)}</h3>
              <p>${escapeHtml(item.description)}</p>
              <div class="food-card-footer">
                <strong>Rs. ${item.price}</strong>
                <div class="food-quantity" data-food-id="${item.id}">
                  <button type="button" data-action="decrease">-</button>
                  <span>${quantity}</span>
                  <button type="button" data-action="increase">+</button>
                </div>
              </div>
            </div>
          </article>
        `;
      }).join("");

      if (!visibleItems.length) {
        foodGrid.innerHTML = '<p class="food-empty food-grid-empty">No items matched your search.</p>';
        return;
      }

      foodGrid.querySelectorAll(".food-quantity").forEach((control) => {
        const item = foodItems.find((entry) => entry.id === control.dataset.foodId);

        control.querySelectorAll("button").forEach((button) => {
          button.addEventListener("click", () => {
            const currentQuantity = snackState.get(item.id)?.quantity || 0;
            const nextQuantity = button.dataset.action === "increase"
              ? currentQuantity + 1
              : currentQuantity - 1;
            updateQuantity(item, nextQuantity);
          });
        });
      });

      initScrollReveal(foodGrid);
    }

    if (foodContinueBtn) {
      foodContinueBtn.addEventListener("click", () => {
        const draft = buildBookingDraft(
          movie,
          activeShow,
          selectedSeats,
          [...snackState.values()].filter((item) => item.quantity > 0)
        );
        window.location.href = buildBookingUrl("confirm.html", movie, activeShow?.showId || "", draft);
      });
    }

    createFilterButtons();
    renderFoodCards();
    renderSummary();
  }

  initAuthPageInteractions();

  const adminPanel = document.getElementById("adminPriceForm");
  const adminFoodPanel = document.getElementById("adminFoodPriceForm");
  const adminFoodForm = document.getElementById("adminFoodForm");
  const adminScheduleForm = document.getElementById("adminScheduleForm");
  const adminScheduleManageForm = document.getElementById("adminScheduleManageForm");
  const adminViewButtons = document.querySelectorAll("[data-admin-view-target]");
  const adminViewPanels = document.querySelectorAll("[data-admin-view-panel]");

  if (adminPanel || adminFoodPanel || adminFoodForm || adminScheduleForm || adminScheduleManageForm) {
    const activeSession = getSession();

    if (!activeSession || activeSession.role !== "admin") {
      window.location.href = "admin-login.html?redirect=admin-dashboard.html";
      return;
    }

    const setAdminView = (targetView) => {
      if (!adminViewPanels.length || !adminViewButtons.length) {
        return;
      }

      adminViewButtons.forEach((button) => {
        button.classList.toggle("active", button.dataset.adminViewTarget === targetView);
      });

      adminViewPanels.forEach((panel) => {
        const isActive = panel.dataset.adminViewPanel === targetView;
        panel.hidden = !isActive;
        panel.classList.remove("active", "slide-up-fade");

        if (isActive) {
          panel.classList.add("active", "slide-up-fade");
          initScrollReveal(panel);
        }
      });

      document.body.classList.toggle("admin-page-movies", targetView === "movies");
      document.body.classList.toggle("admin-page-food", targetView === "food");
      document.body.classList.toggle("admin-page-schedules", targetView === "schedules");
    };

    if (adminViewButtons.length && adminViewPanels.length) {
      const requestedView = ["food", "schedules"].includes(params.get("view")) ? params.get("view") : "movies";
      setAdminView(requestedView);

      adminViewButtons.forEach((button) => {
        button.addEventListener("click", () => {
          const targetView = button.dataset.adminViewTarget;
          const currentView = document.body.classList.contains("admin-page-food") ? "food" : "movies";

          if (targetView === currentView) {
            return;
          }

          setAdminView(targetView);

          const nextUrl = new URL(window.location.href);
          if (targetView === "food" || targetView === "schedules") {
            nextUrl.searchParams.set("view", targetView);
          } else {
            nextUrl.searchParams.delete("view");
          }
          window.history.replaceState({}, "", nextUrl);
        });
      });
    }

    const statusNode = document.getElementById("adminStatus");
    const resetBtn = document.getElementById("resetPrices");
    const addMovieForm = document.getElementById("adminMovieForm");
    const addMovieStatus = document.getElementById("adminMovieStatus");
    const adminFoodGrid = document.getElementById("adminFoodGrid");
    const adminFoodStatus = document.getElementById("adminFoodStatus");
    const adminFoodPriceStatus = document.getElementById("adminFoodPriceStatus");
    const resetFoodItemsBtn = document.getElementById("resetFoodItems");
    const adminScheduleGrid = document.getElementById("adminScheduleGrid");
    const adminScheduleStatus = document.getElementById("adminScheduleStatus");
    const adminScheduleManageStatus = document.getElementById("adminScheduleManageStatus");
    const resetDashboardBookingsBtn = document.getElementById("resetDashboardBookings");
    const adminDashboardResetStatus = document.getElementById("adminDashboardResetStatus");
    const scheduleMovieSelect = document.getElementById("scheduleMovie");
    const scheduleFilterMovie = document.getElementById("scheduleFilterMovie");
    const scheduleSearchInput = document.getElementById("scheduleSearch");
    const resetSchedulesBtn = document.getElementById("resetSchedules");
    let activeScheduleMovieFilter = "all";
    let activeScheduleSearch = "";

    if (adminPanel) {
      renderAdminPriceGrid(movieCatalog, prices);
    }

    const renderAdminFoodGrid = (menu) => {
      if (!adminFoodGrid) {
        return;
      }

      adminFoodGrid.innerHTML = Object.entries(menu)
        .map(([itemId, item]) => `
          <section class="movie-price-card admin-food-card">
            <div class="admin-food-art">${getFoodPosterMarkup(item, "admin-food-poster")}</div>
            <div class="movie-price-card-body">
              <div class="movie-price-card-head">
                <div>
                  <span class="admin-movie-badge">${item.isCustom ? "Custom Food" : "Default Food"}</span>
                  <h3>${escapeHtml(item.name)}</h3>
                </div>
                <button type="button" class="movie-delete-btn" data-delete-food="${escapeHtml(itemId)}">Remove</button>
              </div>
              <p>${escapeHtml(item.category)} | ${escapeHtml(item.description)}</p>
              <div class="price-tier-grid admin-food-manage-grid">
                <label class="price-field" for="${escapeHtml(itemId)}FoodCategory">Category
                  <input id="${escapeHtml(itemId)}FoodCategory" name="${escapeHtml(itemId)}_category" type="text" value="${escapeHtml(item.category)}" required>
                </label>
                <label class="price-field" for="${escapeHtml(itemId)}FoodBadge">Badge
                  <input id="${escapeHtml(itemId)}FoodBadge" name="${escapeHtml(itemId)}_badge" type="text" value="${escapeHtml(item.badge)}">
                </label>
                <label class="price-field" for="${escapeHtml(itemId)}FoodPrice">Price
                  <input id="${escapeHtml(itemId)}FoodPrice" name="${escapeHtml(itemId)}_price" type="number" min="1" value="${item.price}" required>
                </label>
                <label class="price-field price-field-wide" for="${escapeHtml(itemId)}FoodDescription">Description
                  <textarea id="${escapeHtml(itemId)}FoodDescription" name="${escapeHtml(itemId)}_description" rows="3" required>${escapeHtml(item.description)}</textarea>
                </label>
              </div>
            </div>
          </section>
        `)
        .join("");

      initScrollReveal(adminFoodGrid);
    };

    const renderScheduleMovieOptions = () => {
      if (!scheduleMovieSelect) {
        if (!scheduleFilterMovie) {
          return;
        }
      }

      const movieOptions = getOrderedMovieEntries(movieCatalog)
        .map(([movieId, movieData]) => `<option value="${escapeHtml(movieId)}">${escapeHtml(movieData.name)}</option>`)
        .join("");

      if (scheduleMovieSelect) {
        scheduleMovieSelect.innerHTML = movieOptions;
      }

      if (scheduleFilterMovie) {
        scheduleFilterMovie.innerHTML = `<option value="all">All Movies</option>${movieOptions}`;
        scheduleFilterMovie.value = movieCatalog[activeScheduleMovieFilter] ? activeScheduleMovieFilter : "all";
      }

      enhanceCustomSelects(document);
    };

    const getFilteredShows = (shows) =>
      shows.filter((show) => {
        const matchesMovie = activeScheduleMovieFilter === "all" || show.movieId === activeScheduleMovieFilter;
        const haystack = [
          movieCatalog[show.movieId]?.name || show.movieId,
          show.hallName,
          show.dateLabel,
          show.date,
          show.timeLabel,
          show.format
        ].join(" ").toLowerCase();
        const matchesSearch = !activeScheduleSearch || haystack.includes(activeScheduleSearch);

        return matchesMovie && matchesSearch;
      });

    const renderScheduleEmptyState = () => {
      if (!adminScheduleGrid) {
        return;
      }

      adminScheduleGrid.innerHTML = '<p class="movie-grid-empty">No shows matched your current filter.</p>';
    };

    const renderAdminScheduleGrid = (shows) => {
      if (!adminScheduleGrid) {
        return;
      }

      const visibleShows = getFilteredShows(shows);

      adminScheduleGrid.innerHTML = visibleShows.length
        ? visibleShows.map((show) => `
            <section class="movie-price-card admin-schedule-card">
              <div class="movie-price-card-body">
                <div class="movie-price-card-head">
                  <div>
                    <span class="admin-movie-badge">${escapeHtml(movieCatalog[show.movieId]?.name || show.movieId)}</span>
                    <h3>${escapeHtml(show.dateLabel)} | ${escapeHtml(show.timeLabel)}</h3>
                  </div>
                  <button type="button" class="movie-delete-btn" data-delete-show="${escapeHtml(show.showId)}">Remove</button>
                </div>
                <div class="price-tier-grid admin-schedule-grid">
                  <label class="price-field" for="${escapeHtml(show.showId)}Date">Date
                    <input id="${escapeHtml(show.showId)}Date" name="${escapeHtml(show.showId)}_date" type="date" value="${escapeHtml(show.date)}" required>
                  </label>
                  <label class="price-field" for="${escapeHtml(show.showId)}Time">Time
                    <input id="${escapeHtml(show.showId)}Time" name="${escapeHtml(show.showId)}_time" type="time" value="${String(show.time).padStart(4, "0").replace(/(\d{2})(\d{2})/, "$1:$2")}" required>
                  </label>
                  <label class="price-field" for="${escapeHtml(show.showId)}Hall">Hall
                    <select id="${escapeHtml(show.showId)}Hall" name="${escapeHtml(show.showId)}_hall">
                      <option value="1"${show.hallId === 1 ? " selected" : ""}>Hall 1</option>
                      <option value="2"${show.hallId === 2 ? " selected" : ""}>Hall 2</option>
                      <option value="3"${show.hallId === 3 ? " selected" : ""}>Hall 3</option>
                    </select>
                  </label>
                  <label class="price-field" for="${escapeHtml(show.showId)}Format">Format
                    <select id="${escapeHtml(show.showId)}Format" name="${escapeHtml(show.showId)}_format">
                      <option value="2D"${show.format === "2D" ? " selected" : ""}>2D</option>
                      <option value="3D"${show.format === "3D" ? " selected" : ""}>3D</option>
                      <option value="IMAX"${show.format === "IMAX" ? " selected" : ""}>IMAX</option>
                      <option value="4DX"${show.format === "4DX" ? " selected" : ""}>4DX</option>
                    </select>
                  </label>
                </div>
              </div>
            </section>
          `).join("")
        : `<p class="movie-grid-empty">${shows.length ? "No shows matched your current filter." : "No shows available. Add one above."}</p>`;

      enhanceCustomSelects(adminScheduleGrid);
      initScrollReveal(adminScheduleGrid);
    };

    if (adminFoodPanel) {
      renderAdminFoodGrid(foodMenu);
    }

    renderScheduleMovieOptions();

    if (scheduleFilterMovie) {
      scheduleFilterMovie.addEventListener("change", () => {
        activeScheduleMovieFilter = scheduleFilterMovie.value;
        renderAdminScheduleGrid(showCatalog);
      });
    }

    if (scheduleSearchInput) {
      scheduleSearchInput.addEventListener("input", () => {
        activeScheduleSearch = String(scheduleSearchInput.value || "").trim().toLowerCase();
        renderAdminScheduleGrid(showCatalog);
      });
    }

    if (adminScheduleManageForm) {
      renderAdminScheduleGrid(showCatalog);
    }

    if (adminPanel) {
      adminPanel.addEventListener("submit", async (event) => {
        event.preventDefault();
        const updatedPrices = {};

        for (const movieId of Object.keys(movieCatalog)) {
          const regularInput = adminPanel.querySelector(`[name="${movieId}_regular"]`);
          const silverInput = adminPanel.querySelector(`[name="${movieId}_silver"]`);
          const goldInput = adminPanel.querySelector(`[name="${movieId}_gold"]`);
          const displayOrderInput = adminPanel.querySelector(`[name="${movieId}_display_order"]`);
          const regular = Number(regularInput?.value);
          const silver = Number(silverInput?.value);
          const gold = Number(goldInput?.value);
          const displayOrder = Number(displayOrderInput?.value);

          if (
            !Number.isFinite(regular) || regular <= 0 ||
            !Number.isFinite(silver) || silver <= 0 ||
            !Number.isFinite(gold) || gold <= 0 ||
            !Number.isFinite(displayOrder) || displayOrder <= 0
          ) {
            statusNode.textContent = "Enter valid prices and a home order greater than 0 for every movie.";
            statusNode.classList.add("error");
            return;
          }

          movieCatalog[movieId] = normalizeMovieEntry({
            ...movieCatalog[movieId],
            displayOrder
          }, movieId);
          updatedPrices[movieId] = {
            regular: Math.round(regular),
            silver: Math.round(silver),
            gold: Math.round(gold)
          };
        }

        prices = updatedPrices;
        try {
          await upsertMoviesToSupabase(
            Object.keys(updatedPrices).map((movieId) => ({
              id: movieId,
              display_order: movieCatalog[movieId].displayOrder,
              regular_price: updatedPrices[movieId].regular,
              silver_price: updatedPrices[movieId].silver,
              gold_price: updatedPrices[movieId].gold
            }))
          );
        } catch (error) {
          statusNode.textContent = error.message;
          statusNode.classList.add("error");
          return;
        }

        movieCatalog = orderMovieCatalog(movieCatalog);
        showCatalog = showCatalog.map((show) => hydrateShowEntry(show, prices));
        movieIds = Object.keys(movieCatalog);
        renderAdminPriceGrid(movieCatalog, prices);
        renderScheduleMovieOptions();
        renderAdminScheduleGrid(showCatalog);
        statusNode.textContent = "Movie prices and home-page order updated successfully.";
        statusNode.classList.remove("error");
      });

      adminPanel.addEventListener("click", async (event) => {
        const button = event.target.closest("[data-delete-movie]");

        if (!button) {
          return;
        }

        const movieId = button.dataset.deleteMovie;
        const movieData = movieCatalog[movieId];

        const shouldDelete = window.confirm(`Remove ${movieData.name} from booking?`);

        if (!shouldDelete) {
          return;
        }

        try {
          await apiRequest(`/movies/${encodeURIComponent(movieId)}`, {
            method: "DELETE"
          });

          await removeStorageObjectFromPublicUrl(movieData?.image, STORAGE_BUCKETS.moviePosters);
        } catch (error) {
          statusNode.textContent = error.message;
          statusNode.classList.add("error");
          return;
        }

        delete movieCatalog[movieId];
        delete prices[movieId];
        showCatalog = showCatalog.filter((show) => show.movieId !== movieId);
        movieIds = Object.keys(movieCatalog);

        movieIds = Object.keys(movieCatalog);
        renderAdminPriceGrid(movieCatalog, prices);
        renderScheduleMovieOptions();
        renderAdminScheduleGrid(showCatalog);
        statusNode.textContent = `${movieData.name} removed successfully.`;
        statusNode.classList.remove("error");
      });
    }

    if (adminFoodPanel) {
      adminFoodPanel.addEventListener("click", async (event) => {
        const foodButton = event.target.closest("[data-delete-food]");

        if (!foodButton) {
          return;
        }

        const itemId = foodButton.dataset.deleteFood;
        const itemData = foodMenu[itemId];
        const shouldDeleteFood = window.confirm(`Remove ${itemData.name} from the snack menu?`);

        if (!shouldDeleteFood) {
          return;
        }

        try {
          await apiRequest(`/food/${encodeURIComponent(itemId)}`, {
            method: "DELETE"
          });

          await removeStorageObjectFromPublicUrl(itemData?.image, STORAGE_BUCKETS.moviePosters);
        } catch (error) {
          adminFoodPriceStatus.textContent = error.message;
          adminFoodPriceStatus.classList.add("error");
          return;
        }
        delete foodMenu[itemId];

        renderAdminFoodGrid(foodMenu);
        adminFoodPriceStatus.textContent = `${itemData.name} removed from the snack menu.`;
        adminFoodPriceStatus.classList.remove("error");
      });
    }

    if (adminFoodPanel) {
      adminFoodPanel.addEventListener("submit", async (event) => {
        event.preventDefault();
        const nextMenu = {};

        for (const itemId of Object.keys(foodMenu)) {
          const name = foodMenu[itemId].name;
          const categoryInput = adminFoodPanel.querySelector(`[name="${itemId}_category"]`);
          const badgeInput = adminFoodPanel.querySelector(`[name="${itemId}_badge"]`);
          const descriptionInput = adminFoodPanel.querySelector(`[name="${itemId}_description"]`);
          const priceInput = adminFoodPanel.querySelector(`[name="${itemId}_price"]`);
          const price = Number(priceInput?.value);
          const category = String(categoryInput?.value || "").trim();
          const badge = String(badgeInput?.value || "").trim();
          const description = String(descriptionInput?.value || "").trim();

          if (!category || !description || !Number.isFinite(price) || price <= 0) {
            adminFoodPriceStatus.textContent = `Enter a valid category, description, and price for ${name}.`;
            adminFoodPriceStatus.classList.add("error");
            return;
          }

          nextMenu[itemId] = normalizeFoodEntry({
            ...foodMenu[itemId],
            category,
            badge: badge || foodMenu[itemId].badge,
            description,
            price,
            isCustom: foodMenu[itemId].isCustom
          }, itemId);
        }

        try {
          await upsertFoodItemsToSupabase(
            Object.entries(nextMenu).map(([itemId, item]) => mapFoodEntryToRow(itemId, item))
          );
          foodMenu = nextMenu;
        } catch (error) {
          adminFoodPriceStatus.textContent = error.message;
          adminFoodPriceStatus.classList.add("error");
          return;
        }

        renderAdminFoodGrid(foodMenu);
        adminFoodPriceStatus.textContent = "Snack menu updated successfully.";
        adminFoodPriceStatus.classList.remove("error");
      });
    }

    if (adminScheduleForm) {
      adminScheduleForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const formData = new FormData(adminScheduleForm);
        const movieId = String(formData.get("movieId") || "").trim();
        const date = String(formData.get("date") || "").trim();
        const time = String(formData.get("time") || "").trim();
        const hallId = Number(formData.get("hallId"));
        const format = String(formData.get("format") || "2D").trim().toUpperCase();

        if (!movieId || !date || !time || !hallCatalog[hallId]) {
          adminScheduleStatus.textContent = "Select a valid movie, date, time, and hall.";
          adminScheduleStatus.classList.add("error");
          return;
        }

        const normalizedTime = normalizeTimeValue(time);
        const nextShow = hydrateShowEntry({
          movieId,
          hallId,
          date,
          time: normalizedTime,
          format
        }, prices);

        const nextCatalog = [...showCatalog, nextShow].sort((a, b) => {
          if (a.movieId !== b.movieId) {
            return a.movieId.localeCompare(b.movieId);
          }

          if (a.date !== b.date) {
            return a.date.localeCompare(b.date);
          }

          return a.time - b.time;
        });
        try {
          await upsertShowsToSupabase([mapShowEntryToRow(nextShow)]);
          showCatalog = nextCatalog;
        } catch (error) {
          adminScheduleStatus.textContent = error.message;
          adminScheduleStatus.classList.add("error");
          return;
        }

        renderAdminScheduleGrid(showCatalog);
        adminScheduleForm.reset();
        renderScheduleMovieOptions();
        adminScheduleStatus.textContent = "Show added successfully.";
        adminScheduleStatus.classList.remove("error");
      });
    }

    if (adminScheduleManageForm) {
      adminScheduleManageForm.addEventListener("click", async (event) => {
        const button = event.target.closest("[data-delete-show]");

        if (!button) {
          return;
        }

        const showId = button.dataset.deleteShow;

        try {
          await apiRequest(`/shows/${encodeURIComponent(showId)}`, {
            method: "DELETE"
          });
        } catch (error) {
          adminScheduleManageStatus.textContent = error.message;
          adminScheduleManageStatus.classList.add("error");
          return;
        }

        showCatalog = showCatalog.filter((show) => show.showId !== showId);
        renderAdminScheduleGrid(showCatalog);
        adminScheduleManageStatus.textContent = "Show removed successfully.";
        adminScheduleManageStatus.classList.remove("error");
      });

      adminScheduleManageForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const nextShows = [];

        for (const show of showCatalog) {
          const dateInput = adminScheduleManageForm.querySelector(`[name="${show.showId}_date"]`);
          const timeInput = adminScheduleManageForm.querySelector(`[name="${show.showId}_time"]`);
          const hallInput = adminScheduleManageForm.querySelector(`[name="${show.showId}_hall"]`);
          const formatInput = adminScheduleManageForm.querySelector(`[name="${show.showId}_format"]`);
          const date = String(dateInput?.value || "").trim();
          const time = String(timeInput?.value || "").trim();
          const hallId = Number(hallInput?.value);
          const format = String(formatInput?.value || "2D").trim().toUpperCase();

          if (!date || !time || !hallCatalog[hallId]) {
            adminScheduleManageStatus.textContent = "Each show must have a valid date, time, hall, and format.";
            adminScheduleManageStatus.classList.add("error");
            return;
          }

          nextShows.push(hydrateShowEntry({
            movieId: show.movieId,
            date,
            time: normalizeTimeValue(time),
            hallId,
            format
          }, prices));
        }

        const sortedShows = nextShows.sort((a, b) => {
          if (a.movieId !== b.movieId) {
            return a.movieId.localeCompare(b.movieId);
          }

          if (a.date !== b.date) {
            return a.date.localeCompare(b.date);
          }

          return a.time - b.time;
        });
        try {
          await upsertShowsToSupabase(sortedShows.map((show) => mapShowEntryToRow(show)));
          showCatalog = sortedShows;
        } catch (error) {
          adminScheduleManageStatus.textContent = error.message;
          adminScheduleManageStatus.classList.add("error");
          return;
        }

        renderAdminScheduleGrid(showCatalog);
        adminScheduleManageStatus.textContent = "Schedule updated successfully.";
        adminScheduleManageStatus.classList.remove("error");
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener("click", async () => {
        prices = normalizePrices(null, movieCatalog);

        try {
          await upsertMoviesToSupabase(
            Object.entries(movieCatalog).map(([movieId, movieData]) => ({
              id: movieId,
              regular_price: movieData.defaultPrice.regular,
              silver_price: movieData.defaultPrice.silver,
              gold_price: movieData.defaultPrice.gold
            }))
          );
          showCatalog = showCatalog.map((show) => hydrateShowEntry(show, prices));
        } catch (error) {
          statusNode.textContent = error.message;
          statusNode.classList.add("error");
          return;
        }

        renderAdminPriceGrid(movieCatalog, prices);
        renderAdminScheduleGrid(showCatalog);
        statusNode.textContent = "Prices reset to default values.";
        statusNode.classList.remove("error");
      });
    }

    if (resetDashboardBookingsBtn) {
      resetDashboardBookingsBtn.addEventListener("click", async () => {
        const shouldReset = window.confirm("Delete all saved bookings and clear every user dashboard ticket?");

        if (!shouldReset) {
          return;
        }

        try {
          await apiRequest("/bookings", {
            method: "DELETE"
          });
          adminDashboardResetStatus.textContent = "All dashboard tickets were cleared successfully.";
          adminDashboardResetStatus.classList.remove("error");
        } catch (error) {
          adminDashboardResetStatus.textContent = error.message;
          adminDashboardResetStatus.classList.add("error");
        }
      });
    }

    if (resetSchedulesBtn) {
      resetSchedulesBtn.addEventListener("click", async () => {
        const defaultShows = buildShowCatalog(movieCatalog, prices);

        try {
          await apiRequest("/shows/bulk/purge", {
            method: "DELETE",
            body: JSON.stringify({ movie_ids: Object.keys(movieCatalog) })
          });

          await upsertShowsToSupabase(defaultShows.map((show) => mapShowEntryToRow(show)));
          showCatalog = defaultShows;
        } catch (error) {
          adminScheduleStatus.textContent = error.message;
          adminScheduleStatus.classList.add("error");
          return;
        }

        renderAdminScheduleGrid(showCatalog);
        adminScheduleStatus.textContent = "Schedules reset to default values.";
        adminScheduleStatus.classList.remove("error");
      });
    }

    if (resetFoodItemsBtn) {
      resetFoodItemsBtn.addEventListener("click", async () => {
        const defaultFoodRows = DEFAULT_FOOD_MENU.map((item) => mapFoodEntryToRow(item.id, normalizeFoodEntry(item, item.id)));

        try {
          await apiRequest("/food/bulk/clear", {
            method: "DELETE"
          });

          await upsertFoodItemsToSupabase(defaultFoodRows);
          foodMenu = {};
          defaultFoodRows.forEach((row) => {
            foodMenu[row.id] = mapFoodRowToEntry(row);
          });
        } catch (error) {
          adminFoodPriceStatus.textContent = error.message;
          adminFoodPriceStatus.classList.add("error");
          return;
        }

        renderAdminFoodGrid(foodMenu);
        adminFoodPriceStatus.textContent = "Food menu reset to default items.";
        adminFoodPriceStatus.classList.remove("error");
      });
    }

    if (addMovieForm) {
      addMovieForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const formData = new FormData(addMovieForm);
        const name = String(formData.get("name") || "").trim();
        const genre = String(formData.get("genre") || "").trim();
        const summary = String(formData.get("summary") || "").trim();
        const trailerUrl = String(formData.get("trailerUrl") || "").trim();
        const duration = String(formData.get("duration") || "").trim();
        const certificate = String(formData.get("certificate") || "").trim();
        const releaseDate = String(formData.get("releaseDate") || "").trim();
        const languages = String(formData.get("languages") || "").trim();
        const formats = String(formData.get("formats") || "").trim();
        const rating = String(formData.get("rating") || "").trim();
        const votes = String(formData.get("votes") || "").trim();
        const criticRating = String(formData.get("criticRating") || "").trim();
        const highlights = String(formData.get("highlights") || "")
          .split(/\r?\n|,/)
          .map((item) => item.trim())
          .filter(Boolean);
        const regular = Number(formData.get("regular"));
        const silver = Number(formData.get("silver"));
        const gold = Number(formData.get("gold"));
        const posterFile = addMovieForm.querySelector('input[name="poster"]').files?.[0];
        const movieId = slugifyMovieId(name);

        if (!name || !genre || !summary || !movieId) {
          addMovieStatus.textContent = "Movie name, genre, and summary are required.";
          addMovieStatus.classList.add("error");
          return;
        }

        if (!posterFile) {
          addMovieStatus.textContent = "Please upload a poster for the new movie.";
          addMovieStatus.classList.add("error");
          return;
        }

        if (movieCatalog[movieId]) {
          addMovieStatus.textContent = "A movie with a similar name already exists.";
          addMovieStatus.classList.add("error");
          return;
        }

        if (
          !Number.isFinite(regular) || regular <= 0 ||
          !Number.isFinite(silver) || silver <= 0 ||
          !Number.isFinite(gold) || gold <= 0
        ) {
          addMovieStatus.textContent = "Please enter valid ticket prices greater than 0.";
          addMovieStatus.classList.add("error");
          return;
        }

        try {
          const posterImage = await uploadMoviePosterToSupabase(posterFile);
          const nextMovieEntry = normalizeMovieEntry({
            name,
            image: posterImage,
            rating: rating || "New",
            votes: votes || "Fresh Listing",
            duration: duration || "2h 00m",
            genre,
            certificate: certificate || "UA",
            releaseDate: releaseDate || "Coming Soon",
            formats: formats || "2D",
            languages: languages || "Hindi",
            summary,
            criticRating: criticRating || "New",
            highlights: highlights.length ? highlights : [
              `${name} is now live for booking.`,
              "Added directly by the cinema admin.",
              "Trailer and story details are available on the movie page."
            ],
            trailerUrl,
            defaultPrice: { regular: Math.round(regular), silver: Math.round(silver), gold: Math.round(gold) },
            isCustom: true,
            displayOrder: getNextMovieDisplayOrder(movieCatalog)
          }, movieId);

          await upsertMoviesToSupabase([mapMovieEntryToRow(movieId, nextMovieEntry)]);
          movieCatalog[movieId] = nextMovieEntry;
          movieCatalog = orderMovieCatalog(movieCatalog);

          prices[movieId] = { regular: Math.round(regular), silver: Math.round(silver), gold: Math.round(gold) };

          movieIds = Object.keys(movieCatalog);
          renderAdminPriceGrid(movieCatalog, prices);
          renderScheduleMovieOptions();
          renderAdminScheduleGrid(showCatalog);
          addMovieForm.reset();
          addMovieStatus.textContent = `${name} was uploaded to Supabase and is ready for booking.`;
          addMovieStatus.classList.remove("error");
        } catch (error) {
          addMovieStatus.textContent = error?.message || "Poster upload failed. Please try again.";
          addMovieStatus.classList.add("error");
        }
      });
    }

    if (adminFoodForm) {
      adminFoodForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const formData = new FormData(adminFoodForm);
        const name = String(formData.get("name") || "").trim();
        const category = String(formData.get("category") || "").trim();
        const badge = String(formData.get("badge") || "").trim();
        const description = String(formData.get("description") || "").trim();
        const price = Number(formData.get("price"));
        const itemId = slugifyMovieId(name);
        const posterFile = adminFoodForm.querySelector('input[name="poster"]').files?.[0];

        if (!name || !category || !description || !itemId) {
          adminFoodStatus.textContent = "Food name, category, and description are required.";
          adminFoodStatus.classList.add("error");
          return;
        }

        if (!posterFile) {
          adminFoodStatus.textContent = "Please upload a poster for the new food item.";
          adminFoodStatus.classList.add("error");
          return;
        }

        if (foodMenu[itemId]) {
          adminFoodStatus.textContent = "A similar food item already exists.";
          adminFoodStatus.classList.add("error");
          return;
        }

        if (!Number.isFinite(price) || price <= 0) {
          adminFoodStatus.textContent = "Enter a valid food price greater than 0.";
          adminFoodStatus.classList.add("error");
          return;
        }

        try {
          const posterImage = await uploadFoodPosterToSupabase(posterFile);
          const nextFoodEntry = normalizeFoodEntry({
            name,
            category,
            badge: badge || "Fresh",
            image: posterImage,
            description,
            price,
            isCustom: true
          }, itemId);

          await upsertFoodItemsToSupabase([mapFoodEntryToRow(itemId, nextFoodEntry)]);
          foodMenu[itemId] = nextFoodEntry;

          renderAdminFoodGrid(foodMenu);
          adminFoodForm.reset();
          adminFoodStatus.textContent = `${name} was uploaded to Supabase and is now available on the snack page.`;
          adminFoodStatus.classList.remove("error");
        } catch (error) {
          adminFoodStatus.textContent = error?.message || "Food poster upload failed. Please try again.";
          adminFoodStatus.classList.add("error");
        }
      });
    }
  }

  initScrollReveal();
});
