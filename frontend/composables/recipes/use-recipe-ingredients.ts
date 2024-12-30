import DOMPurify from "isomorphic-dompurify";
import { is } from "date-fns/locale";
import { useFraction } from "./use-fraction";
import { CreateIngredientFood, CreateIngredientUnit, IngredientFood, IngredientUnit, RecipeIngredient } from "~/lib/api/types/recipe";
const { frac } = useFraction();

export function sanitizeIngredientHTML(rawHtml: string) {
  return DOMPurify.sanitize(rawHtml, {
    USE_PROFILES: { html: true },
    ALLOWED_TAGS: ["b", "q", "i", "strong", "sup"],
  });
}

function useFoodName(food: CreateIngredientFood | IngredientFood | undefined, usePlural: boolean) {
  if (!food) {
    return "";
  }

  return (usePlural ? food.pluralName || food.name : food.name) || "";
}

function useUnitName(unit: CreateIngredientUnit | IngredientUnit | undefined, usePlural: boolean) {
  if (!unit) {
    return "";
  }

  let returnVal = "";
  if (unit.useAbbreviation) {
    returnVal = (usePlural ? unit.pluralAbbreviation || unit.abbreviation : unit.abbreviation) || "";
  }

  if (!returnVal) {
    returnVal = (usePlural ? unit.pluralName || unit.name : unit.name) || "";
  }

  return returnVal;
}

export function useParsedIngredientText(ingredient: RecipeIngredient, disableAmount: boolean, scale = 1, includeFormating = true, groupSlug?: string) {
  if (disableAmount && !ingredient.isRecipe) {
    return {
      name: ingredient.note ? sanitizeIngredientHTML(ingredient.note) : undefined,
      quantity: undefined,
      unit: undefined,
      note: undefined,
    };
  }

  const { quantity, food, unit, note, referencedRecipe } = ingredient;
  const usePluralUnit = quantity !== undefined && ((quantity || 0) * scale > 1 || (quantity || 0) * scale === 0);
  const usePluralFood = (!quantity) || quantity * scale > 1

  let returnQty = "";

  // casting to number is required as sometimes quantity is a string
  if (quantity && Number(quantity) !== 0) {
    if (unit && !unit.fraction) {
      returnQty = Number((quantity * scale).toPrecision(3)).toString();
    } else {
      const fraction = frac(quantity * scale, 10, true);
      if (fraction[0] !== undefined && fraction[0] > 0) {
        returnQty += fraction[0];
      }

      if (fraction[1] > 0) {
        returnQty += includeFormating ?
          `<sup>${fraction[1]}</sup><span>&frasl;</span><sub>${fraction[2]}</sub>` :
          ` ${fraction[1]}/${fraction[2]}`;
      }
    }
  }

  const unitName = useUnitName(unit || undefined, usePluralUnit);
  // TODO: Add support for sub-recipes here?
  if (food) {
    const foodName = useFoodName(food || undefined, usePluralFood);

    return {
      quantity: returnQty ? sanitizeIngredientHTML(returnQty) : undefined,
      unit: unitName && quantity ? sanitizeIngredientHTML(unitName) : undefined,
      name: foodName ? sanitizeIngredientHTML(foodName) : undefined,
      note: note ? sanitizeIngredientHTML(note) : undefined,
      isRecipe: false,
    };
  } else {
    const subRecipeName: string = referencedRecipe ? referencedRecipe.name || "" : "";
    if (referencedRecipe && referencedRecipe.name && groupSlug) {
      return {
        quantity: returnQty ? sanitizeIngredientHTML(returnQty) : undefined,
        unit: unitName && quantity ? sanitizeIngredientHTML(unitName) : undefined,
        name: subRecipeName ? sanitizeIngredientHTML(subRecipeName) : undefined,
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        link: `<a href="/g/${groupSlug}/r/${referencedRecipe.slug}" target="_blank">${referencedRecipe.name}</a>`,
        note: undefined,
        isRecipe: true,
      };
    }

    return {
      name: ingredient.note ? sanitizeIngredientHTML(ingredient.note) : undefined,
      quantity: undefined,
      unit: undefined,
      note: undefined,
    };

  }

}

export function parseIngredientText(ingredient: RecipeIngredient, disableAmount: boolean, scale = 1, includeFormating = true): string {
  const { quantity, unit, name, note } = useParsedIngredientText(ingredient, disableAmount, scale, includeFormating);

  const text = `${quantity || ""} ${unit || ""} ${name || ""} ${note || ""}`.replace(/ {2,}/g, " ").trim();
  return sanitizeIngredientHTML(text);
}
