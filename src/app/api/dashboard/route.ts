import { NextResponse } from "next/server";
import prisma from "../../../../utils/prisma/prisma";
import { getSessionUserId } from "@/lib/auth";

export async function GET() {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ totalRecipes: 0, recentRecipes: [] });
    }

    const recipeWhere = {
      OR: [{ userId }, { userId: null }],
    };

    const totalRecipes = await prisma.recipe.count({ where: recipeWhere });
    const recentRecipes = await prisma.recipe.findMany({
      where: recipeWhere,
      take: 6,
      orderBy: { createdAt: "desc" },
      include: {
        ingredients: {
          include: {
            ingredient: true,
          },
        },
      },
    });

    return NextResponse.json({
      totalRecipes,
      recentRecipes,
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
