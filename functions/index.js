const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

/**
 * Creates a new Group Admin user and sets up their Firestore record.
 */
exports.createGroupAdmin = functions.region("asia-south1").https.onCall(async (data, context) => {
  // 1. Check if the person is logged in
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Please log in.");
  }

  // 2. THE FORCE-FIX: Allow you if you have the role OR if your email matches
  const isSuper = context.auth.token.role === "super";
  const isOwner = context.auth.token.email === "pkp151998@gmail.com"; // Your email

  if (!isSuper && !isOwner) {
    throw new functions.https.HttpsError(
      "permission-denied", 
      "ERROR 999: Still not working for pkp151998@gmail.com."
    );
  }

  // 2. Data Validation
  const {email, password, groupName} = data;

  if (!email || !password || !groupName) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Missing required fields: email, password, or group name.",
    );
  }

  try {
    // 3. Auth Creation
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      displayName: groupName,
    });

    // 4. Role Assignment
    await admin.auth().setCustomUserClaims(userRecord.uid, {
      role: "group",
    });

    // 5. Firestore Setup
    await admin.firestore().doc(`admins/${userRecord.uid}`).set({
      email: email,
      groupName: groupName,
      role: "group",
      managedBy: "super",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      message: `Admin for ${groupName} created successfully.`,
    };
  } catch (error) {
    console.error("Error creating admin:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});