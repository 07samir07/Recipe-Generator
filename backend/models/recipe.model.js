import db from "../config/db.js";

class Recipe {
  //create a new recipe with ingredients and nutrition

  static async create(userId, recipeData) {
    const client = await db.pool.connect();
    try {
      await client.query("BEGIN");
      const {
        name,
        description,
        cuisine_type,
        difficulty,
        prep_time,
        cook_time,
        servings,
        instructions,
        dietary_tags = [],
        user_notes,
        image_url,
        ingredients = [],
        nutrition = {},
      } = recipeData;

      //insert recipe
      const recipeResult = await client.query(
        `INSERT INTO recipes (user_id, name, description, cuisine_type, difficulty, prep_time, cook_time, servings, instructions, dietary_tags, user_notes,image_url) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
        [
          userId,
          name,
          description,
          cuisine_type,
          difficulty,
          prep_time,
          cook_time,
          servings,
          JSON.stringify(instructions),
          dietary_tags,
          user_notes,
        ],
      );
      const recipe = recipeResult.rows[0];

      //insert ingredients
      if (ingredients.length > 0) {
        const ingredientValues = ingredients
          .map(
            (ing, idx) =>
              `($1, $${idx * 3 + 2}, $${idx * 3 + 3}, $${idx * 3 + 4})`,
          )
          .join(", ");

        const ingredientParams = [recipe.id];
        ingredients.forEach((ing) => {
          ingredientParams.push(ing.name, ing.quantity, ing.unit);
        });

        await client.query(
          `INSERT INTO recipe_ingredients (recipe_id, ingredient_name, quantity, unit) VALUE ${ingredientValues}`,
          ingredientParams,
        );
      }

      //insert nutrition
      if (nutrition && Object.keys(nutrition).length > 0) {
        await client.query(
          `INSERT INTO recipe_nutrition (recipe_id,calories, protein, carbs, fats,fiber) VALUES ($1,$2,$3,$4,$5,$6)`,
          [
            recipe.id,
            nutrition.calories,
            nutrition.protein,
            nutrition.carbs,
            nutrition.fats,
            nutrition.fiber,
          ],
        );
      }

      await client.query("COMMIT");

      //FETCH COMPLETE RECIPE
      return await this.findById(recipe.id, userId);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  //get recipe by ID with ingredients and nutriition
  static async findById(id, userId) {
    const recipeResult = await db.query(
      `SELECT * FROM recipes WHERE id = $1 AND user_id = $2`,
      [id, userId],
    );
    if (recipeResult.rows.length === 0) {
      return null;
    }

    const recipe = recipeResult.rows[0];

    //get ingredients
    const ingredientResult = await db.query(
      `SELECT ingredient_name as name, quantity, unit FROM recipe_ingredients WHERE recipe_id = $1`,
      [id],
    );

    //get nutrition
    const nutritionResult = await db.query(
      `SELECT calories, protein, carbs, fats, fiber FROM recipe_nutrition WHERE recipe_id = $1`,
      [id],
    );
    return {
      ...recipe,
      ingredients: ingredientResult.rows,
      nutrition: nutritionResult.rows[0] || null,
    };
  }
}
