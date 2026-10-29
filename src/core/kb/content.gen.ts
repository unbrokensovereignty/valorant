// Made by tools/prepare-art.mjs from the game's own content: don't edit by hand.
// Each agent's description, colors and abilities, and each map's callouts with their places on the
// minimap (fractions of its width and height).

export interface KitAbility { key: 'C' | 'Q' | 'E' | 'X' | 'Passive'; slot: string; name: string; text: string }
export interface Kit { about: string; colors: string[]; abilities: KitAbility[] }

export const KITS: Record<string, Kit> = {
 "astra": {
  "about": "Ghanaian Agent Astra harnesses the energies of the cosmos to reshape battlefields to her whim. With full command of her astral form and a talent for deep strategic foresight, she's always eons ahead of her enemy's next move.",
  "colors": [
   "#26146c",
   "#0f1923",
   "#5210c6"
  ],
  "abilities": [
   {
    "key": "C",
    "slot": "grenade",
    "name": "Gravity Well",
    "text": "Place Stars in Astral Form (Ultimate Key). ACTIVATE a Star to form a Gravity Well. Players in the area are pulled toward the center before it explodes, making all players still trapped inside Vulnerable."
   },
   {
    "key": "Q",
    "slot": "ability1",
    "name": "Nova Pulse",
    "text": "Place Stars in Astral Form (Ultimate Key). ACTIVATE a Star to detonate a Nova Pulse. The Nova Pulse charges briefly then strikes, Concussing all players in its area."
   },
   {
    "key": "E",
    "slot": "ability2",
    "name": "Nebula",
    "text": "Place Stars in Astral Form (Ultimate Key). ACTIVATE a Star to transform it into a Nebula (smoke). USE a Star to Dissipate it, returning the Star to be placed in a new location after a delay. Dissipate briefly forms a fake Nebula at the Star's location before returning."
   },
   {
    "key": "X",
    "slot": "ultimate",
    "name": "Cosmic Divide",
    "text": "ACTIVATE to enter Astral Form where you can place Stars with FIRE. Stars can be reactivated later, transforming them into a Nova Pulse, Nebula, or Gravity Well. When Cosmic Divide is charged, use ALT FIRE in Astral Form to begin aiming it, then FIRE to select two locations. An infinite Cosmic Divide connects the two points you select. Cosmic Divide blocks bullets and sound."
   },
   {
    "key": "Passive",
    "slot": "passive",
    "name": "Astral Form",
    "text": "ACTIVATE Ultimate to enter Astral Form and PRIMARY FIRE to place Stars. Target Stars with your Nova Pulse, Nebula, or Gravity Well to use those abilities."
   }
  ]
 },
 "breach": {
  "about": "The bionic Swede Breach fires powerful, targeted kinetic blasts to aggressively clear a path through enemy ground. The damage and disruption he inflicts ensures no fight is ever fair.",
  "colors": [
   "#81331a",
   "#0f1923",
   "#523a23"
  ],
  "abilities": [
   {
    "key": "C",
    "slot": "grenade",
    "name": "Aftershock",
    "text": "EQUIP a fusion charge. FIRE the charge to set a slow-acting burst through the wall. The burst does heavy damage to anyone caught in its area."
   },
   {
    "key": "Q",
    "slot": "ability1",
    "name": "Flashpoint",
    "text": "EQUIP a Blinding charge. FIRE the charge to set a fast-acting burst through the wall. The charge detonates to Blind all players looking at it."
   },
   {
    "key": "E",
    "slot": "ability2",
    "name": "Fault Line",
    "text": "EQUIP a Seismic Blast. HOLD FIRE to increase the distance. RELEASE to set off the quake, Concussing all players in its zone and in a line up to the zone."
   },
   {
    "key": "X",
    "slot": "ultimate",
    "name": "Rolling Thunder",
    "text": "EQUIP a Seismic Charge. FIRE to send a cascading quake through all terrain in a large zone. The quake Concusses and knocks up anyone caught in it."
   }
  ]
 },
 "brimstone": {
  "about": "Joining from the U.S.A., Brimstone's orbital arsenal ensures his squad always has the advantage. His ability to deliver utility precisely and safely make him the unmatched boots-on-the-ground commander.",
  "colors": [
   "#363c4f",
   "#0f1923",
   "#211d21"
  ],
  "abilities": [
   {
    "key": "C",
    "slot": "grenade",
    "name": "Stim Beacon",
    "text": "INSTANTLY toss down a stim beacon. Upon landing, it creates a field that grants players a Combat Stim and a Speed Boost."
   },
   {
    "key": "Q",
    "slot": "ability1",
    "name": "Incendiary",
    "text": "EQUIP an incendiary grenade launcher. FIRE to launch a grenade that detonates as it comes to a rest on the floor, creating a lingering fire zone that damages players within the zone."
   },
   {
    "key": "E",
    "slot": "ability2",
    "name": "Sky Smoke",
    "text": "EQUIP a tactical map. FIRE to set locations where Brimstone's smoke clouds will land. ALT FIRE to confirm, launching long-lasting smoke clouds that block vision in the selected area."
   },
   {
    "key": "X",
    "slot": "ultimate",
    "name": "Orbital Strike",
    "text": "EQUIP a tactical map. FIRE to launch a lingering orbital strike laser at the selected location, dealing high damage-over-time to players caught in the selected area."
   }
  ]
 },
 "chamber": {
  "about": "Well-dressed and well-armed, French weapons designer Chamber expels aggressors with deadly precision. He leverages his custom arsenal to hold the line and pick off enemies from afar, with a contingency built for every plan.",
  "colors": [
   "#20435b",
   "#0f1923",
   "#372d2b"
  ],
  "abilities": [
   {
    "key": "C",
    "slot": "grenade",
    "name": "Trademark",
    "text": "EQUIP a trap that scans for enemies. FIRE to place it on the ground. When a visible enemy comes in range, the trap counts down and then destabilizes the terrain around them, creating a lingering field that Slows players caught inside of it. The trap can be picked up to be REDEPLOYED."
   },
   {
    "key": "Q",
    "slot": "ability1",
    "name": "Headhunter",
    "text": "ACTIVATE to equip a heavy pistol. ALT FIRE with the pistol equipped to aim down sights."
   },
   {
    "key": "E",
    "slot": "ability2",
    "name": "Rendezvous",
    "text": "EQUIP a teleport anchor. FIRE to place it on the ground. While on the ground and in range of the anchor, REACTIVATE to quickly teleport to the anchor. The anchor can be picked up to be REDEPLOYED."
   },
   {
    "key": "X",
    "slot": "ultimate",
    "name": "Tour De Force",
    "text": "ACTIVATE to summon a powerful, custom sniper rifle that will kill an enemy with any direct hit to the upper body. ALT FIRE to aim down sights. Killing an enemy creates a lingering field that Slows players caught inside of it."
   }
  ]
 },
 "clove": {
  "about": "Scottish troublemaker Clove makes mischief for enemies in both the heat of combat and the cold of death. The young immortal keeps foes guessing, even from beyond the grave, their return to the living only ever a moment away.",
  "colors": [
   "#4b1d80",
   "#0f1923",
   "#c347c7"
  ],
  "abilities": [
   {
    "key": "C",
    "slot": "grenade",
    "name": "Pick-me-up",
    "text": "ACTIVATE to absorb the life force of a fallen enemy that Clove damaged or killed, gaining haste and temporary health."
   },
   {
    "key": "Q",
    "slot": "ability1",
    "name": "Meddle",
    "text": "EQUIP a fragment of immortality essence. FIRE to throw the fragment, which upon landing on the floor, erupts after a short delay and temporarily Decays all targets caught inside."
   },
   {
    "key": "E",
    "slot": "ability2",
    "name": "Ruse",
    "text": "EQUIP a view of the battlefield. FIRE to set the locations where Clove’s clouds will settle. ALT FIRE to confirm, launching clouds that block vision in the chosen areas. Clove can use this ability after death."
   },
   {
    "key": "X",
    "slot": "ultimate",
    "name": "Not Dead Yet",
    "text": "After dying, ACTIVATE to resurrect. Once resurrected, Clove must earn a kill or a damaging assist within a set time or they will die. REACTIVATE to cancel early."
   }
  ]
 },
 "cypher": {
  "about": "The Moroccan information broker, Cypher is a one-man surveillance network who keeps tabs on the enemy's every move. No secret is safe. No maneuver goes unseen. Cypher is always watching.",
  "colors": [
   "#2f5078",
   "#0f1923",
   "#3f3f6c"
  ],
  "abilities": [
   {
    "key": "C",
    "slot": "grenade",
    "name": "Trapwire",
    "text": "EQUIP a trapwire. FIRE to place a destructible and covert trapwire at the targeted location, creating a line that spans between the placed location and the wall opposite. Enemy players who cross a trapwire will be Slowed and Revealed after a short period if they do not destroy the device in time. This ability can be picked up to be REDEPLOYED."
   },
   {
    "key": "Q",
    "slot": "ability1",
    "name": "Cyber Cage",
    "text": "INSTANTLY toss the cyber cage in front of Cypher. ACTIVATE to create a zone that blocks vision and plays an audio cue when enemies pass through it."
   },
   {
    "key": "E",
    "slot": "ability2",
    "name": "Spycam",
    "text": "EQUIP a spycam. FIRE to place the spycam at the targeted location. RE-USE this ability to take control of the camera's view. While in control of the camera, FIRE to shoot a marking dart. This dart will Reveal the location of any player struck by the dart. This ability can be picked up to be REDEPLOYED."
   },
   {
    "key": "X",
    "slot": "ultimate",
    "name": "Neural Theft",
    "text": "INSTANTLY use on a targeted dead enemy to download information on their team. After a brief delay, the location of all living enemy players will be Revealed twice."
   }
  ]
 },
 "deadlock": {
  "about": "Norwegian operative Deadlock deploys an array of cutting-edge nanowire to secure the battlefield from even the most lethal assault. No one escapes her vigilant watch, nor survives her unyielding ferocity.",
  "colors": [
   "#425495",
   "#0f1923",
   "#221c3d"
  ],
  "abilities": [
   {
    "key": "C",
    "slot": "ability2",
    "name": "GravNet",
    "text": "EQUIP a GravNet grenade. FIRE to throw. ALT FIRE to lob. The GravNet detonates upon landing, forcing any characters caught within to crouch and move slowly."
   },
   {
    "key": "Q",
    "slot": "ability1",
    "name": "Sonic Sensor",
    "text": "EQUIP a Sonic Sensor. FIRE to deploy. The sensor monitors an area for enemies making sound. It concusses that area if footsteps, weapons fire, or significant noise are detected. This ability can be picked up to be REDEPLOYED."
   },
   {
    "key": "E",
    "slot": "grenade",
    "name": "Barrier Mesh",
    "text": "EQUIP a Barrier Mesh disc. FIRE to throw forward. Upon landing, the disc generates barriers from the origin point that block character movement."
   },
   {
    "key": "X",
    "slot": "ultimate",
    "name": "Annihilation",
    "text": "EQUIP a Nanowire Accelerator. FIRE to unleash a pulse of nanowires that captures the first enemy contacted. The cocooned enemy is pulled along a nanowire path and will die unless they are freed. The nanowire cocoon is destructible."
   }
  ]
 },
 "fade": {
  "about": "Turkish bounty hunter Fade unleashes the power of raw nightmare to seize enemy secrets. Attuned with terror itself, she hunts down targets and reveals their deepest fears - before crushing them in the dark.",
  "colors": [
   "#1d2846",
   "#0f1923",
   "#18344c"
  ],
  "abilities": [
   {
    "key": "C",
    "slot": "grenade",
    "name": "Prowler",
    "text": "EQUIP a prowler. FIRE to send the prowler forward. HOLD FIRE to steer the prowler towards your crosshair. The prowler will chase down the first enemy or terror trail it sees, and Nearsight the enemy on impact."
   },
   {
    "key": "Q",
    "slot": "ability1",
    "name": "Seize",
    "text": "EQUIP a knot of raw fear. FIRE to throw. The knot drops down after a set time. RE-USE to drop the knot early. The knot ruptures on impact, holding nearby enemies in place. Held enemies are Deafened, and Decayed."
   },
   {
    "key": "E",
    "slot": "ability2",
    "name": "Haunt",
    "text": "EQUIP a haunting watcher. FIRE to throw. The watcher drops down after a set time. RE-USE to drop the watcher early. The watcher lashes out on impact, Revealing enemies in its line of sight and creating terror trails to them. Enemies can destroy the watcher."
   },
   {
    "key": "X",
    "slot": "ultimate",
    "name": "Nightfall",
    "text": "EQUIP the power of nightmare itself. FIRE to unleash a wave of unstoppable nightmare energy. Enemies caught in the wave are Marked by terror trails, Deafened, and Decayed."
   }
  ]
 },
 "gekko": {
  "about": "Gekko the Angeleno leads a tight-knit crew of calamitous creatures. His buddies bound forward, scattering enemies out of the way, with Gekko chasing them down to regroup and go again.",
  "colors": [
   "#371c5c",
   "#0f1923",
   "#3a2656"
  ],
  "abilities": [
   {
    "key": "C",
    "slot": "grenade",
    "name": "Mosh Pit",
    "text": "EQUIP Mosh. FIRE to throw Mosh like a grenade. ALT FIRE to lob. Upon landing Mosh duplicates across a large area that deals a small amount of damage over time then after a short delay explodes. INTERACT to reclaim the globule and gain another Mosh charge after a short cooldown."
   },
   {
    "key": "Q",
    "slot": "ability1",
    "name": "Wingman",
    "text": "EQUIP Wingman. FIRE to send Wingman forward seeking enemies. Wingman unleashes a concussive blast toward the first enemy he sees. ALT FIRE when targeting a Spike site or planted Spike to have Wingman defuse or plant the Spike. To plant, Gekko must have the Spike in his inventory. When Wingman expires he reverts into a dormant globule. INTERACT to reclaim the globule and gain another Wingman charge after a short cooldown."
   },
   {
    "key": "E",
    "slot": "ability2",
    "name": "Dizzy",
    "text": "EQUIP Dizzy. FIRE to send Dizzy soaring forward through the air. Dizzy charges then unleashes plasma blasts at enemies in line of sight. Enemies hit by her plasma are Blinded. When Dizzy expires she reverts into a dormant globule. INTERACT to reclaim the globule and gain another Dizzy charge after a short cooldown."
   },
   {
    "key": "X",
    "slot": "ultimate",
    "name": "Thrash",
    "text": "EQUIP Thrash. FIRE to link with Thrash’s mind and steer her through enemy territory. ACTIVATE to lunge forward and explode, Detaining any players in a small radius. When Thrash expires she reverts into a dormant globule. INTERACT to reclaim the globule and gain another Thrash charge after a short cooldown. Thrash can be reclaimed once."
   }
  ]
 },
 "harbor": {
  "about": "Hailing from India’s coast, Harbor storms the field wielding ancient technology with dominion over water. He unleashes frothing rapids and crushing waves to shield his allies, or pummel those that oppose him.",
  "colors": [
   "#275146",
   "#0f1923",
   "#11434e"
  ],
  "abilities": [
   {
    "key": "C",
    "slot": "grenade",
    "name": "Storm Surge",
    "text": "EQUIP Storm Surge. FIRE to throw, creating an explosive whirlpool that Slows and Nearsights players within it after a short duration."
   },
   {
    "key": "Q",
    "slot": "ability1",
    "name": "High Tide",
    "text": "EQUIP High Tide. FIRE to send water forward along the ground. HOLD FIRE to guide the water towards your crosshair spawning a vision blocking Screen along the path. ALT FIRE to stop the water early. All players crossing High Tide are Slowed."
   },
   {
    "key": "E",
    "slot": "ability2",
    "name": "Cove",
    "text": "EQUIP Cove. ACTIVATE to form a water Smoke in the select location. HOLD FIRE while targeting to move the marker further away and HOLD ALT FIRE to move it closer. RELOAD to toggle targeting view. REACTIVATE to Shield the water Smoke, blocking any bullets that hit it. The Shielded water Smoke can be destroyed."
   },
   {
    "key": "X",
    "slot": "ultimate",
    "name": "Reckoning",
    "text": "EQUIP Reckoning. FIRE to unleash the full power of your artifact, releasing a surge of water that barrels forward to Nearsight and Slow enemies that are hit."
   }
  ]
 },
 "iso": {
  "about": "Chinese fixer for hire Iso falls into a flow state to dismantle the opposition. Reconfiguring ambient energy into bulletproof protection, he advances with focus towards his next duel to the death.",
  "colors": [
   "#30336e",
   "#0f1923",
   "#20155d"
  ],
  "abilities": [
   {
    "key": "C",
    "slot": "grenade",
    "name": "Contingency",
    "text": "EQUIP to assemble prismatic energy. FIRE to push an indestructible wall of energy forward that blocks bullets. ALT FIRE to push out a slower version of the wall."
   },
   {
    "key": "Q",
    "slot": "ability1",
    "name": "Undercut",
    "text": "EQUIP a molecular bolt. FIRE to throw it forward, briefly applying Vulnerable & Suppress to all players it touches. The bolt can pass through solid objects, including walls."
   },
   {
    "key": "E",
    "slot": "ability2",
    "name": "Double Tap",
    "text": "INSTANTLY start channeling your focus. Once focused: gain a shield which absorbs one instance of damage from any source, reload more quickly, and enter a flow state during which downed enemies you kill or damage spawn an energy orb. Shooting this orb refreshes your flow state and your existing shield, or grants another."
   },
   {
    "key": "X",
    "slot": "ultimate",
    "name": "Kill Contract",
    "text": "EQUIP an interdimensional arena. FIRE to hurl a column of energy through the battlefield, pulling and healing both you and the first enemy hit into the arena to duel to the death."
   }
  ]
 },
 "jett": {
  "about": "Representing her home country of South Korea, Jett's agile and evasive fighting style lets her take risks no one else can. She runs circles around every skirmish, cutting enemies up before they even know what hit them.",
  "colors": [
   "#25607a",
   "#0f1923",
   "#0f1923"
  ],
  "abilities": [
   {
    "key": "C",
    "slot": "grenade",
    "name": "Cloudburst",
    "text": "INSTANTLY throw a projectile that expands into a brief vision-blocking cloud on impact with a surface. HOLD the ability key to curve the smoke in the direction of your crosshair."
   },
   {
    "key": "Q",
    "slot": "ability1",
    "name": "Updraft",
    "text": "INSTANTLY propel Jett high into the air."
   },
   {
    "key": "E",
    "slot": "ability2",
    "name": "Tailwind",
    "text": "ACTIVATE to prepare a gust of wind for a limited time. RE-USE the wind to propel Jett in the direction she is moving. If Jett is standing still, she propels forward. Tailwind charge resets every two kills."
   },
   {
    "key": "X",
    "slot": "ultimate",
    "name": "Blade Storm",
    "text": "EQUIP a set of highly accurate throwing knives. FIRE to throw a single knife and recharge knives on a kill. ALT FIRE to throw all remaining daggers but does not recharge on a kill."
   },
   {
    "key": "Passive",
    "slot": "passive",
    "name": "Drift",
    "text": "Holding the jump button while falling allows you to glide through the air."
   }
  ]
 },
 "kayo": {
  "about": "KAY/O is a machine of war built for a single purpose: neutralizing radiants. His power to Suppress enemy abilities dismantles his opponents' capacity to fight back, securing him and his allies the ultimate edge.",
  "colors": [
   "#1c2a69",
   "#0f1923",
   "#1a1e4b"
  ],
  "abilities": [
   {
    "key": "C",
    "slot": "grenade",
    "name": "FRAG/ment",
    "text": "EQUIP an explosive fragment. FIRE to throw. ALT FIRE to lob. The fragment sticks to the floor and explodes multiple times, dealing near lethal damage at the center with each explosion."
   },
   {
    "key": "Q",
    "slot": "ability1",
    "name": "FLASH/drive",
    "text": "EQUIP a flash grenade. FIRE to overhand throw. ALT FIRE to lob a weaker version that explodes quickly. The flash grenade explodes after a short fuse, Blinding anyone in line of sight."
   },
   {
    "key": "E",
    "slot": "ability2",
    "name": "ZERO/point",
    "text": "EQUIP a suppression blade. FIRE to throw. The blade sticks to the first surface it hits, winds up, and Suppresses anyone in the radius of the explosion. Enemies can destroy this blade."
   },
   {
    "key": "X",
    "slot": "ultimate",
    "name": "NULL/cmd",
    "text": "INSTANTLY overload with polarized radianite energy that pulses from KAY/O in a massive radius. Enemies hit with pulses are Suppressed for a short duration. While overloaded, KAY/O gains Combat Stim and can be re-stabilized if downed."
   }
  ]
 },
 "killjoy": {
  "about": "The genius of Germany, Killjoy effortlessly secures key battlefield positions with her arsenal of inventions. If their damage doesn't take her enemies out, the debuff her robots provide will make short work of them.",
  "colors": [
   "#522162",
   "#0f1923",
   "#413950"
  ],
  "abilities": [
   {
    "key": "C",
    "slot": "grenade",
    "name": "Nanoswarm",
    "text": "EQUIP a Nanoswarm grenade. FIRE to throw the grenade. Upon landing, the Nanoswarm goes covert. ALT FIRE to lob. ACTIVATE the Nanoswarm to deploy a damaging swarm of nanobots."
   },
   {
    "key": "Q",
    "slot": "ability1",
    "name": "Alarmbot",
    "text": "EQUIP a covert Alarmbot. FIRE to deploy a bot that hunts down enemies that get in range. After reaching its target, the bot explodes and applies Vulnerable to enemies in the area. HOLD EQUIP to recall a deployed bot."
   },
   {
    "key": "E",
    "slot": "ability2",
    "name": "Turret",
    "text": "EQUIP a Turret. FIRE to deploy a turret that fires at enemies in a 100 degree cone. While targeting, EQUIP again to swap turret direction, HOLD ALT FIRE to rotate. HOLD EQUIP to recall the deployed turret."
   },
   {
    "key": "X",
    "slot": "ultimate",
    "name": "Lockdown",
    "text": "EQUIP the Lockdown device. FIRE to deploy the device. After a long windup, the device Detains all enemies caught in the radius. The device can be destroyed by enemies."
   }
  ]
 },
 "miks": {
  "about": "Straight from Croatia, Miks takes the stage channeling pure sound energy. With his infectious passion and sonic powers, he rallies his squad to move as one as they set the tempo on the battlefield together.",
  "colors": [
   "#462b75",
   "#0f1923",
   "#344673"
  ],
  "abilities": [
   {
    "key": "C",
    "slot": "grenade",
    "name": "M-pulse",
    "text": "EQUIP M-pulse. ALT-FIRE to toggle between Concuss and Healing outputs. FIRE to throw the device. Upon landing, M-pulse sends out sound waves, either Concussing or Healing players."
   },
   {
    "key": "Q",
    "slot": "ability1",
    "name": "Harmonize",
    "text": "EQUIP Harmonize. Target an ally and FIRE to activate a Combat Stim and a speed boost on yourself and the ally that refreshes with each kill. ALT-FIRE to grant Combat Stim and speed boost to yourself."
   },
   {
    "key": "E",
    "slot": "ability2",
    "name": "Waveform",
    "text": "EQUIP a Map Targeter. FIRE to set locations. ALT-FIRE to spawn Smokes at selected locations."
   },
   {
    "key": "X",
    "slot": "ultimate",
    "name": "Bassquake",
    "text": "EQUIP Bassquake. FIRE to build up and unleash Sonic Radiance forward, knocking back, Deafening, and Slowing players."
   }
  ]
 },
 "neon": {
  "about": "Filipino Agent Neon surges forward at shocking speeds, discharging bursts of bioelectric radiance as fast as her body generates it. She races ahead to catch enemies off guard then strikes them down quicker than lightning.",
  "colors": [
   "#413476",
   "#0f1923",
   "#38328e"
  ],
  "abilities": [
   {
    "key": "C",
    "slot": "grenade",
    "name": "Fast Lane",
    "text": "FIRE two energy lines forward on the ground that extend a short distance or until they hit a surface. The lines rise into walls of static electricity that block vision."
   },
   {
    "key": "Q",
    "slot": "ability1",
    "name": "Relay Bolt",
    "text": "INSTANTLY throw an energy bolt that bounces once. Upon hitting each surface, the bolt electrifies the ground below with a Concussive blast."
   },
   {
    "key": "E",
    "slot": "ability2",
    "name": "High Gear",
    "text": "INSTANTLY channel Neon’s power for Increased Speed. When charged, ALT FIRE to trigger an electric slide dash. Slide charge resets every two kills."
   },
   {
    "key": "X",
    "slot": "ultimate",
    "name": "Overdrive",
    "text": "Unleash Neon’s full power and speed for a short duration, regaining all her fuel and a slide charge. FIRE to channel the power into a deadly lightning beam with high movement accuracy. Kills reset the duration of the effect."
   }
  ]
 },
 "omen": {
  "about": "A phantom of a memory, Omen hunts in the shadows. He renders enemies blind, teleports across the field, then lets paranoia take hold as his foe scrambles to uncover where he might strike next.",
  "colors": [
   "#433178",
   "#0f1923",
   "#344673"
  ],
  "abilities": [
   {
    "key": "C",
    "slot": "grenade",
    "name": "Shrouded Step",
    "text": "EQUIP a shrouded step ability and see its range indicator. FIRE to begin a brief channel, then teleport to the marked location."
   },
   {
    "key": "Q",
    "slot": "ability1",
    "name": "Paranoia",
    "text": "EQUIP a blinding orb. FIRE to throw it forward, briefly Nearsighting and Deafening all players it touches. This projectile can pass straight through walls."
   },
   {
    "key": "E",
    "slot": "ability2",
    "name": "Dark Cover",
    "text": "EQUIP a shadow orb, entering a phased world to place and target the orbs. PRESS the ability key to throw the shadow orb to the marked location, creating a long-lasting shadow sphere that blocks vision. HOLD FIRE while targeting to move the marker further away. HOLD ALT FIRE while targeting to move the marker closer. PRESS RELOAD to toggle normal targeting view."
   },
   {
    "key": "X",
    "slot": "ultimate",
    "name": "From the Shadows",
    "text": "EQUIP a tactical map. FIRE to begin teleporting to the selected location. While teleporting, Omen will appear as a Shade that can be destroyed by an enemy to cancel his teleport, or PRESS EQUIP for Omen to cancel his teleport."
   }
  ]
 },
 "phoenix": {
  "about": "Hailing from the U.K., Phoenix's star power shines through in his fighting style, igniting the battlefield with flash and flare. Whether he's got backup or not, he's rushing in to fight on his own terms.",
  "colors": [
   "#74321c",
   "#0f1923",
   "#262423"
  ],
  "abilities": [
   {
    "key": "C",
    "slot": "grenade",
    "name": "Blaze",
    "text": "EQUIP a flame wall. FIRE to create a line of flame that moves forward, passing through the world and creating a wall of fire that blocks vision and damages players passing through it. The fire wall heals Phoenix instead of dealing damage. HOLD FIRE to bend the wall in the direction of your crosshair."
   },
   {
    "key": "Q",
    "slot": "ability2",
    "name": "Curveball",
    "text": "EQUIP a flare orb that takes a curving path and detonates shortly after throwing. FIRE to curve the flare orb to the left, detonating and Blinding any player who sees the orb. ALT FIRE to curve the flare orb to the right. Curveball resets a charge every two kills."
   },
   {
    "key": "E",
    "slot": "ability1",
    "name": "Hot Hands",
    "text": "EQUIP a fireball. FIRE to throw a fireball that explodes after a set amount of time or upon hitting the ground, creating a lingering fire zone that damages enemies. The fire zone heals Phoenix instead of dealing damage. ALT FIRE to lob."
   },
   {
    "key": "X",
    "slot": "ultimate",
    "name": "Run it Back",
    "text": "INSTANTLY place a marker at Phoenix's location. While this ability is active, dying or allowing the timer to expire will end this ability and bring Phoenix back to this location with full health and the amount of armor he had when the ability was cast."
   },
   {
    "key": "Passive",
    "slot": "passive",
    "name": "Heating Up",
    "text": "PASSIVELY Heal Phoenix instead of taking damage after standing in Phoenix's own fire"
   }
  ]
 },
 "raze": {
  "about": "Raze explodes out of Brazil with her big personality and big guns. With her blunt-force-trauma playstyle, she excels at flushing entrenched enemies and clearing tight spaces with a generous dose of \"boom.\"",
  "colors": [
   "#742e1e",
   "#0f1923",
   "#2c5942"
  ],
  "abilities": [
   {
    "key": "C",
    "slot": "grenade",
    "name": "Boom Bot",
    "text": "EQUIP a Boom Bot. FIRE will deploy the bot, causing it to travel in a straight line on the ground, bouncing off walls. The Boom Bot will lock on to any enemies in its frontal cone and chase them, exploding for heavy damage if it reaches them."
   },
   {
    "key": "Q",
    "slot": "ability1",
    "name": "Blast Pack",
    "text": "INSTANTLY throw a Blast Pack that will stick to surfaces. RE-USE the ability after deployment to detonate, moving anything hit and dealing damage if fully armed."
   },
   {
    "key": "E",
    "slot": "ability2",
    "name": "Paint Shells",
    "text": "EQUIP a cluster grenade. FIRE to throw the grenade, which does damage and creates sub-munitions, each doing damage to anyone in their range. ALT FIRE to lob. Paint Shells charge resets every two kills."
   },
   {
    "key": "X",
    "slot": "ultimate",
    "name": "Showstopper",
    "text": "EQUIP a rocket launcher. FIRE to shoot a rocket that does massive area damage on contact with anything."
   }
  ]
 },
 "reyna": {
  "about": "Forged in the heart of Mexico, Reyna dominates single combat, popping off with each kill she scores. Her capability is only limited by her raw skill, making her sharply dependent on performance.",
  "colors": [
   "#662d62",
   "#0f1923",
   "#2f2664"
  ],
  "abilities": [
   {
    "key": "C",
    "slot": "grenade",
    "name": "Leer",
    "text": "EQUIP an ethereal, destructible eye. ACTIVATE to cast the eye a short distance forward. The eye will Nearsight all enemies who look at it."
   },
   {
    "key": "Q",
    "slot": "ability1",
    "name": "Devour",
    "text": "Soul Harvest: Enemies that die within 3 seconds of taking damage from Reyna leave behind Soul Orbs that last 3 seconds. Devour: INSTANTLY consume a soul orb, rapidly gaining Temporary Health. If EMPRESS is active then Devour automatically casts, does not consume the Soul Orb, and Healing is permanent."
   },
   {
    "key": "E",
    "slot": "ability2",
    "name": "Dismiss",
    "text": "INSTANTLY consume a nearby Soul Orb, becoming Intangible for a short duration. If EMPRESS is active, also become Invisible."
   },
   {
    "key": "X",
    "slot": "ultimate",
    "name": "Empress",
    "text": "INSTANTLY enter a frenzy, gaining a Combat Stim that increases firing, equip and reload speed dramatically. Gain infinite charges of Soul Harvest abilities."
   }
  ]
 },
 "sage": {
  "about": "The bastion of China, Sage creates safety for herself and her team wherever she goes. Able to revive fallen friends and stave off forceful assaults, she provides a calm center to a hellish battlefield.",
  "colors": [
   "#1f5148",
   "#0f1923",
   "#102d23"
  ],
  "abilities": [
   {
    "key": "C",
    "slot": "grenade",
    "name": "Barrier Orb",
    "text": "EQUIP a barrier orb. FIRE places a wall that fortifies after a few seconds. ALT FIRE rotates the targeter."
   },
   {
    "key": "Q",
    "slot": "ability1",
    "name": "Slow Orb",
    "text": "EQUIP a slowing orb. FIRE to throw a slowing orb forward that detonates upon landing, creating a lingering field that Slows and reduces the dash speed of players caught inside of it."
   },
   {
    "key": "E",
    "slot": "ability2",
    "name": "Healing Orb",
    "text": "EQUIP a healing orb. FIRE with your crosshairs over a damaged ally to activate a Heal-Over-Time on them. ALT FIRE while Sage is damaged to activate a self Heal-Over-Time."
   },
   {
    "key": "X",
    "slot": "ultimate",
    "name": "Resurrection",
    "text": "EQUIP a resurrection ability. FIRE with your crosshairs placed over a dead ally to begin resurrecting them. After a brief channel, the ally will be brought back to life with full health."
   }
  ]
 },
 "skye": {
  "about": "Hailing from Australia, Skye and her band of beasts trailblaze the way through hostile territory. With her creations hampering the enemy, and her power to heal others, the team is strongest and safest by Skye's side.",
  "colors": [
   "#436a51",
   "#0f1923",
   "#4f1413"
  ],
  "abilities": [
   {
    "key": "C",
    "slot": "grenade",
    "name": "Regrowth",
    "text": "EQUIP a healing trinket. HOLD FIRE to channel, Healing allies in range and line of sight. Can be reused until her healing pool is depleted. Skye cannot heal herself."
   },
   {
    "key": "Q",
    "slot": "ability1",
    "name": "Trailblazer",
    "text": "EQUIP a Tasmanian tiger trinket. FIRE to send out and take control of the predator. While in control, FIRE to leap forward, exploding in a Concussive blast on impact and damaging directly hit enemies."
   },
   {
    "key": "E",
    "slot": "ability2",
    "name": "Guiding Light",
    "text": "EQUIP a hawk trinket. FIRE to send it forward. HOLD FIRE to guide the hawk in the direction of your crosshair. RE-USE while the hawk is in flight to transform it into a flash. The flash reaches max potency after a short duration during the hawk's flight."
   },
   {
    "key": "X",
    "slot": "ultimate",
    "name": "Seekers",
    "text": "EQUIP a Seeker trinket. FIRE to send out three Seekers to track down the three closest enemies. If a Seeker reaches its target, it Nearsights and slows them. Enemies can destroy the Seekers."
   }
  ]
 },
 "sova": {
  "about": "Born from the eternal winter of Russia's tundra, Sova tracks, finds, and eliminates enemies with ruthless efficiency and precision. His custom bow and incredible scouting abilities ensure that even if you run, you cannot hide.",
  "colors": [
   "#355285",
   "#0f1923",
   "#101c47"
  ],
  "abilities": [
   {
    "key": "C",
    "slot": "grenade",
    "name": "Owl Drone",
    "text": "EQUIP an owl drone. FIRE to deploy and take control of movement of the drone. While in control of the drone, FIRE to shoot a marking dart. This dart will Reveal the location of any player struck by the dart. Enemies can destroy the Owl Drone."
   },
   {
    "key": "Q",
    "slot": "ability1",
    "name": "Shock Bolt",
    "text": "EQUIP a bow with a shock bolt. FIRE to send the explosive bolt forward, detonating upon collision and damaging players nearby. HOLD FIRE to extend the range of the projectile. ALT FIRE to add up to two bounces to this arrow."
   },
   {
    "key": "E",
    "slot": "ability2",
    "name": "Recon Bolt",
    "text": "EQUIP a bow with recon bolt. FIRE to send the recon bolt forward, activating upon collision and Revealing the location of nearby enemies caught in the line of sight of the bolt. Enemies can destroy this bolt. HOLD FIRE to extend the range of the projectile. ALT FIRE to add up to two bounces to this arrow."
   },
   {
    "key": "X",
    "slot": "ultimate",
    "name": "Hunter's Fury",
    "text": "EQUIP a bow with three long-range, wall-piercing energy blasts. FIRE to release an energy blast in a line in front of Sova, dealing damage and Revealing the location of enemies caught in the line. This ability can be RE-USED up to two more times while the ability timer is active."
   },
   {
    "key": "Passive",
    "slot": "passive",
    "name": "Uncanny Marksman",
    "text": "Sova's custom bow can fire his arrows and bounce them off terrain. Holding fire charges the bow's power, and the bolt is loosed when released. Press alt fire to change the number of bounces.Your arrows can bounce off terrain. Holding left click increases the bow's range trajectory. Right clicking Toggle through the desired number of terrain bounces by right clicking. The arrow is loosed when left click is released."
   }
  ]
 },
 "tejo": {
  "about": "A veteran intelligence consultant from Colombia, Tejo’s ballistic guidance system pressures the enemy to relinquish their ground - or their lives. His targeted strikes keep opponents off balance and under his heel.",
  "colors": [
   "#80451b",
   "#0f1923",
   "#ffffff"
  ],
  "abilities": [
   {
    "key": "C",
    "slot": "grenade",
    "name": "Stealth Drone",
    "text": "EQUIP a stealth drone. FIRE to throw the drone forward, assuming direct control of its movement. FIRE again to trigger a pulse that Suppresses and Reveals enemies hit."
   },
   {
    "key": "Q",
    "slot": "ability1",
    "name": "Special Delivery",
    "text": "EQUIP a sticky grenade. FIRE to launch. The grenade sticks to the first surface it hits and explodes, Concussing and dealing damage to any targets caught in the blast. ALT FIRE to launch the grenade with a single bounce instead."
   },
   {
    "key": "E",
    "slot": "ability2",
    "name": "Guided Salvo",
    "text": "EQUIP an AR targeting system. FIRE to select up to two target locations on the map. ALT FIRE to launch missiles that autonomously navigate to target locations, detonating repeatedly for damage on arrival."
   },
   {
    "key": "X",
    "slot": "ultimate",
    "name": "Armageddon",
    "text": "EQUIP a tactical strike targeting map. FIRE to select the origin point of the strike. FIRE again to set the end point and launch the attack, unleashing a wave of lethal damaging explosions along the strike path. ALT FIRE during map targeting to cancel the origin point."
   }
  ]
 },
 "veto": {
  "about": "Empowered by an unstoppable DNA mutation, Senegalese enforcer Veto defies the rules of engagement by nullifying his opponent's powers and technology. On Veto's battlefield, gunplay is your only guarantee.",
  "colors": [
   "#1a5d65",
   "#0f1923",
   "#0f1923"
  ],
  "abilities": [
   {
    "key": "C",
    "slot": "grenade",
    "name": "Crosscut",
    "text": "EQUIP a vortex. FIRE to place on the ground. While in range and looking at the vortex, ACTIVATE to teleport to the vortex. During the BUY PHASE, the vortex can be reclaimed to be REDEPLOYED."
   },
   {
    "key": "Q",
    "slot": "ability1",
    "name": "Chokehold",
    "text": "EQUIP a viscous fragment of your mutation. FIRE to throw. The fragment deploys upon hitting the ground, creating a trap to hold enemies in place. Held enemies are Deafened, and Decayed. Enemies can destroy the trap before activation."
   },
   {
    "key": "E",
    "slot": "ability2",
    "name": "Interceptor",
    "text": "EQUIP the Interceptor. FIRE to place the Interceptor at projected location. Once placed, RE-USE to activate. Once active, it will destroy any utility that would BOUNCE off a player and/or be destroyed naturally by gunfire. Enemies can destroy the Interceptor."
   },
   {
    "key": "X",
    "slot": "ultimate",
    "name": "Evolution",
    "text": "INSTANTLY begin to fully mutate, gaining a combat stim, regeneration, and becoming IMMUNE to all forms of debuffs."
   }
  ]
 },
 "viper": {
  "about": "The American Chemist, Viper deploys an array of poisonous chemical devices to control the battlefield and choke the enemy's vision. If the toxins don't kill her prey, her mindgames surely will.",
  "colors": [
   "#1a5f46",
   "#0f1923",
   "#2c4f5e"
  ],
  "abilities": [
   {
    "key": "C",
    "slot": "grenade",
    "name": "Snake Bite",
    "text": "EQUIP a chemical launcher. FIRE to launch a canister that shatters upon hitting the floor, creating a lingering chemical zone that damages and applies Vulnerable."
   },
   {
    "key": "Q",
    "slot": "ability1",
    "name": "Poison Cloud",
    "text": "EQUIP a gas emitter. FIRE to throw the emitter that perpetually remains throughout the round. ALT FIRE to lob. RE-USE the ability to create a toxic gas cloud that Decays opponents inside it at the cost of fuel. This ability can be picked up to be REDEPLOYED before the round starts and can be RE-USED more than once throughout the round."
   },
   {
    "key": "E",
    "slot": "ability2",
    "name": "Toxic Screen",
    "text": "EQUIP a gas emitter launcher that penetrates terrain. FIRE to deploy a long line of gas emitters. RE-USE the ability to create a tall wall of toxic gas that Decays opponents that cross it at the cost of fuel. This ability can be RE-USED more than once."
   },
   {
    "key": "X",
    "slot": "ultimate",
    "name": "Viper's Pit",
    "text": "EQUIP a chemical sprayer. FIRE to spray a chemical cloud in all directions around Viper, creating a large cloud that Nearsights players and Decays the health of enemies inside of it. HOLD the ability key to disperse the cloud early."
   },
   {
    "key": "Passive",
    "slot": "passive",
    "name": "Toxic",
    "text": "You gradually generate and replenish the toxin that fuels your abilities. Enemies that cross through Viper's Poison Cloud, Toxic Screen, or Viper's Pit are instantly inflicted with at least 30 Decay. Their Decay level increases the longer they remain in contact with it."
   }
  ]
 },
 "vyse": {
  "about": "Metallic mastermind Vyse unleashes liquid metal to isolate, trap, and disarm her enemies. Through cunning and manipulation, she forces all who oppose her to fear the battlefield itself.",
  "colors": [
   "#492280",
   "#0f1923",
   "#ffffff"
  ],
  "abilities": [
   {
    "key": "C",
    "slot": "grenade",
    "name": "Razorvine",
    "text": "EQUIP a nest of liquid metal. FIRE to launch. Upon landing, the nest becomes invisible. When ACTIVATED, it sprawls out into a large razorvine nest which slows and damages all players who move through it."
   },
   {
    "key": "Q",
    "slot": "ability1",
    "name": "Shear",
    "text": "EQUIP filaments of liquid metal. FIRE to place a hidden wall trap. When an enemy crosses, an indestructible wall bursts from the ground behind them. The wall lasts for a brief time before dissipating."
   },
   {
    "key": "E",
    "slot": "ability2",
    "name": "Arc Rose",
    "text": "EQUIP an Arc Rose. Target a surface and FIRE to place a stealthed Arc Rose, or ALT FIRE to place the Arc Rose through it. REUSE to blind all players looking at it. This ability can be picked up to be REDEPLOYED."
   },
   {
    "key": "X",
    "slot": "ultimate",
    "name": "Steel Garden",
    "text": "EQUIP a bramble of liquid metal. FIRE to send the metal erupting from you as a torrent of metal thorns, JAMMING enemy primary weapons after a brief windup."
   }
  ]
 },
 "waylay": {
  "about": "Thailand's prismatic radiant Waylay transforms into light itself as she darts across the battlefield, striking down her targets through shards of light before flitting back to safety, all in the blink of an eye.",
  "colors": [
   "#482e61",
   "#0f1923",
   "#0f1923"
  ],
  "abilities": [
   {
    "key": "C",
    "slot": "grenade",
    "name": "Saturate",
    "text": "EQUIP a cluster of light. FIRE to throw the cluster, which upon contact with the ground explodes, Hindering nearby players with a powerful movement and weapon slow."
   },
   {
    "key": "Q",
    "slot": "ability1",
    "name": "Lightspeed",
    "text": "EQUIP to prepare for a burst of speed. FIRE to dash forward twice. ALT FIRE to dash once. Only your first dash can send you upward."
   },
   {
    "key": "E",
    "slot": "ability2",
    "name": "Refract",
    "text": "INSTANTLY create a beacon of light on the floor. REACTIVATE to speed back to your beacon as a mote of pure light. You are invulnerable as you travel. Refract resets a charge every two kills."
   },
   {
    "key": "X",
    "slot": "ultimate",
    "name": "Convergent Paths",
    "text": "EQUIP to focus your prismatic power. FIRE to create an afterimage of yourself that projects a beam of light. After a brief delay, you gain a powerful speed boost and the beam expands, Hindering other players in the area."
   }
  ]
 },
 "yoru": {
  "about": "Japanese native Yoru rips holes straight through reality to infiltrate enemy lines unseen. Using deception and aggression in equal measure, he gets the drop on each target before they know where to look.",
  "colors": [
   "#222b67",
   "#0f1923",
   "#261e4f"
  ],
  "abilities": [
   {
    "key": "C",
    "slot": "grenade",
    "name": "Fakeout",
    "text": "EQUIP an echo that transforms into a mirror image of Yoru when activated. FIRE to instantly activate the mirror image and send it forward. ALT FIRE to place an inactive echo. USE to transform an inactive echo into a mirror image and send it forward. Mirror images explode in a Blinding flash when destroyed by enemies."
   },
   {
    "key": "Q",
    "slot": "ability1",
    "name": "Blindside",
    "text": "EQUIP to rip an unstable dimensional fragment from reality. FIRE to throw the fragment, activating a flash that winds up once it collides with a hard surface."
   },
   {
    "key": "E",
    "slot": "ability2",
    "name": "Gatecrash",
    "text": "EQUIP a rift tether FIRE to send the tether forward. ALT FIRE to place a stationary tether. ACTIVATE to teleport to the tether's location. USE to trigger a fake teleport. GATECRASH resets a charge every two kills."
   },
   {
    "key": "X",
    "slot": "ultimate",
    "name": "Dimensional Drift",
    "text": "EQUIP a mask that can see between dimensions. FIRE to drift into Yoru's dimension, unable to be affected or seen by enemies from the outside. REACTIVATE to exit Yoru's dimension early."
   }
  ]
 }
};

