import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
/*
CharacterSelector.jsx
Single-file React component for a responsive, interactive character selection UI.
Tailwind CSS classes are used for styling. Requires Tailwind + Framer Motion in the host project.

Features implemented:
- Character grid / horizontal carousel (responsive)
- Hover/tap brief details
- Preview panel with rotate/zoom (CSS 3D), pose change, equipment highlighting
- Filters and sorting
- Detailed stats & abilities panel with animated icons
- Selection with confirmation animation and glowing outline
- Drag-and-drop into team slots
- Keyboard shortcuts (arrows to navigate, Enter to select, Esc to clear)
- Mobile-friendly interactions (swipe carousel, tap to preview)
- Optional sound effects via WebAudio (no external files)

Note: Replace inline SVG placeholders and sample data with real images/models as needed.
*/

const SAMPLE_CHARACTERS = [
  {
    id: "aether",
    name: "Aether",
    class: "Mage",
    rarity: "Legendary",
    element: "Void",
    faction: "Eclipse",
    unlocked: true,
    popularity: 98,
    power: 950,
    image: "#aether", // placeholder id for SVG
    poses: ["pose1", "pose2", "pose3"],
    stats: { hp: 4200, atk: 320, def: 180, spd: 110, skill: 430 },
    abilities: [
      { key: "Q", name: "Void Lance", type: "Active", cooldown: "12s", desc: "Pierces shields and deals massive skill damage." },
      { key: "P", name: "Eclipse Aura", type: "Passive", cooldown: "—", desc: "Grants party increased skill power." },
    ],
    skins: ["Default", "Riftweaver"],
  },
  {
    id: "talon",
    name: "Talon",
    class: "Assassin",
    rarity: "Epic",
    element: "Wind",
    faction: "Crimson Blades",
    unlocked: true,
    popularity: 87,
    power: 810,
    image: "#talon",
    poses: ["pose1", "pose2"],
    stats: { hp: 2800, atk: 540, def: 120, spd: 160, skill: 260 },
    abilities: [
      { key: "E", name: "Shadow Step", type: "Active", cooldown: "8s", desc: "Blink behind enemy and deal critical strike." },
      { key: "P", name: "Lethal Focus", type: "Passive", cooldown: "—", desc: "Crit chance increased after dash." },
    ],
    skins: ["Default", "Nightstalker", "Bloodmoon"],
  },
  {
    id: "gaia",
    name: "Gaia",
    class: "Tank",
    rarity: "Rare",
    element: "Earth",
    faction: "Wardens",
    unlocked: false,
    popularity: 66,
    power: 620,
    image: "#gaia",
    poses: ["pose1"],
    stats: { hp: 7200, atk: 160, def: 420, spd: 70, skill: 190 },
    abilities: [
      { key: "R", name: "Stonewall", type: "Active", cooldown: "18s", desc: "Generates a damage-absorbing barrier." },
    ],
    skins: ["Default"],
  },
  // add more sample characters as needed
];

