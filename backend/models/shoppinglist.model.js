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
        `SELECT name,quantity, unit FROM pantry_items WHERE user_id = $1`,[userId]
      )

      const pantryMap = new Map();
      pantryResult.rows.forEach(item => {
        const key = `${item.name.toLowerCase()}_${item.unit}`;
        pantryMap.set(key, item.quantity);
      }),
      //insert shopping list items (subtract pantry quantities)
      for(const ing of ingredients){
        const key = `${ing.ingredient_name.toLowerCase()}_${ing.unit}`;
        const pantryQty = pantryMap.get(key) || 0;
        const neededQty = Math.max(0, parseFloat(ing.total_quantity) - parseFloat(pantryQty));

        if(neededQty > 0){
          await client.query(`INSERT INTO shopping_list_items (user_id, ingredient_name, quantity, unit, from_meal_plan, category) VALUES ($1,$2,$3,$4, true,$5)`,[userId, ing.ingredient_name, neededQty, ing.unit, 'Uncategorized']);
        }
      }
      await client.query('COMMIT');
      return await this.findByUserId(userId);
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }finally{
      client.release();
    }
  }

  
}

export default ShoppingList;
