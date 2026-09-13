<?php
require_once 'db.php';

$data = json_decode(file_get_contents('php://input'), true);
$action = $_GET['action'] ?? '';

// ---------- Auto-migrate tables ----------
try {
    $pdo->exec("CREATE TABLE IF NOT EXISTS cms_posts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL UNIQUE,
        excerpt TEXT,
        body LONGTEXT,
        cover_image VARCHAR(500),
        status ENUM('draft','published') DEFAULT 'draft',
        category ENUM('blog','news','changelog') DEFAULT 'blog',
        author_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        published_at TIMESTAMP NULL DEFAULT NULL
    )");
} catch (PDOException $e) { /* exists */ }

try {
    $pdo->exec("CREATE TABLE IF NOT EXISTS cms_modals (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        body LONGTEXT,
        cta_text VARCHAR(100),
        cta_url VARCHAR(500),
        image VARCHAR(500),
        trigger_type ENUM('first_visit','always','date_range','manual') DEFAULT 'manual',
        active_from TIMESTAMP NULL DEFAULT NULL,
        active_until TIMESTAMP NULL DEFAULT NULL,
        is_active BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )");
} catch (PDOException $e) { /* exists */ }

try {
    $pdo->exec("CREATE TABLE IF NOT EXISTS cms_pages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        page_key VARCHAR(100) NOT NULL UNIQUE,
        content JSON,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )");
} catch (PDOException $e) { /* exists */ }

// ---------- Public endpoints (no admin check) ----------

if ($action === 'public_posts') {
    $category = $_GET['category'] ?? null;
    $sql = "SELECT id, title, slug, excerpt, cover_image, category, published_at FROM cms_posts WHERE status = 'published'";
    $params = [];
    if ($category) {
        $sql .= " AND category = ?";
        $params[] = $category;
    }
    $sql .= " ORDER BY published_at DESC LIMIT 50";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    echo json_encode(['success' => true, 'posts' => $stmt->fetchAll()]);
    exit;
}

if ($action === 'public_post') {
    $slug = $_GET['slug'] ?? '';
    $stmt = $pdo->prepare("SELECT id, title, slug, excerpt, body, cover_image, category, published_at FROM cms_posts WHERE slug = ? AND status = 'published'");
    $stmt->execute([$slug]);
    $post = $stmt->fetch();
    if (!$post) { http_response_code(404); echo json_encode(['error' => 'Post not found']); exit; }
    echo json_encode(['success' => true, 'post' => $post]);
    exit;
}

if ($action === 'public_modals') {
    $now = date('Y-m-d H:i:s');
    $stmt = $pdo->prepare("SELECT id, title, body, cta_text, cta_url, image, trigger_type FROM cms_modals WHERE is_active = 1 AND (active_from IS NULL OR active_from <= ?) AND (active_until IS NULL OR active_until >= ?)");
    $stmt->execute([$now, $now]);
    echo json_encode(['success' => true, 'modals' => $stmt->fetchAll()]);
    exit;
}

if ($action === 'public_page') {
    $key = $_GET['key'] ?? '';
    $stmt = $pdo->prepare("SELECT content FROM cms_pages WHERE page_key = ?");
    $stmt->execute([$key]);
    $row = $stmt->fetch();
    echo json_encode(['success' => true, 'content' => $row ? json_decode($row['content'], true) : null]);
    exit;
}

// ---------- Admin check ----------

$admin_id = (int)($data['admin_id'] ?? 0);
if (!$admin_id) { http_response_code(401); echo json_encode(['error' => 'Login required']); exit; }

$stmt = $pdo->prepare("SELECT is_admin FROM users WHERE id = ?");
$stmt->execute([$admin_id]);
$adminUser = $stmt->fetch();

if (!$adminUser || !$adminUser['is_admin']) {
    http_response_code(403);
    echo json_encode(['error' => 'Forbidden: Admins only']);
    exit;
}

