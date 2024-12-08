import { PrismaClient } from "./generated/client";

class PrismaService {
  private static instance: PrismaClient;

  private constructor() {}

  public static getInstance(): PrismaClient {
    if (process.env.NODE_ENV === "production") {
      if (!this.instance) {
        this.instance = new PrismaClient();
      }
    } else {
      if (!(global as any).prisma) {
        (global as any).prisma = new PrismaClient();
      }
      this.instance = (global as any).prisma;
    }

    return this.instance;
  }
}

const prisma = PrismaService.getInstance();
export { prisma };
