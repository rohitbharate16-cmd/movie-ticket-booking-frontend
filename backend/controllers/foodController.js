const { supabaseAdmin } = require("../lib/supabaseAdmin");

const listFood = async (_req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("food_items")
      .select("*")
      .eq("is_active", true)
      .order("name");

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const upsertFoodItems = async (items) => supabaseAdmin
  .from("food_items")
  .upsert(items, { onConflict: "id" })
  .select("*");

const createFood = async (req, res) => {
  try {
    const item = req.body;

    if (!item || !item.id) {
      return res.status(400).json({ error: "Food payload with id is required" });
    }

    const { data, error } = await upsertFoodItems([item]);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(201).json(data[0]);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const bulkUpsertFood = async (req, res) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items) || !items.length) {
      return res.status(400).json({ error: "items array is required" });
    }

    const { data, error } = await upsertFoodItems(items);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json({ count: data.length, items: data });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const updateFood = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("food_items")
      .update(req.body)
      .eq("id", req.params.id)
      .select("*")
      .maybeSingle();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (!data) {
      return res.status(404).json({ error: "Not found" });
    }

    return res.json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const deleteFood = async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from("food_items")
      .delete()
      .eq("id", req.params.id);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json({ message: "Food item deleted" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const clearFood = async (_req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from("food_items")
      .delete()
      .neq("id", "");

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json({ message: "All food items deleted" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

module.exports = {
  listFood,
  createFood,
  bulkUpsertFood,
  updateFood,
  deleteFood,
  clearFood
};
