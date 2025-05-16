export const soundCategories = [
  "nature",
  "rain",
  "places",
  "urban",
  "animals",
  "binaural",
  "noise",
  "things",
  "transport",
] as const;

export type SoundCategory = (typeof soundCategories)[number];

export interface SoundPath {
  id: string;
  name: string;
  audioUrl: string;
  category: SoundCategory;
  translationKey: string;
}

export const soundPaths: SoundPath[] = [
  // Nature
  {
    id: "nature-campfire",
    name: "Campfire",
    audioUrl: "/sounds/nature/campfire.mp3",
    category: "nature",
    translationKey: "campfire"
  },
  {
    id: "nature-waterfall",
    name: "Waterfall",
    audioUrl: "/sounds/nature/waterfall.mp3",
    category: "nature",
    translationKey: "waterfall"
  },
  {
    id: "nature-waves",
    name: "Waves",
    audioUrl: "/sounds/nature/waves.mp3",
    category: "nature",
    translationKey: "waves"
  },
  {
    id: "nature-river",
    name: "River",
    audioUrl: "/sounds/nature/river.mp3",
    category: "nature",
    translationKey: "river"
  },
  {
    id: "nature-jungle",
    name: "Jungle",
    audioUrl: "/sounds/nature/jungle.mp3",
    category: "nature",
    translationKey: "jungle"
  },
  {
    id: "nature-wind",
    name: "Wind",
    audioUrl: "/sounds/nature/wind.mp3",
    category: "nature",
    translationKey: "wind"
  },
  {
    id: "nature-droplets",
    name: "Droplets",
    audioUrl: "/sounds/nature/droplets.mp3",
    category: "nature",
    translationKey: "droplets"
  },
  {
    id: "nature-howling-wind",
    name: "Howling Wind",
    audioUrl: "/sounds/nature/howling-wind.mp3",
    category: "nature",
    translationKey: "howlingWind"
  },
  {
    id: "nature-walk-in-snow",
    name: "Walk in Snow",
    audioUrl: "/sounds/nature/walk-in-snow.mp3",
    category: "nature",
    translationKey: "walkInSnow"
  },
  {
    id: "nature-walk-on-gravel",
    name: "Walk on Gravel",
    audioUrl: "/sounds/nature/walk-on-gravel.mp3",
    category: "nature",
    translationKey: "walkOnGravel"
  },
  {
    id: "nature-walk-on-leaves",
    name: "Walk on Leaves",
    audioUrl: "/sounds/nature/walk-on-leaves.mp3",
    category: "nature",
    translationKey: "walkOnLeaves"
  },
  {
    id: "nature-wind-in-trees",
    name: "Wind in Trees",
    audioUrl: "/sounds/nature/wind-in-trees.mp3",
    category: "nature",
    translationKey: "windInTrees"
  },

  // Animals
  {
    id: "animals-beehive",
    name: "Beehive",
    audioUrl: "/sounds/animals/beehive.mp3",
    category: "animals",
    translationKey: "beehive"
  },
  {
    id: "animals-birds",
    name: "Birds",
    audioUrl: "/sounds/animals/birds.mp3",
    category: "animals",
    translationKey: "birds"
  },
  {
    id: "animals-cat-purring",
    name: "Cat Purring",
    audioUrl: "/sounds/animals/cat-purring.mp3",
    category: "animals",
    translationKey: "catPurring"
  },
  {
    id: "animals-chickens",
    name: "Chickens",
    audioUrl: "/sounds/animals/chickens.mp3",
    category: "animals",
    translationKey: "chickens"
  },
  {
    id: "animals-cows",
    name: "Cows",
    audioUrl: "/sounds/animals/cows.mp3",
    category: "animals",
    translationKey: "cows"
  },
  {
    id: "animals-crickets",
    name: "Crickets",
    audioUrl: "/sounds/animals/crickets.mp3",
    category: "animals",
    translationKey: "crickets"
  },
  {
    id: "animals-crows",
    name: "Crows",
    audioUrl: "/sounds/animals/crows.mp3",
    category: "animals",
    translationKey: "crows"
  },
  {
    id: "animals-dog-barking",
    name: "Dog Barking",
    audioUrl: "/sounds/animals/dog-barking.mp3",
    category: "animals",
    translationKey: "dogBarking"
  },
  {
    id: "animals-frog",
    name: "Frog",
    audioUrl: "/sounds/animals/frog.mp3",
    category: "animals",
    translationKey: "frog"
  },
  {
    id: "animals-horse-galopp",
    name: "Horse Galopp",
    audioUrl: "/sounds/animals/horse-galopp.mp3",
    category: "animals",
    translationKey: "horseGalopp"
  },
  {
    id: "animals-owl",
    name: "Owl",
    audioUrl: "/sounds/animals/owl.mp3",
    category: "animals",
    translationKey: "owl"
  },
  {
    id: "animals-seagulls",
    name: "Seagulls",
    audioUrl: "/sounds/animals/seagulls.mp3",
    category: "animals",
    translationKey: "seagulls"
  },
  {
    id: "animals-sheep",
    name: "Sheep",
    audioUrl: "/sounds/animals/sheep.mp3",
    category: "animals",
    translationKey: "sheep"
  },
  {
    id: "animals-whale",
    name: "Whale",
    audioUrl: "/sounds/animals/whale.mp3",
    category: "animals",
    translationKey: "whale"
  },
  {
    id: "animals-wolf",
    name: "Wolf",
    audioUrl: "/sounds/animals/wolf.mp3",
    category: "animals",
    translationKey: "wolf"
  },
  {
    id: "animals-woodpecker",
    name: "Woodpecker",
    audioUrl: "/sounds/animals/woodpecker.mp3",
    category: "animals",
    translationKey: "woodpecker"
  },

  // Binaural
  {
    id: "binaural-alpha",
    name: "Binaural Alpha",
    audioUrl: "/sounds/binaural/binaural-alpha.wav",
    category: "binaural",
    translationKey: "alpha"
  },
  {
    id: "binaural-beta",
    name: "Binaural Beta",
    audioUrl: "/sounds/binaural/binaural-beta.wav",
    category: "binaural",
    translationKey: "beta"
  },
  {
    id: "binaural-delta",
    name: "Binaural Delta",
    audioUrl: "/sounds/binaural/binaural-delta.wav",
    category: "binaural",
    translationKey: "delta"
  },
  {
    id: "binaural-gamma",
    name: "Binaural Gamma",
    audioUrl: "/sounds/binaural/binaural-gamma.wav",
    category: "binaural",
    translationKey: "gamma"
  },
  {
    id: "binaural-theta",
    name: "Binaural Theta",
    audioUrl: "/sounds/binaural/binaural-theta.wav",
    category: "binaural",
    translationKey: "theta"
  },

  // Noise
  {
    id: "noise-brown",
    name: "Brown Noise",
    audioUrl: "/sounds/noise/brown-noise.wav",
    category: "noise",
    translationKey: "brown"
  },
  {
    id: "noise-pink",
    name: "Pink Noise",
    audioUrl: "/sounds/noise/pink-noise.wav",
    category: "noise",
    translationKey: "pink"
  },
  {
    id: "noise-white",
    name: "White Noise",
    audioUrl: "/sounds/noise/white-noise.wav",
    category: "noise",
    translationKey: "white"
  },

  // Places
  {
    id: "places-airport",
    name: "Airport",
    audioUrl: "/sounds/places/airport.mp3",
    category: "places",
    translationKey: "airport"
  },
  {
    id: "places-cafe",
    name: "Cafe",
    audioUrl: "/sounds/places/cafe.mp3",
    category: "places",
    translationKey: "cafe"
  },
  {
    id: "places-carousel",
    name: "Carousel",
    audioUrl: "/sounds/places/carousel.mp3",
    category: "places",
    translationKey: "carousel"
  },
  {
    id: "places-church",
    name: "Church",
    audioUrl: "/sounds/places/church.mp3",
    category: "places",
    translationKey: "church"
  },
  {
    id: "places-construction-site",
    name: "Construction Site",
    audioUrl: "/sounds/places/construction-site.mp3",
    category: "places",
    translationKey: "constructionSite"
  },
  {
    id: "places-crowded-bar",
    name: "Crowded Bar",
    audioUrl: "/sounds/places/crowded-bar.mp3",
    category: "places",
    translationKey: "crowdedBar"
  },
  {
    id: "places-laboratory",
    name: "Laboratory",
    audioUrl: "/sounds/places/laboratory.mp3",
    category: "places",
    translationKey: "laboratory"
  },
  {
    id: "places-laundry-room",
    name: "Laundry Room",
    audioUrl: "/sounds/places/laundry-room.mp3",
    category: "places",
    translationKey: "laundryRoom"
  },
  {
    id: "places-library",
    name: "Library",
    audioUrl: "/sounds/places/library.mp3",
    category: "places",
    translationKey: "library"
  },
  {
    id: "places-night-village",
    name: "Night Village",
    audioUrl: "/sounds/places/night-village.mp3",
    category: "places",
    translationKey: "nightVillage"
  },
  {
    id: "places-office",
    name: "Office",
    audioUrl: "/sounds/places/office.mp3",
    category: "places",
    translationKey: "office"
  },
  {
    id: "places-restaurant",
    name: "Restaurant",
    audioUrl: "/sounds/places/restaurant.mp3",
    category: "places",
    translationKey: "restaurant"
  },
  {
    id: "places-subway-station",
    name: "Subway Station",
    audioUrl: "/sounds/places/subway-station.mp3",
    category: "places",
    translationKey: "subwayStation"
  },
  {
    id: "places-supermarket",
    name: "Supermarket",
    audioUrl: "/sounds/places/supermarket.mp3",
    category: "places",
    translationKey: "supermarket"
  },
  {
    id: "places-temple",
    name: "Temple",
    audioUrl: "/sounds/places/temple.mp3",
    category: "places",
    translationKey: "temple"
  },
  {
    id: "places-underwater",
    name: "Underwater",
    audioUrl: "/sounds/places/underwater.mp3",
    category: "places",
    translationKey: "underwater"
  },

  // Rain
  {
    id: "rain-light",
    name: "Light Rain",
    audioUrl: "/sounds/rain/light-rain.mp3",
    category: "rain",
    translationKey: "light"
  },
  {
    id: "rain-heavy",
    name: "Heavy Rain",
    audioUrl: "/sounds/rain/heavy-rain.mp3",
    category: "rain",
    translationKey: "heavy"
  },
  {
    id: "rain-window",
    name: "Rain on Window",
    audioUrl: "/sounds/rain/rain-on-window.mp3",
    category: "rain",
    translationKey: "window"
  },
  {
    id: "rain-thunder",
    name: "Thunder",
    audioUrl: "/sounds/rain/thunder.mp3",
    category: "rain",
    translationKey: "thunder"
  },
  {
    id: "rain-on-car-roof",
    name: "Rain on Car Roof",
    audioUrl: "/sounds/rain/rain-on-car-roof.mp3",
    category: "rain",
    translationKey: "onCarRoof"
  },
  {
    id: "rain-on-leaves",
    name: "Rain on Leaves",
    audioUrl: "/sounds/rain/rain-on-leaves.mp3",
    category: "rain",
    translationKey: "onLeaves"
  },
  {
    id: "rain-on-tent",
    name: "Rain on Tent",
    audioUrl: "/sounds/rain/rain-on-tent.mp3",
    category: "rain",
    translationKey: "onTent"
  },
  {
    id: "rain-on-umbrella",
    name: "Rain on Umbrella",
    audioUrl: "/sounds/rain/rain-on-umbrella.mp3",
    category: "rain",
    translationKey: "onUmbrella"
  },

  // Urban
  {
    id: "urban-ambulance-siren",
    name: "Ambulance Siren",
    audioUrl: "/sounds/urban/ambulance-siren.mp3",
    category: "urban",
    translationKey: "ambulanceSiren"
  },
  {
    id: "urban-busy-street",
    name: "Busy Street",
    audioUrl: "/sounds/urban/busy-street.mp3",
    category: "urban",
    translationKey: "busyStreet"
  },
  {
    id: "urban-crowd",
    name: "Crowd",
    audioUrl: "/sounds/urban/crowd.mp3",
    category: "urban",
    translationKey: "crowd"
  },
  {
    id: "urban-fireworks",
    name: "Fireworks",
    audioUrl: "/sounds/urban/fireworks.mp3",
    category: "urban",
    translationKey: "fireworks"
  },
  {
    id: "urban-highway",
    name: "Highway",
    audioUrl: "/sounds/urban/highway.mp3",
    category: "urban",
    translationKey: "highway"
  },
  {
    id: "urban-road",
    name: "Road",
    audioUrl: "/sounds/urban/road.mp3",
    category: "urban",
    translationKey: "road"
  },
  {
    id: "urban-traffic",
    name: "Traffic",
    audioUrl: "/sounds/urban/traffic.mp3",
    category: "urban",
    translationKey: "traffic"
  },

  // Things
  {
    id: "things-boiling-water",
    name: "Boiling Water",
    audioUrl: "/sounds/things/boiling-water.mp3",
    category: "things",
    translationKey: "boilingWater"
  },
  {
    id: "things-bubbles",
    name: "Bubbles",
    audioUrl: "/sounds/things/bubbles.mp3",
    category: "things",
    translationKey: "bubbles"
  },
  {
    id: "things-ceiling-fan",
    name: "Ceiling Fan",
    audioUrl: "/sounds/things/ceiling-fan.mp3",
    category: "things",
    translationKey: "ceilingFan"
  },
  {
    id: "things-clock",
    name: "Clock",
    audioUrl: "/sounds/things/clock.mp3",
    category: "things",
    translationKey: "clock"
  },
  {
    id: "things-dryer",
    name: "Dryer",
    audioUrl: "/sounds/things/dryer.mp3",
    category: "things",
    translationKey: "dryer"
  },
  {
    id: "things-keyboard",
    name: "Keyboard",
    audioUrl: "/sounds/things/keyboard.mp3",
    category: "things",
    translationKey: "keyboard"
  },
  {
    id: "things-morse-code",
    name: "Morse Code",
    audioUrl: "/sounds/things/morse-code.mp3",
    category: "things",
    translationKey: "morseCode"
  },
  {
    id: "things-paper",
    name: "Paper",
    audioUrl: "/sounds/things/paper.mp3",
    category: "things",
    translationKey: "paper"
  },
  {
    id: "things-singing-bowl",
    name: "Singing Bowl",
    audioUrl: "/sounds/things/singing-bowl.mp3",
    category: "things",
    translationKey: "singingBowl"
  },
  {
    id: "things-slide-projector",
    name: "Slide Projector",
    audioUrl: "/sounds/things/slide-projector.mp3",
    category: "things",
    translationKey: "slideProjector"
  },
  {
    id: "things-tuning-radio",
    name: "Tuning Radio",
    audioUrl: "/sounds/things/tuning-radio.mp3",
    category: "things",
    translationKey: "tuningRadio"
  },
  {
    id: "things-typewriter",
    name: "Typewriter",
    audioUrl: "/sounds/things/typewriter.mp3",
    category: "things",
    translationKey: "typewriter"
  },
  {
    id: "things-vinyl-effect",
    name: "Vinyl Effect",
    audioUrl: "/sounds/things/vinyl-effect.mp3",
    category: "things",
    translationKey: "vinylEffect"
  },
  {
    id: "things-washing-machine",
    name: "Washing Machine",
    audioUrl: "/sounds/things/washing-machine.mp3",
    category: "things",
    translationKey: "washingMachine"
  },
  {
    id: "things-wind-chimes",
    name: "Wind Chimes",
    audioUrl: "/sounds/things/wind-chimes.mp3",
    category: "things",
    translationKey: "windChimes"
  },
  {
    id: "things-windshield-wipers",
    name: "Windshield Wipers",
    audioUrl: "/sounds/things/windshield-wipers.mp3",
    category: "things",
    translationKey: "windshieldWipers"
  },

  // Transport
  {
    id: "transport-airplane",
    name: "Airplane",
    audioUrl: "/sounds/transport/airplane.mp3",
    category: "transport",
    translationKey: "airplane"
  },
  {
    id: "transport-inside-a-train",
    name: "Inside a Train",
    audioUrl: "/sounds/transport/inside-a-train.mp3",
    category: "transport",
    translationKey: "insideATrain"
  },
  {
    id: "transport-rowing-boat",
    name: "Rowing Boat",
    audioUrl: "/sounds/transport/rowing-boat.mp3",
    category: "transport",
    translationKey: "rowingBoat"
  },
  {
    id: "transport-sailboat",
    name: "Sailboat",
    audioUrl: "/sounds/transport/sailboat.mp3",
    category: "transport",
    translationKey: "sailboat"
  },
  {
    id: "transport-submarine",
    name: "Submarine",
    audioUrl: "/sounds/transport/submarine.mp3",
    category: "transport",
    translationKey: "submarine"
  },
  {
    id: "transport-train",
    name: "Train",
    audioUrl: "/sounds/transport/train.mp3",
    category: "transport",
    translationKey: "train"
  },

  // Alarm (no category)
  {
    id: "alarm",
    name: "Alarm",
    audioUrl: "/sounds/alarm.mp3",
    category: "things",
    translationKey: "alarm"
  },
];
