import { WebClient } from '@slack/web-api';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();  // Ensure .env file is loaded

const client = new WebClient(process.env.SLACK_BOT_TOKEN);
const prisma = new PrismaClient();

// Function to fetch users from Slack API
async function fetchSlackUsers() {
  try {
    const result = await client.users.list();
    return result.members;  
  } catch (error) {
    console.error("Error fetching users from Slack:", error);
    return [];
  }
}

// Save users to database
async function saveUsersToDatabase(usersArray) {
  const integrationId = 'slack';  // Fixed integration ID
  const connectionId = 'my-first-user';  // Fixed connection ID

  for (const user of usersArray) {
    const userId = user.id;
    const fullName = user.profile.real_name || 'Unknown';

    try {
      // Upsert: Create a new contact if it doesn't exist, or update it if it does
      await prisma.contacts.upsert({
        where: { id: userId },  
        update: { fullName: fullName, integrationId: integrationId, connectionId: connectionId },  
        create: { id: userId, fullName: fullName, integrationId: integrationId, connectionId: connectionId },  
      });

      console.log(`User ${fullName} (ID: ${userId}) saved successfully!`);
    } catch (error) {
      console.error(`Error saving user ${fullName}:`, error);
    }
  }
}

async function main() {
  const usersArray = await fetchSlackUsers();  
  if (usersArray.length > 0) {
    await saveUsersToDatabase(usersArray);  
  } else {
    console.log("No users found or error in fetching users.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
