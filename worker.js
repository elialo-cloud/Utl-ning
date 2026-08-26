const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { "content-type": "application/json; charset=utf-8" }
});

async function getState(db) {
  const [classes, students, items, loans] = await Promise.all([
    db.prepare("SELECT id, name FROM classes ORDER BY name").all(),
    db.prepare("SELECT class_id, name FROM students ORDER BY class_id, name").all(),
    db.prepare("SELECT id, name, icon, category, total FROM items ORDER BY name").all(),
    db.prepare("SELECT id, class_id as classId, class_name as className, student, item_id as itemId, item_name as itemName, icon, borrowed_at as borrowedAt, returned, returned_at as returnedAt FROM loans ORDER BY borrowed_at DESC").all()
  ]);

  const studentsByClass = new Map();
  for (const row of students.results) {
    if (!studentsByClass.has(row.class_id)) studentsByClass.set(row.class_id, []);
    studentsByClass.get(row.class_id).push(row.name);
  }

  return {
    classes: classes.results.map(row => ({ id: row.id, name: row.name, students: studentsByClass.get(row.id) || [] })),
    items: items.results,
    loans: loans.results.map(row => ({ ...row, returned: Boolean(row.returned) }))
  };
}

async function replaceState(db, data) {
  const statements = [
    db.prepare("DELETE FROM loans"),
    db.prepare("DELETE FROM students"),
    db.prepare("DELETE FROM classes"),
    db.prepare("DELETE FROM items")
  ];

  for (const cls of data.classes || []) {
    statements.push(db.prepare("INSERT INTO classes (id, name) VALUES (?, ?)").bind(cls.id, cls.name));
    for (const student of cls.students || []) {
      statements.push(db.prepare("INSERT INTO students (class_id, name) VALUES (?, ?)").bind(cls.id, student));
    }
  }

  for (const item of data.items || []) {
    statements.push(db.prepare("INSERT INTO items (id, name, icon, category, total) VALUES (?, ?, ?, ?, ?)").bind(item.id, item.name, item.icon || "📦", item.category || "Övrigt", Number(item.total || 0)));
  }

  for (const loan of data.loans || []) {
    statements.push(db.prepare("INSERT INTO loans (id, class_id, class_name, student, item_id, item_name, icon, borrowed_at, returned, returned_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(
      loan.id,
      loan.classId,
      loan.className,
      loan.student,
      loan.itemId,
      loan.itemName,
      loan.icon || "📦",
      loan.borrowedAt,
      loan.returned ? 1 : 0,
      loan.returnedAt || null
    ));
  }

  await db.batch(statements);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/health") {
      return json({ ok: true, service: "boden-lanesystem" });
    }

    if (url.pathname === "/api/state" && request.method === "GET") {
      try {
        return json(await getState(env.DB));
      } catch (error) {
        return json({ error: String(error) }, 500);
      }
    }

    if (url.pathname === "/api/state" && request.method === "PUT") {
      try {
        const data = await request.json();
        if (!Array.isArray(data.classes) || !Array.isArray(data.items) || !Array.isArray(data.loans)) {
          return json({ error: "Invalid state payload" }, 400);
        }
        await replaceState(env.DB, data);
        return json({ ok: true });
      } catch (error) {
        return json({ error: String(error) }, 500);
      }
    }

    return env.ASSETS.fetch(request);
  }
};
