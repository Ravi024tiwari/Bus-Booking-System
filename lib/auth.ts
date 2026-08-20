import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGODB_URL!);
const db = client.db();

export const auth = betterAuth({
  database: mongodbAdapter(db, {
    usePlural: true, // Maps User schema to 'users' collection (matches your existing User model)
  }),
  
  // Extend User model with fields used in your existing models/User.ts
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "passenger", // Defaults social logins to passenger role
        input: false,             // Prevent manual modification through client signup requests
      },
      operatorApprovalStatus: {
        type: "string",
        required: false,
      },
      phoneNumber: {
        type: "string",
        required: false,
      }
    }
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
});
