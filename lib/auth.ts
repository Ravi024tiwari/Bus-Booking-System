import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { MongoClient } from "mongodb";

const mongoUrl = process.env.MONGODB_URI || process.env.MONGODB_URL || "mongodb://127.0.0.1:27017/seatplus";
const client = new MongoClient(mongoUrl);
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

  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google"],
    },
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "google-client-id-placeholder",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "google-client-secret-placeholder",
    },
  },
});
