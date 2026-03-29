import db from "../config/db.js";

class ShoppingList {
  //generate shopping list from meal plan
  static async generateFromMealPlan(userId, startDate, endDate) {
    try {
      await client.query("BEGIN");
      //clear existing meal plan items
      await client.query(
        `DELETE FROM shopping_list_items WHERE user_id = $1 AND meal_plan = true`,
        [userId],
      );
      //get all ingredients from meal plan recipes
      const result = await client.query(
        `SELECT ri.ingredient_name, ri.unit, SUM(ri.quantity) as total_quantity FROM meal_plans mp JOIN recipe_ingredients ri ON mp.recipe_id = ri.recipe_id WHERE mp.user_id = $1 AND mp.meal_date >=$2 AND mp.meal_date <= $3 GROUP BY ri.ingredient_name,ri.unit`,
        [userId, startDate, endDate],
      );
      const ingredients = result.rows;

      //get pantry itmes to subtract
      const pantryResult = await client.query(
        `SELECT name,quantity, unit FROM pantry_items WHERE user_id = $1`,
        [userId],
      );

      const pantryMap = new Map();
      pantryResult.rows.forEach((item) => {
        const key = `${item.name.toLowerCase()}_${item.unit}`;
        pantryMap.set(key, item.quantity);
      });
      //insert shopping list items (subtract pantry quantities)
      for (const ing of ingredients) {
        const key = `${ing.ingredient_name.toLowerCase()}_${ing.unit}`;
        const pantryQty = pantryMap.get(key) || 0;
        const neededQty = Math.max(
          0,
          parseFloat(ing.total_quantity) - parseFloat(pantryQty),
        );

        if (neededQty > 0) {
          await client.query(
            `INSERT INTO shopping_list_items (user_id, ingredient_name, quantity, unit, from_meal_plan, category) VALUES ($1,$2,$3,$4, true,$5)`,
            [userId, ing.ingredient_name, neededQty, ing.unit, "Uncategorized"],
          );
        }
      }
      await client.query("COMMIT");
      return await this.findByUserId(userId);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  //add manual item to shopping list
  static async create(userId, itemData) {
    const {
      ingredient_name,
      quantity,
      unit,
      category = "Uncategorized",
    } = itemData;

    const result = await db.query(
      `INSERT INTO shopping_list_items (user_id, ingredient_name, quantity, unit, category, from_meal_plan) VALUES ($1,$2,$3,$4,$5,false) RETURNING *`,
      [userId, ingredient_name, quantity, unit, category],
    );
    return result.rows[0];
  }

  //get shopping list items for user
  static async findByUserId(userId) {
    const result = await db.query(
      `SELECT * FROM shopping_list_items WHERE user_id = $1 ORDER BY category, ingredient_name`,
      [userId],
    );
    return result.rows;
  }

  //get shopping list grouped by category
  static async getGroupedByCategory(userId) {
    const result = await db.query(
      `SELECT category, json_agg(
      json_build_object(
      'id', id,
      'ingredient_name', ingredient_name,
      'quantity', quantity,
      'unit', unit,
      'is_checked', is_checked,
      'from_meal_plan', from_meal_plan)) as items FROM shopping_list_items WHERE user_id = $1 GROUP BY category ORDER BY category`,
      [userId],
    );
    return result.rows;
  }
}

export default ShoppingList;
