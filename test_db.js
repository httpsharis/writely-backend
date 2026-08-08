import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
async function check() {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/writely');
    const db = mongoose.connection.db;
    if (!db)
        throw new Error("No db");
    const docs = await db.collection('documents').find({ title: 'New Story' }).toArray();
    console.log("NOVEL:", JSON.stringify(docs, null, 2));
    if (docs.length > 0) {
        const novelId = docs[0]._id;
        const novelIdStr = novelId.toString();
        const chapters = await db.collection('documents').find({ type: 'chapter' }).toArray();
        console.log("ALL CHAPTERS:", JSON.stringify(chapters, null, 2));
        console.log("Matching ObjectId:", chapters.filter(c => c.parentId && c.parentId.equals && c.parentId.equals(novelId)).length);
        console.log("Matching String:", chapters.filter(c => c.parentId === novelIdStr).length);
    }
    process.exit(0);
}
check().catch(console.error);
