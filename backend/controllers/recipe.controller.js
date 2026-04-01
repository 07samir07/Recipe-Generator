import PantryItem from "../models/pantryitem.model.js";
import Recipe from "../models/recipe.model.js";

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
    const recipe = await generateRecipeAI({
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

//get smart pantry suggestions
export const getPantrySuggestions = async (req, res, next) => {
  try {
    const pantryItems = await PantryItem.findByUserId(req.user.id);
    const expiringItems = await PantryItem.getExpiringSoon(req.user.id, 7);
    const expiringNames = expiringItems.map((item) => item.name);
    const suggestions = await generatePantrySuggestionsAI(
      pantryItems,
      expiringNames,
    );

    res.json({
      success: true,
      data: { suggestions },
    });
  } catch (error) {
    next(error);
  }
};

//save recipe
export const saveRecipe = async (req, res, next) => {
  try {
    const recipe = await Recipe.create(req.user.id, req.body);
    res.status(201).json({
      success: true,
      message: "Recipe saved successfully",
      data: { recipe },
    });
  } catch (error) {
    next(error);
  }
};

//get all recipes
export const getRecipes = async (req, res, next) => {
  try {
    const {
      search,
      cuisine_type,
      difficulty,
      dietary_tag,
      max_cook_time,
      sort_by,
      sort_order,
      limit,
      offset,
    } = req.query;
    const recipes = await Recipe.findByUserId(req.user.id, {
      search,
      cuisine_type,
      difficulty,
      dietary_tag,
      max_cook_time: max_cook_time ? parseInt(max_cook_time) : undefined,
      sort_by,
      sort_order,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    });
    res.json({
      success: true,
      data: { recipes },
    });
  } catch (error) {
    next(error);
  }
};