// ---------- Auto-seed default posts ----------
function seedDefaultPosts($pdo) {
    $count = $pdo->query("SELECT COUNT(*) FROM cms_posts")->fetchColumn();
    if ($count > 0) return;

    $defaults = [
        [
            'title' => 'Welcome to Taskoria: Where Productivity Meets Adventure',
            'slug' => 'welcome-to-taskoria',
            'excerpt' => 'We built Taskoria because we believe getting things done should feel rewarding — not like a chore. Here\'s why we turned your to-do list into an RPG.',
            'category' => 'news',
            'date' => '2026-07-28',
            'content' => [
                ['type' => 'paragraph', 'text' => 'Every task manager starts the same way: a blank list, a cursor, and the quiet dread of everything you need to do. We\'ve all been there. You write it all down, check a few boxes, and by Wednesday the app is forgotten.'],
                ['type' => 'paragraph', 'text' => 'Taskoria was born from a simple question: what if finishing your tasks actually felt like winning? Not in a shallow, gamified-sticker kind of way — but in a way that gives you a real sense of progression, community, and creative expression.'],
                ['type' => 'heading', 'text' => 'The Problem with Productivity Apps'],
                ['type' => 'paragraph', 'text' => 'Most productivity tools are designed for output. They track what you do, remind you what you haven\'t done, and punish you with overdue badges when life gets in the way. They\'re effective — but they\'re not motivating.'],
                ['type' => 'paragraph', 'text' => 'We wanted something different. Something that rewards consistency over perfection, that turns a boring Tuesday into an adventure, and that makes you actually want to open the app.'],
                ['type' => 'heading', 'text' => 'Enter the RPG Layer'],
                ['type' => 'paragraph', 'text' => 'In Taskoria, every task you create becomes a Quest. Completing quests earns XP and gold. You level up your character, unlock new classes, adopt pets, and explore an open pixel-art world — all driven by your real productivity.'],
                ['type' => 'paragraph', 'text' => 'But here\'s the key: the task manager comes first. Tasks, deadlines, priorities, habits, and calendars are all front and center. The RPG layer motivates you to use them — it never gets in the way.'],
                ['type' => 'heading', 'text' => 'Built by the Community'],
                ['type' => 'paragraph', 'text' => 'The world of Taskoria isn\'t just ours — it\'s yours. With the built-in Pixel Studio, players can design houses, castles, trees, mounts, and decorations pixel by pixel. Approved creations live on the shared map forever.'],
                ['type' => 'paragraph', 'text' => 'We\'re opening the closed beta now. Founding citizens get early access to all 5 maps, exclusive badges, and a permanent place in the Archive Council\'s records. See you in the kingdom.'],
            ],
        ],
        [
            'title' => 'Why Gamification Actually Works for ADHD Brains',
            'slug' => 'adhd-friendly-task-management',
            'excerpt' => 'Dopamine-driven motivation isn\'t a hack — it\'s how ADHD brains are wired. Here\'s how Taskoria uses game mechanics to help you focus without the guilt.',
            'category' => 'blog',
            'date' => '2026-08-01',
            'content' => [
                ['type' => 'paragraph', 'text' => 'If you have ADHD, you already know the problem: it\'s not that you can\'t focus — it\'s that your brain picks what to focus on, and "organize the kitchen" rarely wins against "watch 40 minutes of random videos."'],
                ['type' => 'paragraph', 'text' => 'Traditional task managers make this worse. A long, flat list of tasks triggers overwhelm, not action. Due dates create anxiety. And checking a box? Your brain barely registers it.'],
                ['type' => 'heading', 'text' => 'The Dopamine Gap'],
                ['type' => 'paragraph', 'text' => 'ADHD brains have lower baseline dopamine. That means tasks need to feel immediately rewarding to compete for your attention. This isn\'t a character flaw — it\'s neurochemistry.'],
                ['type' => 'paragraph', 'text' => 'Games solve this naturally. Clear goals, instant feedback, visible progress, and a sense of agency — these are the exact mechanisms that ADHD brains respond to. Taskoria is built on all four.'],
                ['type' => 'heading', 'text' => 'How Taskoria Helps'],
                ['type' => 'paragraph', 'text' => 'Every completed task triggers an XP animation. Your character visibly levels up. Your pet grows. Your streak counter climbs. These aren\'t gimmicks — they\'re the same reward signals that make games compelling, applied to your actual life.'],
                ['type' => 'paragraph', 'text' => 'The difficulty system lets you rate tasks from Trivial to Legendary. Harder tasks earn more XP. This means your brain gets a proportional reward for tackling the scary stuff — instead of the same hollow checkmark for everything.'],
                ['type' => 'heading', 'text' => 'No Guilt, No Punishment'],
                ['type' => 'paragraph', 'text' => 'Taskoria never punishes you for missing a day. There are no angry red badges, no passive-aggressive "you missed 14 tasks" notifications. Instead, when you come back, your character is right where you left them — ready for the next quest.'],
                ['type' => 'paragraph', 'text' => 'Because the truth is: consistency matters more than perfection. And the best productivity system is the one you actually want to use.'],
            ],
        ],
        [
            'title' => 'Inside the Pixel Studio: How Players Build the World',
            'slug' => 'pixel-studio-creative-expression',
            'excerpt' => 'Taskoria\'s built-in Pixel Studio lets you design houses, castles, and props for the shared world. Here\'s how the creative pipeline works.',
            'category' => 'blog',
            'date' => '2026-08-04',
            'content' => [
                ['type' => 'paragraph', 'text' => 'Most productivity apps end at the checkbox. Taskoria goes further: it gives you a canvas. The Pixel Studio is a full pixel-art editor built right into the app, where players can create assets that become part of the shared game world.'],
                ['type' => 'heading', 'text' => 'What Can You Create?'],
                ['type' => 'paragraph', 'text' => 'The Studio supports six creation categories: houses, castles, mounts, trees, decoration, and props. Each has its own size constraints and design guidelines, but within those bounds, you have complete creative freedom.'],
                ['type' => 'heading', 'text' => 'The Tools'],
                ['type' => 'paragraph', 'text' => 'The editor includes everything you\'d expect from a pixel art tool: a color palette with Taskoria\'s curated colors, free color picker, pencil, bucket fill, eraser, eyedropper, and full undo/redo history. You can also upload a reference image and trace over it with adjustable opacity.'],
                ['type' => 'heading', 'text' => 'From Canvas to World'],
                ['type' => 'paragraph', 'text' => 'When you finish a creation, you submit it for community review. Approved works go through a moderation pipeline and then appear on the shared map — visible to every player who walks through that area.'],
                ['type' => 'paragraph', 'text' => 'Your name appears on every creation you publish. Build enough, and you\'ll see your own village forming in the Taskoria world. It\'s the ultimate form of productive procrastination.'],
            ],
        ],
    ];

    $stmt = $pdo->prepare("INSERT INTO cms_posts (title, slug, excerpt, body, status, category, published_at) VALUES (?, ?, ?, ?, 'published', ?, ?)");
    foreach ($defaults as $post) {
        $body = '';
        foreach ($post['content'] as $block) {
            if ($block['type'] === 'heading') {
                $body .= '<h2>' . htmlspecialchars($block['text']) . '</h2>';
            } else {
                $body .= '<p>' . htmlspecialchars($block['text']) . '</p>';
            }
        }
        try {
            $stmt->execute([$post['title'], $post['slug'], $post['excerpt'], $body, $post['category'], $post['date'] . ' 00:00:00']);
        } catch (PDOException $e) { /* slug duplicate */ }
    }
}