export default function CharacterSelector() {
  const [characters, setCharacters] = useState(SAMPLE_CHARACTERS);
  const [selectedId, setSelectedId] = useState(null);
  const [previewChar, setPreviewChar] = useState(characters[0]);
  const [poseIndex, setPoseIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [filters, setFilters] = useState({ class: "All", rarity: "All", unlocked: "All" });
  const [sortBy, setSortBy] = useState("popularity");
  const [teamSlots, setTeamSlots] = useState([null, null, null]);
  const carouselRef = useRef(null);
  const previewRef = useRef(null);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "ArrowRight") navigateCarousel(1);
      if (e.key === "ArrowLeft") navigateCarousel(-1);
      if (e.key === "Enter") confirmSelect(previewChar.id);
      if (e.key === "Escape") clearSelection();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [previewChar]);

  function navigateCarousel(dir = 1) {
    const idx = characters.findIndex((c) => c.id === previewChar.id);
    if (idx === -1) return;
    const next = characters[(idx + dir + characters.length) % characters.length];
    setPreviewChar(next);
    setPoseIndex(0);
    scrollToCharacter(next.id);
  }

  function scrollToCharacter(id) {
    const el = document.getElementById(`card-${id}`);
    if (el && carouselRef.current) {
      el.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }

  function applyFilters(list) {
    return list
      .filter((c) => (filters.class === "All" ? true : c.class === filters.class))
      .filter((c) => (filters.rarity === "All" ? true : c.rarity === filters.rarity))
      .filter((c) => (filters.unlocked === "All" ? true : (filters.unlocked === "Unlocked" ? c.unlocked : !c.unlocked)));
  }

  function applySort(list) {
    const s = [...list];
    if (sortBy === "alphabetical") return s.sort((a, b) => a.name.localeCompare(b.name));
    if (sortBy === "power") return s.sort((a, b) => b.power - a.power);
    if (sortBy === "popularity") return s.sort((a, b) => b.popularity - a.popularity);
    if (sortBy === "newest") return s; // sample data lacks dates
    return s;
  }

  const visibleChars = applySort(applyFilters(characters));

  function briefOnHover(char) {
    setPreviewChar(char);
    setPoseIndex(0);
  }

  function toggleSelect(id) {
    if (selectedId === id) {
      setSelectedId(null);
    } else {
      setSelectedId(id);
    }
  }

  function confirmSelect(id) {
    setSelectedId(id);
    playClickTone();
    // selection confirmation animation handled by Framer Motion in the card
  }

  function clearSelection() {
    setSelectedId(null);
  }

  // Drag-and-drop handlers for team slots
  function onDragStart(e, charId) {
    e.dataTransfer.setData("text/char", charId);
  }
  function onDropToSlot(e, idx) {
    const charId = e.dataTransfer.getData("text/char");
    const char = characters.find((c) => c.id === charId);
    if (!char) return;
    setTeamSlots((prev) => {
      const copy = [...prev];
      copy[idx] = char;
      return copy;
    });
  }
  function onDragOver(e) {
    e.preventDefault();
  }

  // Simple WebAudio tone for click/hover
  function playTone(freq = 440, time = 0.05) {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = freq;
      g.gain.value = 0.02;
      o.connect(g);
      g.connect(ctx.destination);
      o.start();
      o.stop(ctx.currentTime + time);
    } catch (e) {
      // audio not available
    }
  }
  function playClickTone() {
    playTone(880, 0.06);
  }
  function playHoverTone() {
    playTone(660, 0.03);
  }

  // Preview interactions: rotate via drag, zoom via wheel
  useEffect(() => {
    const el = previewRef.current;
    if (!el) return;
    let dragging = false;
    let lastX = 0;
    function onPointerDown(e) {
      dragging = true;
      lastX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
    }
    function onPointerMove(e) {
      if (!dragging) return;
      const x = e.clientX || (e.touches && e.touches[0].clientX) || 0;
      const dx = x - lastX;
      lastX = x;
      setRotation((r) => r + dx * 0.3);
    }
    function onPointerUp() {
      dragging = false;
    }
    function onWheel(e) {
      e.preventDefault();
      setZoom((z) => Math.min(2.2, Math.max(0.6, z - e.deltaY * 0.001)));
    }
    el.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("wheel", onWheel);
    };
  }, []);

  // helper to cycle pose
  function nextPose() {
    const c = previewChar;
    if (!c) return;
    setPoseIndex((p) => (p + 1) % c.poses.length);
  }
  function prevPose() {
    const c = previewChar;
    if (!c) return;
    setPoseIndex((p) => (p - 1 + c.poses.length) % c.poses.length);
  }

  // UI rendering helpers: inline placeholder SVGs for characters
  function CharacterSVG({ id, name, highlighted }) {
    // Color map by id
    const colors = {
      aether: ["#7C3AED", "#06B6D4"],
      talon: ["#EF4444", "#F97316"],
      gaia: ["#16A34A", "#F59E0B"],
    };
    const c = colors[id] || ["#60A5FA", "#A78BFA"];
    return (
      <svg viewBox="0 0 160 240" className="w-full h-full">
        <defs>
          <linearGradient id={`g-${id}`} x1="0" x2="1">
            <stop offset="0" stopColor={c[0]} />
            <stop offset="1" stopColor={c[1]} />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="160" height="240" rx="14" fill="url(#g-${id})" opacity="0.12" />
        <g transform="translate(80,120)">
          <circle cx="0" cy="-20" r="34" fill={c[0]} opacity="0.95" />
          <rect x="-28" y="20" width="56" height="80" rx="8" fill={c[1]} opacity="0.95" />
          {highlighted && <circle cx="36" cy="-56" r="8" fill="#FFD54F" />}
        </g>
        <text x="80" y="220" textAnchor="middle" fontSize="12" fill="#fff" opacity="0.95">{name}</text>
      </svg>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Filters + Grid / Carousel */}
        <aside className="col-span-1 lg:col-span-1 space-y-4">
          <div className="bg-white/5 rounded-2xl p-4 backdrop-blur-sm">
            <h3 className="text-xl font-semibold">Filters</h3>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <select
                className="bg-white/3 p-2 rounded"
                value={filters.class}
                onChange={(e) => setFilters((f) => ({ ...f, class: e.target.value }))}
              >
                <option>All</option>
                <option>Mage</option>
                <option>Assassin</option>
                <option>Tank</option>
              </select>
              <select
                className="bg-white/3 p-2 rounded"
                value={filters.rarity}
                onChange={(e) => setFilters((f) => ({ ...f, rarity: e.target.value }))}
              >
                <option>All</option>
                <option>Common</option>
                <option>Rare</option>
                <option>Epic</option>
                <option>Legendary</option>
              </select>
              <select
                className="bg-white/3 p-2 rounded col-span-2"
                value={filters.unlocked}
                onChange={(e) => setFilters((f) => ({ ...f, unlocked: e.target.value }))}
              >
                <option>All</option>
                <option>Unlocked</option>
                <option>Locked</option>
              </select>
              <select
                className="bg-white/3 p-2 rounded col-span-2"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="popularity">Sort: Popularity</option>
                <option value="power">Sort: Power</option>
                <option value="alphabetical">Sort: A → Z</option>
                <option value="newest">Sort: Newest</option>
              </select>
            </div>
          </div>

          <div className="bg-white/5 rounded-2xl p-3 backdrop-blur-sm">
            <h3 className="text-lg font-semibold mb-2">Team Slots</h3>
            <div className="flex gap-2">
              {teamSlots.map((slot, i) => (
                <div
                  key={i}
                  onDrop={(e) => onDropToSlot(e, i)}
                  onDragOver={onDragOver}
                  className="w-1/3 aspect-[3/4] rounded-lg bg-white/3 flex items-center justify-center"
                >
                  {slot ? (
                    <div className="text-sm text-left px-2">
                      <div className="font-semibold">{slot.name}</div>
                      <div className="text-xs text-gray-300">{slot.class} · {slot.rarity}</div>
                    </div>
                  ) : (
                    <div className="text-xs text-gray-400">Drop
                      <br />Character
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-3 text-sm text-gray-300">Tip: drag a character card into a team slot. Use keyboard ← → to browse, Enter to select.</div>
          </div>

          <div className="bg-white/5 rounded-2xl p-3 backdrop-blur-sm">
            <h3 className="text-lg font-semibold">Quick Compare</h3>
            <p className="text-sm text-gray-300">Select two characters to compare side-by-side.</p>
            <div className="mt-2 flex gap-2">
              {visibleChars.slice(0, 4).map((c) => (
                <button
                  key={c.id}
                  onClick={() => setPreviewChar(c)}
                  className="p-2 bg-white/3 rounded w-full text-xs"
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Middle: Carousel / Grid */}
        <main className="col-span-1 lg:col-span-1">
          <div className="bg-white/5 rounded-2xl p-3 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-bold">Characters</h2>
              <div className="text-sm text-gray-300">{visibleChars.length} found</div>
            </div>

            {/* Horizontal carousel for mobile / grid for desktop */}
            <div
              ref={carouselRef}
              className="overflow-x-auto md:overflow-visible md:h-auto py-2 carousel flex gap-3 md:grid md:grid-cols-2 lg:grid-cols-3"
            >
              {visibleChars.map((char) => (
                <motion.div
                  id={`card-${char.id}`}
                  key={char.id}
                  layout
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.02 }}
                  className={`min-w-[200px] md:min-w-0 bg-gradient-to-br from-white/4 to-white/1 p-3 rounded-2xl border border-white/6 relative ${selectedId === char.id ? 'ring-4 ring-indigo-500/50' : ''}`}
                  draggable
                  onDragStart={(e) => onDragStart(e, char.id)}
                >
                  <div
                    onMouseEnter={() => { briefOnHover(char); playHoverTone(); }}
                    onClick={() => { setPreviewChar(char); setPoseIndex(0); }}
                    className="cursor-pointer"
                  >
                    <div className="h-40 w-full mb-2 relative">
                      {/* placeholder svg */}
                      <CharacterSVG id={char.id} name={char.name} highlighted={selectedId === char.id} />
                      <div className="absolute top-2 right-2 text-xs bg-black/40 px-2 py-1 rounded">{char.rarity}</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-lg font-semibold">{char.name}</div>
                        <div className="text-sm text-gray-300">{char.class} · {char.element}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold">{char.power}</div>
                        <div className="text-xs text-gray-400">Power</div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => confirmSelect(char.id)}
                      className="flex-1 bg-indigo-600/80 hover:bg-indigo-500/90 px-3 py-2 rounded font-semibold text-sm"
                    >Select</button>
                    <button
                      onClick={() => { setPreviewChar(char); }}
                      className="w-10 h-10 rounded bg-white/3 flex items-center justify-center"
                      title="Preview"
                    >
                      ▶
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>

          </div>
        </main>

        {/* Right: Preview & Details */}
        <aside className="col-span-1 lg:col-span-1">
          <div className="bg-white/5 rounded-2xl p-4 backdrop-blur-sm h-full flex flex-col">
            <div className="flex items-start gap-4">
              <div className="w-2/3">
                <div className="relative bg-gradient-to-br from-black/50 to-white/2 rounded-lg overflow-hidden">
                  <div className="absolute inset-0 pointer-events-none opacity-30" style={{ background: `linear-gradient(180deg, rgba(255,255,255,0.02), transparent 30%)` }} />
                  <div className="p-4">
                    <div
                      ref={previewRef}
                      className="w-full h-64 md:h-80 rounded-lg overflow-hidden flex items-center justify-center"
                      style={{ perspective: 1200 }}
                    >
                      <motion.div
                        animate={{ rotateY: rotation, scale: zoom }}
                        transition={{ type: "spring", stiffness: 80, damping: 18 }}
                        className="w-56 h-72 md:w-72 md:h-96 transform-style-preserve-3d will-change-transform"
                      >
                        {/* Simulated 3D card with pose/equipment overlays */}
                        <div className="relative w-full h-full rounded-lg shadow-2xl overflow-hidden bg-gradient-to-br from-white/10 to-black/10 flex items-start justify-center">
                          <div className="absolute inset-0 flex items-center justify-center">
                            <svg viewBox="0 0 200 300" className="w-56 h-72 md:w-72 md:h-96">
                              <defs>
                                <radialGradient id="gGlow" cx="50%" cy="30%">
                                  <stop offset="0%" stopColor="#fff" stopOpacity="0.18" />
                                  <stop offset="100%" stopColor="#000" stopOpacity="0" />
                                </radialGradient>
                              </defs>
                              <rect x="0" y="0" width="200" height="300" rx="16" fill="url(#gGlow)" />

                              {/* big placeholder character circle */}
                              <g transform="translate(100,120)">
                                <circle r="48" fill="#111827" />
                                <circle r="40" fill={previewChar && (previewChar.id === 'aether' ? '#7C3AED' : previewChar.id === 'talon' ? '#EF4444' : '#16A34A')} opacity="0.95" />
                              </g>

                              <text x="100" y="270" textAnchor="middle" fontSize="14" fill="#fff">{previewChar.name}</text>
                            </svg>
                          </div>

                          {/* equipment highlight badges */}
                          <div className="absolute bottom-4 left-4 flex gap-2">
                            <div className="text-xs bg-black/40 px-2 py-1 rounded">Weapon</div>
                            <div className="text-xs bg-black/40 px-2 py-1 rounded">Armor</div>
                          </div>
                        </div>
                      </motion.div>
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      <button onClick={prevPose} className="px-2 py-1 bg-white/3