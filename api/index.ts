import app from "../src/app";
import { connectDB } from "../src/config/db";

export default async (req: any, res: any) => {
  // Ensure the database is connected before Express handles the request.
  // Our DB config caches this connection globally to optimize for serverless.
  await connectDB();
  
  return app(req, res);
};
