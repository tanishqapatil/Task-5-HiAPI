const express = require("express");
const path = require("path");

const app = express();

app.use(express.json());
app.use(express.static("public"));

var tasks = [];
var nextId = 1;

app.get("/", function(req, res) {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Get all tasks with filtering support
app.get("/api/tasks", function(req, res) {
    res.json(tasks);
});

// Create a new task
app.post("/api/tasks", function(req, res) {
    var title = req.body.title;
    if (!title) {
        res.status(400).json({error: "Title required"});
        return;
    }

    var task = {
        id: nextId++,
        title: title,
        description: req.body.description || "",
        priority: req.body.priority || "medium",
        category: req.body.category || "general",
        dueDate: req.body.dueDate || null,
        done: false,
        order: tasks.length
    };

    tasks.push(task);
    res.json(task);
});

// Update task (supports drag and drop reordering)
app.put("/api/tasks/:id", function(req, res) {
    var id = parseInt(req.params.id);
    var task = tasks.find(function(t) { return t.id === id; });

    if (!task) {
        res.status(404).json({error: "Not found"});
        return;
    }

    if (req.body.title !== undefined) task.title = req.body.title;
    if (req.body.description !== undefined) task.description = req.body.description;
    if (req.body.done !== undefined) task.done = req.body.done;
    if (req.body.priority !== undefined) task.priority = req.body.priority;
    if (req.body.category !== undefined) task.category = req.body.category;
    if (req.body.dueDate !== undefined) task.dueDate = req.body.dueDate;
    if (req.body.order !== undefined) {
        // Handle drag and drop reordering
        var newOrder = req.body.order;
        tasks.forEach(function(t) {
            if (t.order >= newOrder && t.id !== task.id) {
                t.order++;
            }
        });
        task.order = newOrder;
        tasks.sort(function(a, b) { return a.order - b.order; });
    }

    res.json(task);
});

// Bulk update tasks
app.put("/api/tasks", function(req, res) {
    var ids = req.body.ids;
    var updates = req.body.updates;

    if (!ids || !Array.isArray(ids)) {
        res.status(400).json({error: "IDs array required"});
        return;
    }

    var updated = [];
    ids.forEach(function(id) {
        var task = tasks.find(function(t) { return t.id === id; });
        if (task) {
            if (updates.done !== undefined) task.done = updates.done;
            updated.push(task);
        }
    });

    res.json(updated);
});

// Delete a single task
app.delete("/api/tasks/:id", function(req, res) {
    var id = parseInt(req.params.id);
    var idx = tasks.findIndex(function(t) { return t.id === id; });

    if (idx > -1) {
        tasks.splice(idx, 1);
        // Reorder remaining tasks
        tasks.forEach(function(t, index) { t.order = index; });
    }

    res.json({});
});

// Bulk delete tasks
app.delete("/api/tasks", function(req, res) {
    var ids = req.body.ids;
    if (!ids || !Array.isArray(ids)) {
        res.status(400).json({error: "IDs array required"});
        return;
    }

    ids.forEach(function(id) {
        var idx = tasks.findIndex(function(t) { return t.id === id; });
        if (idx > -1) {
            tasks.splice(idx, 1);
        }
    });

    // Reorder remaining tasks
    tasks.forEach(function(t, index) { t.order = index; });

    res.json({deleted: ids.length});
});

// Update task order (for drag and drop)
app.put("/api/tasks/reorder", function(req, res) {
    var reorder = req.body.order; // Array of [id, newOrder]
    if (!reorder || !Array.isArray(reorder)) {
        res.status(400).json({error: "Order array required"});
        return;
    }

    reorder.forEach(function(item) {
        var task = tasks.find(function(t) { return t.id === item[0]; });
        if (task) {
            task.order = item[1];
        }
    });

    tasks.sort(function(a, b) { return a.order - b.order; });
    res.json(tasks);
});

app.listen(3000, function() {
    console.log("Server on http://localhost:3000");
});
