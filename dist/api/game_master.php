<?php
require_once 'db.php';

$data = json_decode(file_get_contents('php://input'), true);
$action = $_GET['action'] ?? '';

// ---------- Auto-migrate tables ----------
try {
    $pdo->exec("CREATE TABLE IF NOT EXISTS gm_zones (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        unlock_level INT DEFAULT 1,
        palette JSON,
        map_id VARCHAR(50) DEFAULT NULL,
        sort_order INT DEFAULT 0
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $pdo->exec("CREATE TABLE IF NOT EXISTS gm_enemies (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        zone_id VARCHAR(50) NOT NULL,
        tier ENUM('minion','elite') DEFAULT 'minion',
        hp INT DEFAULT 100,
        dmg_per_focus_min FLOAT DEFAULT 1.0,
        xp INT DEFAULT 10,
        gold INT DEFAULT 5,
        lore TEXT,
        resist JSON,
        weak JSON,
        sprite_ref VARCHAR(100),
        active BOOLEAN DEFAULT TRUE,
        sort_order INT DEFAULT 0
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $pdo->exec("CREATE TABLE IF NOT EXISTS gm_bosses (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        title VARCHAR(200),
        zone_id VARCHAR(50),
        hp INT DEFAULT 1500,
        danger_label VARCHAR(50) DEFAULT 'HIGH DANGER',
        lore TEXT,
        mechanic TEXT,
        reward JSON,
        is_rare BOOLEAN DEFAULT FALSE,
        spawn_chance FLOAT DEFAULT 1.0,
        sprite_ref VARCHAR(100),
        active BOOLEAN DEFAULT TRUE,
        sort_order INT DEFAULT 0
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $pdo->exec("CREATE TABLE IF NOT EXISTS gm_pets (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        base_blueprint VARCHAR(50),
        base_label VARCHAR(100),
        evolved_blueprint VARCHAR(50),
        evolved_label VARCHAR(100),
        evolution_level INT DEFAULT 10,
        can_evolve BOOLEAN DEFAULT TRUE,
        is_hatchable BOOLEAN DEFAULT TRUE,
        perk_xp_mult FLOAT DEFAULT 0,
        perk_gold_mult FLOAT DEFAULT 0,
        perk_dmg_mult FLOAT DEFAULT 0,
        perk_hard_dmg_mult FLOAT DEFAULT 0,
        evolved_perk_xp_mult FLOAT DEFAULT 0,
        evolved_perk_gold_mult FLOAT DEFAULT 0,
        evolved_perk_dmg_mult FLOAT DEFAULT 0,
        evolved_perk_hard_dmg_mult FLOAT DEFAULT 0,
        perk_description TEXT,
        evolved_perk_description TEXT,
        active BOOLEAN DEFAULT TRUE,
        sort_order INT DEFAULT 0
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
} catch (PDOException $e) { /* tables exist */ }

// ---------- Auto-seed default data ----------
function seedDefaults($pdo) {
    $check = $pdo->query("SELECT COUNT(*) FROM gm_zones")->fetchColumn();
    if ($check > 0) return;

    // Zones
    $zones = [
        ['crypt','Crypt',1,'["#2a2535","#3d3548","#5c5068","#9080a0"]','shadowCrypts',1],
        ['cavern','Cavern',5,'["#1a1a1a","#2d2d2d","#3d3830","#8a7860"]',null,2],
        ['sewer','Sewers',8,'["#2a2010","#504528","#304818","#102810"]',null,3],
        ['elvenRuins','Elven Ruins',10,'["#d0e8d0","#a0c8a0","#608060","#40c870"]',null,4],
        ['dwarfFortress','Dwarf Fortress',15,'["#4a4040","#6a5858","#a08040","#c0c0c0"]',null,5],
        ['chaosTemple','Chaos Temple',20,'["#0a0a0a","#300808","#600000","#ff6000"]',null,6],
        ['dragonLair','Dragon Lair',25,'["#1a0808","#c04000","#ffd700"]',null,7],
    ];
    $stmt = $pdo->prepare("INSERT IGNORE INTO gm_zones (id,name,unlock_level,palette,map_id,sort_order) VALUES (?,?,?,?,?,?)");
    foreach ($zones as $z) $stmt->execute($z);

    // Enemies
    $enemies = [
        ['skeleton_footman','Skeleton Footman','crypt','minion',40,2,10,4,'Animated remains of a soldier fallen in the War of Ashes. Attacks in formation, never alone.','["piercing"]','["bludgeoning"]','enemy_skeleton_footman_64',1],
        ['crypt_zombie','Crypt Zombie','crypt','minion',55,1.5,12,3,'Slow but tireless. They say it still remembers fragments of its life — none of them pleasant.','["poison"]','["fire"]','enemy_crypt_zombie_64',2],
        ['wailing_specter','Wailing Specter','crypt','elite',90,3,25,10,'Its wail drains willpower before life. Only appears when the hero\'s streak has been broken.','["physical"]','["radiant"]','enemy_wailing_specter_64',3],
        ['cave_goblin','Cave Goblin','cavern','minion',30,2,8,6,'Cowardly alone, lethal in a pack. Collects shiny objects from its victims.','[]','["fire"]','enemy_cave_goblin_64',4],
        ['ridgeback_boar','Ridgeback Boar','cavern','minion',45,2.5,12,5,'Territorial beast with curved tusks. Charges without warning.','[]','[]','enemy_ridgeback_boar_64',5],
        ['cave_troll','Deep Troll','cavern','elite',120,4,30,15,'Regenerates what fire doesn\'t cauterize. Accidental guardian of ore veins.','["physical"]','["fire"]','enemy_cave_troll_64',6],
        ['rune_wisp','Rune Wisp','elvenRuins','minion',25,3,10,7,'Fragment of a ward spell that was never deactivated. Attacks from range.','["magic"]','["physical"]','enemy_rune_wisp_64',7],
        ['thornguard','Thornguard','elvenRuins','elite',95,3,26,12,'Vine animated by forgotten elven magic. Guards ruins no one remembers why they were sacred.','["piercing"]','["fire"]','enemy_thornguard_64',8],
        ['clockwork_sentinel','Clockwork Sentinel','dwarfFortress','minion',50,2,14,8,'Automaton of bronze and gears. Still following its patrol route programmed three centuries ago.','["slashing"]','["lightning"]','enemy_clockwork_sentinel_64',9],
        ['forge_golem','Forge Golem','dwarfFortress','elite',130,4,32,16,'Core of eternal embers. Its fist can crush stone without effort.','["physical","fire"]','["cold"]','enemy_forge_golem_64',10],
        ['cultist_acolyte','Chaos Acolyte','chaosTemple','minion',35,2.5,12,6,'Gave up its name in exchange for borrowed power. Casts minor curses.','[]','["radiant"]','enemy_cultist_acolyte_64',11],
        ['lesser_fiend','Lesser Fiend','chaosTemple','elite',100,3.5,28,14,'Summoned and then abandoned by its masters. Now it drifts aimlessly through the temple ruins.','["fire"]','["radiant","cold"]','enemy_lesser_fiend_64',12],
        ['sewer_rat_swarm','Rat Swarm','sewer','minion',20,1.5,6,3,'Individually harmless. In numbers, a serious problem.','[]','["area"]','enemy_sewer_rat_swarm_64',13],
        ['sludge_ooze','Sludge Ooze','sewer','minion',40,2,10,4,'Corrosive mass that seeps through the cracks of the sewers.','["piercing"]','["fire"]','enemy_sludge_ooze_64',14],
    ];
    $stmt = $pdo->prepare("INSERT IGNORE INTO gm_enemies (id,name,zone_id,tier,hp,dmg_per_focus_min,xp,gold,lore,resist,weak,sprite_ref,sort_order) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)");
    foreach ($enemies as $e) $stmt->execute($e);

    // Bosses
    $bosses = [
        ['lich_archivist','Forgotten Archivist Lich','He Who Cataloged His Own Tomb','crypt',1500,'HIGH DANGER','In life, the first Archivist of Taskoria. In death, still cataloging — now souls, not scrolls.','Every failed quest restores 2% of its HP; every completed quest deals proportional damage.','{"xp":800,"gold":300,"dropTable":["mystic_egg","rare_gear"]}',0,1.0,'boss_lich_archivist_64',1],
        ['ironclad_warden','Ironclad Warden','The Last Automaton Still Lit','dwarfFortress',1800,'HIGH DANGER','Built to protect the Dwarf Fortress from invaders who never came.','Immune to damage from trivial quests; only Normal/Hard quests deal damage.','{"xp":900,"gold":350,"dropTable":["griffin_egg_shard","rare_gear"]}',0,1.0,'boss_ironclad_warden_64',2],
        ['chaos_herald','Herald of the Whispering Chaos','The Faceless Voice','chaosTemple',1600,'HIGH DANGER','It has no fixed form — every hero sees it as their own procrastination personified.','HP does not decrease with passive focus: only with Focus Dungeons of 25+ min completed without pausing.','{"xp":850,"gold":320,"dropTable":["phoenix_feather","rare_gear"]}',0,1.0,'boss_chaos_herald_64',3],
        ['red_wyrm_scaltha','Scaltha, Scourge of Ashes','Red Dragon of the Volcanic Lair','dragonLair',2500,'CATACLYSMIC','Its hoard includes the armor of a hundred heroes who never completed their streak.','Only appears after 4 consecutive weeks of Weekly Boss defeated.','{"xp":2000,"gold":1000,"dropTable":["dragon_hoard_cosmetic","legendary_gear"]}',0,1.0,'boss_red_wyrm_scaltha_64',4],
        ['beholder_unblinking','The Sleepless Watcher','Aberration from No Plane',null,2000,'ABERRANT','It belongs neither to Taskoria nor any known realm. A single eye, enormous and lidless, sees all.','Can appear in any Focus Dungeon with a 2% chance. HP drops twice as fast if you complete without switching apps.','{"xp":1200,"gold":500,"dropTable":["aberrant_eye_trophy","legendary_gear"]}',1,0.02,'boss_beholder_unblinking_64',5],
    ];
    $stmt = $pdo->prepare("INSERT IGNORE INTO gm_bosses (id,name,title,zone_id,hp,danger_label,lore,mechanic,reward,is_rare,spawn_chance,sprite_ref,sort_order) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)");
    foreach ($bosses as $b) $stmt->execute($b);

    // Pets
    $pets = [
        ['wolf','Wolf','Loyal companion, grows stronger in battle.','wolf','Wolf','wolf_arctic','Arctic Alpha',10,1,1,0.05,0,0.05,0,0.02,0,0.10,0,'+5% XP','+10% DMG'],
        ['lion','Lion','Proud beast, brings fortune to its master.','lion','Lion','lion_desert','Desert Sovereign',10,1,1,0.02,0.05,0,0,0.03,0.10,0,0,'+2% XP, +5% Gold','+3% XP, +10% Gold'],
        ['emberwyrm','Emberwyrm','Fire wyrm, devastating physical attacks.','emberwyrm_young','Wyrmling','emberwyrm','Emberwyrm',10,1,1,0,0,0.03,0,0,0,0.08,0.05,'+3% DMG','+8% DMG, +5% Hard DMG'],
        ['frostcoil','Frostcoil','Ice serpent, boosts mental prowess.','frostcoil_young','Coilling','frostcoil','Frostcoil',10,1,1,0.03,0,0,0,0.05,0.05,0,0,'+3% XP','+5% XP, +5% Gold'],
        ['tidewyrm','Tidewyrm','Water wyrm, steady gold income.','tidewyrm_young','Tidewyrm Hatchling','tidewyrm','Tidewyrm',10,1,1,0,0.03,0,0,0.03,0.08,0,0,'+3% Gold','+3% XP, +8% Gold'],
        ['slime','Slime','Friendly blob, small XP bonus.','slime','Slime',null,null,0,0,1,0.05,0,0,0,0,0,0,0,'+5% XP',null],
    ];
    $stmt = $pdo->prepare("INSERT IGNORE INTO gm_pets (id,name,description,base_blueprint,base_label,evolved_blueprint,evolved_label,evolution_level,can_evolve,is_hatchable,perk_xp_mult,perk_gold_mult,perk_dmg_mult,perk_hard_dmg_mult,evolved_perk_xp_mult,evolved_perk_gold_mult,evolved_perk_dmg_mult,evolved_perk_hard_dmg_mult,perk_description,evolved_perk_description) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)");
    foreach ($pets as $p) $stmt->execute($p);
}

try { seedDefaults($pdo); } catch (PDOException $e) { /* seeded */ }

// ---------- Public: fetch all game data (used by client) ----------

if ($action === 'all') {
    try {
        $zones = $pdo->query("SELECT * FROM gm_zones ORDER BY sort_order")->fetchAll();
        $enemies = $pdo->query("SELECT * FROM gm_enemies WHERE active = 1 ORDER BY sort_order")->fetchAll();
        $bosses = $pdo->query("SELECT * FROM gm_bosses WHERE active = 1 ORDER BY sort_order")->fetchAll();
        $pets = $pdo->query("SELECT * FROM gm_pets WHERE active = 1 ORDER BY sort_order")->fetchAll();

        foreach ($zones as &$z) { $z['palette'] = json_decode($z['palette'], true); }
        foreach ($enemies as &$e) { $e['resist'] = json_decode($e['resist'], true); $e['weak'] = json_decode($e['weak'], true); }
        foreach ($bosses as &$b) { $b['reward'] = json_decode($b['reward'], true); }

        echo json_encode(['success' => true, 'zones' => $zones, 'enemies' => $enemies, 'bosses' => $bosses, 'pets' => $pets]);
    } catch (PDOException $e) {
        error_log('GM all error: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to fetch game data']);
    }
    exit;
}

// ---------- Admin check ----------

$admin_id = (int)($data['admin_id'] ?? 0);
if (!$admin_id) { http_response_code(401); echo json_encode(['error' => 'Login required']); exit; }

$stmt = $pdo->prepare("SELECT is_admin FROM users WHERE id = ?");
$stmt->execute([$admin_id]);
$adminUser = $stmt->fetch();
if (!$adminUser || !$adminUser['is_admin']) {
    http_response_code(403); echo json_encode(['error' => 'Forbidden']); exit;
}

// ===================== ZONES =====================

if ($action === 'list_zones') {
    $rows = $pdo->query("SELECT * FROM gm_zones ORDER BY sort_order")->fetchAll();
    foreach ($rows as &$r) { $r['palette'] = json_decode($r['palette'], true); }
    echo json_encode(['success' => true, 'zones' => $rows]);
    exit;
}

if ($action === 'save_zone') {
    $id = trim($data['id'] ?? '');
    $name = trim($data['name'] ?? '');
    $unlock_level = (int)($data['unlock_level'] ?? 1);
    $palette = json_encode($data['palette'] ?? []);
    $map_id = !empty($data['map_id']) ? trim($data['map_id']) : null;
    $sort_order = (int)($data['sort_order'] ?? 0);

    if (!$id || !$name) { http_response_code(400); echo json_encode(['error' => 'ID and name required']); exit; }

    $stmt = $pdo->prepare("INSERT INTO gm_zones (id,name,unlock_level,palette,map_id,sort_order) VALUES (?,?,?,?,?,?) ON DUPLICATE KEY UPDATE name=VALUES(name),unlock_level=VALUES(unlock_level),palette=VALUES(palette),map_id=VALUES(map_id),sort_order=VALUES(sort_order)");
    $stmt->execute([$id, $name, $unlock_level, $palette, $map_id, $sort_order]);
    echo json_encode(['success' => true]);
    exit;
}

if ($action === 'delete_zone') {
    $id = trim($data['id'] ?? '');
    if (!$id) { http_response_code(400); echo json_encode(['error' => 'ID required']); exit; }
    $pdo->prepare("DELETE FROM gm_zones WHERE id = ?")->execute([$id]);
    echo json_encode(['success' => true]);
    exit;
}

// ===================== ENEMIES =====================

if ($action === 'list_enemies') {
    $rows = $pdo->query("SELECT * FROM gm_enemies ORDER BY sort_order")->fetchAll();
    foreach ($rows as &$r) { $r['resist'] = json_decode($r['resist'], true); $r['weak'] = json_decode($r['weak'], true); }
    echo json_encode(['success' => true, 'enemies' => $rows]);
    exit;
}

if ($action === 'save_enemy') {
    $id = trim($data['id'] ?? '');
    $name = trim($data['name'] ?? '');
    $zone_id = trim($data['zone_id'] ?? '');
    $tier = in_array($data['tier'] ?? '', ['minion','elite']) ? $data['tier'] : 'minion';
    $hp = (int)($data['hp'] ?? 100);
    $dmg = (float)($data['dmg_per_focus_min'] ?? 1);
    $xp = (int)($data['xp'] ?? 10);
    $gold = (int)($data['gold'] ?? 5);
    $lore = trim($data['lore'] ?? '');
    $resist = json_encode($data['resist'] ?? []);
    $weak = json_encode($data['weak'] ?? []);
    $sprite_ref = trim($data['sprite_ref'] ?? '');
    $active = isset($data['active']) ? (int)(bool)$data['active'] : 1;
    $sort_order = (int)($data['sort_order'] ?? 0);

    if (!$id || !$name || !$zone_id) { http_response_code(400); echo json_encode(['error' => 'ID, name and zone required']); exit; }

    $stmt = $pdo->prepare("INSERT INTO gm_enemies (id,name,zone_id,tier,hp,dmg_per_focus_min,xp,gold,lore,resist,weak,sprite_ref,active,sort_order) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE name=VALUES(name),zone_id=VALUES(zone_id),tier=VALUES(tier),hp=VALUES(hp),dmg_per_focus_min=VALUES(dmg_per_focus_min),xp=VALUES(xp),gold=VALUES(gold),lore=VALUES(lore),resist=VALUES(resist),weak=VALUES(weak),sprite_ref=VALUES(sprite_ref),active=VALUES(active),sort_order=VALUES(sort_order)");
    $stmt->execute([$id, $name, $zone_id, $tier, $hp, $dmg, $xp, $gold, $lore, $resist, $weak, $sprite_ref, $active, $sort_order]);
    echo json_encode(['success' => true]);
    exit;
}

if ($action === 'delete_enemy') {
    $id = trim($data['id'] ?? '');
    if (!$id) { http_response_code(400); echo json_encode(['error' => 'ID required']); exit; }
    $pdo->prepare("DELETE FROM gm_enemies WHERE id = ?")->execute([$id]);
    echo json_encode(['success' => true]);
    exit;
}

// ===================== BOSSES =====================

if ($action === 'list_bosses') {
    $rows = $pdo->query("SELECT * FROM gm_bosses ORDER BY sort_order")->fetchAll();
    foreach ($rows as &$r) { $r['reward'] = json_decode($r['reward'], true); }
    echo json_encode(['success' => true, 'bosses' => $rows]);
    exit;
}

if ($action === 'save_boss') {
    $id = trim($data['id'] ?? '');
    $name = trim($data['name'] ?? '');
    $title = trim($data['title'] ?? '');
    $zone_id = !empty($data['zone_id']) ? trim($data['zone_id']) : null;
    $hp = (int)($data['hp'] ?? 1500);
    $danger_label = trim($data['danger_label'] ?? 'HIGH DANGER');
    $lore = trim($data['lore'] ?? '');
    $mechanic = trim($data['mechanic'] ?? '');
    $reward = json_encode($data['reward'] ?? []);
    $is_rare = !empty($data['is_rare']) ? 1 : 0;
    $spawn_chance = (float)($data['spawn_chance'] ?? 1.0);
    $sprite_ref = trim($data['sprite_ref'] ?? '');
    $active = isset($data['active']) ? (int)(bool)$data['active'] : 1;
    $sort_order = (int)($data['sort_order'] ?? 0);

    if (!$id || !$name) { http_response_code(400); echo json_encode(['error' => 'ID and name required']); exit; }

    $stmt = $pdo->prepare("INSERT INTO gm_bosses (id,name,title,zone_id,hp,danger_label,lore,mechanic,reward,is_rare,spawn_chance,sprite_ref,active,sort_order) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE name=VALUES(name),title=VALUES(title),zone_id=VALUES(zone_id),hp=VALUES(hp),danger_label=VALUES(danger_label),lore=VALUES(lore),mechanic=VALUES(mechanic),reward=VALUES(reward),is_rare=VALUES(is_rare),spawn_chance=VALUES(spawn_chance),sprite_ref=VALUES(sprite_ref),active=VALUES(active),sort_order=VALUES(sort_order)");
    $stmt->execute([$id, $name, $title, $zone_id, $hp, $danger_label, $lore, $mechanic, $reward, $is_rare, $spawn_chance, $sprite_ref, $active, $sort_order]);
    echo json_encode(['success' => true]);
    exit;
}

if ($action === 'delete_boss') {
    $id = trim($data['id'] ?? '');
    if (!$id) { http_response_code(400); echo json_encode(['error' => 'ID required']); exit; }
    $pdo->prepare("DELETE FROM gm_bosses WHERE id = ?")->execute([$id]);
    echo json_encode(['success' => true]);
    exit;
}

// ===================== PETS =====================

if ($action === 'list_pets') {
    echo json_encode(['success' => true, 'pets' => $pdo->query("SELECT * FROM gm_pets ORDER BY sort_order")->fetchAll()]);
    exit;
}

if ($action === 'save_pet') {
    $id = trim($data['id'] ?? '');
    $name = trim($data['name'] ?? '');
    $description = trim($data['description'] ?? '');
    $base_blueprint = trim($data['base_blueprint'] ?? '');
    $base_label = trim($data['base_label'] ?? '');
    $evolved_blueprint = !empty($data['evolved_blueprint']) ? trim($data['evolved_blueprint']) : null;
    $evolved_label = !empty($data['evolved_label']) ? trim($data['evolved_label']) : null;
    $evolution_level = (int)($data['evolution_level'] ?? 10);
    $can_evolve = !empty($data['can_evolve']) ? 1 : 0;
    $is_hatchable = isset($data['is_hatchable']) ? (int)(bool)$data['is_hatchable'] : 1;
    $pxm = (float)($data['perk_xp_mult'] ?? 0);
    $pgm = (float)($data['perk_gold_mult'] ?? 0);
    $pdm = (float)($data['perk_dmg_mult'] ?? 0);
    $phdm = (float)($data['perk_hard_dmg_mult'] ?? 0);
    $epxm = (float)($data['evolved_perk_xp_mult'] ?? 0);
    $epgm = (float)($data['evolved_perk_gold_mult'] ?? 0);
    $epdm = (float)($data['evolved_perk_dmg_mult'] ?? 0);
    $ephdm = (float)($data['evolved_perk_hard_dmg_mult'] ?? 0);
    $pd = trim($data['perk_description'] ?? '');
    $epd = !empty($data['evolved_perk_description']) ? trim($data['evolved_perk_description']) : null;
    $active = isset($data['active']) ? (int)(bool)$data['active'] : 1;
    $sort_order = (int)($data['sort_order'] ?? 0);

    if (!$id || !$name) { http_response_code(400); echo json_encode(['error' => 'ID and name required']); exit; }

    $stmt = $pdo->prepare("INSERT INTO gm_pets (id,name,description,base_blueprint,base_label,evolved_blueprint,evolved_label,evolution_level,can_evolve,is_hatchable,perk_xp_mult,perk_gold_mult,perk_dmg_mult,perk_hard_dmg_mult,evolved_perk_xp_mult,evolved_perk_gold_mult,evolved_perk_dmg_mult,evolved_perk_hard_dmg_mult,perk_description,evolved_perk_description,active,sort_order) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE name=VALUES(name),description=VALUES(description),base_blueprint=VALUES(base_blueprint),base_label=VALUES(base_label),evolved_blueprint=VALUES(evolved_blueprint),evolved_label=VALUES(evolved_label),evolution_level=VALUES(evolution_level),can_evolve=VALUES(can_evolve),is_hatchable=VALUES(is_hatchable),perk_xp_mult=VALUES(perk_xp_mult),perk_gold_mult=VALUES(perk_gold_mult),perk_dmg_mult=VALUES(perk_dmg_mult),perk_hard_dmg_mult=VALUES(perk_hard_dmg_mult),evolved_perk_xp_mult=VALUES(evolved_perk_xp_mult),evolved_perk_gold_mult=VALUES(evolved_perk_gold_mult),evolved_perk_dmg_mult=VALUES(evolved_perk_dmg_mult),evolved_perk_hard_dmg_mult=VALUES(evolved_perk_hard_dmg_mult),perk_description=VALUES(perk_description),evolved_perk_description=VALUES(evolved_perk_description),active=VALUES(active),sort_order=VALUES(sort_order)");
    $stmt->execute([$id,$name,$description,$base_blueprint,$base_label,$evolved_blueprint,$evolved_label,$evolution_level,$can_evolve,$is_hatchable,$pxm,$pgm,$pdm,$phdm,$epxm,$epgm,$epdm,$ephdm,$pd,$epd,$active,$sort_order]);
    echo json_encode(['success' => true]);
    exit;
}

if ($action === 'delete_pet') {
    $id = trim($data['id'] ?? '');
    if (!$id) { http_response_code(400); echo json_encode(['error' => 'ID required']); exit; }
    $pdo->prepare("DELETE FROM gm_pets WHERE id = ?")->execute([$id]);
    echo json_encode(['success' => true]);
    exit;
}

echo json_encode(['error' => 'Unknown action']);
