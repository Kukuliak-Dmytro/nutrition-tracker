import { NextResponse } from "next/server";
import prisma from "../../../../utils/prisma/prisma";

export async function GET() {
  try {
    const totalRecipes = await prisma.recipe.count();
    const recentRecipes = await prisma.recipe.findMany({
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
