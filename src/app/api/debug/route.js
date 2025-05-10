import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    
    let userInfo = null;
    if (email) {
      // Check if the user exists
      userInfo = await prisma.user.findUnique({
        where: { email },
        select: { 
          id: true,
          email: true,
          name: true,
          emailVerified: true 
        }
      });
    }
    
    // Attempt to see if the email_tokens table exists
    let tableExists = false;
    let tablesInDb = [];
    try {
      tablesInDb = await prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `;
      
      tableExists = tablesInDb.some(
        t => t.table_name === 'email_tokens'
      );
    } catch (dbQueryError) {
      console.error("Error checking tables:", dbQueryError);
    }
    
    // Try to count email tokens
    let emailTokensCount = 0;
    let emailTokens = [];
    try {
      emailTokensCount = await prisma.emailToken.count();
      
      // Get all email tokens for debugging
      if (emailTokensCount > 0) {
        emailTokens = await prisma.emailToken.findMany({
          select: {
            email: true,
            expires: true,
            updatedAt: true
          }
        });
      }
    } catch (tokenError) {
      console.error("Error accessing email tokens:", tokenError);
    }
    
    // Check database connection status
    const connectionStatus = {
      connected: true,
      provider: prisma._engineConfig?.activeProvider || 'unknown'
    };
    
    // Find migration for email_tokens table
    let migrations = [];
    try {
      migrations = await prisma.$queryRaw`
        SELECT migration_name, finished_at
        FROM _prisma_migrations
        WHERE migration_name LIKE '%email_token%'
        ORDER BY finished_at DESC
      `;
    } catch (migrationError) {
      console.error("Error checking migrations:", migrationError);
    }

    return NextResponse.json({
      status: "success",
      databaseStatus: connectionStatus,
      userExists: !!userInfo,
      userInfo,
      emailTokensTableExists: tableExists,
      tablesInDatabase: tablesInDb.map(t => t.table_name),
      emailTokensCount,
      emailTokens,
      migrations,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Database debug error:", error);
    return NextResponse.json({
      status: "error",
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}