import PantryItem from "../models/pantryitem.model.js";

export const generateRecipe = async (req, res, next) => {
  try {
    const {
      ingredients = [],
      usePantryIngredients = false,
      dietaryRestrictions = [],
      cuisineType = "any",
      servings = 4,
      cookingTime = "medium",
    } = req.body;

    let finalIngredients = [...ingredients];

    //add pantry ingredients if requested
    if (usePantryIngredients) {
      const pantryItems = await PantryItem.findByUserId(req.user.id);
      const pantryIngredientNames = pantryItems.map((item) => item.name);
      finalIngredients = [
        ...new Set([...finalIngredients, ...pantryIngredientNames]),
      ];
    }
    if (finalIngredients.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide at least one ingredient",
      });
    }

    //generate recipe using gemini
    const recipe = await generateRecipeAi({
      ingredients: finalIngredients,
      dietaryRestrictions,
      cuisineType,
      servings,
      cookingTime,
    });
    res.json({
      success: true,
      message: "Recipe generated successfully",
      data: { recipe },
    });
  } catch (error) {
    next(error);
  }
};