export const CALLOUTS: Record<string, [name: string, x: number, y: number][]> = {"abyss":[["A Bridge",0.47,0.038],["A Link",0.302,0.273],["A Lobby",0.775,0.237],["A Main",0.634,0.192],["A Secret",0.188,0.194],["A Security",0.259,0.103],["A Site",0.484,0.152],["A Tower",0.49,0.255],["A Vent",0.474,0.362],["Attacker Side Spawn",0.901,0.423],["B Danger",0.557,0.974],["B Link",0.31,0.662],["B Lobby",0.826,0.796],["B Main",0.624,0.86],["B Nest",0.674,0.903],["B Site",0.405,0.858],["B Tower",0.298,0.818],["Defender Side Spawn",0.073,0.423],["Mid Bend",0.587,0.638],["Mid Bottom",0.547,0.532],["Mid Catwalk",0.543,0.451],["Mid Library",0.451,0.526],["Mid Top",0.308,0.437]],"ascent":[["A Garden",0.285,0.309],["A Lobby",0.603,0.259],["A Main",0.484,0.201],["A Rafters",0.239,0.144],["A Site",0.35,0.142],["A Tree",0.398,0.295],["A Window",0.241,0.292],["A Wine",0.486,0.058],["Attacker Side Spawn",0.817,0.569],["B Boat House",0.27,0.887],["B Lobby",0.717,0.678],["B Main",0.405,0.712],["B Site",0.285,0.737],["Defender Side Spawn",0.132,0.434],["Mid Bottom",0.397,0.495],["Mid Catwalk",0.525,0.411],["Mid Courtyard",0.493,0.488],["Mid Cubby",0.455,0.336],["Mid Link",0.514,0.617],["Mid Market",0.298,0.497],["Mid Pizza",0.306,0.447],["Mid Top",0.665,0.38]],"bind":[["A Bath",0.839,0.43],["A Cubby",0.587,0.46],["A Exit",0.924,0.522],["A Lamps",0.582,0.339],["A Link",0.518,0.592],["A Lobby",0.763,0.607],["A Short",0.624,0.497],["A Site",0.734,0.333],["A Teleporter",0.606,0.411],["A Tower",0.728,0.208],["Attacker Side Cave",0.592,0.736],["Attacker Side Spawn",0.582,0.958],["B Elbow",0.158,0.306],["B Exit",0.473,0.441],["B Fountain",0.259,0.629],["B Garden",0.247,0.428],["B Hall",0.285,0.202],["B Link",0.422,0.592],["B Long",0.193,0.515],["B Short",0.397,0.53],["B Site",0.292,0.312],["B Teleporter",0.151,0.435],["B Window",0.323,0.447],["Defender Side Spawn",0.517,0.104]],"breeze":[["A Bridge",0.712,0.245],["A Lobby",0.703,0.921],["A Pyramids",0.847,0.469],["A Ramp",0.656,0.322],["A Shop",0.763,0.683],["A Site",0.908,0.495],["Attacker Side Spawn",0.434,0.873],["B Back",0.068,0.305],["B Elbow",0.262,0.506],["B Main",0.154,0.585],["B Site",0.07,0.382],["B Tunnel",0.364,0.382],["B Wall",0.255,0.235],["B Window",0.173,0.677],["Defender Side Arches",0.374,0.175],["Defender Side Spawn",0.712,0.21],["Mid Bottom",0.498,0.723],["Mid Cannon",0.336,0.63],["Mid Hall",0.639,0.535],["Mid Nest",0.484,0.228],["Mid Pillar",0.498,0.541],["Mid Top",0.502,0.401],["Mid Wood Doors",0.644,0.495]],"corrode":[["A Crane",0.243,0.203],["A Elbow",0.381,0.109],["A Link",0.453,0.375],["A Lobby",0.708,0.197],["A Main",0.612,0.085],["A Pocket",0.47,0.109],["A Site",0.398,0.258],["A Yard",0.47,0.197],["Attacker Side Spawn",0.923,0.502],["B Arch",0.218,0.717],["B Elbow",0.321,0.891],["B Link",0.398,0.59],["B Lobby",0.72,0.617],["B Main",0.579,0.69],["B Site",0.444,0.69],["B Tower",0.321,0.746],["Defender Side Spawn",0.124,0.499],["Mid Bottom",0.538,0.491],["Mid Stairs",0.423,0.491],["Mid Top",0.398,0.491],["Mid Window",0.309,0.491]],"fracture":[["A Dish",0.666,0.275],["A Door",0.708,0.703],["A Drop",0.777,0.43],["A Gate",0.679,0.145],["A Hall",0.717,0.761],["A Link",0.659,0.487],["A Main",0.826,0.697],["A Rope",0.639,0.638],["A Site",0.82,0.522],["Attacker Side Bridge",0.498,0.126],["Attacker Side Spawn",0.483,0.817],["B Arcade",0.231,0.362],["B Bench",0.331,0.261],["B Canteen",0.312,0.601],["B Generator",0.293,0.504],["B Link",0.343,0.438],["B Main",0.14,0.69],["B Site",0.093,0.518],["B Tower",0.12,0.442],["B Tree",0.236,0.769],["B Tunnel",0.24,0.579],["Defender Side Spawn",0.504,0.442]],"haven":[["A Garden",0.742,0.41],["A Link",0.29,0.324],["A Lobby",0.624,0.385],["A Long",0.576,0.177],["A Sewer",0.5,0.384],["A Site",0.402,0.17],["A Tower",0.308,0.139],["Attacker Side Spawn",0.895,0.512],["B Back",0.294,0.495],["B Site",0.401,0.501],["C Cubby",0.601,0.802],["C Garage",0.493,0.629],["C Link",0.343,0.649],["C Lobby",0.664,0.766],["C Long",0.644,0.894],["C Site",0.418,0.821],["C Window",0.419,0.643],["Defender Side Spawn",0.14,0.422],["Mid Courtyard",0.59,0.506],["Mid Doors",0.624,0.631],["Mid Window",0.676,0.496]],"icebox":[["A Belt",0.399,0.823],["A Nest",0.525,0.783],["A Pipes",0.493,0.747],["A Rafters",0.766,0.769],["A Screen",0.7,0.672],["A Site",0.691,0.765],["Attacker Side Spawn",0.14,0.587],["B Back",0.768,0.287],["B Cubby",0.39,0.229],["B Fence",0.719,0.279],["B Garage",0.358,0.395],["B Green",0.41,0.337],["B Hall",0.68,0.283],["B Hut",0.777,0.407],["B Kitchen",0.705,0.465],["B Orange",0.583,0.35],["B Site",0.646,0.18],["B Snow Pile",0.64,0.432],["B Snowman",0.745,0.143],["B Tube",0.552,0.47],["B Yellow",0.458,0.157],["Defender Side Spawn",0.97,0.575],["Mid Blue",0.53,0.508],["Mid Boiler",0.671,0.548],["Mid Pallet",0.588,0.625]],"lotus":[["A Door",0.829,0.514],["A Drop",0.893,0.233],["A Hut",0.855,0.348],["A Link",0.605,0.485],["A Lobby",0.666,0.724],["A Main",0.754,0.537],["A Root",0.692,0.601],["A Rubble",0.809,0.601],["A Site",0.855,0.361],["A Stairs",0.733,0.323],["A Top",0.818,0.251],["A Tree",0.855,0.475],["Attacker Side Spawn",0.511,0.817],["B Main",0.451,0.567],["B Pillars",0.503,0.661],["B Site",0.503,0.459],["B Upper",0.564,0.365],["C Bend",0.075,0.51],["C Door",0.329,0.571],["C Gravel",0.329,0.274],["C Hall",0.148,0.349],["C Link",0.356,0.377],["C Lobby",0.341,0.817],["C Main",0.228,0.535],["C Mound",0.341,0.64],["C Site",0.148,0.437],["C Waterfall",0.311,0.434],["Defender Side Spawn",0.577,0.22]],"pearl":[["A Art",0.746,0.56],["A Dugout",0.937,0.318],["A Flowers",0.676,0.193],["A Link",0.776,0.444],["A Main",0.779,0.419],["A Restaurant",0.7,0.57],["A Secret",0.779,0.1],["A Site",0.915,0.4],["Attacker Side Spawn",0.434,0.959],["B Club",0.367,0.854],["B Hall",0.094,0.331],["B Link",0.434,0.565],["B Main",0.139,0.6],["B Ramp",0.184,0.78],["B Screen",0.09,0.428],["B Site",0.258,0.464],["B Tower",0.258,0.25],["B Tunnel",0.312,0.216],["Defender Side Records",0.366,0.216],["Defender Side Spawn",0.51,0.051],["Defender Side Water",0.621,0.307],["Mid Connector",0.621,0.444],["Mid Doors",0.527,0.549],["Mid Plaza",0.455,0.702],["Mid Shops",0.367,0.854],["Mid Top",0.537,0.754]],"split":[["A Back",0.229,0.125],["A Lobby",0.65,0.166],["A Main",0.492,0.208],["A Rafters",0.354,0.274],["A Ramps",0.472,0.36],["A Screens",0.15,0.257],["A Sewer",0.658,0.318],["A Site",0.315,0.184],["A Tower",0.316,0.336],["Attacker Side Spawn",0.847,0.549],["B Alley",0.213,0.788],["B Back",0.264,0.94],["B Garage",0.542,0.868],["B Link",0.657,0.7],["B Lobby",0.687,0.797],["B Rafters",0.369,0.747],["B Site",0.354,0.867],["B Stairs",0.315,0.615],["B Tower",0.43,0.684],["Defender Side Spawn",0.143,0.53],["Mid Bottom",0.616,0.548],["Mid Mail",0.467,0.607],["Mid Top",0.484,0.54],["Mid Vent",0.426,0.451]],"summit":[["A Art",0.792,0.265],["A Cave",0.957,0.265],["A Garden",0.792,0.403],["A Hall",0.692,0.265],["A Link",0.651,0.36],["A Lobby",0.694,0.741],["A Main",0.694,0.566],["A Site",0.917,0.403],["Attacker Side Spawn",0.04,0.896],["B Drop",0.053,0.24],["B Gym",0.28,0.19],["B Link",0.331,0.416],["B Lobby",0.289,0.595],["B Main",0.186,0.491],["B Site",0.151,0.338],["B Tower",0.156,0.216],["B Trophy",0.323,0.298],["Defender Side Spawn",0.511,0.073],["Mid Bend",0.636,0.493],["Mid Bottom",0.484,0.416],["Mid Fountain",0.511,0.553],["Mid Tiles",0.365,0.607],["Mid Top",0.537,0.677],["Mid Window",0.484,0.326]],"sunset":[["A Alley",0.781,0.25],["A Elbow",0.828,0.5],["A Link",0.734,0.344],["A Lobby",0.656,0.656],["A Main",0.672,0.547],["A Site",0.75,0.438],["Attacker Side Spawn",0.469,0.986],["B Boba",0.126,0.344],["B Lobby",0.297,0.781],["B Main",0.059,0.672],["B Market",0.235,0.531],["B Site",0.044,0.562],["Defender Side Spawn",0.345,0.219],["Mid Bottom",0.342,0.656],["Mid Courtyard",0.406,0.562],["Mid Tiles",0.531,0.656],["Mid Top",0.344,0.36]]};