seedDefaultPosts($pdo);

// ---------- Posts CRUD ----------

if ($action === 'list_posts') {
    $stmt = $pdo->query("SELECT id, title, slug, excerpt, cover_image, status, category, created_at, published_at FROM cms_posts ORDER BY created_at DESC");
    echo json_encode(['success' => true, 'posts' => $stmt->fetchAll()]);
    exit;
}

if ($action === 'get_post') {
    $id = (int)($data['id'] ?? 0);
    $stmt = $pdo->prepare("SELECT * FROM cms_posts WHERE id = ?");
    $stmt->execute([$id]);
    $post = $stmt->fetch();
    if (!$post) { http_response_code(404); echo json_encode(['error' => 'Not found']); exit; }
    echo json_encode(['success' => true, 'post' => $post]);
    exit;
}

if ($action === 'save_post') {
    $id = (int)($data['id'] ?? 0);
    $title = trim($data['title'] ?? '');
    $slug = trim($data['slug'] ?? '');
    $excerpt = trim($data['excerpt'] ?? '');
    $body = $data['body'] ?? '';
    $cover_image = trim($data['cover_image'] ?? '');
    $status = in_array($data['status'] ?? '', ['draft', 'published']) ? $data['status'] : 'draft';
    $category = in_array($data['category'] ?? '', ['blog', 'news', 'changelog']) ? $data['category'] : 'blog';

    if (!$title) { http_response_code(400); echo json_encode(['error' => 'Title is required']); exit; }

    if (!$slug) {
        $slug = preg_replace('/[^a-z0-9]+/', '-', strtolower($title));
        $slug = trim($slug, '-');
    }

    $published_at = null;
    if ($status === 'published') {
        $published_at = date('Y-m-d H:i:s');
    }

    try {
        if ($id) {
            // Keep original published_at if already set
            $existing = $pdo->prepare("SELECT published_at FROM cms_posts WHERE id = ?");
            $existing->execute([$id]);
            $row = $existing->fetch();
            if ($row && $row['published_at'] && $status === 'published') {
                $published_at = $row['published_at'];
            }

            $stmt = $pdo->prepare("UPDATE cms_posts SET title = ?, slug = ?, excerpt = ?, body = ?, cover_image = ?, status = ?, category = ?, published_at = ? WHERE id = ?");
            $stmt->execute([$title, $slug, $excerpt, $body, $cover_image, $status, $category, $published_at, $id]);
        } else {
            $stmt = $pdo->prepare("INSERT INTO cms_posts (title, slug, excerpt, body, cover_image, status, category, author_id, published_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([$title, $slug, $excerpt, $body, $cover_image, $status, $category, $admin_id, $published_at]);
            $id = $pdo->lastInsertId();
        }
        echo json_encode(['success' => true, 'id' => $id]);
    } catch (PDOException $e) {
        http_response_code(500);
        error_log('CMS save_post error: ' . $e->getMessage());
        echo json_encode(['error' => 'Failed to save post']);
    }
    exit;
}

if ($action === 'delete_post') {
    $id = (int)($data['id'] ?? 0);
    $pdo->prepare("DELETE FROM cms_posts WHERE id = ?")->execute([$id]);
    echo json_encode(['success' => true]);
    exit;
}

// ---------- Image upload ----------

if ($action === 'upload_image') {
    if (!isset($_FILES['image'])) {
        http_response_code(400);
        echo json_encode(['error' => 'No file uploaded']);
        exit;
    }

    // Admin check via GET param for multipart uploads
    $admin_id = (int)($_POST['admin_id'] ?? $_GET['admin_id'] ?? 0);
    if (!$admin_id) { http_response_code(401); echo json_encode(['error' => 'Login required']); exit; }
    $stmt = $pdo->prepare("SELECT is_admin FROM users WHERE id = ?");
    $stmt->execute([$admin_id]);
    $chk = $stmt->fetch();
    if (!$chk || !$chk['is_admin']) { http_response_code(403); echo json_encode(['error' => 'Forbidden']); exit; }

    $file = $_FILES['image'];
    $allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!in_array($file['type'], $allowed)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid file type. Allowed: jpg, png, gif, webp']);
        exit;
    }
    if ($file['size'] > 5 * 1024 * 1024) {
        http_response_code(400);
        echo json_encode(['error' => 'File too large (max 5MB)']);
        exit;
    }

    $uploadDir = __DIR__ . '/uploads/';
    if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);

    $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = uniqid('img_') . '.' . $ext;
    $dest = $uploadDir . $filename;

    if (move_uploaded_file($file['tmp_name'], $dest)) {
        echo json_encode(['success' => true, 'url' => 'api/uploads/' . $filename]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to save file']);
    }
    exit;
}

