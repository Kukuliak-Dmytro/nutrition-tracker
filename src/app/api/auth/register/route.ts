import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "../../../../../utils/prisma/prisma";
import { hashPassword, signToken, AUTH_COOKIE_NAME } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email: rawEmail, password, name } = body;

    if (!rawEmail || typeof rawEmail !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const email = rawEmail.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    const newUser = await prisma.user.create({
      data: {
        email,
        passwordHash: hashPassword(password),
        name: typeof name === "string" && name.trim() ? name.trim() : null,
      },
    });

    // Count how many users exist in the database
    const userCount = await prisma.user.count();

    if (userCount === 1) {
      // First registered user: claim all existing unassigned data from prior to auth
      await prisma.recipe.updateMany({
        where: { userId: null },
        data: { userId: newUser.id },
      });
      await prisma.foodLogEntry.updateMany({
        where: { userId: null },
        data: { userId: newUser.id },
      });
      await prisma.dailyGoal.updateMany({
        where: { userId: null },
        data: { userId: newUser.id },
      });
      await prisma.ingredient.updateMany({
        where: { userId: null, isCustom: true },
        data: { userId: newUser.id },
      });
    } else {
      // Subsequent users start with their own standard daily goal
      await prisma.dailyGoal.create({
        data: {
          userId: newUser.id,
          goalType: "WEIGHT_LOSS",
          calories: 2000,
          maintenanceCalories: 2850,
          protein: 120,
          carbs: 220,
          fat: 65,
          fiber: 30,
        },
      });
    }

    const token = signToken(newUser.id);
    const cookieStore = await cookies();
    cookieStore.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 24 * 60 * 60,
    });

    return NextResponse.json({
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
