const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

/**
 * Creates a new Group Admin user and sets up their Firestore record.
 * Restricted to users with the "super" custom claim.
 */
exports.createGroupAdmin = functions.https.onCall(async (data, context) => {
  // 1️⃣ SECURITY CHECK: Verify the requester is a Super Admin
  if (!context.auth || context.auth.token.role !== "super") {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Only Super Admins can create new admin accounts."
    );
  }

  // 2️⃣ DATA VALIDATION: Get data from the frontend call
  const { email, password, groupName } = data;

  if (!email || !password || !groupName) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Missing required fields: email, password, or group name."
    );
  }

  try {
    // 3️⃣ AUTH CREATION: Create the user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      displayName: groupName,
    });

    // 4️⃣ ROLE ASSIGNMENT: Tag the new user with 'group' role
    await admin.auth().setCustomUserClaims(userRecord.uid, { 
      role: "group" 
    });

    // 5️⃣ FIRESTORE SETUP: Create the admin record in the database
    await admin.firestore().doc(`admins/${userRecord.uid}`).set({
      email: email,
      groupName: groupName,
      role: "group",
      managedBy: "super",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // 6️⃣ SUCCESS RESPONSE
    return { 
      success: true, 
      message: `Admin for ${groupName} created successfully.` 
    };

  } catch (error) {
    console.error("Error creating admin:", error);
    // Return specific Firebase error message to frontend
    throw new functions.https.HttpsError("internal", error.message);
  }
});