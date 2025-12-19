const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

admin.initializeApp();

// Creating the function in the Mumbai region to match your database
exports.createGroupAdmin = onCall({ region: "asia-south1" }, async (request) => {
  
  // 1. Security Check: Check for Login
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "The function must be called while authenticated.");
  }

  // 2. Role Check: Allow if Email is yours OR Role is Super
  const isOwner = request.auth.token.email === "pkp151998@gmail.com";
  const isSuper = request.auth.token.role === "super";

  if (!isOwner && !isSuper) {
    throw new HttpsError("permission-denied", "Only Super Admins can create new admins.");
  }

  const { email, password, groupName } = request.data;

  // 3. Validation
  if (!email || !password || !groupName) {
    throw new HttpsError("invalid-argument", "Missing required fields (email, password, groupName).");
  }

  try {
    // 4. Create the User in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      displayName: groupName,
    });

    // 5. Set the 'group' role claim
    await admin.auth().setCustomUserClaims(userRecord.uid, { role: "group" });

    // 6. Create the record in Firestore
    await admin.firestore().collection("admins").doc(userRecord.uid).set({
      email: email,
      groupName: groupName,
      role: "group",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: request.auth.token.email,
    });

    return { success: true, uid: userRecord.uid };

  } catch (error) {
    console.error("Error creating admin:", error);
    throw new HttpsError("internal", error.message);
  }
});