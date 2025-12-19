const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

exports.createGroupAdmin = functions.https.onCall(async (data, context) => {

  // 1️⃣ CHECK: only super admin allowed
  if (!context.auth || context.auth.token.email !== "pkp151998@gmail.com") {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Only Super Admin can create admins"
    );
  }

  // 2️⃣ Get data from frontend
  const { email, password, groupName } = data;

  if (!email || !password || !groupName) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Missing email, password, or group name"
    );
  }

  // 3️⃣ Create user in Firebase Authentication
  const userRecord = await admin.auth().createUser({
    email,
    password,
  });

  // 4️⃣ Save admin info in Firestore
  await admin.firestore().doc(`admins/${userRecord.uid}`).set({
    email,
    groupName,
    role: "group",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // 5️⃣ Send success response
  return { success: true };
});