// ---------- Modals CRUD ----------

if ($action === 'list_modals') {
    $stmt = $pdo->query("SELECT * FROM cms_modals ORDER BY created_at DESC");
    echo json_encode(['success' => true, 'modals' => $stmt->fetchAll()]);
    exit;
}

if ($action === 'save_modal') {
    $id = (int)($data['id'] ?? 0);
    $title = trim($data['title'] ?? '');
    $body = $data['body'] ?? '';
    $cta_text = trim($data['cta_text'] ?? '');
    $cta_url = trim($data['cta_url'] ?? '');
    $image = trim($data['image'] ?? '');
    $trigger_type = in_array($data['trigger_type'] ?? '', ['first_visit', 'always', 'date_range', 'manual']) ? $data['trigger_type'] : 'manual';
    $is_active = !empty($data['is_active']) ? 1 : 0;
    $active_from = !empty($data['active_from']) ? $data['active_from'] : null;
    $active_until = !empty($data['active_until']) ? $data['active_until'] : null;

    if (!$title) { http_response_code(400); echo json_encode(['error' => 'Title is required']); exit; }

    try {
        if ($id) {
            $stmt = $pdo->prepare("UPDATE cms_modals SET title=?, body=?, cta_text=?, cta_url=?, image=?, trigger_type=?, is_active=?, active_from=?, active_until=? WHERE id=?");
            $stmt->execute([$title, $body, $cta_text, $cta_url, $image, $trigger_type, $is_active, $active_from, $active_until, $id]);
        } else {
            $stmt = $pdo->prepare("INSERT INTO cms_modals (title, body, cta_text, cta_url, image, trigger_type, is_active, active_from, active_until) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([$title, $body, $cta_text, $cta_url, $image, $trigger_type, $is_active, $active_from, $active_until]);
            $id = $pdo->lastInsertId();
        }
        echo json_encode(['success' => true, 'id' => $id]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to save modal']);
    }
    exit;
}

if ($action === 'delete_modal') {
    $id = (int)($data['id'] ?? 0);
    $pdo->prepare("DELETE FROM cms_modals WHERE id = ?")->execute([$id]);
    echo json_encode(['success' => true]);
    exit;
}

// ---------- Pages (landing blocks) ----------

if ($action === 'save_page') {
    $key = trim($data['page_key'] ?? '');
    $content = json_encode($data['content'] ?? []);
    if (!$key) { http_response_code(400); echo json_encode(['error' => 'page_key required']); exit; }

    $stmt = $pdo->prepare("INSERT INTO cms_pages (page_key, content) VALUES (?, ?) ON DUPLICATE KEY UPDATE content = VALUES(content)");
    $stmt->execute([$key, $content]);
    echo json_encode(['success' => true]);
    exit;
}

echo json_encode(['error' => 'Unknown action']);
